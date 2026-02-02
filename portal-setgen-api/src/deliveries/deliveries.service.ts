import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Prisma, UserRole, ServiceOrderStatus } from '@prisma/client';

@Injectable()
export class DeliveriesService {
  constructor(private prisma: PrismaService) {}

  /** Converte DTO para array JSON que o Prisma aceita */
  private toPrismaJsonArray(dtoArray: unknown[]): Prisma.InputJsonValue[] {
    return dtoArray.map((item) => item as unknown as Prisma.InputJsonValue);
  }

  /** Cria nova entrega */
  async create(
    createDeliveryDto: CreateDeliveryDto,
    evidences: string[] = [],
    acceptanceSignature?: string,
    deliveredById?: string,
  ) {
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: createDeliveryDto.serviceOrderId },
      include: { delivery: true },
    });

    if (!serviceOrder) throw new NotFoundException('OS não encontrada');
    if (serviceOrder.delivery)
      throw new BadRequestException('OS já possui entrega registrada');

    if (
      serviceOrder.status !== ServiceOrderStatus.IN_PROGRESS &&
      serviceOrder.status !== ServiceOrderStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Apenas OS em andamento ou concluídas podem ter entrega registrada',
      );
    }

    if (!createDeliveryDto.checklist.every((i) => i.checked)) {
      throw new BadRequestException(
        'Todos os itens do checklist devem estar marcados',
      );
    }

    const deliveryData: Prisma.DeliveryCreateInput = {
      serviceOrder: { connect: { id: createDeliveryDto.serviceOrderId } },
      deliveryDate: new Date(createDeliveryDto.deliveryDate),
      deliveredBy: { connect: { id: deliveredById } },
      receivedBy: createDeliveryDto.receivedBy,
      checklist: this.toPrismaJsonArray(createDeliveryDto.checklist),
      evidences,
      acceptanceSignature,
      notes: createDeliveryDto.notes,
    };

    const delivery = await this.prisma.delivery.create({
      data: deliveryData,
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            client: { select: { companyName: true, tradeName: true } },
          },
        },
        deliveredBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Atualiza OS para COMPLETED
    await this.prisma.serviceOrder.update({
      where: { id: createDeliveryDto.serviceOrderId },
      data: { status: ServiceOrderStatus.COMPLETED, progress: 100 },
    });

    return delivery;
  }

  /** Atualiza entrega existente */
  async update(
    id: string,
    updateDeliveryDto: UpdateDeliveryDto,
    userId: string,
    userRole: UserRole,
  ) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundException('Entrega não encontrada');

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      delivery.deliveredById !== userId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para editar esta entrega',
      );
    }

    if (
      updateDeliveryDto.checklist &&
      !updateDeliveryDto.checklist.every((i) => i.checked)
    ) {
      throw new BadRequestException(
        'Todos os itens do checklist devem estar marcados',
      );
    }

    const updateData: Prisma.DeliveryUpdateInput = {
      ...(updateDeliveryDto.deliveryDate && {
        deliveryDate: new Date(updateDeliveryDto.deliveryDate),
      }),
      ...(updateDeliveryDto.receivedBy && {
        receivedBy: updateDeliveryDto.receivedBy,
      }),
      ...(updateDeliveryDto.notes !== undefined && {
        notes: updateDeliveryDto.notes,
      }),
      ...(updateDeliveryDto.checklist && {
        checklist: this.toPrismaJsonArray(updateDeliveryDto.checklist),
      }),
    };

    return this.prisma.delivery.update({ where: { id }, data: updateData });
  }

  /** Retorna todas as entregas com filtros opcionais */
  async findAll(filters?: { serviceOrderId?: string; deliveredById?: string }) {
    const where: Prisma.DeliveryWhereInput = {
      ...(filters?.serviceOrderId && {
        serviceOrderId: filters.serviceOrderId,
      }),
      ...(filters?.deliveredById && { deliveredById: filters.deliveredById }),
    };

    return this.prisma.delivery.findMany({
      where,
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            client: { select: { companyName: true, tradeName: true } },
          },
        },
        deliveredBy: { select: { name: true, email: true } },
      },
      orderBy: { deliveryDate: 'desc' },
    });
  }

  /** Retorna entrega por ID */
  async findOne(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        serviceOrder: {
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
              select: { id: true, visitDate: true, description: true },
            },
            createdBy: { select: { name: true, email: true } },
          },
        },
        deliveredBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!delivery) throw new NotFoundException('Entrega não encontrada');
    return delivery;
  }

  /** Retorna entrega por serviceOrderId */
  async findByServiceOrder(serviceOrderId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { serviceOrderId },
      include: {
        serviceOrder: { select: { orderNumber: true, type: true } },
        deliveredBy: { select: { name: true, email: true } },
      },
    });

    if (!delivery)
      throw new NotFoundException('Entrega não encontrada para esta OS');
    return delivery;
  }

  /** Adiciona evidências */
  async addEvidences(id: string, evidences: string[]) {
    const delivery = await this.findOne(id);
    return this.prisma.delivery.update({
      where: { id },
      data: { evidences: [...delivery.evidences, ...evidences] },
    });
  }

  /** Adiciona assinatura */
  async addSignature(id: string, signaturePath: string) {
    const delivery = await this.findOne(id);
    if (delivery.acceptanceSignature)
      throw new BadRequestException(
        'Esta entrega já possui assinatura de aceite',
      );

    return this.prisma.delivery.update({
      where: { id },
      data: { acceptanceSignature: signaturePath },
    });
  }

  /** Remove entrega */
  async remove(id: string, userRole: UserRole) {
    const delivery = await this.findOne(id);
    if (userRole !== UserRole.ADMIN)
      throw new ForbiddenException(
        'Apenas administradores podem deletar entregas',
      );

    if (delivery.serviceOrderId) {
      await this.prisma.serviceOrder.update({
        where: { id: delivery.serviceOrderId },
        data: { status: ServiceOrderStatus.IN_PROGRESS },
      });
    }

    return this.prisma.delivery.delete({ where: { id } });
  }

  /** Estatísticas */
  async getStatistics() {
    const total = await this.prisma.delivery.count();

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthCount = await this.prisma.delivery.count({
      where: { deliveryDate: { gte: thisMonth } },
    });

    const withSignature = await this.prisma.delivery.count({
      where: { acceptanceSignature: { not: null } },
    });

    return {
      total,
      thisMonth: thisMonthCount,
      withSignature,
      signaturePercentage:
        total > 0 ? ((withSignature / total) * 100).toFixed(2) : 0,
    };
  }
}
