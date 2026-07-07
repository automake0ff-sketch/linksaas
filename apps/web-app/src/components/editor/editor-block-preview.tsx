'use client';

import type { Block } from '@linkforge/contracts';
import clsx from 'clsx';

/**
 * Deliberadamente la misma forma que apps/web-public/src/components/block-renderer.tsx
 * — candidato a extraerse a packages/block-renderer (ver README, sección de
 * pendientes) en cuanto ambas copias empiecen a divergir por necesidad real.
 * Aquí además recibe `selected`/`onSelect` porque en el editor los bloques
 * son clicables para abrir el panel de propiedades.
 */
export function EditorBlockPreview({
  block,
  selected,
  onSelect,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'w-full rounded-xl border px-5 py-4 text-left transition-colors',
        selected ? 'border-accent ring-2 ring-accent/20' : 'border-border hover:border-accent/50',
      )}
    >
      {renderContent(block)}
    </button>
  );
}

function renderContent(block: Block) {
  switch (block.type) {
    case 'link': {
      const c = block.config as { label?: string; url?: string };
      return (
        <div className="text-center">
          <p className="font-medium text-text-primary">{c.label || 'Enlace sin título'}</p>
          <p className="truncate text-xs text-text-secondary">{c.url || 'https://…'}</p>
        </div>
      );
    }
    case 'text': {
      const c = block.config as { content?: string };
      return <p className="text-center text-text-secondary">{c.content || 'Texto vacío'}</p>;
    }
    case 'social': {
      const c = block.config as { platform?: string; url?: string };
      return (
        <p className="text-center text-sm font-medium text-text-primary">
          {c.platform || 'Red social'}
        </p>
      );
    }
    case 'image': {
      const c = block.config as { src?: string };
      return c.src ? (
        // eslint-disable-next-line @next/next/no-img-element -- preview de contenido de usuario, dominio arbitrario
        <img src={c.src} alt="" className="mx-auto max-h-32 rounded-md object-cover" />
      ) : (
        <p className="text-center text-sm text-text-secondary">Imagen sin configurar</p>
      );
    }
    default:
      return (
        <p className="text-center text-sm text-text-secondary">
          Bloque «{block.type}» — edición disponible en Fase B/C
        </p>
      );
  }
}
