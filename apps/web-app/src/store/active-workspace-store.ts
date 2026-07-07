import { create } from 'zustand';

interface ActiveWorkspaceState {
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
}

// TODO(Fase A, siguiente incremento): inicializar desde GET /workspaces real
// y persistir la elección (ej. en la URL o en un cookie de preferencia) en
// vez de este valor fijo — documentado también en README.
export const useActiveWorkspaceStore = create<ActiveWorkspaceState>((set) => ({
  workspaceId: 'w1',
  setWorkspaceId: (workspaceId) => set({ workspaceId }),
}));
