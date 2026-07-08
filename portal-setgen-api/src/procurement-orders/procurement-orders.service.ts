import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { MaterialRequestsService } from '../material-requests/material-requests.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateProcurementOrderDto } from './dto/create-procurement-order.dto';
import { UpdateProcurementOrderDto } from './dto/update-procurement-order.dto';
import { UpdateProcurementOrderStatusDto } from './dto/update-procurement-order-status.dto';
import {
  Prisma,
  ProcurementOrderStatus,
  MaterialRequestStatus,
  MovementType,
  AuditAction,
} from '@prisma/client';

// Máquina de estados: transições permitidas a partir de cada status atual.
const VALID_STATUS_TRANSITIONS: Record<
  ProcurementOrderStatus,
  ProcurementOrderStatus[]
> = {
  [ProcurementOrderStatus.QUOTING]: [
    ProcurementOrderStatus.ORDER_ISSUED,
    ProcurementOrderStatus.CANCELLED,
  ],
  [ProcurementOrderStatus.ORDER_ISSUED]: [
    ProcurementOrderStatus.AWAITING_DELIVERY,
    ProcurementOrderStatus.CANCELLED,
  ],
  [ProcurementOrderStatus.AWAITING_DELIVERY]: [
    ProcurementOrderStatus.RECEIVED,
    ProcurementOrderStatus.CANCELLED,
  ],
  [ProcurementOrderStatus.RECEIVED]: [],
  [ProcurementOrderStatus.CANCELLED]: [],
};

@Injectable()
export class ProcurementOrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private materialRequestsService: MaterialRequestsService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateProcurementOrderDto) {
    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: dto.supplierId },
      });
      if (!supplier) {
        throw new NotFoundException('Fornecedor não encontrado');
      }
    }

    const data: Prisma.ProcurementOrderCreateInput = {
      ...(dto.supplierId && { supplier: { connect: { id: dto.supplierId } } }),
      ...(dto.materialRequestId && {
        materialRequest: { connect: { id: dto.materialRequestId } },
      }),
      ...(dto.expectedDeliveryDate && {
        expectedDeliveryDate: new Date(dto.expectedDeliveryDate),
      }),
      items: {
        create: dto.items.map((item) => ({
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
    };

    return this.prisma.procurementOrder.create({
      data,
      include: { items: { include: { product: true } }, supplier: true },
    });
  }

  async findAll(filters?: {
    status?: ProcurementOrderStatus;
    supplierId?: string;
  }) {
    return this.prisma.procurementOrder.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.supplierId && { supplierId: filters.supplierId }),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: true } },
        materialRequest: {
          select: {
            id: true,
            serviceOrder: { select: { id: true, orderNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.procurementOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        materialRequest: {
          select: {
            id: true,
            serviceOrder: { select: { id: true, orderNumber: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido de compra não encontrado');
    }

    return order;
  }

  async update(id: string, dto: UpdateProcurementOrderDto) {
    const order = await this.findOne(id);

    if (order.status !== ProcurementOrderStatus.QUOTING) {
      throw new BadRequestException(
        'Só é possível editar um pedido enquanto está em cotação',
      );
    }

    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: dto.supplierId },
      });
      if (!supplier) {
        throw new NotFoundException('Fornecedor não encontrado');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        await tx.procurementOrderItem.deleteMany({
          where: { procurementOrderId: id },
        });
      }

      return tx.procurementOrder.update({
        where: { id },
        data: {
          ...(dto.supplierId && { supplier: { connect: { id: dto.supplierId } } }),
          ...(dto.expectedDeliveryDate && {
            expectedDeliveryDate: new Date(dto.expectedDeliveryDate),
          }),
          ...(dto.items && {
            items: {
              create: dto.items.map((item) => ({
                product: { connect: { id: item.productId } },
                quantity: item.quantity,
                unitCost: item.unitCost,
              })),
            },
          }),
        },
        include: { items: { include: { product: true } }, supplier: true },
      });
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateProcurementOrderStatusDto,
    userId: string,
  ) {
    const order = await this.findOne(id);

    const allowedNextStatuses = VALID_STATUS_TRANSITIONS[order.status];
    if (!allowedNextStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Transição de status inválida: ${order.status} -> ${dto.status}`,
      );
    }

    if (
      dto.status === ProcurementOrderStatus.ORDER_ISSUED &&
      !order.supplierId
    ) {
      throw new BadRequestException(
        'Escolha um fornecedor antes de emitir o pedido',
      );
    }

    if (dto.status === ProcurementOrderStatus.RECEIVED) {
      for (const item of order.items) {
        await this.inventoryService.createMovement(
          {
            productId: item.productId,
            type: MovementType.ENTRY,
            quantity: item.quantity,
            unitCost: Number(item.unitCost),
            reason: `Recebimento — Pedido de Compra ${order.id}`,
            referenceId: order.id,
          },
          userId,
        );
      }
    }

    const updated = await this.prisma.procurementOrder.update({
      where: { id },
      data: { status: dto.status },
      include: { items: { include: { product: true } }, supplier: true },
    });

    await this.auditService.record(
      userId,
      AuditAction.UPDATE,
      'ProcurementOrder',
      id,
      { from: order.status, to: dto.status },
    );

    // Recebido o material: tenta reservar de novo a solicitação de origem
    // (agora com estoque reposto). Só reexecuta se ainda estiver aguardando
    // compra — evita erro em solicitação já separada por outra via.
    if (dto.status === ProcurementOrderStatus.RECEIVED && order.materialRequest) {
      const materialRequest = await this.prisma.materialRequest.findUnique({
        where: { id: order.materialRequest.id },
      });
      if (materialRequest?.status === MaterialRequestStatus.AWAITING_PURCHASE) {
        await this.materialRequestsService.separate(materialRequest.id, userId);
      }
    }

    return updated;
  }

  async remove(id: string) {
    const order = await this.findOne(id);

    if (
      order.status !== ProcurementOrderStatus.QUOTING &&
      order.status !== ProcurementOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Só é possível remover pedidos em cotação ou cancelados',
      );
    }

    return this.prisma.procurementOrder.delete({ where: { id } });
  }
}
