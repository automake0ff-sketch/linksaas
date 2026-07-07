import { Theme } from './theme.entity';

export interface ThemeRepositoryPort {
  findSystemThemes(): Promise<Theme[]>;
  findByWorkspace(workspaceId: string): Promise<Theme[]>;
  findById(themeId: string): Promise<Theme | null>;
  save(theme: Theme): Promise<void>;
}
export const THEME_REPOSITORY = Symbol('THEME_REPOSITORY');
