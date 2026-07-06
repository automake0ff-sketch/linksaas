import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { User } from '../domain/user.entity';
import { UserRepositoryPort } from '../domain/user.repository.port';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        emailVerifiedAt: user.isEmailVerified ? new Date() : null,
      },
      update: {
        emailVerifiedAt: user.isEmailVerified ? new Date() : null,
      },
    });
  }

  private toDomain(row: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    emailVerifiedAt: Date | null;
    twoFactorEnabled: boolean;
    createdAt: Date;
  }): User {
    return User.reconstitute(row.id, {
      email: row.email,
      name: row.name ?? undefined,
      avatarUrl: row.avatarUrl ?? undefined,
      emailVerifiedAt: row.emailVerifiedAt ?? undefined,
      twoFactorEnabled: row.twoFactorEnabled,
      createdAt: row.createdAt,
    });
  }
}
