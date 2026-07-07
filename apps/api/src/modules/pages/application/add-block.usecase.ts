import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PAGE_REPOSITORY, PageRepositoryPort } from '../domain/ports';
import { BlockType } from '../domain/page.entity';

export interface AddBlockInput {
  workspaceId: string;
  type: BlockType;
  config: Record<string, unknown>;
}

@Injectable()
export class AddBlockUseCase {
  constructor(@Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort) {}

  async execute(input: AddBlockInput): Promise<{ blockId: string }> {
    const page = await this.pages.findRootPageByWorkspace(input.workspaceId);
    if (!page) throw new NotFoundException('Página no encontrada para este workspace');

    const blockId = randomUUID();
    page.addBlock(blockId, input.type, input.config);
    await this.pages.save(page);

    return { blockId };
  }
}
