import { AggregateRoot, DomainError } from '../../../shared/kernel/entity';

interface WorkspaceProps {
  organizationId: string;
  slug: string;
  displayName: string;
  createdAt: Date;
}

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set([
  'www', 'api', 'app', 'admin', 'docs', 'blog', 'help', 'support',
  'mail', 'ftp', 'staging', 'assets', 'static', 'cdn',
]);

export class Workspace extends AggregateRoot<WorkspaceProps> {
  private constructor(id: string, props: WorkspaceProps) {
    super(id, props);
  }

  static create(
    id: string,
    params: { organizationId: string; slug: string; displayName: string },
  ): Workspace {
    const slug = params.slug.toLowerCase().trim();
    if (!SLUG_REGEX.test(slug)) {
      throw new DomainError(
        'El slug solo puede contener minúsculas, números y guiones (3-50 caracteres)',
        'INVALID_SLUG',
      );
    }
    if (RESERVED_SLUGS.has(slug)) {
      throw new DomainError('Este slug está reservado por la plataforma', 'RESERVED_SLUG');
    }

    const workspace = new Workspace(id, {
      organizationId: params.organizationId,
      slug,
      displayName: params.displayName,
      createdAt: new Date(),
    });

    workspace.addDomainEvent({
      name: 'workspace.created',
      occurredAt: new Date(),
      payload: { workspaceId: id, slug, organizationId: params.organizationId },
    });

    return workspace;
  }

  static reconstitute(id: string, props: WorkspaceProps): Workspace {
    return new Workspace(id, props);
  }

  get slug(): string {
    return this.props.slug;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }
}
