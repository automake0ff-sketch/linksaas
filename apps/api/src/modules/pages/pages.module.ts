import { Module } from '@nestjs/common';
import { AddBlockUseCase } from './application/add-block.usecase';
import {
  DuplicateBlockUseCase,
  GetDraftPageUseCase,
  RemoveBlockUseCase,
  ReorderBlocksUseCase,
  UpdateBlockUseCase,
} from './application/block-mutations.usecases';
import { SaveDraftUseCase } from './application/save-draft.usecase';
import {
  ListPageVersionsUseCase,
  PublishPageUseCase,
  RestorePageVersionUseCase,
} from './application/publishing.usecases';
import { CreateRootPageOnWorkspaceCreated } from './application/create-root-page.listener';
import { PagesController } from './interface/pages.controller';
import { PAGE_REPOSITORY, PAGE_VERSION_REPOSITORY } from './domain/ports';
import {
  PrismaPageRepository,
  PrismaPageVersionRepository,
} from './infrastructure/prisma-page.repository';

@Module({
  controllers: [PagesController],
  providers: [
    AddBlockUseCase,
    UpdateBlockUseCase,
    RemoveBlockUseCase,
    DuplicateBlockUseCase,
    ReorderBlocksUseCase,
    SaveDraftUseCase,
    GetDraftPageUseCase,
    PublishPageUseCase,
    ListPageVersionsUseCase,
    RestorePageVersionUseCase,
    CreateRootPageOnWorkspaceCreated,
    { provide: PAGE_REPOSITORY, useClass: PrismaPageRepository },
    { provide: PAGE_VERSION_REPOSITORY, useClass: PrismaPageVersionRepository },
  ],
  exports: [PAGE_REPOSITORY],
})
export class PagesModule {}
