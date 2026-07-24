import { Module } from '@nestjs/common';
import { GetAnalyticsSummaryUseCase } from './application/get-analytics-summary.usecase';
import { AnalyticsController } from './interface/analytics.controller';

@Module({
  controllers: [AnalyticsController],
  providers: [GetAnalyticsSummaryUseCase],
})
export class AnalyticsModule {}
