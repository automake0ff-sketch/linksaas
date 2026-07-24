import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  ctr: number; // clicks / views, 0 si no hay vistas
  dailyViews: { date: string; count: number }[];
  dailyClicks: { date: string; count: number }[];
  topBlocks: { blockId: string; clicks: number }[];
}

const DEFAULT_RANGE_DAYS = 14;

/**
 * Query de solo lectura (agregación) — igual que ListMyWorkspacesUseCase,
 * usa PrismaService directamente en vez de un puerto/repositorio propio.
 * No hay reglas de negocio aquí, solo agregación de datos ya guardados.
 */
@Injectable()
export class GetAnalyticsSummaryUseCase {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async execute(workspaceId: string, rangeDays = DEFAULT_RANGE_DAYS): Promise<AnalyticsSummary> {
    const since = new Date();
    since.setDate(since.getDate() - rangeDays);
    since.setHours(0, 0, 0, 0);

    const events: { eventType: string; blockId: string | null; createdAt: Date }[] =
      await this.prisma.analyticsEvent.findMany({
        where: { workspaceId, createdAt: { gte: since } },
        select: { eventType: true, blockId: true, createdAt: true },
      });

    const totalViews = events.filter((e) => e.eventType === 'view').length;
    const totalClicks = events.filter((e) => e.eventType === 'click').length;
    const ctr = totalViews > 0 ? totalClicks / totalViews : 0;

    const dailyViews = this.bucketByDay(
      events.filter((e) => e.eventType === 'view'),
      rangeDays,
    );
    const dailyClicks = this.bucketByDay(
      events.filter((e) => e.eventType === 'click'),
      rangeDays,
    );

    const clicksByBlock = new Map<string, number>();
    for (const e of events) {
      if (e.eventType === 'click' && e.blockId) {
        clicksByBlock.set(e.blockId, (clicksByBlock.get(e.blockId) ?? 0) + 1);
      }
    }
    const topBlocks = [...clicksByBlock.entries()]
      .map(([blockId, clicks]) => ({ blockId, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    return { totalViews, totalClicks, ctr, dailyViews, dailyClicks, topBlocks };
  }

  private bucketByDay(
    events: { createdAt: Date }[],
    rangeDays: number,
  ): { date: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const e of events) {
      const key = e.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    // Se rellenan también los días sin eventos con 0 — así el frontend
    // dibuja una serie continua en vez de tener huecos que confundan
    // "sin datos" con "cero visitas ese día".
    const result: { date: string; count: number }[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: counts.get(key) ?? 0 });
    }
    return result;
  }
}
