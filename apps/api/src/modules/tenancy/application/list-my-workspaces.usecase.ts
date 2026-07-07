import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';

export interface MyWorkspaceSummary {
  id: string;
  slug: string;
  displayName: string;
  role: string;
}

/**
 * Query de solo lectura simple (listar workspaces de un usuario) — no
 * justifica un agregado de dominio propio, así que usa PrismaService
 * directamente en vez de pasar por un puerto/repositorio. Esta es
 * precisamente la línea que traza docs/02-Arquitectura.md §3 para decidir
 * cuándo algo es "suficientemente simple" para saltarse la capa de puertos.
 */
@Injectable()
export class ListMyWorkspacesUseCase {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<MyWorkspaceSummary[]> {
    const memberships = await this.prisma.member.findMany({
      where: { userId, status: 'active' },
      include: { workspace: true, role: true },
      orderBy: { createdAt: 'asc' },
    });

    return memberships
      .filter((m) => !m.workspace.deletedAt)
      .map((m) => ({
        id: m.workspace.id,
        slug: m.workspace.slug,
        displayName: m.workspace.displayName,
        role: m.role.name,
      }));
  }
}
