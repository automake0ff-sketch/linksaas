'use client';

import { useState } from 'react';
import type { ThemeTokens } from '@linkforge/contracts';
import { Button, TextField } from '@/components/form-fields';

const ALLOWED_FONTS = [
  'Inter', 'Space Grotesk', 'JetBrains Mono', 'Poppins', 'Playfair Display',
  'Merriweather', 'Roboto Mono', 'Work Sans', 'Fraunces',
];
const RADIUS_OPTIONS: ThemeTokens['radius'][] = ['none', 'sm', 'md', 'lg', 'full'];

const COLOR_FIELDS: { key: keyof ThemeTokens; label: string }[] = [
  { key: 'surface', label: 'Fondo' },
  { key: 'surfaceSecondary', label: 'Fondo secundario' },
  { key: 'textPrimary', label: 'Texto principal' },
  { key: 'textSecondary', label: 'Texto secundario' },
  { key: 'border', label: 'Bordes' },
  { key: 'accent', label: 'Acento' },
];

export function ThemeEditor({
  initialName,
  initialTokens,
  showNameField,
  onSave,
  onCancel,
  isSaving,
}: {
  initialName?: string;
  initialTokens: ThemeTokens;
  showNameField: boolean;
  onSave: (input: { name: string; tokens: ThemeTokens }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initialName ?? 'Mi tema');
  const [tokens, setTokens] = useState<ThemeTokens>(initialTokens);

  const setField = <K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) =>
    setTokens((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex gap-6">
      <div className="flex w-72 flex-col gap-4">
        {showNameField && (
          <TextField label="Nombre del tema" value={name} onChange={(e) => setName(e.target.value)} />
        )}

        <div className="grid grid-cols-2 gap-3">
          {COLOR_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">{label}</span>
              <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                <input
                  type="color"
                  value={tokens[key] as string}
                  onChange={(e) => setField(key, e.target.value as never)}
                  className="h-6 w-6 shrink-0 cursor-pointer rounded border-none bg-transparent p-0"
                />
                <span className="truncate text-xs text-text-secondary">{tokens[key] as string}</span>
              </div>
            </label>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Fuente de titulares</span>
          <select
            value={tokens.fontDisplay}
            onChange={(e) => setField('fontDisplay', e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          >
            {ALLOWED_FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Fuente de cuerpo</span>
          <select
            value={tokens.fontBody}
            onChange={(e) => setField('fontBody', e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          >
            {ALLOWED_FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Bordes</span>
          <select
            value={tokens.radius}
            onChange={(e) => setField('radius', e.target.value as ThemeTokens['radius'])}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-2 flex gap-2">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={() => onSave({ name, tokens })}
            isLoading={isSaving}
            className="flex-1"
          >
            Guardar
          </Button>
        </div>
      </div>

      <LivePreview tokens={tokens} />
    </div>
  );
}

const RADIUS_PX: Record<ThemeTokens['radius'], string> = {
  none: '0px', sm: '6px', md: '12px', lg: '20px', full: '999px',
};

/** Preview en vivo — los mismos tokens que verá la página pública real. */
function LivePreview({ tokens }: { tokens: ThemeTokens }) {
  return (
    <div
      className="flex flex-1 flex-col items-center gap-4 rounded-xl border border-border p-8"
      style={{ background: tokens.surface }}
    >
      <div
        className="h-16 w-16 rounded-full"
        style={{ background: tokens.surfaceSecondary, border: `1px solid ${tokens.border}` }}
      />
      <p style={{ color: tokens.textPrimary, fontFamily: tokens.fontDisplay }} className="text-lg font-semibold">
        Tu Nombre
      </p>
      <p style={{ color: tokens.textSecondary, fontFamily: tokens.fontBody }} className="text-sm">
        Una breve biografía de ejemplo
      </p>
      <div
        className="w-full max-w-xs px-5 py-3 text-center text-sm font-medium"
        style={{
          background: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: RADIUS_PX[tokens.radius],
          color: tokens.textPrimary,
          fontFamily: tokens.fontBody,
        }}
      >
        Mi enlace de ejemplo
      </div>
      <div
        className="w-full max-w-xs px-5 py-3 text-center text-sm font-medium text-white"
        style={{ background: tokens.accent, borderRadius: RADIUS_PX[tokens.radius] }}
      >
        Botón de acento
      </div>
    </div>
  );
}
