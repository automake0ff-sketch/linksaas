import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { Theme, ThemeTokens } from '../domain/theme.entity';
import { ThemeRepositoryPort } from '../domain/ports';

@Injectable()
export class PrismaThemeRepository implements ThemeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findSystemThemes(): Promise<Theme[]> {
    // workspace_id IS NULL siempre matchea la política RLS de themes sin
    // importar el contexto de sesión — no hace falta abrir withWorkspace.
    const rows = await this.prisma.theme.findMany({ where: { workspaceId: null } });
    return rows.map(this.toDomain);
  }

  async findByWorkspace(workspaceId: string): Promise<Theme[]> {
    const rows = await this.prisma.withWorkspace(workspaceId, (tx) =>
      tx.theme.findMany({ where: { workspaceId } }),
    );
    return rows.map(this.toDomain);
  }

  async findById(themeId: string, workspaceId: string): Promise<Theme | null> {
    const row = await this.prisma.withWorkspace(workspaceId, (tx) =>
      tx.theme.findUnique({ where: { id: themeId } }),
    );
    return row ? this.toDomain(row) : null;
  }

  async save(theme: Theme): Promise<void> {
    const data = {
      name: theme.name,
      tokens: theme.tokens as unknown as object,
      customCss: theme.customCss,
    };

    // Los temas de sistema (workspaceId null) los crea el seed, no este
    // método vía la app — pero por si acaso, si no hay workspaceId no hay
    // contexto de tenant que abrir.
    if (!theme.workspaceId) {
      await this.prisma.theme.upsert({
        where: { id: theme.id },
        create: { id: theme.id, workspaceId: null, ...data },
        update: data,
      });
      return;
    }

    await this.prisma.withWorkspace(theme.workspaceId, (tx) =>
      tx.theme.upsert({
        where: { id: theme.id },
        create: { id: theme.id, workspaceId: theme.workspaceId, ...data },
        update: data,
      }),
    );
  }

  private toDomain(row: {
    id: string;
    workspaceId: string | null;
    name: string;
    tokens: unknown;
    customCss: string | null;
  }): Theme {
    return Theme.reconstitute(row.id, {
      workspaceId: row.workspaceId,
      name: row.name,
      tokens: row.tokens as ThemeTokens,
      customCss: row.customCss,
    });
  }
}
