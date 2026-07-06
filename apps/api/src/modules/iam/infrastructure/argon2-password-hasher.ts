import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordHasherPort } from '../domain/ports';

// Argon2id: ganador del Password Hashing Competition, resistente tanto a
// ataques por GPU (como scrypt) como a side-channel timing (como bcrypt puro).
// Preferido sobre bcrypt para nuevos sistemas en 2026.
@Injectable()
export class Argon2PasswordHasher implements PasswordHasherPort {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
