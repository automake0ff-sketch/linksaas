import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Workspace } from '../domain/workspace.entity';
import {
  MEMBER_REPOSITORY,
  MemberRepositoryPort,
  ORGANIZATION_REPOSITORY,
  OrganizationRepositoryPort,
  ROLE_REPOSITORY,
  RoleRepositoryPort,
  WORKSPACE_REPOSITORY,
  WorkspaceRepositoryPort,
} from '../domain/ports';
import { DomainEventBus } from '../../../shared/kernel/domain-event-bus';

export interface CreateWorkspaceInput {
  ownerId: string;
  slug: string;
  displayName: string;
  /** organizationId existente, o se crea una nueva si no se pasa (caso típico: primer workspace del usuario) */
  organizationId?: string;
}

@Injectable()
export class CreateWorkspaceUseCase {
  constructor(
    @Inject(WORKSPACE_REPOSITORY) private readonly workspaces: WorkspaceRepositoryPort,
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgs: OrganizationRepositoryPort,
    @Inject(MEMBER_REPOSITORY) private readonly members: MemberRepositoryPort,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepositoryPort,
    private readonly eventBus: DomainEventBus,
  ) {}

  async execute(input: CreateWorkspaceInput): Promise<{ workspaceId: string; slug: string }> {
    if (await this.workspaces.slugExists(input.slug)) {
      throw new ConflictException('Ese nombre de espacio ya está en uso');
    }

    const organizationId =
      input.organizationId ?? (await this.orgs.createForOwner(input.ownerId, input.displayName)).id;

    const workspace = Workspace.create(randomUUID(), {
      organizationId,
      slug: input.slug,
      displayName: input.displayName,
    });

    await this.workspaces.save(workspace);

    const ownerRole = await this.roles.findSystemRoleByName('owner');
    if (!ownerRole) {
      // Los roles de sistema (owner/admin/editor/viewer) se siembran en el
      // seed de la base de datos — si falta aquí es un error de despliegue,
      // no un caso de negocio a manejar silenciosamente.
      throw new Error('Rol de sistema "owner" no encontrado — revisar seed de roles');
    }
    await this.members.addOwner(workspace.id, input.ownerId);

    this.eventBus.publishAll(workspace.pullDomainEvents());

    return { workspaceId: workspace.id, slug: workspace.slug };
  }
}
