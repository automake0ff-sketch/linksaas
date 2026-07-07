import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ThemeTokensSchema } from '@linkforge/contracts';

export const CreateThemeSchema = z.object({
  name: z.string().min(1).max(60),
  tokens: ThemeTokensSchema,
});
export class CreateThemeDto extends createZodDto(CreateThemeSchema) {}

export const UpdateThemeSchema = z.object({
  tokens: ThemeTokensSchema,
});
export class UpdateThemeDto extends createZodDto(UpdateThemeSchema) {}

export const AssignThemeSchema = z.object({
  themeId: z.string(),
});
export class AssignThemeDto extends createZodDto(AssignThemeSchema) {}
