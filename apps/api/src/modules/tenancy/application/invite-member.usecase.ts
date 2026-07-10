import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  MEMBER_REPOSITORY,
  MemberRepositoryPort,
  ROLE_REPOSITORY,
  RoleRepositoryPort,
  WORKSPACE_INVITATION_REPOSITORY,
  WorkspaceInvitationRepositoryPort,
} from '../domain/ports';
import { USER_REPOSITORY, UserRepositoryPort } from '../../iam/domain/user.repository.port';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export interface InviteMemberInput {
  workspaceId: string;
  invitedEmail: string;
  invitedBy: string;
  role: 'admin' | 'editor' | 'viewer';
}

@Injectable()
export class InviteMemberUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepositoryPort,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(WORKSPACE_INVITATION_REPOSITORY)
    private readonly invitations: WorkspaceInvitationRepositoryPort,
  ) {}

  async execute(input: InviteMemberInput): Promise<{ invited: boolean; pending: boolean }> {
    const role = await this.roles.findSystemRoleByName(input.role);
    if (!role) {
      throw new NotFoundException(`Rol "${input.role}" no encontrado`);
    }

    const user = await this.users.findByEmail(input.invitedEmail);

    if (!user) {
      // El invitado no tiene cuenta todavía: se guarda una invitación
      // pendiente en vez de fallar. Cuando ese email se registre,
      // AcceptPendingInvitationsOnRegister (listener de 'user.registered')
      // lo añade automáticamente a este workspace.
      const existing = await this.invitations.findPendingByWorkspaceAndEmail(
        input.workspaceId,
        input.invitedEmail,
      );
      if (existing) {
        throw new ConflictException('Ya hay una invitación pendiente para este email');
      }

      await this.invitations.create({
        workspaceId: input.workspaceId,
        email: input.invitedEmail,
        roleId: role.id,
        invitedBy: input.invitedBy,
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      });
      return { invited: true, pending: true };
    }

    const alreadyMember = await this.members.isMember(input.workspaceId, user.id);
    if (alreadyMember) {
      throw new ConflictException('Este usuario ya es miembro del workspace');
    }

    await this.members.addMember(input.workspaceId, user.id, role.id);
    return { invited: true, pending: false };
  }
}
