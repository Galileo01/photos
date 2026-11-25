const exactErrorCodes: Record<string, string> = {
  'Access denied': 'ACCESS_DENIED',
  'Admin access required': 'ADMIN_ACCESS_REQUIRED',
  'Authentication failed': 'AUTHENTICATION_FAILED',
  'Authentication required': 'AUTHENTICATION_REQUIRED',
  'Event not found': 'EVENT_NOT_FOUND',
  'Internal server error': 'INTERNAL_SERVER_ERROR',
  'Invalid password': 'INVALID_PASSWORD',
  'Not found': 'NOT_FOUND',
  'Password is required': 'PASSWORD_REQUIRED',
  'Photo not found': 'PHOTO_NOT_FOUND',
  'Sign-in required': 'AUTHENTICATION_REQUIRED',
  'Unauthorized': 'AUTHENTICATION_REQUIRED',
};

export function getErrorCode(error: string): string {
  return exactErrorCodes[error] ?? 'REQUEST_FAILED';
}

export async function addErrorCode(response: Response): Promise<Response> {
  if (response.status < 400 || !response.headers.get('Content-Type')?.includes('application/json')) {
    return response;
  }

  const payload = await response.clone().json() as { code?: unknown; error?: unknown };
  if (typeof payload.error !== 'string' || typeof payload.code === 'string') return response;

  return new Response(JSON.stringify({ ...payload, code: getErrorCode(payload.error) }), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
