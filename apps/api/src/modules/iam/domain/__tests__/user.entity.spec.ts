import { describe, expect, it } from 'vitest';
import { User } from '../user.entity';
import { DomainError } from '../../../../shared/kernel/entity';

describe('User (dominio)', () => {
  it('normaliza el email a minúsculas y sin espacios', () => {
    const user = User.create('id-1', { email: '  Test@Example.com  ' });
    expect(user.email).toBe('test@example.com');
  });

  it('rechaza un email con formato inválido', () => {
    expect(() => User.create('id-1', { email: 'no-es-un-email' })).toThrow(DomainError);
  });

  it('emite el evento user.registered al crearse', () => {
    const user = User.create('id-1', { email: 'a@b.com' });
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('user.registered');
  });

  it('se marca como verificado automáticamente al registrarse (no hay envío de email todavía)', () => {
    const user = User.create('id-1', { email: 'a@b.com' });
    expect(user.isEmailVerified).toBe(true);
  });

  it('marcar como verificado un usuario ya verificado es idempotente (no emite evento)', () => {
    const user = User.create('id-1', { email: 'a@b.com' });
    user.pullDomainEvents(); // limpiar el evento de creación
    user.markEmailVerified();
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(0);
  });
});
