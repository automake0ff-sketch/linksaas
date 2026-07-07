import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PAGE_REPOSITORY, PageRepositoryPort } from '../domain/ports';

async function loadPageOrThrow(pages: PageRepositoryPort, workspaceId: string) {
  const page = await pages.findRootPageByWorkspace(workspaceId);
  if (!page) throw new NotFoundException('Página no encontrada para este workspace');
  return page;
}

@Injectable()
export class UpdateBlockUseCase {
  constructor(@Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort) {}

  async execute(input: {
    workspaceId: string;
    blockId: string;
    config: Record<string, unknown>;
  }): Promise<void> {
    const page = await loadPageOrThrow(this.pages, input.workspaceId);
    page.updateBlockConfig(input.blockId, input.config);
    await this.pages.save(page);
  }
}

@Injectable()
export class RemoveBlockUseCase {
  constructor(@Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort) {}

  async execute(input: { workspaceId: string; blockId: string }): Promise<void> {
    const page = await loadPageOrThrow(this.pages, input.workspaceId);
    page.removeBlock(input.blockId);
    await this.pages.save(page);
  }
}

@Injectable()
export class DuplicateBlockUseCase {
  constructor(@Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort) {}

  async execute(input: {
    workspaceId: string;
    blockId: string;
  }): Promise<{ newBlockId: string }> {
    const page = await loadPageOrThrow(this.pages, input.workspaceId);
    const newBlockId = randomUUID();
    page.duplicateBlock(input.blockId, newBlockId);
    await this.pages.save(page);
    return { newBlockId };
  }
}

@Injectable()
export class ReorderBlocksUseCase {
  constructor(@Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort) {}

  async execute(input: { workspaceId: string; orderedBlockIds: string[] }): Promise<void> {
    const page = await loadPageOrThrow(this.pages, input.workspaceId);
    page.reorderBlocks(input.orderedBlockIds);
    await this.pages.save(page);
  }
}

@Injectable()
export class GetDraftPageUseCase {
  constructor(@Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort) {}

  async execute(workspaceId: string) {
    const page = await loadPageOrThrow(this.pages, workspaceId);
    return { pageId: page.id, blocks: page.draftBlocks, isPublished: page.isPublished };
  }
}
