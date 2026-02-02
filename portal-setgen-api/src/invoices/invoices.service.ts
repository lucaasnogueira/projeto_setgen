import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-status.dto';
import {
  Prisma,
  InvoiceStatus,
  UserRole,
  ServiceOrderStatus,
  PurchaseOrderStatus,
} from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createInvoiceDto: CreateInvoiceDto,
    files: { xml?: string; pdf?: string },
    createdById: string,
  ) {
    // Verificar se a OS existe
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: createInvoiceDto.serviceOrderId },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    // Verificar se a OC existe e está ativa
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id: createInvoiceDto.purchaseOrderId },
    });

    if (!purchaseOrder) {
      throw new NotFoundException('Ordem de Compra não encontrada');
    }

    if (purchaseOrder.status === PurchaseOrderStatus.EXPIRED) {
      throw new BadRequestException('Ordem de Compra está vencida');
    }

    // Verificar se a OC pertence à OS
    if (purchaseOrder.serviceOrderId !== createInvoiceDto.serviceOrderId) {
      throw new BadRequestException('Ordem de Compra não pertence a esta OS');
    }

    // Validar datas
    const issueDate = new Date(createInvoiceDto.issueDate);
    const dueDate = new Date(createInvoiceDto.dueDate);

    if (dueDate <= issueDate) {
      throw new BadRequestException(
        'Data de vencimento deve ser posterior à data de emissão',
      );
    }

    // Verificar se já existe NF com o mesmo número e série
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        invoiceNumber: createInvoiceDto.invoiceNumber,
        series: createInvoiceDto.series,
      },
    });

    if (existingInvoice) {
      throw new BadRequestException('Já existe uma NF com este número e série');
    }

    // Determinar status inicial
    const now = new Date();
    let status: InvoiceStatus = InvoiceStatus.ISSUED;
    if (dueDate < now) {
      status = InvoiceStatus.OVERDUE;
    }

    const invoiceData: Prisma.InvoiceCreateInput = {
      serviceOrder: { connect: { id: createInvoiceDto.serviceOrderId } },
      purchaseOrder: { connect: { id: createInvoiceDto.purchaseOrderId } },
      invoiceNumber: createInvoiceDto.invoiceNumber,
      series: createInvoiceDto.series,
      value: createInvoiceDto.value,
      issueDate,
      dueDate,
      status,
      xmlUrl: files.xml,
      pdfUrl: files.pdf,
      createdBy: { connect: { id: createdById } },
    };

    return this.prisma.invoice.create({
      data: invoiceData,
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            client: {
              select: {
                companyName: true,
                tradeName: true,
                cnpjCpf: true,
              },
            },
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            orderNumber: true,
            value: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    serviceOrderId?: string;
    purchaseOrderId?: string;
    status?: InvoiceStatus;
  }) {
    const where: Prisma.InvoiceWhereInput = {
      ...(filters?.serviceOrderId && {
        serviceOrderId: filters.serviceOrderId,
      }),
      ...(filters?.purchaseOrderId && {
        purchaseOrderId: filters.purchaseOrderId,
      }),
      ...(filters?.status && { status: filters.status }),
    };

    return this.prisma.invoice.findMany({
      where,
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            client: {
              select: {
                companyName: true,
                tradeName: true,
              },
            },
          },
        },
        purchaseOrder: {
          select: {
            orderNumber: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
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
                address: true,
              },
            },
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            orderNumber: true,
            value: true,
            issueDate: true,
            expiryDate: true,
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
      },
    });

    if (!invoice) {
      throw new NotFoundException('Nota Fiscal não encontrada');
    }

    return invoice;
  }

  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
    userId: string,
    userRole: UserRole,
  ) {
    const invoice = await this.findOne(id);

    // Apenas ADMIN e ADMINISTRATIVE podem editar
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.ADMINISTRATIVE) {
      throw new ForbiddenException(
        'Você não tem permissão para editar Notas Fiscais',
      );
    }

    // Não pode editar NF paga ou cancelada
    if (
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Não é possível editar NF com status ${invoice.status}`,
      );
    }

    const updateData: Prisma.InvoiceUpdateInput = {
      ...(updateInvoiceDto.invoiceNumber && {
        invoiceNumber: updateInvoiceDto.invoiceNumber,
      }),
      ...(updateInvoiceDto.series && { series: updateInvoiceDto.series }),
      ...(updateInvoiceDto.value !== undefined && {
        value: updateInvoiceDto.value,
      }),
      ...(updateInvoiceDto.issueDate && {
        issueDate: new Date(updateInvoiceDto.issueDate),
      }),
      ...(updateInvoiceDto.dueDate && {
        dueDate: new Date(updateInvoiceDto.dueDate),
      }),
      ...(updateInvoiceDto.status && { status: updateInvoiceDto.status }),
    };

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        serviceOrder: {
          select: {
            orderNumber: true,
            client: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(id: string, updateStatusDto: UpdateInvoiceStatusDto) {
    const invoice = await this.findOne(id);

    // Validações de transição de status
    if (
      invoice.status === InvoiceStatus.CANCELLED &&
      updateStatusDto.status !== InvoiceStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Não é possível alterar status de NF cancelada',
      );
    }

    if (
      invoice.status === InvoiceStatus.PAID &&
      updateStatusDto.status !== InvoiceStatus.PAID
    ) {
      throw new BadRequestException('Não é possível alterar status de NF paga');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: updateStatusDto.status },
      include: {
        serviceOrder: {
          select: {
            orderNumber: true,
          },
        },
      },
    });
  }

  async markAsPaid(id: string) {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Esta NF já está marcada como paga');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException(
        'Não é possível marcar NF cancelada como paga',
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID },
    });
  }

  async cancel(id: string, reason?: string) {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Não é possível cancelar NF já paga');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Esta NF já está cancelada');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
    });
  }

  async checkOverdueInvoices() {
    const now = new Date();

    const overdue = await this.prisma.invoice.updateMany({
      where: {
        dueDate: {
          lt: now,
        },
        status: InvoiceStatus.ISSUED,
      },
      data: {
        status: InvoiceStatus.OVERDUE,
      },
    });

    return {
      message: `${overdue.count} Notas Fiscais marcadas como vencidas`,
      count: overdue.count,
    };
  }

  async getOverdueInvoices() {
    return this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.OVERDUE,
      },
      include: {
        serviceOrder: {
          select: {
            orderNumber: true,
            client: {
              select: {
                companyName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getDueSoon(daysAhead: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.invoice.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: futureDate,
        },
        status: InvoiceStatus.ISSUED,
      },
      include: {
        serviceOrder: {
          select: {
            orderNumber: true,
            client: {
              select: {
                companyName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async remove(id: string, userRole: UserRole) {
    await this.findOne(id);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem deletar Notas Fiscais',
      );
    }

    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const total = await this.prisma.invoice.count();

    const byStatus = await this.prisma.invoice.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalValue = await this.prisma.invoice.aggregate({
      _sum: {
        value: true,
      },
    });

    const paidValue = await this.prisma.invoice.aggregate({
      _sum: {
        value: true,
      },
      where: {
        status: InvoiceStatus.PAID,
      },
    });

    const overdueValue = await this.prisma.invoice.aggregate({
      _sum: {
        value: true,
      },
      where: {
        status: InvoiceStatus.OVERDUE,
      },
    });

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      totalValue: totalValue._sum.value || 0,
      paidValue: paidValue._sum.value || 0,
      overdueValue: overdueValue._sum.value || 0,
    };
  }
}
