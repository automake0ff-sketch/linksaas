import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { RegisterUserUseCase } from '../register-user.usecase';
import { DomainEventBus } from '../../../../shared/kernel/domain-event-bus';

function buildUseCase() {
  const users = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
  };
  const authMethods = {
    createPasswordMethod: vi.fn().mockResolvedValue(undefined),
    findPasswordMethod: vi.fn(),
    findOAuthMethod: vi.fn(),
    createOAuthMethod: vi.fn(),
  };
  const hasher = { hash: vi.fn().mockResolvedValue('hashed'), verify: vi.fn() };
  const eventBus = { publish: vi.fn(), publishAll: vi.fn() } as unknown as DomainEventBus;

  const useCase = new RegisterUserUseCase(
    users as never,
    authMethods as never,
    hasher as never,
    eventBus,
  );
  return { useCase, users, authMethods, hasher, eventBus };
}

describe('RegisterUserUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra un usuario nuevo y hashea la contraseña', async () => {
    const { useCase, users, authMethods, hasher } = buildUseCase();
    users.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({
      email: 'nueva@linkforge.com',
      password: 'Sup3rSecreta123',
    });

    expect(result.userId).toBeDefined();
    expect(users.save).toHaveBeenCalledOnce();
    expect(hasher.hash).toHaveBeenCalledWith('Sup3rSecreta123');
    expect(authMethods.createPasswordMethod).toHaveBeenCalledOnce();
  });

  it('rechaza el registro si el email ya existe, sin filtrar detalle', async () => {
    const { useCase, users } = buildUseCase();
    users.findByEmail.mockResolvedValue({ id: 'existing' });

    await expect(
      useCase.execute({ email: 'ya@existe.com', password: 'Sup3rSecreta123' }),
    ).rejects.toThrow(ConflictException);
  });

  it('publica los eventos de dominio generados', async () => {
    const { useCase, users, eventBus } = buildUseCase();
    users.findByEmail.mockResolvedValue(null);

    await useCase.execute({ email: 'a@b.com', password: 'Sup3rSecreta123' });

    expect(eventBus.publishAll).toHaveBeenCalledOnce();
    const events = (eventBus.publishAll as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(events[0].name).toBe('user.registered');
  });
});
