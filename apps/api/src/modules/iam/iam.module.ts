import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RegisterUserUseCase } from './application/register-user.usecase';
import { LoginUserUseCase } from './application/login-user.usecase';
import { RefreshTokenUseCase } from './application/refresh-token.usecase';
import { AuthController } from './interface/auth.controller';
import { USER_REPOSITORY } from './domain/user.repository.port';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import {
  AUTH_METHOD_REPOSITORY,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
} from './domain/ports';
import { PrismaAuthMethodRepository } from './infrastructure/prisma-auth-method.repository';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { SharedInfraModule } from '../../shared/infrastructure/shared-infra.module';

@Module({
  imports: [
    SharedInfraModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      // Nunca un default hardcodeado en producción — falla explícitamente
      // si falta la variable de entorno (ver main.ts, validación de config).
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: AUTH_METHOD_REPOSITORY, useClass: PrismaAuthMethodRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [USER_REPOSITORY],
})
export class IamModule {}
