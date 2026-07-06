import { Module } from '@nestjs/common';
import { CreateWorkspaceUseCase } from './application/create-workspace.usecase';
import { InviteMemberUseCase } from './application/invite-member.usecase';
import { CreateDefaultWorkspaceOnRegister } from './application/create-default-workspace.listener';
import { TenancyController } from './interface/tenancy.controller';
import {
  MEMBER_REPOSITORY,
  ORGANIZATION_REPOSITORY,
  ROLE_REPOSITORY,
  WORKSPACE_REPOSITORY,
} from './domain/ports';
import {
  PrismaMemberRepository,
  PrismaOrganizationRepository,
  PrismaRoleRepository,
  PrismaWorkspaceRepository,
} from './infrastructure/prisma-tenancy.repositories';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [IamModule], // InviteMemberUseCase depende de USER_REPOSITORY, exportado por IamModule
  controllers: [TenancyController],
  providers: [
    CreateWorkspaceUseCase,
    InviteMemberUseCase,
    CreateDefaultWorkspaceOnRegister,
    { provide: WORKSPACE_REPOSITORY, useClass: PrismaWorkspaceRepository },
    { provide: ORGANIZATION_REPOSITORY, useClass: PrismaOrganizationRepository },
    { provide: MEMBER_REPOSITORY, useClass: PrismaMemberRepository },
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
  ],
})
export class TenancyModule {}
