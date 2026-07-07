import { Page } from './page.entity';

export interface PageRepositoryPort {
  findRootPageByWorkspace(workspaceId: string): Promise<Page | null>;
  save(page: Page): Promise<void>;
}
export const PAGE_REPOSITORY = Symbol('PAGE_REPOSITORY');

export interface PageVersionRepositoryPort {
  createSnapshot(
    pageId: string,
    blocks: unknown,
    createdBy: string,
  ): Promise<{ id: string; createdAt: Date }>;
  listByPage(pageId: string): Promise<{ id: string; createdAt: Date; createdBy: string }[]>;
  findById(versionId: string): Promise<{ id: string; blocks: unknown } | null>;
}
export const PAGE_VERSION_REPOSITORY = Symbol('PAGE_VERSION_REPOSITORY');
