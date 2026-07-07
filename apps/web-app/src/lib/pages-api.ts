import type { Block, BlockType } from '@linkforge/contracts';
import { apiFetch } from './api-client';
import { getAccessToken } from './auth-token-store';

function authedFetch<T>(path: string, init: RequestInit = {}) {
  return apiFetch<T>(path, { ...init, accessToken: getAccessToken() ?? undefined });
}

export const pagesApi = {
  getDraft: (workspaceId: string) =>
    authedFetch<{ pageId: string; blocks: Block[]; isPublished: boolean; themeId: string | null }>(
      `/workspaces/${workspaceId}/page`,
    ),

  /** Autosave: reemplaza el borrador completo — ver docs y save-draft.usecase.ts en la API. */
  saveDraft: (workspaceId: string, blocks: Block[]) =>
    authedFetch<{ saved: true }>(`/workspaces/${workspaceId}/page/draft`, {
      method: 'PUT',
      body: JSON.stringify({ blocks }),
    }),

  addBlock: (workspaceId: string, type: BlockType, config: Record<string, unknown>) =>
    authedFetch<{ blockId: string }>(`/workspaces/${workspaceId}/page/blocks`, {
      method: 'POST',
      body: JSON.stringify({ type, config }),
    }),

  publish: (workspaceId: string) =>
    authedFetch<{ versionId: string }>(`/workspaces/${workspaceId}/page/publish`, {
      method: 'POST',
    }),

  listVersions: (workspaceId: string) =>
    authedFetch<{ id: string; createdAt: string; createdBy: string }[]>(
      `/workspaces/${workspaceId}/page/versions`,
    ),

  restoreVersion: (workspaceId: string, versionId: string) =>
    authedFetch<{ restored: true }>(
      `/workspaces/${workspaceId}/page/versions/${versionId}/restore`,
      { method: 'POST' },
    ),
};
