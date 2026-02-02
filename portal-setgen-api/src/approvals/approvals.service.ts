import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ApproveDto, RejectDto } from './dto/approve-reject.dto';
import {
  UserRole,
  ApprovalStatus,
  ServiceOrderStatus,
  ServiceOrderType,
} from '@prisma/client';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  async create(createApprovalDto: CreateApprovalDto, approverId: string) {
    // Verificar se a OS existe
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: createApprovalDto.serviceOrderId },
      include: {
        approvals: true,
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    // Verificar se já existe aprovação/rejeição anterior
    if (serviceOrder.approvals && serviceOrder.approvals.length > 0) {
      const lastApproval = serviceOrder.approvals[0];
      if (lastApproval.status === ApprovalStatus.APPROVED) {
        throw new BadRequestException('Esta OS já foi aprovada anteriormente');
      }
    }

    // Criar aprovação
    const approval = await this.prisma.approval.create({
      data: {
        serviceOrder: { connect: { id: createApprovalDto.serviceOrderId } },
        approver: { connect: { id: approverId } },
        status: createApprovalDto.status,
        comments: createApprovalDto.comments,
      },
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            client: {
              select: {
                companyName: true,
              },
            },
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Atualizar status da OS
    const newStatus =
      createApprovalDto.status === ApprovalStatus.APPROVED
        ? ServiceOrderStatus.APPROVED
        : ServiceOrderStatus.REJECTED;

    await this.prisma.serviceOrder.update({
      where: { id: createApprovalDto.serviceOrderId },
      data: { status: newStatus },
    });

    return approval;
  }

  async approve(
    serviceOrderId: string,
    approveDto: ApproveDto,
    approverId: string,
  ) {
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      include: {
        approvals: {
          orderBy: { approvedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    // Validar se pode ser aprovada
    if (serviceOrder.status === ServiceOrderStatus.APPROVED) {
      throw new BadRequestException('Esta OS já está aprovada');
    }

    if (serviceOrder.status === ServiceOrderStatus.COMPLETED) {
      throw new BadRequestException('Não é possível aprovar OS já concluída');
    }

    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new BadRequestException('Não é possível aprovar OS cancelada');
    }

    // Criar aprovação
    const approval = await this.prisma.approval.create({
      data: {
        serviceOrder: { connect: { id: serviceOrderId } },
        approver: { connect: { id: approverId } },
        status: ApprovalStatus.APPROVED,
        comments: approveDto.comments || 'Aprovado',
      },
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
    });

    // Atualizar status da OS
    await this.prisma.serviceOrder.update({
      where: { id: serviceOrderId },
      data: { status: ServiceOrderStatus.APPROVED },
    });

    // TODO: Enviar notificação para o criador da OS
    // TODO: Enviar notificação para técnicos responsáveis

    return {
      ...approval,
      serviceOrder: {
        id: serviceOrder.id,
        orderNumber: serviceOrder.orderNumber,
        status: ServiceOrderStatus.APPROVED,
      },
    };
  }

  async reject(
    serviceOrderId: string,
    rejectDto: RejectDto,
    approverId: string,
  ) {
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    // Validar se pode ser rejeitada
    if (serviceOrder.status === ServiceOrderStatus.APPROVED) {
      throw new BadRequestException('Não é possível rejeitar OS já aprovada');
    }

    if (serviceOrder.status === ServiceOrderStatus.COMPLETED) {
      throw new BadRequestException('Não é possível rejeitar OS já concluída');
    }

    if (serviceOrder.status === ServiceOrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Não é possível rejeitar OS em andamento');
    }

    // Criar rejeição
    const approval = await this.prisma.approval.create({
      data: {
        serviceOrder: { connect: { id: serviceOrderId } },
        approver: { connect: { id: approverId } },
        status: ApprovalStatus.REJECTED,
        comments: rejectDto.comments,
      },
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
    });

    // Atualizar status da OS
    await this.prisma.serviceOrder.update({
      where: { id: serviceOrderId },
      data: { status: ServiceOrderStatus.REJECTED },
    });

    // TODO: Enviar notificação para o criador da OS com os comentários

    return {
      ...approval,
      serviceOrder: {
        id: serviceOrder.id,
        orderNumber: serviceOrder.orderNumber,
        status: ServiceOrderStatus.REJECTED,
        createdBy: serviceOrder.createdBy,
      },
    };
  }

  async findAll(filters?: { serviceOrderId?: string; approverId?: string }) {
    const where: any = {
      ...(filters?.serviceOrderId && {
        serviceOrderId: filters.serviceOrderId,
      }),
      ...(filters?.approverId && { approverId: filters.approverId }),
    };

    return this.prisma.approval.findMany({
      where,
      include: {
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            status: true,
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
        },
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
    });
  }

  async findByServiceOrder(serviceOrderId: string) {
    return this.prisma.approval.findMany({
      where: { serviceOrderId },
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
    });
  }

  async findPendingApprovals() {
    return this.prisma.serviceOrder.findMany({
      where: {
        status: ServiceOrderStatus.PENDING_APPROVAL,
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
            email: true,
          },
        },
        technicalVisit: {
          select: {
            id: true,
            visitDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getApprovalStatistics() {
    const total = await this.prisma.approval.count();

    const byStatus = await this.prisma.approval.groupBy({
      by: ['status'],
      _count: true,
    });

    const pending = await this.prisma.serviceOrder.count({
      where: { status: ServiceOrderStatus.PENDING_APPROVAL },
    });

    return {
      total,
      pending,
      approved:
        byStatus.find((s) => s.status === ApprovalStatus.APPROVED)?._count || 0,
      rejected:
        byStatus.find((s) => s.status === ApprovalStatus.REJECTED)?._count || 0,
    };
  }
}
