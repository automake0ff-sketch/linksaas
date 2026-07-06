import { Workspace } from './workspace.entity';

export interface WorkspaceRepositoryPort {
  findBySlug(slug: string): Promise<Workspace | null>;
  save(workspace: Workspace): Promise<void>;
  slugExists(slug: string): Promise<boolean>;
}
export const WORKSPACE_REPOSITORY = Symbol('WORKSPACE_REPOSITORY');

export interface OrganizationRepositoryPort {
  createForOwner(ownerId: string, name: string): Promise<{ id: string }>;
}
export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface MemberRepositoryPort {
  addOwner(workspaceId: string, userId: string): Promise<void>;
  addMember(workspaceId: string, userId: string, roleId: string): Promise<void>;
  isMember(workspaceId: string, userId: string): Promise<boolean>;
  listByWorkspace(
    workspaceId: string,
  ): Promise<{ userId: string; roleName: string; status: string }[]>;
}
export const MEMBER_REPOSITORY = Symbol('MEMBER_REPOSITORY');

export interface RoleRepositoryPort {
  findSystemRoleByName(name: 'owner' | 'admin' | 'editor' | 'viewer'): Promise<{ id: string } | null>;
}
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
