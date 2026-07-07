'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pagesApi } from '@/lib/pages-api';
import { useAutosave } from '@/lib/use-autosave';
import { useEditorStore } from '@/store/editor-store';
import { EditorToolbar } from './editor-toolbar';
import { BlockLibrary } from './block-library';
import { SortableBlockList } from './sortable-block-list';
import { BlockPropertiesPanel } from './block-properties-panel';
import { DeviceFrame } from './device-frame';

export function PageEditor({ workspaceId }: { workspaceId: string }) {
  const loadFromServer = useEditorStore((s) => s.loadFromServer);
  const device = useEditorStore((s) => s.device);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['page-draft', workspaceId],
    queryFn: () => pagesApi.getDraft(workspaceId),
  });

  useEffect(() => {
    if (data) loadFromServer(data.pageId, data.blocks, data.isPublished);
  }, [data, loadFromServer]);

  // El autosave se activa siempre que este componente esté montado — se
  // apaga solo al desmontar el editor (navegar fuera del panel).
  useAutosave(workspaceId);

  if (isLoading) {
    return <div className="p-8 text-sm text-text-secondary">Cargando tu página…</div>;
  }

  if (isError) {
    return (
      <div className="p-8 text-sm text-danger">
        No se pudo cargar la página. Comprueba tu conexión e inténtalo de nuevo.
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <EditorToolbar workspaceId={workspaceId} />
      <div className="flex flex-1 overflow-hidden">
        <BlockLibrary />
        <DeviceFrame device={device}>
          <SortableBlockList />
        </DeviceFrame>
        <BlockPropertiesPanel />
      </div>
    </div>
  );
}
