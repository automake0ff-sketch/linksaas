'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Palette, BarChart3, Settings, LogOut } from 'lucide-react';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog';
import { useActiveWorkspaceStore } from '@/store/active-workspace-store';
import { workspacesApi } from '@/lib/workspaces-api';
import { Button } from '@/components/form-fields';

const NAV = [
  { label: 'Editor', icon: LayoutGrid, href: '/dashboard' },
  { label: 'Temas', icon: Palette, href: '/dashboard/themes' },
  { label: 'Analítica', icon: BarChart3, href: '/dashboard/analytics' },
  { label: 'Ajustes', icon: Settings, href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const activeWorkspaceId = useActiveWorkspaceStore((s) => s.workspaceId);
  const setActiveWorkspace = useActiveWorkspaceStore((s) => s.setWorkspaceId);

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['my-workspaces'],
    queryFn: workspacesApi.listMine,
  });

  // Al llegar la lista real, si todavía no hay workspace activo seleccionado
  // (primera carga de sesión), se elige el primero automáticamente.
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !activeWorkspaceId) {
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspace]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-2">
        <p className="text-sm text-text-secondary">Cargando tus espacios…</p>
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-2 px-4 text-center">
        <h1 className="font-display text-xl font-semibold text-text-primary">
          Todavía no tienes ningún espacio
        </h1>
        <p className="max-w-sm text-sm text-text-secondary">
          Un espacio es tu página pública (linkforge.com/tu-slug) y todo lo que
          publiques en ella.
        </p>
        <Button onClick={() => setDialogOpen(true)}>Crear mi primer espacio</Button>
        {dialogOpen && <CreateWorkspaceDialog onClose={() => setDialogOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-2">
      <aside className="flex w-60 flex-col gap-6 border-r border-border bg-surface p-4">
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeId={activeWorkspaceId ?? workspaces[0].id}
          onSelect={setActiveWorkspace}
          onCreateWorkspace={() => setDialogOpen(true)}
        />

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ label, icon: Icon, href }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            >
              <Icon className="h-4 w-4" />
              {label}
            </a>
          ))}
        </nav>

        <button className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 overflow-hidden">{children}</main>

      {dialogOpen && <CreateWorkspaceDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}
