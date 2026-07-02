import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { CheckinVisitDto, CheckoutVisitDto } from './dto/checkin-visit.dto';
import { Prisma, UserRole } from '@prisma/client';
import { RoutePoint, nearestNeighborRoute } from './route.util';

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

    // Verificar se técnico principal existe (se fornecido)
    if (createVisitDto.technicianId) {
      const technician = await this.prisma.user.findUnique({
        where: { id: createVisitDto.technicianId },
      });

      if (!technician) {
        throw new NotFoundException('Técnico principal não encontrado');
      }
    }

    // Combinar anexos com legendas
    const attachmentsData = attachments.map((path, index) => ({
      url: path,
      legend:
        createVisitDto.legends && createVisitDto.legends[index]
          ? createVisitDto.legends[index]
          : '',
    }));

    const visitData: Prisma.TechnicalVisitCreateInput = {
      client: { connect: { id: createVisitDto.clientId } },
      ...(createVisitDto.technicianId && {
        technician: { connect: { id: createVisitDto.technicianId } },
      }),
      visitDate: new Date(createVisitDto.visitDate),
      visitType: createVisitDto.visitType,
      location: createVisitDto.location,
      description: createVisitDto.description,
      userReport: createVisitDto.userReport,
      identifiedNeeds: createVisitDto.identifiedNeeds,
      suggestedScope: createVisitDto.suggestedScope,
      estimatedDeadline: createVisitDto.estimatedDeadline,
      estimatedValue: createVisitDto.estimatedValue,
      notes: createVisitDto.notes,
      attachments: attachments,
      attachmentsData: attachmentsData as any,
      responsibleIds: createVisitDto.responsibleIds || [],
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
    teamId?: string;
    visitType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Prisma.TechnicalVisitWhereInput = {
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.technicianId && { technicianId: filters.technicianId }),
      ...(filters?.teamId && {
        technician: { teams: { some: { id: filters.teamId } } },
      }),
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
            latitude: true,
            longitude: true,
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

  async getOptimizedRoute(filters: {
    date: string;
    technicianId?: string;
    teamId?: string;
  }) {
    if (!filters.technicianId && !filters.teamId) {
      throw new BadRequestException(
        'Informe technicianId ou teamId para otimizar a rota',
      );
    }

    const dayStart = new Date(`${filters.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${filters.date}T23:59:59.999Z`);

    const where: Prisma.TechnicalVisitWhereInput = {
      visitDate: { gte: dayStart, lte: dayEnd },
      ...(filters.technicianId && { technicianId: filters.technicianId }),
      ...(filters.teamId && {
        technician: { teams: { some: { id: filters.teamId } } },
      }),
    };

    const visits = await this.prisma.technicalVisit.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
            latitude: true,
            longitude: true,
          },
        },
        technician: { select: { id: true, name: true, email: true } },
      },
      orderBy: { visitDate: 'asc' },
    });

    const points: (RoutePoint & { visit: (typeof visits)[number] })[] =
      visits.map((v) => ({
        id: v.id,
        lat: v.client?.latitude ?? null,
        lng: v.client?.longitude ?? null,
        visit: v,
      }));

    const { ordered, totalDistanceKm } = nearestNeighborRoute(points);

    return {
      date: filters.date,
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      stopsCount: ordered.length,
      unroutedCount: ordered.filter((p) => p.lat === null || p.lng === null)
        .length,
      visits: ordered.map((p, index) => ({
        ...p.visit,
        routeOrder: index + 1,
        hasCoordinates: p.lat !== null && p.lng !== null,
      })),
    };
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
      ...(updateVisitDto.userReport && {
        userReport: updateVisitDto.userReport,
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
      ...(updateVisitDto.responsibleIds && {
        responsibleIds: updateVisitDto.responsibleIds,
      }),
      ...(updateVisitDto.technicianId !== undefined && {
        technician: updateVisitDto.technicianId
          ? { connect: { id: updateVisitDto.technicianId } }
          : { disconnect: true },
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

  async checkin(
    id: string,
    dto: CheckinVisitDto,
    userId: string,
    userRole: UserRole,
  ) {
    const visit = await this.findOne(id);

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      visit.technicianId !== userId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para fazer checkin nesta visita',
      );
    }

    if (visit.checkinAt) {
      throw new BadRequestException('Visita já teve checkin');
    }

    return this.prisma.technicalVisit.update({
      where: { id },
      data: {
        checkinAt: new Date(),
        checkinLat: dto.lat,
        checkinLng: dto.lng,
        checkinAccuracy: dto.accuracy,
      },
    });
  }

  async checkout(
    id: string,
    dto: CheckoutVisitDto,
    userId: string,
    userRole: UserRole,
  ) {
    const visit = await this.findOne(id);

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      visit.technicianId !== userId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para fazer checkout nesta visita',
      );
    }

    if (!visit.checkinAt) {
      throw new BadRequestException('Visita ainda não teve checkin');
    }

    if (visit.checkoutAt) {
      throw new BadRequestException('Visita já teve checkout');
    }

    return this.prisma.technicalVisit.update({
      where: { id },
      data: {
        checkoutAt: new Date(),
        checkoutLat: dto.lat,
        checkoutLng: dto.lng,
        checkoutAccuracy: dto.accuracy,
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
