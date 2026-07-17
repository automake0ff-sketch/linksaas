import { Injectable, Logger } from '@nestjs/common';
import { EmailPort, SendEmailInput } from '../domain/email.port';

/**
 * Sin RESEND_API_KEY configurada (local, o un despliegue que aún no lo ha
 * conectado), los emails no se envían — se registran en el log para poder
 * ver el contenido durante el desarrollo, en vez de fallar o de fingir que
 * se envió algo. Ver NotificationsModule para la selección automática de
 * adaptador según haya o no API key.
 */
@Injectable()
export class NoopEmailAdapter implements EmailPort {
  private readonly logger = new Logger(NoopEmailAdapter.name);

  async send(input: SendEmailInput): Promise<void> {
    this.logger.warn(
      `RESEND_API_KEY no configurada — email NO enviado a ${input.to}. Asunto: "${input.subject}"`,
    );
  }
}
