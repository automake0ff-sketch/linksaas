'use client';

import clsx from 'clsx';
import { Check } from 'lucide-react';
import type { ThemeSummary } from '@/lib/themes-api';

export function ThemeCard({
  theme,
  active,
  onSelect,
  onEdit,
}: {
  theme: ThemeSummary;
  active: boolean;
  onSelect: () => void;
  onEdit?: () => void;
}) {
  const t = theme.tokens;

  return (
    <div
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-xl border transition-colors',
        active ? 'border-accent ring-2 ring-accent/20' : 'border-border hover:border-accent/50',
      )}
    >
      {/* Miniatura: reproduce en pequeño la paleta real del tema, no un icono genérico */}
      <button
        onClick={onSelect}
        className="flex h-28 flex-col items-center justify-center gap-2 p-4"
        style={{ background: t.surface }}
      >
        <div
          className="h-8 w-24 rounded-md"
          style={{ background: t.surfaceSecondary, border: `1px solid ${t.border}` }}
        />
        <div className="h-2 w-16 rounded-full" style={{ background: t.textSecondary }} />
        <div className="h-2 w-10 rounded-full" style={{ background: t.accent }} />
      </button>

      <div className="flex items-center justify-between border-t border-border bg-surface px-3 py-2">
        <span className="text-sm font-medium text-text-primary">{theme.name}</span>
        <div className="flex items-center gap-2">
          {!theme.isSystemTheme && onEdit && (
            <button onClick={onEdit} className="text-xs text-text-secondary hover:text-accent">
              Editar
            </button>
          )}
          {active && <Check className="h-4 w-4 text-accent" />}
        </div>
      </div>
    </div>
  );
}
