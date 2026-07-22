import { describe, expect, it } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from '../jwt-token.service';

/**
 * Deliberadamente NO se mockea JwtService aquí — el bug real de producción
 * ("Bad options.subject option. The payload already has a sub property")
 * solo lo dispara la librería `jsonwebtoken` de verdad al firmar; un mock
 * de JwtService.sign() nunca lo habría detectado. Este test usa una
 * instancia real, igual que en producción.
 */
describe('JwtTokenService (con JwtService real, sin mockear)', () => {
  const jwt = new JwtService({ secret: 'test-secret-de-al-menos-32-caracteres' });
  const service = new JwtTokenService(jwt);

  it('firma un access token sin lanzar', () => {
    expect(() => service.signAccessToken({ sub: 'user-1', email: 'a@b.com' })).not.toThrow();
  });

  it('firma un refresh token sin lanzar (regresión: payload.sub + options.subject en conflicto)', () => {
    expect(() => service.signRefreshToken({ sub: 'user-1' })).not.toThrow();
  });

  it('el refresh token firmado se puede verificar y recupera el sub correcto', () => {
    const token = service.signRefreshToken({ sub: 'user-42' });
    const decoded = service.verifyRefreshToken(token);
    expect(decoded?.sub).toBe('user-42');
  });

  it('verifyRefreshToken devuelve null ante un token inválido', () => {
    expect(service.verifyRefreshToken('esto-no-es-un-jwt')).toBeNull();
  });
});
