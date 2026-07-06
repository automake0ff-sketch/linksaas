import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { Workspace } from '../domain/workspace.entity';
import {
  MemberRepositoryPort,
  OrganizationRepositoryPort,
  RoleRepositoryPort,
  WorkspaceRepositoryPort,
} from '../domain/ports';

@Injectable()
export class PrismaWorkspaceRepository implements WorkspaceRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<Workspace | null> {
    const row = await this.prisma.workspace.findUnique({ where: { slug } });
    if (!row) return null;
    return Workspace.reconstitute(row.id, {
      organizationId: row.organizationId,
      slug: row.slug,
      displayName: row.displayName,
      createdAt: row.createdAt,
    });
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.workspace.count({ where: { slug } });
    return count > 0;
  }

  async save(workspace: Workspace): Promise<void> {
    await this.prisma.workspace.upsert({
      where: { id: workspace.id },
      create: {
        id: workspace.id,
        organizationId: workspace.organizationId,
        slug: workspace.slug,
        displayName: workspace.slug,
      },
      update: { slug: workspace.slug },
    });
  }
}

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createForOwner(ownerId: string, name: string): Promise<{ id: string }> {
    const org = await this.prisma.organization.create({
      data: { ownerId, name, plan: 'free' },
    });
    return { id: org.id };
  }
}

@Injectable()
export class PrismaMemberRepository implements MemberRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async addOwner(workspaceId: string, userId: string): Promise<void> {
    const ownerRole = await this.prisma.role.findFirst({
      where: { name: 'owner', workspaceId: null },
    });
    if (!ownerRole) throw new Error('Rol de sistema "owner" no encontrado — revisar seed');
    await this.prisma.member.create({
      data: { workspaceId, userId, roleId: ownerRole.id, status: 'active' },
    });
  }

  async addMember(workspaceId: string, userId: string, roleId: string): Promise<void> {
    await this.prisma.member.create({
      data: { workspaceId, userId, roleId, status: 'active' },
    });
  }

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.member.count({ where: { workspaceId, userId } });
    return count > 0;
  }

  async listByWorkspace(workspaceId: string) {
    const rows = await this.prisma.member.findMany({
      where: { workspaceId },
      include: { role: true },
    });
    return rows.map((r) => ({ userId: r.userId, roleName: r.role.name, status: r.status }));
  }
}

@Injectable()
export class PrismaRoleRepository implements RoleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findSystemRoleByName(name: 'owner' | 'admin' | 'editor' | 'viewer') {
    const row = await this.prisma.role.findFirst({ where: { name, workspaceId: null } });
    return row ? { id: row.id } : null;
  }
}
