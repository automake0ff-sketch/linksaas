import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '../../../shared/kernel/entity';
import {
  MEMBER_REPOSITORY,
  MemberRepositoryPort,
  WORKSPACE_INVITATION_REPOSITORY,
  WorkspaceInvitationRepositoryPort,
} from '../domain/ports';

interface UserRegisteredPayload {
  userId: string;
  email: string;
}

/**
 * Complementa a CreateDefaultWorkspaceOnRegister: además de su workspace
 * propio, si el email con el que se registra tenía invitaciones pendientes
 * (creadas por InviteMemberUseCase cuando el invitado aún no tenía cuenta),
 * se le añade como miembro de esos workspaces automáticamente.
 *
 * Corre en paralelo al listener de "workspace por defecto" — ambos
 * reaccionan al mismo evento 'user.registered' de forma independiente, así
 * que un usuario invitado termina con su propio workspace Y acceso a los
 * workspaces a los que le invitaron, igual que Slack.
 */
@Injectable()
export class AcceptPendingInvitationsOnRegister {
  private readonly logger = new Logger(AcceptPendingInvitationsOnRegister.name);

  constructor(
    @Inject(WORKSPACE_INVITATION_REPOSITORY)
    private readonly invitations: WorkspaceInvitationRepositoryPort,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepositoryPort,
  ) {}

  @OnEvent('user.registered')
  async handle(event: DomainEvent): Promise<void> {
    const payload = event.payload as unknown as UserRegisteredPayload;
    const pending = await this.invitations.findPendingByEmail(payload.email);

    for (const invitation of pending) {
      if (invitation.expiresAt < new Date()) {
        this.logger.warn(
          `Invitación ${invitation.id} expirada, no se acepta automáticamente`,
        );
        continue;
      }

      try {
        await this.members.addMember(invitation.workspaceId, payload.userId, invitation.roleId);
        await this.invitations.markAccepted(invitation.id);
      } catch (error) {
        // No debe tumbar el registro del usuario si una invitación puntual
        // falla (ej. condición de carrera con otra invitación al mismo
        // workspace) — se registra y se continúa con las demás.
        this.logger.error(
          `No se pudo aceptar la invitación ${invitation.id} para ${payload.email}`,
          error instanceof Error ? error.stack : error,
        );
      }
    }
  }
}
