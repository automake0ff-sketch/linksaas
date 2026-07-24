'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, MousePointerClick, TrendingUp } from 'lucide-react';
import { useActiveWorkspaceStore } from '@/store/active-workspace-store';
import { analyticsApi } from '@/lib/analytics-api';
import { MiniBarChart } from '@/components/analytics/mini-bar-chart';

const RANGE_OPTIONS = [
  { label: '7 días', value: 7 },
  { label: '14 días', value: 14 },
  { label: '30 días', value: 30 },
];

export default function AnalyticsPage() {
  const workspaceId = useActiveWorkspaceStore((s) => s.workspaceId);
  const [rangeDays, setRangeDays] = useState(14);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-summary', workspaceId, rangeDays],
    queryFn: () => analyticsApi.summary(workspaceId!, rangeDays),
    enabled: !!workspaceId,
  });

  if (!workspaceId || isLoading) {
    return <div className="p-8 text-sm text-text-secondary">Cargando analítica…</div>;
  }

  if (!data) {
    return <div className="p-8 text-sm text-danger">No se pudo cargar la analítica.</div>;
  }

  const ctrPercent = (data.ctr * 100).toFixed(1);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Analítica</h1>
          <p className="mt-1 text-text-secondary">Rendimiento de tu página pública.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRangeDays(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                rangeDays === opt.value
                  ? 'bg-surface text-accent shadow-sm'
                  : 'text-text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard icon={Eye} label="Visitas" value={data.totalViews} />
        <StatCard icon={MousePointerClick} label="Clics" value={data.totalClicks} />
        <StatCard icon={TrendingUp} label="CTR" value={`${ctrPercent}%`} />
      </div>

      {/* Tendencia diaria */}
      <div className="mt-8 grid grid-cols-2 gap-6 rounded-lg border border-border bg-surface p-5">
        <MiniBarChart data={data.dailyViews} label="Visitas por día" />
        <MiniBarChart data={data.dailyClicks} label="Clics por día" />
      </div>

      {/* Bloques más clicados */}
      <div className="mt-8 rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Bloques con más clics
        </h2>
        {data.topBlocks.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Todavía no hay clics registrados en este periodo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.topBlocks.map((b, i) => (
              <li key={b.blockId} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">
                  #{i + 1} · bloque <code className="text-xs">{b.blockId.slice(0, 8)}</code>
                </span>
                <span className="font-medium text-text-primary">{b.clicks} clics</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-text-secondary">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}
