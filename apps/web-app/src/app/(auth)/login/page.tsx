'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoginInputSchema, type LoginInput } from '@linkforge/contracts';
import { apiFetch, ApiError } from '@/lib/api-client';
import { setAccessToken } from '@/lib/auth-token-store';
import { TextField, Button } from '@/components/form-fields';

interface LoginResponse {
  accessToken?: string;
  requiresTwoFactor: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get('registered') === '1';
  const justReset = params.get('reset') === '1';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginInputSchema) });

  const mutation = useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (res) => {
      if (res.requiresTwoFactor) {
        router.push('/login/2fa');
        return;
      }
      if (res.accessToken) setAccessToken(res.accessToken);
      router.push('/dashboard');
    },
    onError: (error: ApiError) => setError('root', { message: error.message }),
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Bienvenido de nuevo</h1>

        {justRegistered && (
          <p className="mt-3 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            Cuenta creada. Ya puedes iniciar sesión.
          </p>
        )}

        {justReset && (
          <p className="mt-3 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            Contraseña actualizada. Ya puedes iniciar sesión con la nueva.
          </p>
        )}

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
        >
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
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Link
            href="/forgot-password"
            className="-mt-2 self-end text-xs text-text-secondary hover:text-accent hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}

          <Button type="submit" isLoading={mutation.isPending} className="mt-2">
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
