'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/auth-api';
import { ApiError } from '@/lib/api-client';
import { TextField, Button } from '@/components/form-fields';

const ResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(10, 'La contraseña debe tener al menos 10 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
});
type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(ResetPasswordSchema) });

  const mutation = useMutation({
    mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(token ?? '', input.newPassword),
    onSuccess: () => router.push('/login?reset=1'),
    onError: (error: ApiError) => setError('root', { message: error.message }),
  });

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
          <p className="text-sm text-danger">
            Este enlace no es válido. Pide uno nuevo desde{' '}
            <Link href="/forgot-password" className="underline">
              recuperar contraseña
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Elige una nueva contraseña
        </h1>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
        >
          <TextField
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
            error={errors.newPassword?.message}
          />
          {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}

          <Button type="submit" isLoading={mutation.isPending} className="mt-2">
            Guardar nueva contraseña
          </Button>
        </form>
      </div>
    </main>
  );
}
