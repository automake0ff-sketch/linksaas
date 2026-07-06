import { z } from 'zod';

/**
 * Único punto de verdad para la forma de un "bloque" de página — usado por
 * el editor en web-app y por el renderer en web-public. Si mañana se añade
 * un tipo de bloque nuevo, se añade aquí una vez y ambas apps lo entienden.
 */
export const BlockTypeSchema = z.enum([
  'link', 'text', 'image', 'social', 'video', 'embed',
  'gallery', 'faq', 'countdown', 'form', 'product', 'html', 'markdown',
]);
export type BlockType = z.infer<typeof BlockTypeSchema>;

export const BlockSchema = z.object({
  id: z.string(),
  type: BlockTypeSchema,
  order: z.number().int().nonnegative(),
  config: z.record(z.unknown()),
});
export type Block = z.infer<typeof BlockSchema>;

export const ThemeTokensSchema = z.object({
  surface: z.string(),
  surfaceSecondary: z.string(),
  textPrimary: z.string(),
  textSecondary: z.string(),
  border: z.string(),
  accent: z.string(),
  fontDisplay: z.string().default('Space Grotesk'),
  fontBody: z.string().default('Inter'),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('md'),
});
export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

export const PublicPageSchema = z.object({
  workspaceSlug: z.string(),
  title: z.string().nullable(),
  blocks: z.array(BlockSchema),
  theme: ThemeTokensSchema,
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
});
export type PublicPage = z.infer<typeof PublicPageSchema>;

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  name: z.string().min(1).max(120).optional(),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;
