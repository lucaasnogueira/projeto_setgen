import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import {
  Prisma,
  PurchaseOrderStatus,
  ServiceOrderStatus,
  UserRole,
} from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    fileUrl: string,
    uploadedById: string,
  ) {
    // Verificar se a OS existe e está aprovada
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: createPurchaseOrderDto.serviceOrderId },
      include: {
        purchaseOrders: true,
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    if (serviceOrder.status !== ServiceOrderStatus.APPROVED) {
      throw new BadRequestException(
        'Apenas OS aprovadas podem receber Ordem de Compra',
      );
    }

    // Verificar se já existe OC para esta OS
    if (serviceOrder.purchaseOrders && serviceOrder.purchaseOrders.length > 0) {
      const activeOC = serviceOrder.purchaseOrders.find(
        (po) => po.status !== PurchaseOrderStatus.EXPIRED,
      );
      if (activeOC) {
        throw new BadRequestException(
          'Esta OS já possui uma Ordem de Compra ativa',
        );
      }
    }

    // Verificar se o cliente corresponde
    if (serviceOrder.clientId !== createPurchaseOrderDto.clientId) {
      throw new BadRequestException(
        'Cliente da OC não corresponde ao cliente da OS',
      );
    }

    // Validar datas
    const issueDate = new Date(createPurchaseOrderDto.issueDate);
    const expiryDate = new Date(createPurchaseOrderDto.expiryDate);

    if (expiryDate <= issueDate) {
      throw new BadRequestException(
        'Data de validade deve ser posterior à data de emissão',
      );
    }

    // Verificar se já está vencida
    const now = new Date();
    const status =
      expiryDate < now
        ? PurchaseOrderStatus.EXPIRED
        : PurchaseOrderStatus.APPROVED;

    const purchaseOrderData: Prisma.PurchaseOrderCreateInput = {
      serviceOrder: { connect: { id: createPurchaseOrderDto.serviceOrderId } },
      client: { connect: { id: createPurchaseOrderDto.clientId } },
      orderNumber: createPurchaseOrderDto.orderNumber,
      value: createPurchaseOrderDto.value,
      issueDate,
      expiryDate,
      status,
      fileUrl,
      uploadedBy: { connect: { id: uploadedById } },
    };

    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: purchaseOrderData,
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            status: true,
          },
        },
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
            cnpjCpf: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Se a OC foi aprovada, atualizar status da OS para IN_PROGRESS
    if (status === PurchaseOrderStatus.APPROVED) {
      await this.prisma.serviceOrder.update({
        where: { id: createPurchaseOrderDto.serviceOrderId },
        data: { status: ServiceOrderStatus.IN_PROGRESS },
      });
    }

    return purchaseOrder;
  }

  async findAll(filters?: {
    serviceOrderId?: string;
    clientId?: string;
    status?: PurchaseOrderStatus;
  }) {
    const where: Prisma.PurchaseOrderWhereInput = {
      ...(filters?.serviceOrderId && {
        serviceOrderId: filters.serviceOrderId,
      }),
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.status && { status: filters.status }),
    };

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            status: true,
          },
        },
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        serviceOrder: {
          include: {
            client: {
              select: {
                companyName: true,
                tradeName: true,
                cnpjCpf: true,
                phone: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
            cnpjCpf: true,
            phone: true,
            email: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            series: true,
            value: true,
            issueDate: true,
            status: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException('Ordem de Compra não encontrada');
    }

    return purchaseOrder;
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    userId: string,
    userRole: UserRole,
  ) {
    const purchaseOrder = await this.findOne(id);

    // Apenas ADMIN e ADMINISTRATIVE podem editar
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.ADMINISTRATIVE &&
      userRole !== UserRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para editar Ordens de Compra',
      );
    }

    // Não pode editar OC vencida
    if (purchaseOrder.status === PurchaseOrderStatus.EXPIRED) {
      throw new BadRequestException(
        'Não é possível editar Ordem de Compra vencida',
      );
    }

    const updateData: Prisma.PurchaseOrderUpdateInput = {
      ...(updatePurchaseOrderDto.orderNumber && {
        orderNumber: updatePurchaseOrderDto.orderNumber,
      }),
      ...(updatePurchaseOrderDto.value !== undefined && {
        value: updatePurchaseOrderDto.value,
      }),
      ...(updatePurchaseOrderDto.issueDate && {
        issueDate: new Date(updatePurchaseOrderDto.issueDate),
      }),
      ...(updatePurchaseOrderDto.expiryDate && {
        expiryDate: new Date(updatePurchaseOrderDto.expiryDate),
      }),
      ...(updatePurchaseOrderDto.status && {
        status: updatePurchaseOrderDto.status,
      }),
    };

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        client: {
          select: {
            companyName: true,
          },
        },
      },
    });
  }

  async checkExpiredOrders() {
    const now = new Date();

    const expired = await this.prisma.purchaseOrder.updateMany({
      where: {
        expiryDate: {
          lt: now,
        },
        status: {
          not: PurchaseOrderStatus.EXPIRED,
        },
      },
      data: {
        status: PurchaseOrderStatus.EXPIRED,
      },
    });

    return {
      message: `${expired.count} Ordens de Compra marcadas como vencidas`,
      count: expired.count,
    };
  }

  async getExpiringOrders(daysAhead: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.purchaseOrder.findMany({
      where: {
        expiryDate: {
          gte: now,
          lte: futureDate,
        },
        status: PurchaseOrderStatus.APPROVED,
      },
      include: {
        serviceOrder: {
          select: {
            orderNumber: true,
          },
        },
        client: {
          select: {
            companyName: true,
            email: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }

  async remove(id: string, userRole: UserRole) {
    await this.findOne(id);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem deletar Ordens de Compra',
      );
    }

    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const total = await this.prisma.purchaseOrder.count();

    const byStatus = await this.prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalValue = await this.prisma.purchaseOrder.aggregate({
      _sum: {
        value: true,
      },
      where: {
        status: PurchaseOrderStatus.APPROVED,
      },
    });

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      totalValue: totalValue._sum.value || 0,
    };
  }
}
