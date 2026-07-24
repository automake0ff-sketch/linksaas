import { apiFetch } from './api-client';
import { getAccessToken } from './auth-token-store';

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  dailyViews: { date: string; count: number }[];
  dailyClicks: { date: string; count: number }[];
  topBlocks: { blockId: string; clicks: number }[];
}

export const analyticsApi = {
  summary: (workspaceId: string, rangeDays = 14) =>
    apiFetch<AnalyticsSummary>(
      `/workspaces/${workspaceId}/analytics/summary?rangeDays=${rangeDays}`,
      { accessToken: getAccessToken() ?? undefined },
    ),
};
