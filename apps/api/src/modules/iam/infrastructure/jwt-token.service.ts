import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenServicePort } from '../domain/ports';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwt: JwtService) {}

  signAccessToken(payload: { sub: string; email: string }): string {
    // Access token de vida corta (15 min) — si se filtra, la ventana de
    // exposición es pequeña. El refresh token (vida larga) vive en cookie
    // httpOnly, nunca en localStorage, para reducir superficie de XSS.
    return this.jwt.sign(payload, { expiresIn: '15m' });
  }

  signRefreshToken(payload: { sub: string }): string {
    return this.jwt.sign(payload, { expiresIn: '30d', subject: payload.sub });
  }

  verifyRefreshToken(token: string): { sub: string } | null {
    try {
      const decoded = this.jwt.verify<{ sub: string }>(token);
      return decoded;
    } catch {
      return null;
    }
  }
}
