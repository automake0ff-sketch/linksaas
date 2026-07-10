import { Theme } from './theme.entity';

export interface ThemeRepositoryPort {
  findSystemThemes(): Promise<Theme[]>;
  findByWorkspace(workspaceId: string): Promise<Theme[]>;
  /**
   * workspaceId es el workspace que está PIDIENDO el tema (para abrir el
   * contexto RLS), no necesariamente el dueño del tema — un tema de sistema
   * (workspace_id IS NULL) es visible desde cualquier contexto por la
   * política; un tema personalizado de OTRO workspace queda oculto por RLS
   * y esto devuelve null (antes se encontraba igualmente y se rechazaba
   * explícitamente con 403 — con RLS activo el resultado observable pasa a
   * ser 404, que además revela menos información).
   */
  findById(themeId: string, workspaceId: string): Promise<Theme | null>;
  save(theme: Theme): Promise<void>;
}
export const THEME_REPOSITORY = Symbol('THEME_REPOSITORY');
