import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { Theme, ThemeTokens } from '../domain/theme.entity';
import { ThemeRepositoryPort } from '../domain/ports';

@Injectable()
export class PrismaThemeRepository implements ThemeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findSystemThemes(): Promise<Theme[]> {
    const rows = await this.prisma.theme.findMany({ where: { workspaceId: null } });
    return rows.map(this.toDomain);
  }

  async findByWorkspace(workspaceId: string): Promise<Theme[]> {
    const rows = await this.prisma.theme.findMany({ where: { workspaceId } });
    return rows.map(this.toDomain);
  }

  async findById(themeId: string): Promise<Theme | null> {
    const row = await this.prisma.theme.findUnique({ where: { id: themeId } });
    return row ? this.toDomain(row) : null;
  }

  async save(theme: Theme): Promise<void> {
    await this.prisma.theme.upsert({
      where: { id: theme.id },
      create: {
        id: theme.id,
        workspaceId: theme.workspaceId,
        name: theme.name,
        tokens: theme.tokens as unknown as object,
        customCss: theme.customCss,
      },
      update: {
        name: theme.name,
        tokens: theme.tokens as unknown as object,
        customCss: theme.customCss,
      },
    });
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
