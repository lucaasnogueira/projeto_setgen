import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { AuditAction } from '@prisma/client';

// Janela de antecedência para alertar vencimento de garantia.
const EXPIRY_ALERT_WINDOW_DAYS = 30;
// Intervalo mínimo entre alertas repetidos da mesma garantia (evita spam
// diário enquanto ninguém renova).
const ALERT_COOLDOWN_DAYS = 30;

@Injectable()
export class WarrantiesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(filters?: { equipmentId?: string; expiringInDays?: number }) {
    const where: any = {
      ...(filters?.equipmentId && { equipmentId: filters.equipmentId }),
    };

    if (filters?.expiringInDays !== undefined) {
      const limit = new Date();
      limit.setDate(limit.getDate() + filters.expiringInDays);
      where.endDate = { lte: limit };
    }

    return this.prisma.warranty.findMany({
      where,
      include: {
        equipment: {
          select: { id: true, type: true, brand: true, model: true, clientId: true },
        },
        delivery: {
          select: {
            id: true,
            serviceOrder: {
              select: { id: true, orderNumber: true, client: { select: { companyName: true } } },
            },
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const warranty = await this.prisma.warranty.findUnique({
      where: { id },
      include: {
        equipment: true,
        delivery: {
          select: {
            id: true,
            serviceOrder: {
              select: { id: true, orderNumber: true, client: { select: { companyName: true } } },
            },
          },
        },
      },
    });

    if (!warranty) {
      throw new NotFoundException('Garantia não encontrada');
    }

    return warranty;
  }

  async update(id: string, dto: UpdateWarrantyDto) {
    await this.findOne(id);

    return this.prisma.warranty.update({
      where: { id },
      data: {
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.terms !== undefined && { terms: dto.terms }),
      },
    });
  }

  // Varre garantias perto do vencimento e registra um alerta no AuditLog
  // (não há canal de envio de e-mail/WhatsApp configurado ainda — fica para
  // quando essa integração existir). Roda uma vez por dia.
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpiringWarranties() {
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + EXPIRY_ALERT_WINDOW_DAYS);

    const expiring = await this.prisma.warranty.findMany({
      where: { endDate: { lte: windowEnd, gte: new Date() } },
      include: {
        delivery: { select: { deliveredById: true } },
      },
    });

    const cooldownStart = new Date();
    cooldownStart.setDate(cooldownStart.getDate() - ALERT_COOLDOWN_DAYS);

    let alertedCount = 0;

    for (const warranty of expiring) {
      const recentAlert = await this.prisma.auditLog.findFirst({
        where: {
          entity: 'Warranty',
          entityId: warranty.id,
          action: AuditAction.ALERT,
          createdAt: { gte: cooldownStart },
        },
      });

      if (recentAlert) continue;

      await this.auditService.record(
        warranty.delivery.deliveredById,
        AuditAction.ALERT,
        'Warranty',
        warranty.id,
        { endDate: warranty.endDate, message: 'Garantia próxima do vencimento' },
      );
      alertedCount++;
    }

    return alertedCount;
  }
}
