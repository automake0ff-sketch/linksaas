'use client';

import { Link2, Type, Share2, Image as ImageIcon } from 'lucide-react';
import type { BlockType } from '@linkforge/contracts';
import { useEditorStore } from '@/store/editor-store';

const AVAILABLE_BLOCKS: { type: BlockType; label: string; icon: typeof Link2; defaultConfig: Record<string, unknown> }[] = [
  { type: 'link', label: 'Enlace', icon: Link2, defaultConfig: { label: 'Nuevo enlace', url: 'https://' } },
  { type: 'text', label: 'Texto', icon: Type, defaultConfig: { content: 'Escribe algo…' } },
  { type: 'social', label: 'Red social', icon: Share2, defaultConfig: { platform: 'Instagram', url: 'https://' } },
  { type: 'image', label: 'Imagen', icon: ImageIcon, defaultConfig: { src: '' } },
  // video, embed, gallery, faq, countdown, form, product, html, markdown:
  // el tipo ya existe en el dominio (BLOCK_TYPES) — se añaden aquí a
  // medida que su editor de propiedades específico se implemente (Fase B/C).
];

export function BlockLibrary() {
  const addBlock = useEditorStore((s) => s.addBlock);

  return (
    <aside className="flex w-56 flex-col gap-1 border-r border-border bg-surface p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Añadir bloque
      </h2>
      {AVAILABLE_BLOCKS.map(({ type, label, icon: Icon, defaultConfig }) => (
        <button
          key={type}
          onClick={() => addBlock(type, defaultConfig)}
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-text-primary hover:bg-surface-2"
        >
          <Icon className="h-4 w-4 text-text-secondary" />
          {label}
        </button>
      ))}
    </aside>
  );
}
