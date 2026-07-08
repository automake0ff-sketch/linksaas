const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Un único refresh en vuelo compartido entre todas las peticiones que
 * lleguen a la vez con un 401 — evita una tormenta de N llamadas a
 * /auth/refresh si varias queries fallan simultáneamente por token
 * expirado (ej. al volver de segundo plano con varias queries en caché).
 */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return null;
        const body = await res.json();
        const { setAccessToken } = await import('./auth-token-store');
        setAccessToken(body.accessToken);
        return body.accessToken as string;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

/**
 * Wrapper mínimo de fetch: siempre incluye credentials (cookie httpOnly del
 * refresh token), adjunta el access token en memoria si existe, y normaliza
 * errores al formato uniforme que define docs/06-APIs.md.
 *
 * Si el servidor responde 401 y la petición llevaba un access token (es
 * decir, expiró en vez de faltar desde el principio), intenta refrescar
 * una vez y reintenta la petición original — así una sesión de 15 minutos
 * no interrumpe al usuario a media edición.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string; _isRetry?: boolean } = {},
): Promise<T> {
  const { accessToken, _isRetry, ...init } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && accessToken && !_isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, { ...options, accessToken: newToken, _isRetry: true });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? 'Error inesperado', res.status, body.details);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
