import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { User } from '../domain/user.entity';
import { USER_REPOSITORY, UserRepositoryPort } from '../domain/user.repository.port';
import {
  AUTH_METHOD_REPOSITORY,
  AuthMethodRepositoryPort,
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../domain/ports';
import { DomainEventBus } from '../../../shared/kernel/domain-event-bus';

export interface RegisterUserInput {
  email: string;
  password: string;
  name?: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(AUTH_METHOD_REPOSITORY) private readonly authMethods: AuthMethodRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    private readonly eventBus: DomainEventBus,
  ) {}

  async execute(input: RegisterUserInput): Promise<{ userId: string }> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      // No revelamos si el email existe con detalle distinto — mensaje genérico
      throw new ConflictException('No se pudo completar el registro');
    }

    const user = User.create(randomUUID(), { email: input.email, name: input.name });
    await this.users.save(user);

    const passwordHash = await this.hasher.hash(input.password);
    await this.authMethods.createPasswordMethod(user.id, passwordHash);

    this.eventBus.publishAll(user.pullDomainEvents());
    // user.registered dispara: email de verificación (notifications),
    // creación de organización/workspace por defecto (tenancy) — vía listeners,
    // no acoplado aquí.

    return { userId: user.id };
  }
}
