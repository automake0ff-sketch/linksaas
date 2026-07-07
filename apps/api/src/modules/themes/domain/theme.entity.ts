import { AggregateRoot, DomainError } from '../../../shared/kernel/entity';

export interface ThemeTokens {
  surface: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  fontDisplay: string;
  fontBody: string;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

interface ThemeProps {
  workspaceId: string | null; // null = tema de sistema, disponible para todos
  name: string;
  tokens: ThemeTokens;
  customCss: string | null;
}

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const COLOR_FIELDS: (keyof ThemeTokens)[] = [
  'surface', 'surfaceSecondary', 'textPrimary', 'textSecondary', 'border', 'accent',
];

// Allowlist deliberada de fuentes (no input libre): evita que un usuario
// inyecte un nombre de fuente arbitrario que rompa el @font-face o que se
// use como vector para cargar recursos de terceros no controlados.
const ALLOWED_FONTS = new Set([
  'Inter', 'Space Grotesk', 'JetBrains Mono', 'Poppins', 'Playfair Display',
  'Merriweather', 'Roboto Mono', 'Work Sans', 'Fraunces',
]);

// Custom CSS tiene un tamaño máximo — no es una validación de seguridad
// (eso se hace al renderizar, ver docs/08-Seguridad.md sobre sanitización),
// es una protección contra abuso/payloads desproporcionados en la BD.
const MAX_CUSTOM_CSS_LENGTH = 20_000;

export class Theme extends AggregateRoot<ThemeProps> {
  private constructor(id: string, props: ThemeProps) {
    super(id, props);
  }

  static create(
    id: string,
    params: { workspaceId: string | null; name: string; tokens: ThemeTokens; customCss?: string },
  ): Theme {
    Theme.validateTokens(params.tokens);
    Theme.validateCustomCss(params.customCss);

    if (!params.name.trim()) {
      throw new DomainError('El tema necesita un nombre', 'INVALID_THEME_NAME');
    }

    return new Theme(id, {
      workspaceId: params.workspaceId,
      name: params.name.trim(),
      tokens: params.tokens,
      customCss: params.customCss?.trim() || null,
    });
  }

  static reconstitute(id: string, props: ThemeProps): Theme {
    return new Theme(id, props);
  }

  updateTokens(tokens: ThemeTokens): void {
    Theme.validateTokens(tokens);
    this.props.tokens = tokens;
  }

  updateCustomCss(customCss: string | null): void {
    Theme.validateCustomCss(customCss ?? undefined);
    this.props.customCss = customCss?.trim() || null;
  }

  get tokens(): ThemeTokens {
    return this.props.tokens;
  }

  get name(): string {
    return this.props.name;
  }

  get workspaceId(): string | null {
    return this.props.workspaceId;
  }

  get customCss(): string | null {
    return this.props.customCss;
  }

  get isSystemTheme(): boolean {
    return this.props.workspaceId === null;
  }

  private static validateTokens(tokens: ThemeTokens): void {
    for (const field of COLOR_FIELDS) {
      const value = tokens[field] as string;
      if (!HEX_COLOR_REGEX.test(value)) {
        throw new DomainError(`"${field}" debe ser un color hexadecimal válido`, 'INVALID_COLOR');
      }
    }
    if (!ALLOWED_FONTS.has(tokens.fontDisplay)) {
      throw new DomainError(`Fuente de titulares "${tokens.fontDisplay}" no permitida`, 'INVALID_FONT');
    }
    if (!ALLOWED_FONTS.has(tokens.fontBody)) {
      throw new DomainError(`Fuente de cuerpo "${tokens.fontBody}" no permitida`, 'INVALID_FONT');
    }
  }

  private static validateCustomCss(customCss?: string): void {
    if (customCss && customCss.length > MAX_CUSTOM_CSS_LENGTH) {
      throw new DomainError(
        `El CSS personalizado no puede superar ${MAX_CUSTOM_CSS_LENGTH} caracteres`,
        'CUSTOM_CSS_TOO_LONG',
      );
    }
  }
}
