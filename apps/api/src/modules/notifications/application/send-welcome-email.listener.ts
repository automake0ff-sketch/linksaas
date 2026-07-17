import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EMAIL_PORT, EmailPort } from '../domain/email.port';
import { welcomeEmail } from '../templates';
import { DomainEvent } from '../../../shared/kernel/entity';

interface UserRegisteredPayload {
  userId: string;
  email: string;
}

@Injectable()
export class SendWelcomeEmailOnRegister {
  private readonly logger = new Logger(SendWelcomeEmailOnRegister.name);

  constructor(@Inject(EMAIL_PORT) private readonly email: EmailPort) {}

  @OnEvent('user.registered')
  async handle(event: DomainEvent): Promise<void> {
    const { email } = event.payload as unknown as UserRegisteredPayload;
    const { subject, html } = welcomeEmail();
    try {
      await this.email.send({ to: email, subject, html });
    } catch (error) {
      this.logger.error(`No se pudo enviar el email de bienvenida a ${email}`, error as Error);
    }
  }
}
