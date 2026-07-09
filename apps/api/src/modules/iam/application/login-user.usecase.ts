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

    // IMPORTANTE: no existe todavía VerifyTwoFactorUseCase ni endpoint de
    // verificación, ni forma de activar 2FA desde la UI. Bloquear aquí a un
    // usuario con twoFactorEnabled=true lo dejaría sin poder entrar nunca
    // (callejón sin salida). Hasta que el flujo completo esté implementado,
    // se ignora el flag y se emiten credenciales normales.
    // TODO: reactivar este bloqueo en cuanto exista /auth/2fa/verify.
    void user.twoFactorEnabled;

    return {
      accessToken: this.tokens.signAccessToken({ sub: user.id, email: user.email }),
      refreshToken: this.tokens.signRefreshToken({ sub: user.id }),
      requiresTwoFactor: false,
    };
  }
}
