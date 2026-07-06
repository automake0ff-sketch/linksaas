import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateWorkspaceUseCase } from './create-workspace.usecase';
import { DomainEvent } from '../../../shared/kernel/entity';

interface UserRegisteredPayload {
  userId: string;
  email: string;
}

/**
 * Este listener es la prueba de que la comunicación entre módulos por
 * eventos de dominio funciona: `iam` no conoce `tenancy`, solo emite
 * `user.registered`. Es `tenancy` quien decide reaccionar creando el
 * primer workspace — si mañana se quisiera cambiar ese comportamiento
 * (ej. onboarding con elección manual de slug antes de crear nada),
 * se cambia aquí sin tocar el módulo iam.
 */
@Injectable()
export class CreateDefaultWorkspaceOnRegister {
  private readonly logger = new Logger(CreateDefaultWorkspaceOnRegister.name);

  constructor(private readonly createWorkspace: CreateWorkspaceUseCase) {}

  @OnEvent('user.registered')
  async handle(event: DomainEvent): Promise<void> {
    const payload = event.payload as unknown as UserRegisteredPayload;
    const suggestedSlug = this.slugFromEmail(payload.email);

    try {
      await this.createWorkspace.execute({
        ownerId: payload.userId,
        slug: suggestedSlug,
        displayName: suggestedSlug,
      });
    } catch (error) {
      // Si el slug sugerido ya existe (email común), se añade un sufijo
      // aleatorio corto en vez de fallar todo el registro — el usuario
      // puede cambiar el slug después desde el panel.
      const fallbackSlug = `${suggestedSlug}-${Math.random().toString(36).slice(2, 6)}`;
      this.logger.warn(
        `Slug "${suggestedSlug}" no disponible, usando "${fallbackSlug}"`,
      );
      await this.createWorkspace.execute({
        ownerId: payload.userId,
        slug: fallbackSlug,
        displayName: fallbackSlug,
      });
    }
  }

  private slugFromEmail(email: string): string {
    const local = email.split('@')[0];
    return local
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30) || 'usuario';
  }
}
