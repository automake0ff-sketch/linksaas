import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  AUTH_METHOD_REPOSITORY,
  AuthMethodRepositoryPort,
  PASSWORD_HASHER,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  PasswordHasherPort,
  PasswordResetTokenRepositoryPort,
} from '../domain/ports';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokens: PasswordResetTokenRepositoryPort,
    @Inject(AUTH_METHOD_REPOSITORY) private readonly authMethods: AuthMethodRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
  ) {}

  async execute(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const record = await this.resetTokens.findValidByHash(tokenHash);

    // Mismo mensaje genérico tanto si el token no existe/ya se usó como si
    // ha expirado — no hay razón para diferenciarlos de cara al usuario, y
    // así no se revela si un token concreto "casi" era válido.
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('El enlace de recuperación no es válido o ha expirado');
    }

    const passwordHash = await this.hasher.hash(newPassword);
    await this.authMethods.updatePasswordMethod(record.userId, passwordHash);
    // Se marca usado DESPUÉS de actualizar la contraseña con éxito — si el
    // update fallara antes, el token seguiría siendo válido para reintentar
    // en vez de quedar quemado sin haber cambiado nada.
    await this.resetTokens.markUsed(record.id);
  }
}
