'use client';

import { useEffect } from 'react';
import { trackPublicEvent } from '@/lib/public-page-client';

/**
 * Client component deliberadamente mínimo: el resto de la página es un
 * Server Component (cero JS extra para el visitante) — solo esto necesita
 * ejecutarse en el navegador, y su único trabajo es un fetch en segundo plano.
 */
export function PageAnalyticsBeacon({ workspaceSlug }: { workspaceSlug: string }) {
  useEffect(() => {
    trackPublicEvent({ workspaceSlug, eventType: 'view' });
  }, [workspaceSlug]);

  return null;
}
