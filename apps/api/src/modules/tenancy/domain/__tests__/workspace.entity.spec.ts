import { describe, expect, it } from 'vitest';
import { Workspace } from '../workspace.entity';
import { DomainError } from '../../../../shared/kernel/entity';

describe('Workspace (dominio)', () => {
  const base = { organizationId: 'org-1', displayName: 'Mi espacio' };

  it('acepta un slug válido en minúsculas con guiones', () => {
    const ws = Workspace.create('id-1', { ...base, slug: 'mi-espacio-2026' });
    expect(ws.slug).toBe('mi-espacio-2026');
  });

  it('normaliza el slug a minúsculas', () => {
    const ws = Workspace.create('id-1', { ...base, slug: 'MiEspacio' });
    expect(ws.slug).toBe('miespacio');
  });

  it('rechaza un slug con caracteres inválidos', () => {
    expect(() => Workspace.create('id-1', { ...base, slug: 'mi espacio!' })).toThrow(DomainError);
  });

  it('rechaza slugs reservados por la plataforma', () => {
    expect(() => Workspace.create('id-1', { ...base, slug: 'admin' })).toThrow(DomainError);
    expect(() => Workspace.create('id-1', { ...base, slug: 'api' })).toThrow(DomainError);
  });

  it('emite workspace.created al crearse', () => {
    const ws = Workspace.create('id-1', { ...base, slug: 'valido' });
    const events = ws.pullDomainEvents();
    expect(events[0].name).toBe('workspace.created');
  });
});
