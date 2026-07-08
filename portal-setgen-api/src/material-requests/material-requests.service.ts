import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../common/audit/audit.service';
import { UpdateMaterialRequestDto } from './dto/update-material-request.dto';
import {
  MaterialRequestStatus,
  ProcurementOrderStatus,
  MovementType,
  AuditAction,
} from '@prisma/client';

@Injectable()
export class MaterialRequestsService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private auditService: AuditService,
  ) {}

  // Chamado pela aprovação de OS (ver ApprovalsService.approve). Cria a
  // "mesa do almoxarife" a partir dos materiais previstos na OS. Se a OS não
  // tem itens de material, não há o que separar — não cria nada.
  async createFromServiceOrder(serviceOrderId: string) {
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      include: { items: true },
    });

    if (!serviceOrder || serviceOrder.items.length === 0) {
      return null;
    }

    const existing = await this.prisma.materialRequest.findFirst({
      where: { serviceOrderId },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.materialRequest.create({
      data: {
        serviceOrder: { connect: { id: serviceOrderId } },
        items: {
          create: serviceOrder.items.map((item) => ({
            product: { connect: { id: item.productId } },
            quantityNeeded: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAll(status?: MaterialRequestStatus) {
    return this.prisma.materialRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            client: { select: { id: true, companyName: true } },
          },
        },
        items: { include: { product: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const materialRequest = await this.prisma.materialRequest.findUnique({
      where: { id },
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            client: { select: { id: true, companyName: true } },
          },
        },
        items: { include: { product: true } },
        procurementOrders: {
          select: { id: true, status: true, supplierId: true },
        },
      },
    });

    if (!materialRequest) {
      throw new NotFoundException('Solicitação de material não encontrada');
    }

    return materialRequest;
  }

  async update(id: string, dto: UpdateMaterialRequestDto) {
    await this.findOne(id);

    return this.prisma.materialRequest.update({
      where: { id },
      data: {
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.expectedExecutionDate && {
          expectedExecutionDate: new Date(dto.expectedExecutionDate),
        }),
      },
    });
  }

  // Tenta reservar (dar baixa no estoque) tudo que ainda falta para cada
  // item. O que não tiver estoque disponível vira "falta" e gera (ou
  // reaproveita) um pedido de compra em rascunho. Reexecutável: usado tanto
  // pelo almoxarife quanto automaticamente após o recebimento de uma compra.
  async separate(id: string, userId: string) {
    const materialRequest = await this.findOne(id);

    if (
      materialRequest.status === MaterialRequestStatus.SEPARATED ||
      materialRequest.status === MaterialRequestStatus.RELEASED
    ) {
      throw new BadRequestException('Esta solicitação já está separada');
    }

    const shortages: { productId: string; missing: number }[] = [];

    for (const item of materialRequest.items) {
      const missingBefore = item.quantityNeeded - item.quantityReserved;
      if (missingBefore <= 0) continue;

      const reserveNow = Math.min(missingBefore, item.product.currentStock);

      if (reserveNow > 0) {
        await this.inventoryService.createMovement(
          {
            productId: item.productId,
            type: MovementType.EXIT,
            quantity: reserveNow,
            reason: `Separação de material — Solicitação ${materialRequest.id}`,
            referenceId: materialRequest.id,
          },
          userId,
        );

        await this.prisma.materialRequestItem.update({
          where: { id: item.id },
          data: { quantityReserved: { increment: reserveNow } },
        });
      }

      const stillMissing = missingBefore - reserveNow;
      if (stillMissing > 0) {
        shortages.push({ productId: item.productId, missing: stillMissing });
      }
    }

    const newStatus =
      shortages.length > 0
        ? MaterialRequestStatus.AWAITING_PURCHASE
        : MaterialRequestStatus.SEPARATED;

    await this.prisma.materialRequest.update({
      where: { id },
      data: { status: newStatus },
    });

    if (shortages.length > 0) {
      await this.ensureProcurementDraft(materialRequest.id, shortages);
    }

    await this.auditService.record(
      userId,
      AuditAction.UPDATE,
      'MaterialRequest',
      id,
      { from: materialRequest.status, to: newStatus, shortages },
    );

    return this.findOne(id);
  }

  async release(id: string, userId: string) {
    const materialRequest = await this.findOne(id);

    if (materialRequest.status !== MaterialRequestStatus.SEPARATED) {
      throw new BadRequestException(
        'Só é possível liberar uma solicitação totalmente separada',
      );
    }

    const updated = await this.prisma.materialRequest.update({
      where: { id },
      data: { status: MaterialRequestStatus.RELEASED },
    });

    await this.auditService.record(
      userId,
      AuditAction.UPDATE,
      'MaterialRequest',
      id,
      { from: MaterialRequestStatus.SEPARATED, to: MaterialRequestStatus.RELEASED },
    );

    return updated;
  }

  private async ensureProcurementDraft(
    materialRequestId: string,
    shortages: { productId: string; missing: number }[],
  ) {
    const existingActive = await this.prisma.procurementOrder.findFirst({
      where: {
        materialRequestId,
        status: {
          in: [
            ProcurementOrderStatus.QUOTING,
            ProcurementOrderStatus.ORDER_ISSUED,
            ProcurementOrderStatus.AWAITING_DELIVERY,
          ],
        },
      },
    });

    if (existingActive) {
      return existingActive;
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: shortages.map((s) => s.productId) } },
    });
    const unitCostByProduct = new Map(
      products.map((p) => [p.id, p.unitCost ? Number(p.unitCost) : 0]),
    );

    return this.prisma.procurementOrder.create({
      data: {
        materialRequest: { connect: { id: materialRequestId } },
        status: ProcurementOrderStatus.QUOTING,
        items: {
          create: shortages.map((s) => ({
            product: { connect: { id: s.productId } },
            quantity: s.missing,
            unitCost: unitCostByProduct.get(s.productId) || 0,
          })),
        },
      },
    });
  }
}
