'use client';

import { PageEditor } from '@/components/editor/page-editor';
import { useActiveWorkspaceStore } from '@/store/active-workspace-store';

export default function DashboardPage() {
  const workspaceId = useActiveWorkspaceStore((s) => s.workspaceId);

  // El layout padre ya garantiza que existe al menos un workspace y que
  // activeWorkspaceId se puebla en cuanto la query resuelve — este guard
  // cubre únicamente el instante entre "layout montado" y "efecto ejecutado".
  if (!workspaceId) {
    return <div className="p-8 text-sm text-text-secondary">Preparando tu editor…</div>;
  }

  return <PageEditor workspaceId={workspaceId} />;
}
