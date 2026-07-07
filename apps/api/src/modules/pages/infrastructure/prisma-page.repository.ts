import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { Page, PageBlock } from '../domain/page.entity';
import { PageRepositoryPort, PageVersionRepositoryPort } from '../domain/ports';

@Injectable()
export class PrismaPageRepository implements PageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findRootPageByWorkspace(workspaceId: string): Promise<Page | null> {
    const row = await this.prisma.page.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: '' } },
    });
    if (!row) return null;

    return Page.reconstitute(row.id, {
      workspaceId: row.workspaceId,
      slug: row.slug,
      title: row.title,
      draftBlocks: row.draftBlocks as unknown as PageBlock[],
      publishedVersionId: row.publishedVersionId,
      themeId: row.themeId,
    });
  }

  async save(page: Page): Promise<void> {
    await this.prisma.page.upsert({
      where: { id: page.id },
      create: {
        id: page.id,
        workspaceId: page.workspaceId,
        slug: '',
        draftBlocks: page.draftBlocks as unknown as object,
        themeId: page.themeId ?? undefined,
      },
      update: {
        draftBlocks: page.draftBlocks as unknown as object,
        publishedVersionId: page.publishedVersionId ?? undefined,
        themeId: page.themeId ?? undefined,
      },
    });
  }
}

@Injectable()
export class PrismaPageVersionRepository implements PageVersionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createSnapshot(pageId: string, blocks: unknown, createdBy: string) {
    const version = await this.prisma.pageVersion.create({
      data: { pageId, blocks: blocks as object, createdBy },
    });
    return { id: version.id, createdAt: version.createdAt };
  }

  async listByPage(pageId: string) {
    const rows = await this.prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, createdBy: true },
    });
    return rows;
  }

  async findById(versionId: string) {
    const row = await this.prisma.pageVersion.findUnique({ where: { id: versionId } });
    return row ? { id: row.id, blocks: row.blocks } : null;
  }
}
