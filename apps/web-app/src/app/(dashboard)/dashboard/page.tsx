'use client';

import { PageEditor } from '@/components/editor/page-editor';
import { useActiveWorkspaceStore } from '@/store/active-workspace-store';

export default function DashboardPage() {
  const workspaceId = useActiveWorkspaceStore((s) => s.workspaceId);
  return <PageEditor workspaceId={workspaceId} />;
}
