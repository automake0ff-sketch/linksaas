import { describe, expect, it, beforeEach } from 'vitest';
import { useEditorStore } from '../editor-store';

function reset() {
  useEditorStore.setState({
    pageId: 'p1',
    blocks: [],
    selectedBlockId: null,
    device: 'desktop',
    isPublished: false,
    saveStatus: 'idle',
    past: [],
    future: [],
  });
}

describe('editor-store — historial de deshacer/rehacer', () => {
  beforeEach(reset);

  it('añadir un bloque permite deshacerlo y volver al estado vacío', () => {
    useEditorStore.getState().addBlock('link', { label: 'A', url: 'https://a.com' });
    expect(useEditorStore.getState().blocks).toHaveLength(1);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().blocks).toHaveLength(0);
  });

  it('rehacer restaura el estado deshecho', () => {
    useEditorStore.getState().addBlock('text', { content: 'hola' });
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().blocks).toHaveLength(0);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().blocks).toHaveLength(1);
  });

  it('una nueva acción después de deshacer descarta el futuro (redo)', () => {
    useEditorStore.getState().addBlock('link', { label: 'A' });
    useEditorStore.getState().addBlock('link', { label: 'B' });
    useEditorStore.getState().undo(); // vuelve a tener solo "A"

    useEditorStore.getState().addBlock('link', { label: 'C' });
    expect(useEditorStore.getState().blocks.map((b) => (b.config as { label: string }).label)).toEqual([
      'A',
      'C',
    ]);
    expect(useEditorStore.getState().canRedo()).toBe(false);
  });

  it('duplicar un bloque lo inserta justo después del original', () => {
    useEditorStore.getState().addBlock('link', { label: 'A' });
    const [original] = useEditorStore.getState().blocks;
    useEditorStore.getState().duplicateBlock(original.id);

    const blocks = useEditorStore.getState().blocks;
    expect(blocks).toHaveLength(2);
    expect(blocks[0].id).toBe(original.id);
    expect(blocks[1].id).not.toBe(original.id);
  });

  it('eliminar un bloque lo quita y reindexa el orden', () => {
    useEditorStore.getState().addBlock('link', { label: 'A' });
    useEditorStore.getState().addBlock('link', { label: 'B' });
    const [first] = useEditorStore.getState().blocks;

    useEditorStore.getState().removeBlock(first.id);

    const blocks = useEditorStore.getState().blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].order).toBe(0);
  });

  it('deshacer sin historial previo no falla ni cambia el estado', () => {
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().blocks).toHaveLength(0);
  });
});
