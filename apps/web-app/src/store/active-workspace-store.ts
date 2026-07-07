import { create } from 'zustand';

interface ActiveWorkspaceState {
  workspaceId: string | null;
  setWorkspaceId: (id: string) => void;
}

/**
 * Sin valor por defecto: se puebla desde GET /workspaces en cuanto la
 * query resuelve (ver DashboardLayout). `null` significa "todavía no
 * sabemos qué workspaces tiene el usuario" — no "no tiene ninguno".
 */
export const useActiveWorkspaceStore = create<ActiveWorkspaceState>((set) => ({
  workspaceId: null,
  setWorkspaceId: (workspaceId) => set({ workspaceId }),
}));
