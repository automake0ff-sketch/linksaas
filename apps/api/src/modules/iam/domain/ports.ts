export interface PasswordHasherPort {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface AuthMethodRepositoryPort {
  findPasswordMethod(userId: string): Promise<{ passwordHash: string } | null>;
  createPasswordMethod(userId: string, passwordHash: string): Promise<void>;
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
