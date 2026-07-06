import { PublicPageSchema, type PublicPage } from '@linkforge/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

/**
 * IMPORTANTE (ver docs/02-Arquitectura.md §8 y docs/06-APIs.md): esta
 * llamada NO pasa por la API transaccional autenticada — golpea un endpoint
 * público de solo lectura, cacheado en el edge, para no acoplar el tráfico
 * público de altísimo volumen al sistema de escritura. `next: { revalidate }`
 * permite ISR: la página se sirve de caché y se revalida en background.
 */
export async function getPublicPage(slug: string): Promise<PublicPage | null> {
  const res = await fetch(`${API_BASE}/public/pages/${slug}`, {
    next: { revalidate: 300, tags: [`page:${slug}`] },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Error al cargar la página pública de "${slug}"`);

  const json = await res.json();
  return PublicPageSchema.parse(json);
}

/** Registra un evento de analítica (view/click) — fire-and-forget, sin bloquear el render. */
export function trackPublicEvent(payload: {
  workspaceSlug: string;
  blockId?: string;
  eventType: 'view' | 'click';
}) {
  fetch(`${API_BASE}/public/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Un evento de analítica perdido no debe romper la experiencia del
    // visitante — se descarta en silencio en vez de reintentar en el cliente.
  });
}
