import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { WorkspaceInvitationRepositoryPort } from '../domain/ports';

@Injectable()
export class PrismaWorkspaceInvitationRepository implements WorkspaceInvitationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    workspaceId: string;
    email: string;
    roleId: string;
    invitedBy: string;
    expiresAt: Date;
  }): Promise<{ id: string }> {
    // NOTA: workspace_invitations no tiene RLS activo todavía a propósito
    // (ver docs/rls-policies-reference.sql) — igual que members/roles, la
    // consulta de invitaciones pendientes por email es cross-tenant por
    // diseño (un email puede tener invitaciones de varios workspaces
    // distintos antes de registrarse). Se usa el cliente directo, no
    // withWorkspace.
    const row = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId: input.workspaceId,
        email: input.email.toLowerCase().trim(),
        roleId: input.roleId,
        invitedBy: input.invitedBy,
        expiresAt: input.expiresAt,
      },
    });
    return { id: row.id };
  }

  async findPendingByEmail(
    email: string,
  ): Promise<{ id: string; workspaceId: string; roleId: string; expiresAt: Date }[]> {
    const rows = await this.prisma.workspaceInvitation.findMany({
      where: { email: email.toLowerCase().trim(), status: 'pending' },
    });
    return rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      roleId: r.roleId,
      expiresAt: r.expiresAt,
    }));
  }

  async findPendingByWorkspaceAndEmail(
    workspaceId: string,
    email: string,
  ): Promise<{ id: string } | null> {
    const row = await this.prisma.workspaceInvitation.findFirst({
      where: { workspaceId, email: email.toLowerCase().trim(), status: 'pending' },
    });
    return row ? { id: row.id } : null;
  }

  async markAccepted(id: string): Promise<void> {
    await this.prisma.workspaceInvitation.update({
      where: { id },
      data: { status: 'accepted', acceptedAt: new Date() },
    });
  }
}
