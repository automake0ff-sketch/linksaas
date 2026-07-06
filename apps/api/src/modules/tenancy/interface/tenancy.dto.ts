import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateWorkspaceSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/, 'Solo minúsculas, números y guiones'),
  displayName: z.string().min(1).max(120),
});
export class CreateWorkspaceDto extends createZodDto(CreateWorkspaceSchema) {}

export const InviteMemberSchema = z.object({
  invitedEmail: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});
export class InviteMemberDto extends createZodDto(InviteMemberSchema) {}
