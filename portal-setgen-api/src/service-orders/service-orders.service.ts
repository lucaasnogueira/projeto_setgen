import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import {
  Prisma,
  UserRole,
  ServiceOrderStatus,
  ServiceOrderType,
} from '@prisma/client';

// Máquina de estados: transições permitidas a partir de cada status atual.
// Usada tanto em update() (bloqueio de status livre) quanto em updateStatus().
const VALID_STATUS_TRANSITIONS: Record<
  ServiceOrderStatus,
  ServiceOrderStatus[]
> = {
  [ServiceOrderStatus.DRAFT]: [
    ServiceOrderStatus.PENDING_APPROVAL,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.PENDING_APPROVAL]: [
    ServiceOrderStatus.APPROVED,
    ServiceOrderStatus.REJECTED,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.APPROVED]: [
    ServiceOrderStatus.IN_PROGRESS,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.REJECTED]: [
    ServiceOrderStatus.PENDING_APPROVAL,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.IN_PROGRESS]: [
    ServiceOrderStatus.COMPLETED,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.COMPLETED]: [],
  [ServiceOrderStatus.CANCELLED]: [],
};

@Injectable()
export class ServiceOrdersService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const sequenceName = `seq_service_order_${year}`;

    try {
      const result = await this.prisma.$queryRawUnsafe<[{ nextval: bigint }]>(
        `SELECT nextval('${sequenceName}'::regclass)`,
      );
      const orderNumber = `OS-${year}-${String(result[0].nextval).padStart(5, '0')}`;
      return orderNumber;
    } catch {
      // Fallback: se a sequence não existir, cria e retorna 1
      await this.prisma.$executeRawUnsafe(
        `CREATE SEQUENCE IF NOT EXISTS ${sequenceName} START 1 INCREMENT 1`,
      );
      const result = await this.prisma.$queryRawUnsafe<[{ nextval: bigint }]>(
        `SELECT nextval('${sequenceName}'::regclass)`,
      );
      const orderNumber = `OS-${year}-${String(result[0].nextval).padStart(5, '0')}`;
      return orderNumber;
    }
  }

  async create(
    createServiceOrderDto: CreateServiceOrderDto,
    createdById: string,
  ) {
    // Verificar se cliente existe
    const client = await this.prisma.client.findUnique({
      where: { id: createServiceOrderDto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Se for OS de Visita, verificar se a visita existe
    if (createServiceOrderDto.technicalVisitId) {
      const visit = await this.prisma.technicalVisit.findUnique({
        where: { id: createServiceOrderDto.technicalVisitId },
      });

      if (!visit) {
        throw new NotFoundException('Visita técnica não encontrada');
      }

      // Verificar se o cliente da visita é o mesmo da OS
      if (visit.clientId !== createServiceOrderDto.clientId) {
        throw new BadRequestException(
          'Cliente da OS não corresponde ao cliente da visita',
        );
      }
    }

    // Gerar número da OS
    const orderNumber = await this.generateOrderNumber();

    // Se um template de checklist foi informado, copia os campos dele
    // (snapshot) pro checklist da OS, com resposta em branco.
    let checklistData: Prisma.InputJsonValue[] =
      (createServiceOrderDto.checklist as Prisma.InputJsonValue[]) || [];

    if (createServiceOrderDto.checklistTemplateId) {
      const template = await this.prisma.checklistTemplate.findUnique({
        where: { id: createServiceOrderDto.checklistTemplateId },
      });

      if (!template) {
        throw new NotFoundException('Template de checklist não encontrado');
      }

      const fields = template.fields as unknown as Array<{
        id: string;
        type: string;
        label: string;
        required: boolean;
        options?: string[];
      }>;

      checklistData = fields.map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        required: f.required,
        ...(f.options && { options: f.options }),
        answer: null,
        completed: false,
      })) as Prisma.InputJsonValue[];
    }

    const orderData: Prisma.ServiceOrderCreateInput = {
      orderNumber,
      type: createServiceOrderDto.type,
      client: { connect: { id: createServiceOrderDto.clientId } },
      ...(createServiceOrderDto.technicalVisitId && {
        technicalVisit: {
          connect: { id: createServiceOrderDto.technicalVisitId },
        },
      }),
      scope: createServiceOrderDto.scope,
      reportedDefects: createServiceOrderDto.reportedDefects,
      requestedServices: createServiceOrderDto.requestedServices,
      notes: createServiceOrderDto.notes,
      requiredResources: createServiceOrderDto.requiredResources || {},
      ...(createServiceOrderDto.deadline && {
        deadline: new Date(createServiceOrderDto.deadline),
      }),
      responsibleIds: createServiceOrderDto.responsibleIds || [],
      checklist: checklistData,
      ...(createServiceOrderDto.checklistTemplateId && {
        checklistTemplate: {
          connect: { id: createServiceOrderDto.checklistTemplateId },
        },
      }),
      createdBy: { connect: { id: createdById } },
      status:
        createServiceOrderDto.type === ServiceOrderType.VISIT_REPORT
          ? ServiceOrderStatus.PENDING_APPROVAL
          : ServiceOrderStatus.DRAFT,
      ...(createServiceOrderDto.items && {
        items: {
          create: createServiceOrderDto.items.map((item) => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      }),
    };

    return this.prisma.serviceOrder.create({
      data: orderData,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
            cnpjCpf: true,
          },
        },
        technicalVisit: {
          select: {
            id: true,
            visitDate: true,
            visitType: true,
            technician: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    clientId?: string;
    status?: ServiceOrderStatus;
    type?: ServiceOrderType;
    createdById?: string;
  }) {
    const where: Prisma.ServiceOrderWhereInput = {
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.createdById && { createdById: filters.createdById }),
    };

    return this.prisma.serviceOrder.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
          },
        },
        createdBy: {
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
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
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
        technicalVisit: {
          include: {
            technician: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            approvedAt: 'desc',
          },
        },
        purchaseOrders: true,
        invoices: true,
        delivery: true,
        checklistTemplate: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    return order;
  }

  async update(
    id: string,
    updateServiceOrderDto: UpdateServiceOrderDto,
    userId: string,
    userRole: UserRole,
  ) {
    const order = await this.findOne(id);

    // Verificar permissões
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      order.createdById !== userId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para editar esta OS',
      );
    }

    // Não pode editar OS aprovada, exceto ADMIN
    if (
      order.status === ServiceOrderStatus.APPROVED &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Não é possível editar OS aprovada');
    }

    // Mudança de status não passa por aqui: só o endpoint dedicado
    // updateStatus() valida transição de estado e permissão por status.
    if (updateServiceOrderDto.status) {
      throw new BadRequestException(
        'Use o endpoint PATCH /service-orders/:id/status para alterar o status da OS',
      );
    }

    const updateData: Prisma.ServiceOrderUpdateInput = {
      ...(updateServiceOrderDto.scope && {
        scope: updateServiceOrderDto.scope,
      }),
      ...(updateServiceOrderDto.requiredResources && {
        requiredResources: updateServiceOrderDto.requiredResources,
      }),
      ...(updateServiceOrderDto.deadline && {
        deadline: new Date(updateServiceOrderDto.deadline),
      }),
      ...(updateServiceOrderDto.responsibleIds && {
        responsibleIds: updateServiceOrderDto.responsibleIds,
      }),
      ...(updateServiceOrderDto.checklist && {
        checklist: updateServiceOrderDto.checklist,
      }),
      ...(updateServiceOrderDto.progress !== undefined && {
        progress: updateServiceOrderDto.progress,
      }),
      ...(updateServiceOrderDto.reportedDefects !== undefined && {
        reportedDefects: updateServiceOrderDto.reportedDefects,
      }),
      ...(updateServiceOrderDto.requestedServices !== undefined && {
        requestedServices: updateServiceOrderDto.requestedServices,
      }),
      ...(updateServiceOrderDto.notes !== undefined && {
        notes: updateServiceOrderDto.notes,
      }),
    };

    // Se houver itens para atualizar, lidar com a sincronização
    if (updateServiceOrderDto.items) {
      const itemsToCreate = updateServiceOrderDto.items;
      return this.prisma.$transaction(async (tx) => {
        // Por simplicidade, deletamos os antigos e criamos os novos
        await tx.serviceOrderProduct.deleteMany({
          where: { serviceOrderId: id },
        });

        return tx.serviceOrder.update({
          where: { id },
          data: {
            ...updateData,
            items: {
              create: itemsToCreate.map((item) => ({
                product: { connect: { id: item.productId } },
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
              })),
            },
          },
          include: {
            client: {
              select: {
                id: true,
                companyName: true,
                tradeName: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      });
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    userId: string,
    userRole: UserRole,
  ) {
    const order = await this.findOne(id);

    // Validação de transição de status: só permite mudar para um status
    // alcançável a partir do status atual (evita ex: DRAFT -> COMPLETED direto)
    const allowedNextStatuses = VALID_STATUS_TRANSITIONS[order.status];
    if (!allowedNextStatuses.includes(updateStatusDto.status)) {
      throw new BadRequestException(
        `Transição de status inválida: ${order.status} -> ${updateStatusDto.status}`,
      );
    }

    // Validações de permissão por status
    if (
      updateStatusDto.status === ServiceOrderStatus.APPROVED &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Apenas gerentes podem aprovar OS');
    }

    if (
      updateStatusDto.status === ServiceOrderStatus.REJECTED &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Apenas gerentes podem rejeitar OS');
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
      include: {
        client: true,
        createdBy: true,
      },
    });
  }

  async updateProgress(id: string, progress: number) {
    await this.findOne(id);

    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        progress,
        ...(progress === 100 && { status: ServiceOrderStatus.COMPLETED }),
      },
    });
  }

  async addAttachments(id: string, attachments: string[]) {
    const order = await this.findOne(id);

    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        attachments: [...order.attachments, ...attachments],
      },
    });
  }

  async remove(id: string, userRole: UserRole) {
    const order = await this.findOne(id);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem deletar OS');
    }

    // Verificar se existem registros financeiros vinculados
    const hasFinancialRecords =
      (order.purchaseOrders && order.purchaseOrders.length > 0) ||
      (order.invoices && order.invoices.length > 0);

    if (hasFinancialRecords) {
      throw new BadRequestException(
        'Não é possível deletar esta OS pois existem Ordens de Compra ou Notas Fiscais vinculadas. Remova-as primeiro.',
      );
    }

    // Deletar dependências e a OS em uma transação
    return this.prisma.$transaction(async (tx) => {
      // 1. Deletar aprovações
      await tx.approval.deleteMany({
        where: { serviceOrderId: id },
      });

      // 2. Deletar itens da OS
      await tx.serviceOrderProduct.deleteMany({
        where: { serviceOrderId: id },
      });

      // 3. Deletar entregas
      // Delivery é one-to-one ou one-to-many? No schema é one-to-one (Delivery?)
      // Mas o deleteMany é seguro
      await tx.delivery.deleteMany({
        where: { serviceOrderId: id },
      });

      // 4. Deletar a OS
      return tx.serviceOrder.delete({
        where: { id },
      });
    });
  }

  async getStatistics() {
    const total = await this.prisma.serviceOrder.count();
    const byStatus = await this.prisma.serviceOrder.groupBy({
      by: ['status'],
      _count: true,
    });
    const byType = await this.prisma.serviceOrder.groupBy({
      by: ['type'],
      _count: true,
    });

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count,
      })),
    };
  }
}
