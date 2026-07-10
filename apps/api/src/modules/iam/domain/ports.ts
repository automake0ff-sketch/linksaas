export interface PasswordHasherPort {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface AuthMethodRepositoryPort {
  findPasswordMethod(userId: string): Promise<{ passwordHash: string } | null>;
  createPasswordMethod(userId: string, passwordHash: string): Promise<void>;
  updatePasswordMethod(userId: string, passwordHash: string): Promise<void>;
  findOAuthMethod(
    provider: string,
    providerAccountId: string,
  ): Promise<{ userId: string } | null>;
  createOAuthMethod(
    userId: string,
    provider: string,
    providerAccountId: string,
  ): Promise<void>;
}
export const AUTH_METHOD_REPOSITORY = Symbol('AUTH_METHOD_REPOSITORY');

export interface TokenServicePort {
  signAccessToken(payload: { sub: string; email: string }): string;
  signRefreshToken(payload: { sub: string }): string;
  verifyRefreshToken(token: string): { sub: string } | null;
}
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface PasswordResetTokenRepositoryPort {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<{ id: string }>;
  /** Solo devuelve tokens que aún no se hayan usado (usedAt IS NULL). La
   * expiración se comprueba en el caso de uso, no aquí, para que el
   * mensaje de error pueda ser específico sin acoplar el repositorio a
   * reglas de negocio. */
  findValidByHash(tokenHash: string): Promise<{
    id: string;
    userId: string;
    expiresAt: Date;
  } | null>;
  markUsed(id: string): Promise<void>;
}
export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol('PASSWORD_RESET_TOKEN_REPOSITORY');
