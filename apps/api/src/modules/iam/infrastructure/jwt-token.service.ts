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
    // NUNCA pasar también `subject:` aquí — el payload ya incluye `sub`,
    // y la librería jsonwebtoken rechaza tener las dos cosas a la vez
    // ("Bad options.subject option. The payload already has a sub
    // property") porque no sabe cuál debe prevalecer. Este bug rompía
    // TODO login real (nunca se detectó antes porque los tests unitarios
    // mockean JwtService, sin pasar por la librería real).
    return this.jwt.sign(payload, { expiresIn: '30d' });
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
