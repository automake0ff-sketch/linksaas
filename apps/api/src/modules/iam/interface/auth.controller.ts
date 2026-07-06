import { Body, Controller, HttpCode, Post, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { RegisterUserUseCase } from '../application/register-user.usecase';
import { LoginUserUseCase } from '../application/login-user.usecase';
import { LoginDto, RegisterDto } from './auth.dto';
import { Public } from '../../../shared/decorators/public.decorator';

const REFRESH_COOKIE = 'lf_refresh';

@ApiTags('auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
  ) {}

  @Post('register')
  @HttpCode(201)
  // Rate limit agresivo en registro: mitiga creación masiva de cuentas /
  // enumeración de emails vía el mensaje de error.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto) {
    const { userId } = await this.registerUser.execute(dto);
    return { userId, message: 'Revisa tu email para verificar la cuenta' };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.loginUser.execute(dto);

    if (result.requiresTwoFactor) {
      return { requiresTwoFactor: true };
    }

    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, requiresTwoFactor: false };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request) {
    // La rotación de refresh token y la detección de reuse se implementan
    // en RefreshTokenUseCase (siguiente incremento de este módulo) —
    // aquí queda el punto de entrada ya cableado.
    const token = (req.cookies?.[REFRESH_COOKIE] as string) ?? '';
    return { received: !!token };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
}
