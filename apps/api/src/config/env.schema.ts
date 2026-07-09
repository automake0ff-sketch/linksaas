import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  // Opcional en Fase 0/A: nada del código conecta a Redis todavía (el
  // throttler usa memoria, BullMQ no está cableado). Pasa a ser obligatoria
  // en cuanto se conecte el worker de colas (Fase A avanzada / Fase B).
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  PLATFORM_DOMAIN: z.string().default('linkforge.com'),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
