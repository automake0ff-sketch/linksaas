import { create } from 'zustand';
import type { Block, BlockType } from '@linkforge/contracts';

export type DeviceMode = 'mobile' | 'tablet' | 'desktop';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const MAX_HISTORY = 50;

interface EditorState {
  pageId: string | null;
  blocks: Block[];
  selectedBlockId: string | null;
  device: DeviceMode;
  isPublished: boolean;
  saveStatus: SaveStatus;

  past: Block[][];
  future: Block[][];

  loadFromServer: (pageId: string, blocks: Block[], isPublished: boolean) => void;
  addBlock: (type: BlockType, config: Record<string, unknown>) => void;
  updateBlockConfig: (blockId: string, config: Record<string, unknown>) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  reorderBlocks: (orderedIds: string[]) => void;
  selectBlock: (blockId: string | null) => void;
  setDevice: (device: DeviceMode) => void;
  setSaveStatus: (status: SaveStatus) => void;
  markPublished: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

/** Genera IDs de bloque en el cliente. crypto.randomUUID existe en todos los
 * navegadores modernos; el fallback manual cubre entornos sin esa API
 * (nunca debería activarse en producción, pero evita un crash duro). */
function newBlockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function pushHistory(state: EditorState): Pick<EditorState, 'past' | 'future'> {
  const past = [...state.past, state.blocks].slice(-MAX_HISTORY);
  return { past, future: [] };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  pageId: null,
  blocks: [],
  selectedBlockId: null,
  device: 'desktop',
  isPublished: false,
  saveStatus: 'idle',
  past: [],
  future: [],

  loadFromServer: (pageId, blocks, isPublished) =>
    set({ pageId, blocks, isPublished, past: [], future: [], saveStatus: 'idle' }),

  addBlock: (type, config) =>
    set((state) => ({
      ...pushHistory(state),
      blocks: [
        ...state.blocks,
        { id: newBlockId(), type, order: state.blocks.length, config },
      ],
      selectedBlockId: null,
    })),

  updateBlockConfig: (blockId, config) =>
    set((state) => ({
      ...pushHistory(state),
      blocks: state.blocks.map((b) => (b.id === blockId ? { ...b, config } : b)),
    })),

  removeBlock: (blockId) =>
    set((state) => ({
      ...pushHistory(state),
      blocks: state.blocks
        .filter((b) => b.id !== blockId)
        .map((b, index) => ({ ...b, order: index })),
      selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
    })),

  duplicateBlock: (blockId) =>
    set((state) => {
      const index = state.blocks.findIndex((b) => b.id === blockId);
      if (index === -1) return state;
      const copy: Block = { ...state.blocks[index], id: newBlockId() };
      const blocks = [
        ...state.blocks.slice(0, index + 1),
        copy,
        ...state.blocks.slice(index + 1),
      ].map((b, i) => ({ ...b, order: i }));
      return { ...pushHistory(state), blocks };
    }),

  reorderBlocks: (orderedIds) =>
    set((state) => {
      const byId = new Map(state.blocks.map((b) => [b.id, b]));
      const blocks = orderedIds.map((id, index) => ({ ...byId.get(id)!, order: index }));
      return { ...pushHistory(state), blocks };
    }),

  selectBlock: (blockId) => set({ selectedBlockId: blockId }),
  setDevice: (device) => set({ device }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  markPublished: () => set({ isPublished: true }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        blocks: previous,
        past: state.past.slice(0, -1),
        future: [state.blocks, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        blocks: next,
        past: [...state.past, state.blocks],
        future: state.future.slice(1),
      };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
