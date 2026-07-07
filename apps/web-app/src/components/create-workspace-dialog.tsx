'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '@/lib/workspaces-api';
import { ApiError } from '@/lib/api-client';
import { TextField, Button } from '@/components/form-fields';
import { useActiveWorkspaceStore } from '@/store/active-workspace-store';

const CreateWorkspaceSchema = z.object({
  slug: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50)
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/, 'Solo minúsculas, números y guiones'),
  displayName: z.string().min(1, 'Requerido').max(120),
});
type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

export function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const setActiveWorkspace = useActiveWorkspaceStore((s) => s.setWorkspaceId);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({ resolver: zodResolver(CreateWorkspaceSchema) });

  const mutation = useMutation({
    mutationFn: workspacesApi.create,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['my-workspaces'] });
      setActiveWorkspace(result.workspaceId);
      onClose();
    },
    onError: (error: ApiError) => setError('root', { message: error.message }),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-text-primary">Crear espacio</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Cada espacio tiene su propia página pública: linkforge.com/tu-slug.
        </p>

        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
        >
          <TextField
            label="Nombre"
            placeholder="Mi marca personal"
            {...register('displayName')}
            error={errors.displayName?.message}
          />
          <TextField
            label="Slug"
            placeholder="mi-marca"
            {...register('slug')}
            error={errors.slug?.message}
          />
          {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}

          <div className="mt-2 flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" isLoading={mutation.isPending} className="flex-1">
              Crear
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
