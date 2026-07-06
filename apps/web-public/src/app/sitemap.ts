import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pendiente: GET /public/pages/sitemap-slugs en la API (lista paginada de
  // slugs publicados) — hoy devuelve solo la raíz para no bloquear el build.
  return [{ url: 'https://linkforge.com', lastModified: new Date() }];
}
