'use client';

import { useEffect, useState } from 'react';
import { setAccessToken } from './auth-token-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

/**
 * Sin esto, recargar la pestaña pierde el access token (vive solo en
 * memoria, ver auth-token-store.ts) aunque la cookie httpOnly del refresh
 * token siga siendo válida — el usuario vería la app como "deslogueada" tras
 * cada F5, pese a tener una sesión perfectamente vigente en el servidor.
 *
 * Se ejecuta una vez al montar el layout del dashboard. Devuelve `ready`
 * para que el layout pueda esperar antes de decidir "no hay sesión, a login".
 */
export function useBootstrapSession() {
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'anonymous'>('checking');

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setStatus('anonymous');
          return;
        }
        const body = await res.json();
        setAccessToken(body.accessToken);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) setStatus('anonymous');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
