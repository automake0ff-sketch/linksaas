import { AggregateRoot, DomainError } from '../../../shared/kernel/entity';

interface UserProps {
  email: string;
  name?: string;
  avatarUrl?: string;
  emailVerifiedAt?: Date;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User extends AggregateRoot<UserProps> {
  private constructor(id: string, props: UserProps) {
    super(id, props);
  }

  static create(id: string, params: { email: string; name?: string }): User {
    const normalizedEmail = params.email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new DomainError('Email inválido', 'INVALID_EMAIL');
    }
    const user = new User(id, {
      email: normalizedEmail,
      name: params.name,
      // TODO: volver a exigir verificación por email en cuanto exista el
      // envío real (Resend/SES). Hasta entonces, verificar en el registro
      // evita prometer un correo que nunca llega.
      emailVerifiedAt: new Date(),
      twoFactorEnabled: false,
      createdAt: new Date(),
    });
    user.addDomainEvent({
      name: 'user.registered',
      occurredAt: new Date(),
      payload: { userId: id, email: user.props.email },
    });
    return user;
  }

  static reconstitute(id: string, props: UserProps): User {
    return new User(id, props);
  }

  markEmailVerified(): void {
    if (this.props.emailVerifiedAt) return;
    this.props.emailVerifiedAt = new Date();
    this.addDomainEvent({
      name: 'user.email_verified',
      occurredAt: new Date(),
      payload: { userId: this.id },
    });
  }

  get email(): string {
    return this.props.email;
  }

  get isEmailVerified(): boolean {
    return !!this.props.emailVerifiedAt;
  }

  get twoFactorEnabled(): boolean {
    return this.props.twoFactorEnabled;
  }
}
