const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
  }
}

/**
 * Wrapper mínimo de fetch: siempre incluye credentials (cookie httpOnly del
 * refresh token), adjunta el access token en memoria si existe, y normaliza
 * errores al formato uniforme que define docs/06-APIs.md.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const { accessToken, ...init } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? 'Error inesperado', res.status, body.details);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
