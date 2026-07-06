import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  MEMBER_REPOSITORY,
  MemberRepositoryPort,
  ROLE_REPOSITORY,
  RoleRepositoryPort,
} from '../domain/ports';
import { USER_REPOSITORY, UserRepositoryPort } from '../../iam/domain/user.repository.port';

export interface InviteMemberInput {
  workspaceId: string;
  invitedEmail: string;
  role: 'admin' | 'editor' | 'viewer';
}

@Injectable()
export class InviteMemberUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepositoryPort,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
  ) {}

  async execute(input: InviteMemberInput): Promise<{ invited: boolean }> {
    const user = await this.users.findByEmail(input.invitedEmail);
    if (!user) {
      // En una implementación completa esto dispara un email de invitación
      // con un link de registro pre-vinculado al workspace (Fase 0, siguiente
      // incremento: tabla `workspace_invitations` para invitados sin cuenta aún).
      throw new NotFoundException(
        'El usuario invitado debe tener una cuenta antes de ser añadido (invitación por email pendiente de implementar)',
      );
    }

    const alreadyMember = await this.members.isMember(input.workspaceId, user.id);
    if (alreadyMember) {
      throw new ConflictException('Este usuario ya es miembro del workspace');
    }

    const role = await this.roles.findSystemRoleByName(input.role);
    if (!role) {
      throw new NotFoundException(`Rol "${input.role}" no encontrado`);
    }

    await this.members.addMember(input.workspaceId, user.id, role.id);
    return { invited: true };
  }
}
