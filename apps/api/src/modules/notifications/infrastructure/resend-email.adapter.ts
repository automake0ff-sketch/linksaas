import { Injectable, Logger } from '@nestjs/common';
import { EmailPort, SendEmailInput } from '../domain/email.port';

/**
 * Llamada HTTP directa a la API de Resend en vez de su SDK — un email
 * transaccional simple no justifica una dependencia adicional. Si Resend
 * responde con error, se registra pero NUNCA se relanza como excepción:
 * un fallo de envío de email no debe tumbar el flujo de negocio que lo
 * disparó (ej. "olvidé mi contraseña" debe seguir devolviendo su mensaje
 * genérico aunque el email falle en enviarse).
 */
@Injectable()
export class ResendEmailAdapter implements EmailPort {
  private readonly logger = new Logger(ResendEmailAdapter.name);
  private readonly apiKey = process.env.RESEND_API_KEY!;
  private readonly fromAddress = process.env.EMAIL_FROM ?? 'LinkForge <onboarding@resend.dev>';

  async send(input: SendEmailInput): Promise<void> {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: input.to,
          subject: input.subject,
          html: input.html,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`Resend respondió ${res.status} al enviar a ${input.to}: ${body}`);
      }
    } catch (error) {
      this.logger.error(`Fallo de red enviando email a ${input.to}`, error as Error);
    }
  }
}
