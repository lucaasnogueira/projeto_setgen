import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async record(
    userId: string,
    action: AuditAction,
    entity: string,
    entityId: string,
    changes?: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        changes,
      },
    });
  }
}
