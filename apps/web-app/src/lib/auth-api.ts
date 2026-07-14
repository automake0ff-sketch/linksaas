import { apiFetch } from './api-client';
import { getAccessToken, setAccessToken } from './auth-token-store';

export const authApi = {
  /** Invalida la cookie de refresh en el servidor y limpia el access token
   * en memoria — antes de este arreglo, el botón "Cerrar sesión" no hacía
   * absolutamente nada (no estaba conectado a ningún handler). */
  async logout(): Promise<void> {
    try {
      await apiFetch<void>('/auth/logout', {
        method: 'POST',
        accessToken: getAccessToken() ?? undefined,
      });
    } finally {
      setAccessToken(null);
    }
  },
};
