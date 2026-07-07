import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAGE_REPOSITORY, PageRepositoryPort } from '../domain/ports';
import { PageBlock } from '../domain/page.entity';

@Injectable()
export class SaveDraftUseCase {
  constructor(@Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort) {}

  async execute(input: { workspaceId: string; blocks: PageBlock[] }): Promise<void> {
    const page = await this.pages.findRootPageByWorkspace(input.workspaceId);
    if (!page) throw new NotFoundException('Página no encontrada para este workspace');

    page.replaceAllBlocks(input.blocks);
    await this.pages.save(page);
  }
}
