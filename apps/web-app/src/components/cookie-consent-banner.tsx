'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from './form-fields';

const STORAGE_KEY = 'lf_cookie_consent';

/**
 * Solo usamos cookies estrictamente necesarias (sesión) — no hay tracking
 * de terceros ni analítica de comportamiento en el panel. Aun así, el
 * banner es buena práctica y suele ser requisito para clientes B2B con
 * su propio departamento legal (ver docs/12-Plan-Lanzamiento.md, T13).
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    window.localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface px-4 py-4 shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-text-secondary">
          Usamos únicamente cookies necesarias para mantener tu sesión iniciada. Ver{' '}
          <Link href="/privacy" className="underline hover:text-accent">
            política de privacidad
          </Link>
          .
        </p>
        <Button onClick={accept} className="shrink-0">
          Entendido
        </Button>
      </div>
    </div>
  );
}
