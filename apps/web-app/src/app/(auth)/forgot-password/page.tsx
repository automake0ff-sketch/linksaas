'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { authApi } from '@/lib/auth-api';
import { TextField, Button } from '@/components/form-fields';

const ForgotPasswordSchema = z.object({ email: z.string().email() });
type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [devToken, setDevToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(ForgotPasswordSchema) });

  const mutation = useMutation({
    mutationFn: (input: ForgotPasswordInput) => authApi.forgotPassword(input.email),
    onSuccess: (res) => {
      if (res.devResetToken) setDevToken(res.devResetToken);
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Recupera tu contraseña
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Te enviaremos un enlace para elegir una nueva.
        </p>

        {mutation.isSuccess ? (
          <div className="mt-6 rounded-md bg-success/10 px-3 py-3 text-sm text-success">
            {mutation.data.message}
            {devToken && (
              <p className="mt-2 break-all text-xs text-text-secondary">
                Modo desarrollo (sin proveedor de email configurado):{' '}
                <Link href={`/reset-password?token=${devToken}`} className="underline">
                  usar este enlace
                </Link>
              </p>
            )}
          </div>
        ) : (
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
            <Button type="submit" isLoading={mutation.isPending} className="mt-2">
              Enviar enlace
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link href="/login" className="font-medium text-accent hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
