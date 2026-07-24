'use client';

/**
 * Barras en CSS puro, sin librería de gráficos — para una serie de 14-90
 * puntos esto es más que suficiente y evita añadir una dependencia nueva
 * (recharts/chart.js) solo para esto. Si el panel necesita gráficos más
 * ricos en el futuro (comparativas, múltiples series), ahí sí se justifica.
 */
export function MiniBarChart({
  data,
  label,
}: {
  data: { date: string; count: number }[];
  label: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-text-secondary">{label}</p>
      <div className="flex h-24 items-end gap-1">
        {data.map((d) => (
          <div
            key={d.date}
            className="group relative flex-1 rounded-t bg-accent/70 transition-colors hover:bg-accent"
            style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
          >
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-text-primary px-1.5 py-0.5 text-[10px] text-surface opacity-0 group-hover:opacity-100">
              {formatShortDate(d.date)}: {d.count}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-text-secondary">
        <span>{formatShortDate(data[0]?.date)}</span>
        <span>{formatShortDate(data[data.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

function formatShortDate(iso?: string): string {
  if (!iso) return '';
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}
