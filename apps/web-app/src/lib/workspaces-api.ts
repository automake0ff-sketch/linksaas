import { apiFetch } from './api-client';
import { getAccessToken } from './auth-token-store';

export interface WorkspaceSummary {
  id: string;
  slug: string;
  displayName: string;
  role: string;
}

function authedFetch<T>(path: string, init: RequestInit = {}) {
  return apiFetch<T>(path, { ...init, accessToken: getAccessToken() ?? undefined });
}

export const workspacesApi = {
  listMine: () => authedFetch<WorkspaceSummary[]>('/workspaces'),

  create: (input: { slug: string; displayName: string }) =>
    authedFetch<{ workspaceId: string; slug: string }>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
