import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddBlockUseCase } from '../application/add-block.usecase';
import {
  DuplicateBlockUseCase,
  GetDraftPageUseCase,
  RemoveBlockUseCase,
  ReorderBlocksUseCase,
  UpdateBlockUseCase,
} from '../application/block-mutations.usecases';
import { SaveDraftUseCase } from '../application/save-draft.usecase';
import {
  ListPageVersionsUseCase,
  PublishPageUseCase,
  RestorePageVersionUseCase,
} from '../application/publishing.usecases';
import { AddBlockDto, ReorderBlocksDto, SaveDraftDto, UpdateBlockDto } from './pages.dto';
import { RequirePermission, WorkspaceAccessGuard } from '../../../shared/guards/workspace-access.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@ApiTags('pages')
@Controller('workspaces/:workspaceId/page')
@UseGuards(WorkspaceAccessGuard)
export class PagesController {
  constructor(
    private readonly getDraft: GetDraftPageUseCase,
    private readonly addBlock: AddBlockUseCase,
    private readonly updateBlock: UpdateBlockUseCase,
    private readonly removeBlock: RemoveBlockUseCase,
    private readonly duplicateBlock: DuplicateBlockUseCase,
    private readonly reorderBlocks: ReorderBlocksUseCase,
    private readonly saveDraft: SaveDraftUseCase,
    private readonly publishPage: PublishPageUseCase,
    private readonly listVersions: ListPageVersionsUseCase,
    private readonly restoreVersion: RestorePageVersionUseCase,
  ) {}

  @Get()
  @RequirePermission('pages.edit')
  async get(@Param('workspaceId') workspaceId: string) {
    return this.getDraft.execute(workspaceId);
  }

  @Put('draft')
  @RequirePermission('pages.edit')
  async save(@Param('workspaceId') workspaceId: string, @Body() dto: SaveDraftDto) {
    await this.saveDraft.execute({ workspaceId, blocks: dto.blocks as never });
    return { saved: true };
  }

  @Post('blocks')
  @RequirePermission('pages.edit')
  async add(@Param('workspaceId') workspaceId: string, @Body() dto: AddBlockDto) {
    return this.addBlock.execute({ workspaceId, ...dto });
  }

  @Put('blocks/:blockId')
  @RequirePermission('pages.edit')
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('blockId') blockId: string,
    @Body() dto: UpdateBlockDto,
  ) {
    await this.updateBlock.execute({ workspaceId, blockId, config: dto.config });
    return { updated: true };
  }

  @Delete('blocks/:blockId')
  @RequirePermission('pages.edit')
  async remove(@Param('workspaceId') workspaceId: string, @Param('blockId') blockId: string) {
    await this.removeBlock.execute({ workspaceId, blockId });
    return { removed: true };
  }

  @Post('blocks/:blockId/duplicate')
  @RequirePermission('pages.edit')
  async duplicate(@Param('workspaceId') workspaceId: string, @Param('blockId') blockId: string) {
    return this.duplicateBlock.execute({ workspaceId, blockId });
  }

  @Put('blocks/reorder')
  @RequirePermission('pages.edit')
  async reorder(@Param('workspaceId') workspaceId: string, @Body() dto: ReorderBlocksDto) {
    await this.reorderBlocks.execute({ workspaceId, orderedBlockIds: dto.orderedBlockIds });
    return { reordered: true };
  }

  @Post('publish')
  @RequirePermission('pages.publish')
  async publish(@Param('workspaceId') workspaceId: string, @CurrentUser() userId: string) {
    return this.publishPage.execute({ workspaceId, publishedBy: userId });
  }

  @Get('versions')
  @RequirePermission('pages.edit')
  async versions(@Param('workspaceId') workspaceId: string) {
    return this.listVersions.execute(workspaceId);
  }

  @Post('versions/:versionId/restore')
  @RequirePermission('pages.edit')
  async restore(@Param('workspaceId') workspaceId: string, @Param('versionId') versionId: string) {
    await this.restoreVersion.execute({ workspaceId, versionId });
    return { restored: true };
  }
}
