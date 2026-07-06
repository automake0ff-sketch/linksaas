import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicPage } from '@/lib/public-page-client';
import { BlockRenderer } from '@/components/block-renderer';
import { PageAnalyticsBeacon } from '@/components/page-analytics-beacon';

interface Props {
  params: { slug: string };
}

// generateStaticParams se completa cuando exista un endpoint de "slugs
// publicados" — de momento cada página se genera on-demand (ISR) en la
// primera visita y queda cacheada (ver next.config.js).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPublicPage(params.slug);
  if (!page) return { title: 'Página no encontrada' };

  const title = page.title ?? `${params.slug} · LinkForge`;
  const description = page.bio ?? 'Descubre todos mis enlaces en un solo lugar.';
  const url = `https://${params.slug}.linkforge.com`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'profile',
      images: page.avatarUrl ? [{ url: page.avatarUrl }] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: page.avatarUrl ? [page.avatarUrl] : [],
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicPage({ params }: Props) {
  const page = await getPublicPage(params.slug);
  if (!page) notFound();

  const sortedBlocks = [...page.blocks].sort((a, b) => a.order - b.order);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: page.title ?? params.slug,
    description: page.bio ?? undefined,
    mainEntity: {
      '@type': 'Person',
      name: page.title ?? params.slug,
      image: page.avatarUrl ?? undefined,
    },
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center gap-4 px-4 py-12"
      style={{
        // Los tokens del tema del usuario sobrescriben las variables CSS
        // globales solo dentro de este árbol — así cada página pública
        // puede tener su propia paleta sin tocar el resto de la app.
        // @ts-expect-error -- CSS custom properties
        '--surface': page.theme.surface,
        '--surface-2': page.theme.surfaceSecondary,
        '--text-primary': page.theme.textPrimary,
        '--text-secondary': page.theme.textSecondary,
        '--border': page.theme.border,
        '--accent': page.theme.accent,
        background: 'var(--surface)',
        color: 'var(--text-primary)',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageAnalyticsBeacon workspaceSlug={params.slug} />

      <div className="flex w-full max-w-md flex-col items-center gap-4">
        {page.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- avatar remoto arbitrario, sin dominio fijo conocido de antemano
          <img
            src={page.avatarUrl}
            alt=""
            className="h-20 w-20 rounded-full border border-border object-cover"
          />
        )}
        {page.title && (
          <h1 className="font-display text-xl font-semibold text-text-primary">{page.title}</h1>
        )}
        {page.bio && <p className="text-center text-sm text-text-secondary">{page.bio}</p>}

        <div className="mt-4 flex w-full flex-col gap-3">
          {sortedBlocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      </div>

      <footer className="mt-auto pt-10 text-xs text-text-secondary">
        Creado con LinkForge
      </footer>
    </main>
  );
}
