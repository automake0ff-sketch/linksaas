import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  // Sigue siendo opcional para no romper desarrollo local sin Redis
  // levantado — sin ella, el rate limiting cae a memoria del proceso
  // (ver app.module.ts, ThrottlerModule.forRootAsync). Con ella puesta,
  // el rate limit es compartido entre réplicas — necesaria en cualquier
  // despliegue con más de una instancia de la API.
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  PLATFORM_DOMAIN: z.string().default('linkforge.com'),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
