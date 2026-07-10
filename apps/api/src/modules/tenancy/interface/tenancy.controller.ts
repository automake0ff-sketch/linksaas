import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateWorkspaceUseCase } from '../application/create-workspace.usecase';
import { InviteMemberUseCase } from '../application/invite-member.usecase';
import { ListMyWorkspacesUseCase } from '../application/list-my-workspaces.usecase';
import { MEMBER_REPOSITORY, MemberRepositoryPort } from '../domain/ports';
import { CreateWorkspaceDto, InviteMemberDto } from './tenancy.dto';
import { WorkspaceAccessGuard, RequirePermission } from '../../../shared/guards/workspace-access.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@ApiTags('workspaces')
@Controller('workspaces')
export class TenancyController {
  constructor(
    private readonly createWorkspace: CreateWorkspaceUseCase,
    private readonly inviteMember: InviteMemberUseCase,
    private readonly listMyWorkspaces: ListMyWorkspacesUseCase,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepositoryPort,
  ) {}

  @Get()
  async listMine(@CurrentUser() userId: string) {
    return this.listMyWorkspaces.execute(userId);
  }

  @Post()
  async create(@Body() dto: CreateWorkspaceDto, @CurrentUser() userId: string) {
    return this.createWorkspace.execute({ ownerId: userId, ...dto });
  }

  @Post(':workspaceId/members')
  @UseGuards(WorkspaceAccessGuard)
  @RequirePermission('members.invite')
  async invite(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() userId: string,
  ) {
    return this.inviteMember.execute({ workspaceId, invitedBy: userId, ...dto });
  }

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceAccessGuard)
  @RequirePermission('members.view')
  async list(@Param('workspaceId') workspaceId: string) {
    // Antes esto devolvía un stub ({ note: '...' }) en vez de la lista real
    // — se detectó de paso al tocar este módulo para las invitaciones
    // pendientes.
    return this.members.listByWorkspace(workspaceId);
  }
}
