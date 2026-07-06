import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../domain/user.repository.port';
import {
  AUTH_METHOD_REPOSITORY,
  AuthMethodRepositoryPort,
  PASSWORD_HASHER,
  PasswordHasherPort,
  TOKEN_SERVICE,
  TokenServicePort,
} from '../domain/ports';

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  accessToken: string;
  refreshToken: string;
  requiresTwoFactor: boolean;
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(AUTH_METHOD_REPOSITORY) private readonly authMethods: AuthMethodRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.users.findByEmail(input.email);
    // Mensaje idéntico si el usuario no existe o la contraseña es incorrecta
    // (evita enumeración de usuarios).
    const invalidCredentials = () =>
      new UnauthorizedException('Credenciales inválidas');

    if (!user) throw invalidCredentials();

    const method = await this.authMethods.findPasswordMethod(user.id);
    if (!method) throw invalidCredentials();

    const valid = await this.hasher.verify(input.password, method.passwordHash);
    if (!valid) throw invalidCredentials();

    if (user.twoFactorEnabled) {
      // El flujo de 2FA emite un token temporal de "pending 2FA" en vez de
      // las credenciales finales — se completa en VerifyTwoFactorUseCase.
      return {
        accessToken: '',
        refreshToken: '',
        requiresTwoFactor: true,
      };
    }

    return {
      accessToken: this.tokens.signAccessToken({ sub: user.id, email: user.email }),
      refreshToken: this.tokens.signRefreshToken({ sub: user.id }),
      requiresTwoFactor: false,
    };
  }
}
