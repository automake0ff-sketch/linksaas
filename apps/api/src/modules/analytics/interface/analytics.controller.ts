import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAnalyticsSummaryUseCase } from '../application/get-analytics-summary.usecase';
import { RequirePermission, WorkspaceAccessGuard } from '../../../shared/guards/workspace-access.guard';

@ApiTags('analytics')
@Controller('workspaces/:workspaceId/analytics')
@UseGuards(WorkspaceAccessGuard)
export class AnalyticsController {
  constructor(private readonly getSummary: GetAnalyticsSummaryUseCase) {}

  @Get('summary')
  @RequirePermission('pages.edit') // mismo permiso que ver/editar la página — no hace falta uno nuevo
  async summary(
    @Param('workspaceId') workspaceId: string,
    @Query('rangeDays') rangeDays?: string,
  ) {
    const parsed = rangeDays ? Math.min(Math.max(parseInt(rangeDays, 10) || 14, 1), 90) : 14;
    return this.getSummary.execute(workspaceId, parsed);
  }
}
