import { Module } from '@nestjs/common';
import { CreateWorkspaceUseCase } from './application/create-workspace.usecase';
import { InviteMemberUseCase } from './application/invite-member.usecase';
import { ListMyWorkspacesUseCase } from './application/list-my-workspaces.usecase';
import { CreateDefaultWorkspaceOnRegister } from './application/create-default-workspace.listener';
import { AcceptPendingInvitationsOnRegister } from './application/accept-pending-invitations.listener';
import { TenancyController } from './interface/tenancy.controller';
import {
  MEMBER_REPOSITORY,
  ORGANIZATION_REPOSITORY,
  ROLE_REPOSITORY,
  WORKSPACE_INVITATION_REPOSITORY,
  WORKSPACE_REPOSITORY,
} from './domain/ports';
import {
  PrismaMemberRepository,
  PrismaOrganizationRepository,
  PrismaRoleRepository,
  PrismaWorkspaceRepository,
} from './infrastructure/prisma-tenancy.repositories';
import { PrismaWorkspaceInvitationRepository } from './infrastructure/prisma-workspace-invitation.repository';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [IamModule], // InviteMemberUseCase depende de USER_REPOSITORY, exportado por IamModule
  controllers: [TenancyController],
  providers: [
    CreateWorkspaceUseCase,
    InviteMemberUseCase,
    ListMyWorkspacesUseCase,
    CreateDefaultWorkspaceOnRegister,
    AcceptPendingInvitationsOnRegister,
    { provide: WORKSPACE_REPOSITORY, useClass: PrismaWorkspaceRepository },
    { provide: ORGANIZATION_REPOSITORY, useClass: PrismaOrganizationRepository },
    { provide: MEMBER_REPOSITORY, useClass: PrismaMemberRepository },
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    { provide: WORKSPACE_INVITATION_REPOSITORY, useClass: PrismaWorkspaceInvitationRepository },
  ],
})
export class TenancyModule {}
