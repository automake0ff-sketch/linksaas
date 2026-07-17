import { Global, Module } from '@nestjs/common';
import { EMAIL_PORT } from './domain/email.port';
import { ResendEmailAdapter } from './infrastructure/resend-email.adapter';
import { NoopEmailAdapter } from './infrastructure/noop-email.adapter';
import { SendWelcomeEmailOnRegister } from './application/send-welcome-email.listener';

/**
 * Global porque cualquier módulo (iam, tenancy...) puede necesitar enviar
 * un email sin tener que importar notifications explícitamente cada vez.
 */
@Global()
@Module({
  providers: [
    {
      provide: EMAIL_PORT,
      // Sin RESEND_API_KEY: adaptador no-op (registra en log, no envía nada)
      // — un despliegue sin proveedor de email conectado todavía sigue
      // funcionando, no revienta el registro ni el reset de contraseña.
      useClass: process.env.RESEND_API_KEY ? ResendEmailAdapter : NoopEmailAdapter,
    },
    SendWelcomeEmailOnRegister,
  ],
  exports: [EMAIL_PORT],
})
export class NotificationsModule {}
