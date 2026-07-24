import { describe, expect, it, vi } from 'vitest';
import { GetAnalyticsSummaryUseCase } from '../get-analytics-summary.usecase';

function buildUseCase(events: { eventType: string; blockId: string | null; createdAt: Date }[]) {
  const prisma = { analyticsEvent: { findMany: vi.fn().mockResolvedValue(events) } };
  return new GetAnalyticsSummaryUseCase(prisma as never);
}

const today = new Date();

describe('GetAnalyticsSummaryUseCase', () => {
  it('cuenta vistas y clics por separado y calcula el CTR', async () => {
    const useCase = buildUseCase([
      { eventType: 'view', blockId: null, createdAt: today },
      { eventType: 'view', blockId: null, createdAt: today },
      { eventType: 'click', blockId: 'b1', createdAt: today },
    ]);

    const result = await useCase.execute('ws-1', 7);

    expect(result.totalViews).toBe(2);
    expect(result.totalClicks).toBe(1);
    expect(result.ctr).toBeCloseTo(0.5);
  });

  it('CTR es 0 si no hay vistas (evita dividir por cero)', async () => {
    const useCase = buildUseCase([]);
    const result = await useCase.execute('ws-1', 7);
    expect(result.ctr).toBe(0);
  });

  it('rellena con 0 los días sin eventos en vez de dejar huecos', async () => {
    const useCase = buildUseCase([{ eventType: 'view', blockId: null, createdAt: today }]);
    const result = await useCase.execute('ws-1', 7);
    expect(result.dailyViews).toHaveLength(7);
    expect(result.dailyViews.every((d) => typeof d.count === 'number')).toBe(true);
  });

  it('ordena los bloques más clicados de mayor a menor', async () => {
    const useCase = buildUseCase([
      { eventType: 'click', blockId: 'b1', createdAt: today },
      { eventType: 'click', blockId: 'b2', createdAt: today },
      { eventType: 'click', blockId: 'b2', createdAt: today },
    ]);

    const result = await useCase.execute('ws-1', 7);

    expect(result.topBlocks[0]).toEqual({ blockId: 'b2', clicks: 2 });
    expect(result.topBlocks[1]).toEqual({ blockId: 'b1', clicks: 1 });
  });

  it('ignora clics sin blockId al rankear bloques', async () => {
    const useCase = buildUseCase([{ eventType: 'click', blockId: null, createdAt: today }]);
    const result = await useCase.execute('ws-1', 7);
    expect(result.topBlocks).toHaveLength(0);
  });
});
