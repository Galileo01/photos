import { describe, expect, it } from 'vitest';
import { addErrorCode, getErrorCode } from '../errorCodes';

describe('error response codes', () => {
  it('maps common user-facing errors to stable codes', () => {
    expect(getErrorCode('Event not found')).toBe('EVENT_NOT_FOUND');
    expect(getErrorCode('Authentication required')).toBe('AUTHENTICATION_REQUIRED');
    expect(getErrorCode('A future route-specific failure')).toBe('REQUEST_FAILED');
  });

  it('adds a code without removing legacy response fields or headers', async () => {
    const response = Response.json(
      { error: 'Photo not found', detail: 'legacy detail' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
    const localized = await addErrorCode(response);

    expect(localized.status).toBe(404);
    expect(localized.headers.get('Cache-Control')).toBe('no-store');
    expect(await localized.json()).toEqual({
      error: 'Photo not found',
      detail: 'legacy detail',
      code: 'PHOTO_NOT_FOUND',
    });
  });

  it('does not modify successful responses', async () => {
    const response = Response.json({ status: 'ok' });
    expect(await addErrorCode(response)).toBe(response);
  });
});
