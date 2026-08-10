import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseBusinessDate } from '../common/date/business-date.util';
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

  /** Sem isso, um productId inexistente vira erro de FK (500) em vez de 400. */
  private async assertProductsExist(items: { productId: string }[]) {
    if (!items?.length) return;

    const ids = [...new Set(items.map((i) => i.productId))];
    const found = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((p) => p.id));
      throw new BadRequestException(
        `Produto(s) não encontrado(s): ${ids.filter((id) => !foundIds.has(id)).join(', ')}`,
      );
    }
  }

  async create(dto: CreateProcurementOrderDto) {
    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: dto.supplierId },
      });
      if (!supplier) {
        throw new NotFoundException('Fornecedor não encontrado');
      }
    }

    await this.assertProductsExist(dto.items);

    const data: Prisma.ProcurementOrderCreateInput = {
      ...(dto.supplierId && { supplier: { connect: { id: dto.supplierId } } }),
      ...(dto.materialRequestId && {
        materialRequest: { connect: { id: dto.materialRequestId } },
      }),
      ...(dto.expectedDeliveryDate && {
        expectedDeliveryDate: parseBusinessDate(dto.expectedDeliveryDate),
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

    if (dto.items) {
      await this.assertProductsExist(dto.items);
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
            expectedDeliveryDate: parseBusinessDate(dto.expectedDeliveryDate),
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

    // Entrada de estoque e mudança de status numa transação só, com o pedido
    // travado (FOR UPDATE) e o status revalidado dentro do lock. Antes, dois
    // "receber" simultâneos passavam os dois pela validação e davam entrada em
    // dobro no estoque; e uma falha no meio do laço deixava parte do material
    // já lançado com o pedido ainda aguardando entrega.
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM procurement_orders WHERE id = ${id} FOR UPDATE`;

      const current = await tx.procurementOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!current) {
        throw new NotFoundException('Pedido de compra não encontrado');
      }

      if (!VALID_STATUS_TRANSITIONS[current.status].includes(dto.status)) {
        throw new BadRequestException(
          `Transição de status inválida: ${current.status} -> ${dto.status}`,
        );
      }

      if (
        dto.status === ProcurementOrderStatus.ORDER_ISSUED &&
        !current.supplierId
      ) {
        throw new BadRequestException(
          'Escolha um fornecedor antes de emitir o pedido',
        );
      }

      if (dto.status === ProcurementOrderStatus.RECEIVED) {
        for (const item of current.items) {
          await this.inventoryService.createMovement(
            {
              productId: item.productId,
              type: MovementType.ENTRY,
              quantity: item.quantity,
              unitCost: Number(item.unitCost),
              reason: `Recebimento — Pedido de Compra ${current.id}`,
              referenceId: current.id,
            },
            userId,
            tx,
          );
        }
      }

      return tx.procurementOrder.update({
        where: { id },
        data: { status: dto.status },
        include: { items: { include: { product: true } }, supplier: true },
      });
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

    // Apagar a compra deixava a solicitação de material presa em
    // AWAITING_PURCHASE, esperando um pedido que não existe mais — e sem
    // pedido ativo o almoxarife não tinha como destravar a OS.
    if (order.materialRequest) {
      throw new BadRequestException(
        'Este pedido atende uma solicitação de material do almoxarifado. Cancele o pedido (status CANCELLED) em vez de removê-lo, para que uma nova compra possa ser aberta.',
      );
    }

    return this.prisma.procurementOrder.delete({ where: { id } });
  }
}
