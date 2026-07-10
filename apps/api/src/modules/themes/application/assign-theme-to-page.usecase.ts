import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { THEME_REPOSITORY, ThemeRepositoryPort } from '../domain/ports';
import { PAGE_REPOSITORY } from '../../pages/domain/ports';
import type { PageRepositoryPort } from '../../pages/domain/ports';

@Injectable()
export class AssignThemeToPageUseCase {
  constructor(
    @Inject(THEME_REPOSITORY) private readonly themes: ThemeRepositoryPort,
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
  ) {}

  async execute(input: { workspaceId: string; themeId: string }): Promise<void> {
    const theme = await this.themes.findById(input.themeId, input.workspaceId);
    if (!theme) throw new NotFoundException('Tema no encontrado');

    // Un workspace puede usar cualquier tema de sistema, pero solo sus
    // propios temas personalizados — no los de otro workspace.
    if (!theme.isSystemTheme && theme.workspaceId !== input.workspaceId) {
      throw new ForbiddenException('No puedes usar un tema de otro workspace');
    }

    const page = await this.pages.findRootPageByWorkspace(input.workspaceId);
    if (!page) throw new NotFoundException('Página no encontrada para este workspace');

    page.assignTheme(theme.id);
    await this.pages.save(page);
  }
}
