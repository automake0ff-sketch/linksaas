'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RegisterInputSchema, type RegisterInput } from '@linkforge/contracts';
import { apiFetch, ApiError } from '@/lib/api-client';
import { TextField, Button } from '@/components/form-fields';

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterInputSchema) });

  const mutation = useMutation({
    mutationFn: (input: RegisterInput) =>
      apiFetch<{ userId: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => router.push('/login?registered=1'),
    onError: (error: ApiError) => {
      // Mensaje genérico también en la UI — no revelamos si el fallo fue
      // "email ya existe" con detalle distinto a cualquier otro error.
      setError('root', { message: error.message });
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Publica tu página en menos de 5 minutos.
        </p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
        >
          <TextField
            label="Nombre"
            type="text"
            autoComplete="name"
            {...register('name')}
            error={errors.name?.message}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
          />
          {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}

          <Button type="submit" isLoading={mutation.isPending} className="mt-2">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
