import type { ThemeTokens } from '@linkforge/contracts';
import { apiFetch } from './api-client';
import { getAccessToken } from './auth-token-store';

export interface ThemeSummary {
  id: string;
  name: string;
  tokens: ThemeTokens;
  isSystemTheme: boolean;
}

function authedFetch<T>(path: string, init: RequestInit = {}) {
  return apiFetch<T>(path, { ...init, accessToken: getAccessToken() ?? undefined });
}

export const themesApi = {
  list: (workspaceId: string) =>
    authedFetch<{ systemThemes: ThemeSummary[]; customThemes: ThemeSummary[] }>(
      `/workspaces/${workspaceId}/themes`,
    ),

  create: (workspaceId: string, input: { name: string; tokens: ThemeTokens }) =>
    authedFetch<{ themeId: string }>(`/workspaces/${workspaceId}/themes`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (workspaceId: string, themeId: string, tokens: ThemeTokens) =>
    authedFetch<{ updated: true }>(`/workspaces/${workspaceId}/themes/${themeId}`, {
      method: 'PUT',
      body: JSON.stringify({ tokens }),
    }),

  assign: (workspaceId: string, themeId: string) =>
    authedFetch<{ assigned: true }>(`/workspaces/${workspaceId}/themes/assign`, {
      method: 'POST',
      body: JSON.stringify({ themeId }),
    }),
};
