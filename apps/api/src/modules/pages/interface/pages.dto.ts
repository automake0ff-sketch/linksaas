import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { BLOCK_TYPES } from '../domain/page.entity';
import { BlockSchema } from '@linkforge/contracts';

export const AddBlockSchema = z.object({
  type: z.enum(BLOCK_TYPES),
  config: z.record(z.unknown()).default({}),
});
export class AddBlockDto extends createZodDto(AddBlockSchema) {}

export const UpdateBlockSchema = z.object({
  config: z.record(z.unknown()),
});
export class UpdateBlockDto extends createZodDto(UpdateBlockSchema) {}

export const ReorderBlocksSchema = z.object({
  orderedBlockIds: z.array(z.string()).min(1),
});
export class ReorderBlocksDto extends createZodDto(ReorderBlocksSchema) {}

export const SaveDraftSchema = z.object({
  blocks: z.array(BlockSchema).max(100),
});
export class SaveDraftDto extends createZodDto(SaveDraftSchema) {}
