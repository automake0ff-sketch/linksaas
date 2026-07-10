import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { USER_REPOSITORY, UserRepositoryPort } from '../domain/user.repository.port';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  PasswordResetTokenRepositoryPort,
} from '../domain/ports';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export interface ForgotPasswordOutput {
  message: string;
  /**
   * Solo se rellena fuera de producción. Sin un proveedor de email real
   * conectado (Resend/SES — ver .env.example), no hay forma de que el
   * usuario reciba el enlace, así que se expone aquí para poder probar el
   * flujo manualmente en desarrollo. NUNCA debe volver en producción.
   */
  devResetToken?: string;
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokens: PasswordResetTokenRepositoryPort,
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

    const isProduction = process.env.NODE_ENV === 'production';
    return {
      message: genericMessage,
      ...(isProduction ? {} : { devResetToken: rawToken }),
    };
  }
}
