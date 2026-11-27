import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { describe, it, expect, vi } from 'vitest';
import { getCollaboratorRole, getCollaboratorRoleByEventId, hasEventCapability } from '../auth';
import worker from '../index';
import { createEnv } from './mocks/env';

/**
 * Minimal fake D1Database that actually evaluates the WHERE clauses used by
 * getCollaboratorRole()/getCollaboratorRoleByEventId(), so these tests catch
 * real case-sensitivity regressions instead of relying on string-matching
 * mocks. Only supports the exact query shapes those two functions issue.
 */
function createFakeDb(collaboratorRows: Array<{ event_id: number; slug: string; user_email: string; role: string }>) {
  return {
    prepare(query: string) {
      let boundArgs: unknown[] = [];
      return {
        bind(...args: unknown[]) {
          boundArgs = args;
          return this;
        },
        async first<T>() {
          if (query.includes('JOIN events e')) {
            const [slug, userEmail] = boundArgs as [string, string];
            const match = collaboratorRows.find(
              r => r.slug === slug && r.user_email.toLowerCase() === String(userEmail).toLowerCase()
            );
            return (match ? { role: match.role } : null) as T | null;
          }

          // getCollaboratorRoleByEventId: WHERE event_id = ? AND ...user_email = ?
          const [eventId, userEmail] = boundArgs as [number, string];
          const match = collaboratorRows.find(
            r => r.event_id === eventId && r.user_email.toLowerCase() === String(userEmail).toLowerCase()
          );
          return (match ? { role: match.role } : null) as T | null;
        },
        async run() {
          return { success: true, meta: { changes: 1 } };
        },
      };
    },
  } as any;
}

describe('getCollaboratorRole (case-insensitive email matching)', () => {
  const rows = [
    { event_id: 1, slug: 'summer-party', user_email: 'Jane.Doe@Example.com', role: 'uploader' },
  ];

  it('matches when the login email casing differs from the stored casing', async () => {
    const db = createFakeDb(rows);
    const role = await getCollaboratorRole(db, 'summer-party', 'jane.doe@example.com');
    expect(role).toBe('uploader');
  });

  it('matches the same way for getCollaboratorRoleByEventId', async () => {
    const db = createFakeDb(rows);
    const role = await getCollaboratorRoleByEventId(db, 1, 'JANE.DOE@EXAMPLE.COM');
    expect(role).toBe('uploader');
  });

  it('grants the upload capability regardless of email casing', async () => {
    const db = createFakeDb(rows);
    const allowed = await hasEventCapability(db, 'summer-party', 'jane.DOE@example.COM', 'upload');
    expect(allowed).toBe(true);
  });

  it('returns null for an email that truly does not match', async () => {
    const db = createFakeDb(rows);
    const role = await getCollaboratorRole(db, 'summer-party', 'someone-else@example.com');
    expect(role).toBeNull();
  });
});

describe('private gallery access', () => {
  it('keeps the health check available when email features are disabled', async () => {
    const env = {
      ...createEnv(createFakeDb([])),
      MAILGUN_API_KEY: undefined,
      MAILGUN_DOMAIN: undefined,
    };

    const response = await worker.fetch(
      new Request('https://photos.example.com/health'),
      env,
      {} as ExecutionContext
    );

    expect(response.status).toBe(200);
  });

  it('requires an Access JWT issued for the gallery', async () => {
    const issuer = 'https://photos-test.cloudflareaccess.com';
    const audience = 'photos-audience';
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const jwk = await exportJWK(publicKey);
    const env = {
      ...createEnv(createFakeDb([])),
      PRIVATE_GALLERY: 'true',
      ACCESS_TEAM_DOMAIN: issuer,
      ACCESS_AUD: audience,
    };
    const ctx = {} as ExecutionContext;
    const issueToken = (tokenAudience: string) => new SignJWT({ email: 'admin@example.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(issuer)
      .setAudience(tokenAudience)
      .setSubject('test-user')
      .setExpirationTime('5m')
      .sign(privateKey);
    const request = (path: string, token?: string) => new Request(`https://photos.example.com${path}`, {
      headers: token ? { 'Cf-Access-Jwt-Assertion': token } : {},
    });

    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ keys: [{ ...jwk, kid: 'test-key' }] })));
    try {
      expect((await worker.fetch(request('/api/events'), env, ctx)).status).toBe(401);
      expect((await worker.fetch(request('/media/test/preview/test.jpg'), env, ctx)).status).toBe(401);
      expect((await worker.fetch(request('/health', await issueToken('other-app')), env, ctx)).status).toBe(401);

      const response = await worker.fetch(request('/health', await issueToken(audience)), env, ctx);
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
