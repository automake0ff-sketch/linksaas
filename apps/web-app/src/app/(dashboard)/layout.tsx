'use client';

import { LayoutGrid, Palette, BarChart3, Settings, LogOut } from 'lucide-react';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { useActiveWorkspaceStore } from '@/store/active-workspace-store';

const NAV = [
  { label: 'Editor', icon: LayoutGrid, href: '/dashboard' },
  { label: 'Temas', icon: Palette, href: '/dashboard/themes' },
  { label: 'Analítica', icon: BarChart3, href: '/dashboard/analytics' },
  { label: 'Ajustes', icon: Settings, href: '/dashboard/settings' },
];

// Datos de ejemplo — se sustituyen por la query real a GET /workspaces
// cuando se cablee el hook useWorkspaces() (siguiente incremento).
const MOCK_WORKSPACES = [{ id: 'w1', slug: 'ana', displayName: 'Ana Torres' }];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const activeWorkspace = useActiveWorkspaceStore((s) => s.workspaceId);
  const setActiveWorkspace = useActiveWorkspaceStore((s) => s.setWorkspaceId);

  return (
    <div className="flex min-h-screen bg-surface-2">
      <aside className="flex w-60 flex-col gap-6 border-r border-border bg-surface p-4">
        <WorkspaceSwitcher
          workspaces={MOCK_WORKSPACES}
          activeId={activeWorkspace}
          onSelect={setActiveWorkspace}
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
    </div>
  );
}
