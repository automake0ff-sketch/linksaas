import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { USER_REPOSITORY, UserRepositoryPort } from '../domain/user.repository.port';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  PasswordResetTokenRepositoryPort,
} from '../domain/ports';
import { EMAIL_PORT, EmailPort } from '../../notifications/domain/email.port';
import { passwordResetEmail } from '../../notifications/templates';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export interface ForgotPasswordOutput {
  message: string;
  /**
   * Solo se rellena fuera de producción, como red de seguridad para probar
   * el flujo si todavía no hay RESEND_API_KEY configurada en desarrollo.
   * En producción, el enlace solo llega por email real (ver NotificationsModule).
   */
  devResetToken?: string;
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokens: PasswordResetTokenRepositoryPort,
    @Inject(EMAIL_PORT) private readonly email: EmailPort,
  ) {}

  async execute(email: string): Promise<ForgotPasswordOutput> {
    const genericMessage = 'Si ese email tiene una cuenta, recibirás instrucciones para continuar.';

    const user = await this.users.findByEmail(email);
    // Respuesta idéntica exista o no la cuenta — si no, este endpoint se
    // convierte en un oráculo para enumerar qué emails están registrados.
    if (!user) {
      return { message: genericMessage };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.resetTokens.create(user.id, tokenHash, expiresAt);

    const { subject, html } = passwordResetEmail(rawToken);
    await this.email.send({ to: user.email, subject, html });

    const isProduction = process.env.NODE_ENV === 'production';
    return {
      message: genericMessage,
      ...(isProduction ? {} : { devResetToken: rawToken }),
    };
  }
}
