'use client';

import { useEditorStore } from '@/store/editor-store';
import { TextField } from '@/components/form-fields';

/**
 * Un formulario de propiedades por tipo de bloque (no un editor de JSON
 * genérico) — más trabajo hoy, pero es lo que hace que el editor se sienta
 * como Notion/Canva y no como un panel de administración técnico. Cada tipo
 * nuevo (video, embed, producto…) añade su propio bloque de campos aquí.
 */
export function BlockPropertiesPanel() {
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const updateBlockConfig = useEditorStore((s) => s.updateBlockConfig);
  const selectBlock = useEditorStore((s) => s.selectBlock);

  const block = blocks.find((b) => b.id === selectedBlockId);

  if (!block) {
    return (
      <aside className="w-72 border-l border-border bg-surface p-4">
        <p className="text-sm text-text-secondary">
          Selecciona un bloque para editar sus propiedades.
        </p>
      </aside>
    );
  }

  const config = block.config as Record<string, string>;
  const setField = (field: string, value: string) =>
    updateBlockConfig(block.id, { ...config, [field]: value });

  return (
    <aside className="flex w-72 flex-col gap-4 border-l border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Propiedades — {block.type}
        </h2>
        <button
          onClick={() => selectBlock(null)}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Cerrar
        </button>
      </div>

      {block.type === 'link' && (
        <>
          <TextField
            label="Texto del botón"
            value={config.label ?? ''}
            onChange={(e) => setField('label', e.target.value)}
          />
          <TextField
            label="URL"
            value={config.url ?? ''}
            onChange={(e) => setField('url', e.target.value)}
          />
        </>
      )}

      {block.type === 'text' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Contenido</span>
          <textarea
            value={config.content ?? ''}
            onChange={(e) => setField('content', e.target.value)}
            rows={4}
            className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
      )}

      {block.type === 'social' && (
        <>
          <TextField
            label="Plataforma"
            value={config.platform ?? ''}
            onChange={(e) => setField('platform', e.target.value)}
          />
          <TextField
            label="URL de perfil"
            value={config.url ?? ''}
            onChange={(e) => setField('url', e.target.value)}
          />
        </>
      )}

      {block.type === 'image' && (
        <TextField
          label="URL de la imagen"
          value={config.src ?? ''}
          onChange={(e) => setField('src', e.target.value)}
        />
      )}

      {!['link', 'text', 'social', 'image'].includes(block.type) && (
        <p className="text-sm text-text-secondary">
          El editor de propiedades para «{block.type}» llega en Fase B/C.
        </p>
      )}
    </aside>
  );
}
