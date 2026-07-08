import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { pagesApi } from '@/lib/pages-api';

const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * Se suscribe a cambios de `blocks` en el store y sincroniza con el backend
 * tras un breve debounce — evita una llamada de red por cada tecla/drag,
 * pero mantiene el borrador casi siempre al día. `isPublished`/`selectedBlockId`
 * no disparan guardado: solo los cambios de contenido importan.
 */
export function useAutosave(workspaceId: string) {
  const blocks = useEditorStore((s) => s.blocks);
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // No autoguardar la carga inicial (blocks recién llegados del servidor,
    // no hay nada nuevo que persistir todavía).
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('idle');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await pagesApi.saveDraft(workspaceId, blocks);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe reaccionar a `blocks`
  }, [blocks, workspaceId]);
}
