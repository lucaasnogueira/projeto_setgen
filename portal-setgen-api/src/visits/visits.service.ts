import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  async create(createVisitDto: CreateVisitDto, attachments: string[] = []) {
    // Verificar se cliente existe
    const client = await this.prisma.client.findUnique({
      where: { id: createVisitDto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se técnico existe
    const technician = await this.prisma.user.findUnique({
      where: { id: createVisitDto.technicianId },
    });

    if (!technician) {
      throw new NotFoundException('Técnico não encontrado');
    }

    const visitData: Prisma.TechnicalVisitCreateInput = {
      client: { connect: { id: createVisitDto.clientId } },
      technician: { connect: { id: createVisitDto.technicianId } },
      visitDate: new Date(createVisitDto.visitDate),
      visitType: createVisitDto.visitType,
      location: createVisitDto.location,
      description: createVisitDto.description,
      identifiedNeeds: createVisitDto.identifiedNeeds,
      suggestedScope: createVisitDto.suggestedScope,
      estimatedDeadline: createVisitDto.estimatedDeadline,
      estimatedValue: createVisitDto.estimatedValue,
      notes: createVisitDto.notes,
      attachments: attachments,
    };

    return this.prisma.technicalVisit.create({
      data: visitData,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
            cnpjCpf: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    clientId?: string;
    technicianId?: string;
    visitType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Prisma.TechnicalVisitWhereInput = {
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.technicianId && { technicianId: filters.technicianId }),
      ...(filters?.visitType && { visitType: filters.visitType as any }),
      ...(filters?.startDate &&
        filters?.endDate && {
          visitDate: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate),
          },
        }),
    };

    return this.prisma.technicalVisit.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
            cnpjCpf: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        visitDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const visit = await this.prisma.technicalVisit.findUnique({
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
            address: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        serviceOrders: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Visita técnica não encontrada');
    }

    return visit;
  }

  async findByClient(clientId: string) {
    return this.prisma.technicalVisit.findMany({
      where: { clientId },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        visitDate: 'desc',
      },
    });
  }

  async findByTechnician(technicianId: string) {
    return this.prisma.technicalVisit.findMany({
      where: { technicianId },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
          },
        },
      },
      orderBy: {
        visitDate: 'desc',
      },
    });
  }

  async update(
    id: string,
    updateVisitDto: UpdateVisitDto,
    userId: string,
    userRole: UserRole,
  ) {
    const visit = await this.findOne(id);

    // Apenas ADMIN, MANAGER ou o próprio técnico pode editar
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      visit.technicianId !== userId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para editar esta visita',
      );
    }

    const updateData: Prisma.TechnicalVisitUpdateInput = {
      ...(updateVisitDto.visitDate && {
        visitDate: new Date(updateVisitDto.visitDate),
      }),
      ...(updateVisitDto.visitType && { visitType: updateVisitDto.visitType }),
      ...(updateVisitDto.location && { location: updateVisitDto.location }),
      ...(updateVisitDto.description && {
        description: updateVisitDto.description,
      }),
      ...(updateVisitDto.identifiedNeeds && {
        identifiedNeeds: updateVisitDto.identifiedNeeds,
      }),
      ...(updateVisitDto.suggestedScope && {
        suggestedScope: updateVisitDto.suggestedScope,
      }),
      ...(updateVisitDto.estimatedDeadline && {
        estimatedDeadline: updateVisitDto.estimatedDeadline,
      }),
      ...(updateVisitDto.estimatedValue !== undefined && {
        estimatedValue: updateVisitDto.estimatedValue,
      }),
      ...(updateVisitDto.notes !== undefined && {
        notes: updateVisitDto.notes,
      }),
    };

    return this.prisma.technicalVisit.update({
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
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async addAttachments(id: string, attachments: string[]) {
    const visit = await this.findOne(id);

    return this.prisma.technicalVisit.update({
      where: { id },
      data: {
        attachments: [...visit.attachments, ...attachments],
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const visit = await this.findOne(id);

    // Apenas ADMIN pode deletar
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem deletar visitas',
      );
    }

    // Verificar se não tem OS vinculada
    if (visit.serviceOrders && visit.serviceOrders.length > 0) {
      throw new ForbiddenException(
        'Não é possível deletar visita com Ordens de Serviço vinculadas',
      );
    }

    return this.prisma.technicalVisit.delete({
      where: { id },
    });
  }
}
