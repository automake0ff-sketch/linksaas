'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useActiveWorkspaceStore } from '@/store/active-workspace-store';
import { themesApi, type ThemeSummary } from '@/lib/themes-api';
import { pagesApi } from '@/lib/pages-api';
import { ThemeCard } from '@/components/themes/theme-card';
import { ThemeEditor } from '@/components/themes/theme-editor';

const BLANK_TOKENS = {
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F5F8',
  textPrimary: '#12151C',
  textSecondary: '#5B6270',
  border: '#E3E5EA',
  accent: '#3454D1',
  fontDisplay: 'Space Grotesk',
  fontBody: 'Inter',
  radius: 'md' as const,
};

export default function ThemesPage() {
  const workspaceId = useActiveWorkspaceStore((s) => s.workspaceId);
  const queryClient = useQueryClient();
  const [editingTheme, setEditingTheme] = useState<ThemeSummary | 'new' | null>(null);

  const { data: themesData } = useQuery({
    queryKey: ['themes', workspaceId],
    queryFn: () => themesApi.list(workspaceId!),
    enabled: !!workspaceId,
  });

  const { data: draft } = useQuery({
    queryKey: ['page-draft', workspaceId],
    queryFn: () => pagesApi.getDraft(workspaceId!),
    enabled: !!workspaceId,
  });

  const assignMutation = useMutation({
    mutationFn: (themeId: string) => themesApi.assign(workspaceId!, themeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['page-draft', workspaceId] }),
  });

  const createMutation = useMutation({
    mutationFn: (input: { name: string; tokens: typeof BLANK_TOKENS }) =>
      themesApi.create(workspaceId!, input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['themes', workspaceId] });
      await assignMutation.mutateAsync(result.themeId);
      setEditingTheme(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: { themeId: string; tokens: typeof BLANK_TOKENS }) =>
      themesApi.update(workspaceId!, input.themeId, input.tokens),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['themes', workspaceId] });
      setEditingTheme(null);
    },
  });

  if (!workspaceId || !themesData) {
    return <div className="p-8 text-sm text-text-secondary">Cargando temas…</div>;
  }

  const activeThemeId = draft?.themeId ?? null;

  if (editingTheme) {
    const isNew = editingTheme === 'new';
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">
          {isNew ? 'Nuevo tema personalizado' : `Editando «${editingTheme.name}»`}
        </h1>
        <ThemeEditor
          showNameField={isNew}
          initialName={isNew ? undefined : editingTheme.name}
          initialTokens={isNew ? BLANK_TOKENS : editingTheme.tokens}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onCancel={() => setEditingTheme(null)}
          onSave={({ name, tokens }) =>
            isNew
              ? createMutation.mutate({ name, tokens })
              : updateMutation.mutate({ themeId: (editingTheme as ThemeSummary).id, tokens })
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Temas</h1>
      <p className="mt-1 text-text-secondary">
        Elige un tema para tu página o crea uno personalizado.
      </p>

      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Presets
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {themesData.systemThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            active={theme.id === activeThemeId}
            onSelect={() => assignMutation.mutate(theme.id)}
          />
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Tus temas
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {themesData.customThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            active={theme.id === activeThemeId}
            onSelect={() => assignMutation.mutate(theme.id)}
            onEdit={() => setEditingTheme(theme)}
          />
        ))}
        <button
          onClick={() => setEditingTheme('new')}
          className="flex h-full min-h-[10rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-text-secondary hover:border-accent/50 hover:text-accent"
        >
          <Plus className="h-5 w-5" />
          Crear tema
        </button>
      </div>
    </div>
  );
}
