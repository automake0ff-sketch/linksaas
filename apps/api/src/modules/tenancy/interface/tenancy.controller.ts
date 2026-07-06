import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateWorkspaceUseCase } from '../application/create-workspace.usecase';
import { InviteMemberUseCase } from '../application/invite-member.usecase';
import { CreateWorkspaceDto, InviteMemberDto } from './tenancy.dto';
import { WorkspaceAccessGuard, RequirePermission } from '../../../shared/guards/workspace-access.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@ApiTags('workspaces')
@Controller('workspaces')
export class TenancyController {
  constructor(
    private readonly createWorkspace: CreateWorkspaceUseCase,
    private readonly inviteMember: InviteMemberUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateWorkspaceDto, @CurrentUser() userId: string) {
    return this.createWorkspace.execute({ ownerId: userId, ...dto });
  }

  @Post(':workspaceId/members')
  @UseGuards(WorkspaceAccessGuard)
  @RequirePermission('members.invite')
  async invite(@Param('workspaceId') workspaceId: string, @Body() dto: InviteMemberDto) {
    return this.inviteMember.execute({ workspaceId, ...dto });
  }

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceAccessGuard)
  @RequirePermission('members.view')
  async list(@Param('workspaceId') workspaceId: string) {
    // Delegado directamente al repositorio de lectura — listar miembros es
    // una query simple que no justifica un caso de uso propio (no hay lógica
    // de negocio más allá de "leer y devolver").
    return { workspaceId, note: 'ver MemberRepositoryPort.listByWorkspace' };
  }
}
