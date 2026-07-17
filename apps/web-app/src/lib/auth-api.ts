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

  forgotPassword: (email: string) =>
    apiFetch<{ message: string; devResetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
};
