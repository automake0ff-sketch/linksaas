import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(10, 'La contraseña debe tener al menos 10 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
  name: z.string().min(1).max(120).optional(),
});
export class RegisterDto extends createZodDto(RegisterSchema) {}

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export class LoginDto extends createZodDto(LoginSchema) {}

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export class RefreshDto extends createZodDto(RefreshSchema) {}

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});
export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(10, 'La contraseña debe tener al menos 10 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
});
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
