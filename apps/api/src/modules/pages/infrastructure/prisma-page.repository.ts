import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { Page, PageBlock } from '../domain/page.entity';
import { PageRepositoryPort, PageVersionRepositoryPort } from '../domain/ports';

@Injectable()
export class PrismaPageRepository implements PageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findRootPageByWorkspace(workspaceId: string): Promise<Page | null> {
    const row = await this.prisma.withWorkspace(workspaceId, (tx) =>
      tx.page.findUnique({
        where: { workspaceId_slug: { workspaceId, slug: '' } },
      }),
    );
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
    // RLS con WITH CHECK exige que workspace_id de la fila coincida con el
    // de la sesión — por eso el contexto se abre con page.workspaceId antes
    // de hacer el upsert, tanto en el create como en el update.
    await this.prisma.withWorkspace(page.workspaceId, (tx) =>
      tx.page.upsert({
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
      }),
    );
  }
}

@Injectable()
export class PrismaPageVersionRepository implements PageVersionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createSnapshot(workspaceId: string, pageId: string, blocks: unknown, createdBy: string) {
    return this.prisma.withWorkspace(workspaceId, async (tx) => {
      const version = await tx.pageVersion.create({
        data: { pageId, blocks: blocks as object, createdBy },
      });
      return { id: version.id, createdAt: version.createdAt };
    });
  }

  async listByPage(workspaceId: string, pageId: string) {
    return this.prisma.withWorkspace(workspaceId, (tx) =>
      tx.pageVersion.findMany({
        where: { pageId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, createdBy: true },
      }),
    );
  }

  async findById(workspaceId: string, versionId: string) {
    const row = await this.prisma.withWorkspace(workspaceId, (tx) =>
      tx.pageVersion.findUnique({ where: { id: versionId } }),
    );
    return row ? { id: row.id, blocks: row.blocks } : null;
  }
}
