import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../domain/user.repository.port';
import { TOKEN_SERVICE, TokenServicePort } from '../domain/ports';

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

/**
 * IMPORTANTE — estado real de esta implementación (léase antes de asumir
 * que esto es un sistema de refresh completo):
 *
 * Esto verifica la firma/expiración del refresh token y emite un par nuevo
 * (rotación básica). Lo que NO hace todavía, y es un hueco real: no hay
 * tabla de refresh tokens emitidos, así que no hay detección de reuse
 * (si un refresh token robado se usa dos veces, no se puede detectar ni
 * revocar la sesión). Añadir eso requiere una tabla `refresh_tokens`
 * (jti, user_id, family_id, revoked_at) — ver docs/11-Auditoria-Produccion.md.
 * Sin esto, el sistema es funcional pero no tiene el nivel de seguridad de
 * sesión que docs/08-Seguridad.md da por sentado.
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokenOutput> {
    if (!refreshToken) throw new UnauthorizedException('Sesión no encontrada');

    const decoded = this.tokens.verifyRefreshToken(refreshToken);
    if (!decoded) throw new UnauthorizedException('Sesión expirada, inicia sesión de nuevo');

    const user = await this.users.findById(decoded.sub);
    if (!user) throw new UnauthorizedException('Sesión inválida');

    return {
      accessToken: this.tokens.signAccessToken({ sub: user.id, email: user.email }),
      refreshToken: this.tokens.signRefreshToken({ sub: user.id }),
    };
  }
}
