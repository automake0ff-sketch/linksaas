'use client';

import { Undo2, Redo2, Smartphone, Tablet, Monitor, Check, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useMutation } from '@tanstack/react-query';
import { useEditorStore, type DeviceMode } from '@/store/editor-store';
import { pagesApi } from '@/lib/pages-api';
import { Button } from '@/components/form-fields';

const DEVICES: { mode: DeviceMode; icon: typeof Smartphone; label: string }[] = [
  { mode: 'mobile', icon: Smartphone, label: 'Móvil' },
  { mode: 'tablet', icon: Tablet, label: 'Tablet' },
  { mode: 'desktop', icon: Monitor, label: 'Escritorio' },
];

export function EditorToolbar({ workspaceId }: { workspaceId: string }) {
  const device = useEditorStore((s) => s.device);
  const setDevice = useEditorStore((s) => s.setDevice);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const isPublished = useEditorStore((s) => s.isPublished);
  const markPublished = useEditorStore((s) => s.markPublished);
  const blocks = useEditorStore((s) => s.blocks);

  const publishMutation = useMutation({
    mutationFn: () => pagesApi.publish(workspaceId),
    onSuccess: () => markPublished(),
  });

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          aria-label="Deshacer"
          className="rounded-md p-2 text-text-secondary hover:bg-surface-2 disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          aria-label="Rehacer"
          className="rounded-md p-2 text-text-secondary hover:bg-surface-2 disabled:opacity-30"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1">
        {DEVICES.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setDevice(mode)}
            aria-label={label}
            aria-pressed={device === mode}
            className={clsx(
              'rounded-md p-1.5 transition-colors',
              device === mode ? 'bg-surface text-accent shadow-sm' : 'text-text-secondary',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <SaveIndicator status={saveStatus} />
        <Button
          onClick={() => publishMutation.mutate()}
          isLoading={publishMutation.isPending}
          disabled={blocks.length === 0}
        >
          {isPublished ? 'Publicar cambios' : 'Publicar'}
        </Button>
      </div>
    </header>
  );
}

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  if (status === 'saving')
    return (
      <span className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…
      </span>
    );
  if (status === 'error')
    return (
      <span className="flex items-center gap-1.5 text-xs text-danger">
        <AlertCircle className="h-3.5 w-3.5" /> Error al guardar
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs text-success">
      <Check className="h-3.5 w-3.5" /> Guardado
    </span>
  );
}
