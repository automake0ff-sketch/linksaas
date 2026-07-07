import { describe, expect, it } from 'vitest';
import { Theme, ThemeTokens } from '../theme.entity';
import { DomainError } from '../../../../shared/kernel/entity';

const VALID_TOKENS: ThemeTokens = {
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F5F8',
  textPrimary: '#12151C',
  textSecondary: '#5B6270',
  border: '#E3E5EA',
  accent: '#3454D1',
  fontDisplay: 'Space Grotesk',
  fontBody: 'Inter',
  radius: 'md',
};

describe('Theme (dominio)', () => {
  it('crea un tema válido', () => {
    const theme = Theme.create('t1', { workspaceId: 'ws-1', name: 'Mi tema', tokens: VALID_TOKENS });
    expect(theme.name).toBe('Mi tema');
    expect(theme.isSystemTheme).toBe(false);
  });

  it('un tema con workspaceId null es de sistema', () => {
    const theme = Theme.create('t1', { workspaceId: null, name: 'Claro', tokens: VALID_TOKENS });
    expect(theme.isSystemTheme).toBe(true);
  });

  it('rechaza un color no hexadecimal', () => {
    const badTokens = { ...VALID_TOKENS, accent: 'blue' };
    expect(() => Theme.create('t1', { workspaceId: 'ws-1', name: 'X', tokens: badTokens })).toThrow(
      DomainError,
    );
  });

  it('acepta hex corto (#fff) y largo (#ffffff)', () => {
    const short = { ...VALID_TOKENS, accent: '#f00' };
    expect(() => Theme.create('t1', { workspaceId: 'ws-1', name: 'X', tokens: short })).not.toThrow();
  });

  it('rechaza una fuente fuera de la allowlist', () => {
    const badFont = { ...VALID_TOKENS, fontBody: 'Comic Sans MS' };
    expect(() => Theme.create('t1', { workspaceId: 'ws-1', name: 'X', tokens: badFont })).toThrow(
      DomainError,
    );
  });

  it('rechaza un nombre vacío', () => {
    expect(() =>
      Theme.create('t1', { workspaceId: 'ws-1', name: '   ', tokens: VALID_TOKENS }),
    ).toThrow(DomainError);
  });

  it('rechaza CSS personalizado demasiado largo', () => {
    const hugeCss = 'a'.repeat(20_001);
    expect(() =>
      Theme.create('t1', { workspaceId: 'ws-1', name: 'X', tokens: VALID_TOKENS, customCss: hugeCss }),
    ).toThrow(DomainError);
  });

  it('actualizar tokens revalida (no permite colar un color inválido en un update)', () => {
    const theme = Theme.create('t1', { workspaceId: 'ws-1', name: 'X', tokens: VALID_TOKENS });
    expect(() => theme.updateTokens({ ...VALID_TOKENS, border: 'not-a-color' })).toThrow(DomainError);
  });
});
