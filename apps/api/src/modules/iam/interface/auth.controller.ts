import { Body, Controller, HttpCode, Post, Res, Req, UnauthorizedException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { RegisterUserUseCase } from '../application/register-user.usecase';
import { LoginUserUseCase } from '../application/login-user.usecase';
import { RefreshTokenUseCase } from '../application/refresh-token.usecase';
import { ForgotPasswordUseCase } from '../application/forgot-password.usecase';
import { ResetPasswordUseCase } from '../application/reset-password.usecase';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './auth.dto';
import { Public } from '../../../shared/decorators/public.decorator';

const REFRESH_COOKIE = 'lf_refresh';

@ApiTags('auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly forgotPassword: ForgotPasswordUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
  ) {}

  @Post('register')
  @HttpCode(201)
  // Rate limit agresivo en registro: mitiga creación masiva de cuentas /
  // enumeración de emails vía el mensaje de error.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto) {
    const { userId } = await this.registerUser.execute(dto);
    // Nota: hasta que exista envío real de email (Resend/SES), la cuenta se
    // marca como verificada en el registro para no prometer un correo que
    // nunca llega. Ver User.create() en el dominio.
    return { userId, message: 'Cuenta creada correctamente' };
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
    // clearCookie debe recibir las MISMAS opciones (path, sameSite, secure)
    // con las que se creó la cookie — si no, el navegador la trata como una
    // cookie distinta y la original (path='/v1/auth') sigue viva. Antes de
    // este fix, "cerrar sesión" no cerraba la sesión de verdad: el refresh
    // token seguía siendo válido y usable después de pulsar logout.
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/v1/auth',
    });
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException('Sesión no encontrada');

    const result = await this.refreshTokenUseCase.execute(token);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: true,
      // 'none' (no 'lax'): web-app vive en vercel.app y la API en onrender.com
      // (u otro dominio) — son sitios distintos desde el punto de vista del
      // navegador. Con 'lax', esta cookie NUNCA se habría enviado en las
      // llamadas fetch() cross-site (solo se envía en navegaciones de nivel
      // superior, como pinchar un link) — el refresh habría fallado en
      // silencio en producción real, aunque funcionara en local (mismo
      // origen allí). 'none' exige 'secure: true', que ya estaba puesto.
      sameSite: 'none',
      path: '/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('forgot-password')
  @HttpCode(200)
  // Mismo espíritu que el rate limit de /register: sin esto, este endpoint
  // es una forma barata de hacer spam de emails de reset o de tantear qué
  // direcciones existen por temporización.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async requestPasswordReset(@Body() dto: ForgotPasswordDto) {
    return this.forgotPassword.execute(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async completePasswordReset(@Body() dto: ResetPasswordDto) {
    await this.resetPassword.execute(dto.token, dto.newPassword);
    return { message: 'Contraseña actualizada correctamente' };
  }
}
