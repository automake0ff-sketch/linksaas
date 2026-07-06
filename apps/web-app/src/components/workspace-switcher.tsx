'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import clsx from 'clsx';

interface WorkspaceOption {
  id: string;
  slug: string;
  displayName: string;
}

/**
 * Elemento de firma del panel: representa "cada usuario tiene su propio
 * espacio" como una pila de tarjetas físicamente superpuestas — al abrir,
 * se despliegan. No es un <select> genérico: la metáfora visual encarna
 * el concepto central del producto (multi-workspace).
 */
export function WorkspaceSwitcher({
  workspaces,
  activeId,
  onSelect,
}: {
  workspaces: WorkspaceOption[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group relative flex h-11 w-56 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-left"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {/* tarjetas apiladas detrás, visibles como bordes asomando */}
        {!open && workspaces.length > 1 && (
          <>
            <span className="absolute -right-1 top-1 h-full w-full -translate-y-1 rounded-lg border border-border bg-surface-2 opacity-60" />
            <span className="absolute -right-0.5 top-0.5 h-full w-full -translate-y-0.5 rounded-lg border border-border bg-surface-2 opacity-80" />
          </>
        )}
        <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-semibold text-white">
          {active?.displayName?.slice(0, 2).toUpperCase()}
        </span>
        <span className="relative z-10 flex-1 truncate text-sm font-medium text-text-primary">
          {active?.displayName}
        </span>
        <ChevronDown className="relative z-10 h-4 w-4 text-text-secondary" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg"
        >
          {workspaces.map((w) => (
            <li key={w.id}>
              <button
                role="option"
                aria-selected={w.id === activeId}
                onClick={() => {
                  onSelect(w.id);
                  setOpen(false);
                }}
                className={clsx(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-surface-2',
                  w.id === activeId ? 'text-accent' : 'text-text-primary',
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-2 text-[10px] font-semibold">
                  {w.displayName.slice(0, 2).toUpperCase()}
                </span>
                {w.displayName}
              </button>
            </li>
          ))}
          <li>
            <button className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-text-secondary hover:bg-surface-2">
              <Plus className="h-4 w-4" /> Crear espacio
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
