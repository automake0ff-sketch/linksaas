import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PAGE_REPOSITORY, PageRepositoryPort } from '../domain/ports';
import { Page } from '../domain/page.entity';
import { DomainEvent } from '../../../shared/kernel/entity';

interface WorkspaceCreatedPayload {
  workspaceId: string;
}

/**
 * Misma idea que CreateDefaultWorkspaceOnRegister en el módulo tenancy:
 * `tenancy` no conoce `pages`, solo emite `workspace.created`. Es `pages`
 * quien decide que todo workspace nuevo empieza con una página raíz vacía
 * lista para editar.
 */
@Injectable()
export class CreateRootPageOnWorkspaceCreated {
  constructor(@Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort) {}

  @OnEvent('workspace.created')
  async handle(event: DomainEvent): Promise<void> {
    const { workspaceId } = event.payload as unknown as WorkspaceCreatedPayload;
    const page = Page.createEmpty(randomUUID(), { workspaceId, slug: '' });
    await this.pages.save(page);
  }
}
