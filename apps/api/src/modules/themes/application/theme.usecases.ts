import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Theme, ThemeTokens } from '../domain/theme.entity';
import { THEME_REPOSITORY, ThemeRepositoryPort } from '../domain/ports';

@Injectable()
export class ListAvailableThemesUseCase {
  constructor(@Inject(THEME_REPOSITORY) private readonly themes: ThemeRepositoryPort) {}

  async execute(workspaceId: string) {
    const [system, custom] = await Promise.all([
      this.themes.findSystemThemes(),
      this.themes.findByWorkspace(workspaceId),
    ]);
    const toDto = (t: Theme) => ({
      id: t.id,
      name: t.name,
      tokens: t.tokens,
      isSystemTheme: t.isSystemTheme,
    });
    return { systemThemes: system.map(toDto), customThemes: custom.map(toDto) };
  }
}

@Injectable()
export class CreateCustomThemeUseCase {
  constructor(@Inject(THEME_REPOSITORY) private readonly themes: ThemeRepositoryPort) {}

  async execute(input: {
    workspaceId: string;
    name: string;
    tokens: ThemeTokens;
  }): Promise<{ themeId: string }> {
    const theme = Theme.create(randomUUID(), {
      workspaceId: input.workspaceId,
      name: input.name,
      tokens: input.tokens,
    });
    await this.themes.save(theme);
    return { themeId: theme.id };
  }
}

@Injectable()
export class UpdateCustomThemeUseCase {
  constructor(@Inject(THEME_REPOSITORY) private readonly themes: ThemeRepositoryPort) {}

  async execute(input: { workspaceId: string; themeId: string; tokens: ThemeTokens }): Promise<void> {
    const theme = await this.themes.findById(input.themeId);
    if (!theme) throw new NotFoundException('Tema no encontrado');

    if (theme.isSystemTheme || theme.workspaceId !== input.workspaceId) {
      // Un workspace no puede editar temas de sistema ni temas de otro
      // workspace — este chequeo es la razón por la que el endpoint exige
      // el workspaceId en la ruta y no solo el themeId.
      throw new ForbiddenException('No puedes editar este tema');
    }

    theme.updateTokens(input.tokens);
    await this.themes.save(theme);
  }
}
