import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { PasswordResetTokenRepositoryPort } from '../domain/ports';

@Injectable()
export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<{ id: string }> {
    const row = await this.prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return { id: row.id };
  }

  async findValidByHash(
    tokenHash: string,
  ): Promise<{ id: string; userId: string; expiresAt: Date } | null> {
    const row = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null },
    });
    return row ? { id: row.id, userId: row.userId, expiresAt: row.expiresAt } : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
