import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import { CheckinVisitDto, CheckoutVisitDto } from './dto/checkin-visit.dto';
import { Prisma, UserRole, VisitStatus, AuditAction } from '@prisma/client';
import { RoutePoint, nearestNeighborRoute, haversineDistanceKm } from './route.util';
import { snapshotChecklistFields } from '../common/checklist/snapshot-checklist-fields.util';

// Acima disso (metros), o GPS do check-in/checkout é considerado impreciso —
// mesma ideia do aviso "Alta precisão do GPS" do Auvo, derivada do accuracy
// já gravado, sem precisar de coluna nova.
const GPS_IMPRECISE_THRESHOLD_METERS = 100;

// Janela (em dias) usada para sugerir cobrança de 2ª visita no mesmo
// equipamento + mesma categoria de falha.
const RECURRING_VISIT_WINDOW_DAYS = 90;

// Máquina de estados: transições permitidas a partir de cada status atual.
const VALID_STATUS_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  [VisitStatus.SCHEDULED]: [
    VisitStatus.CONFIRMED,
    VisitStatus.RESCHEDULED,
    VisitStatus.CANCELLED,
  ],
  [VisitStatus.CONFIRMED]: [
    VisitStatus.EN_ROUTE,
    VisitStatus.RESCHEDULED,
    VisitStatus.CANCELLED,
  ],
  [VisitStatus.EN_ROUTE]: [VisitStatus.IN_PROGRESS, VisitStatus.CANCELLED],
  [VisitStatus.IN_PROGRESS]: [VisitStatus.COMPLETED, VisitStatus.CANCELLED],
  [VisitStatus.COMPLETED]: [],
  [VisitStatus.CANCELLED]: [],
  [VisitStatus.RESCHEDULED]: [
    VisitStatus.SCHEDULED,
    VisitStatus.CONFIRMED,
    VisitStatus.CANCELLED,
  ],
};

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // Impede que o mesmo técnico fique com duas visitas agendadas em horários
  // sobrepostos. Só se aplica quando a visita tem início/fim definidos.
  private async checkTechnicianConflict(
    technicianId: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    excludeVisitId?: string,
  ) {
    const conflict = await this.prisma.technicalVisit.findFirst({
      where: {
        technicianId,
        status: { notIn: [VisitStatus.CANCELLED, VisitStatus.RESCHEDULED] },
        scheduledStart: { not: null },
        scheduledEnd: { not: null },
        ...(excludeVisitId && { id: { not: excludeVisitId } }),
        AND: [
          { scheduledStart: { lt: scheduledEnd } },
          { scheduledEnd: { gt: scheduledStart } },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException(
        'Técnico já possui uma visita agendada nesse horário',
      );
    }
  }

  // Se já existe uma visita concluída no mesmo equipamento + mesma categoria
  // de falha dentro da janela definida, sugere cobrança da taxa de 2ª visita
  // (não bloqueia a criação, só sinaliza para o atendimento decidir).
  private async suggestChargeable(
    equipmentId?: string,
    failureCategoryId?: string,
  ): Promise<boolean> {
    if (!equipmentId || !failureCategoryId) {
      return false;
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - RECURRING_VISIT_WINDOW_DAYS);

    const previousVisit = await this.prisma.technicalVisit.findFirst({
      where: {
        equipmentId,
        failureCategoryId,
        status: VisitStatus.COMPLETED,
        visitDate: { gte: windowStart },
      },
    });

    return !!previousVisit;
  }

  async create(
    createVisitDto: CreateVisitDto,
    attachments: string[] = [],
    createdById?: string,
  ) {
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

    // Todos os equipamentos informados precisam existir (evita FK quebrada
    // na tabela de vínculo VisitEquipment).
    const equipmentIds = createVisitDto.equipmentIds ?? [];
    if (equipmentIds.length > 0) {
      const foundCount = await this.prisma.equipment.count({
        where: { id: { in: equipmentIds } },
      });
      if (foundCount !== equipmentIds.length) {
        throw new NotFoundException('Um ou mais equipamentos não encontrados');
      }
    }

    const scheduledStart = createVisitDto.scheduledStart
      ? new Date(createVisitDto.scheduledStart)
      : undefined;
    const scheduledEnd = createVisitDto.scheduledEnd
      ? new Date(createVisitDto.scheduledEnd)
      : undefined;

    if (createVisitDto.technicianId && scheduledStart && scheduledEnd) {
      await this.checkTechnicianConflict(
        createVisitDto.technicianId,
        scheduledStart,
        scheduledEnd,
      );
    }

    // Regra de 2ª visita continua olhando só o equipamento "principal"
    // (primeiro selecionado) — mesma lógica de antes, sem mudança.
    const primaryEquipmentId = equipmentIds[0];
    const chargeable = await this.suggestChargeable(
      primaryEquipmentId,
      createVisitDto.failureCategoryId,
    );

    // Se um tipo de tarefa foi informado e a visita não trouxe um
    // questionário próprio, herda o questionário padrão do tipo.
    let checklistTemplateId = createVisitDto.checklistTemplateId;
    if (!checklistTemplateId && createVisitDto.taskTypeId) {
      const taskType = await this.prisma.visitTaskType.findUnique({
        where: { id: createVisitDto.taskTypeId },
      });
      checklistTemplateId = taskType?.defaultChecklistTemplateId ?? undefined;
    }

    let checklistData: Prisma.InputJsonValue[] = [];
    if (checklistTemplateId) {
      const template = await this.prisma.checklistTemplate.findUnique({
        where: { id: checklistTemplateId },
      });

      if (!template) {
        throw new NotFoundException('Template de checklist não encontrado');
      }

      checklistData = snapshotChecklistFields(template.fields);
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
      ...(createdById && {
        createdBy: { connect: { id: createdById } },
      }),
      ...(primaryEquipmentId && {
        equipment: { connect: { id: primaryEquipmentId } },
      }),
      ...(equipmentIds.length > 0 && {
        equipments: {
          create: equipmentIds.map((equipmentId) => ({
            equipment: { connect: { id: equipmentId } },
          })),
        },
      }),
      ...(createVisitDto.failureCategoryId && {
        failureCategory: { connect: { id: createVisitDto.failureCategoryId } },
      }),
      ...(createVisitDto.taskTypeId && {
        taskType: { connect: { id: createVisitDto.taskTypeId } },
      }),
      ...(checklistTemplateId && {
        checklistTemplate: { connect: { id: checklistTemplateId } },
      }),
      checklist: checklistData,
      priority: createVisitDto.priority,
      externalCode: createVisitDto.externalCode,
      actualValue: createVisitDto.actualValue,
      scheduledStart,
      scheduledEnd,
      chargeable,
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
        createdBy: { select: { id: true, name: true } },
        equipment: true,
        equipments: { include: { equipment: true } },
        failureCategory: true,
        taskType: true,
        checklistTemplate: { select: { id: true, name: true } },
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
            latitude: true,
            longitude: true,
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
        createdBy: { select: { id: true, name: true } },
        equipments: { include: { equipment: true } },
        failureCategory: true,
        taskType: true,
        checklistTemplate: { select: { id: true, name: true } },
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

    // Distância (m) entre onde o check-in/checkout aconteceu e o endereço
    // cadastrado do cliente — mesma ideia do "693m de distância" do Auvo.
    // Calculado na leitura, não persistido (evita duplicar dado que já dá
    // pra derivar de client.latitude/longitude + visit.checkin/checkoutLat/Lng).
    const clientLat = visit.client?.latitude;
    const clientLng = visit.client?.longitude;

    const checkinDistanceMeters =
      clientLat != null && clientLng != null && visit.checkinLat != null && visit.checkinLng != null
        ? Math.round(haversineDistanceKm(visit.checkinLat, visit.checkinLng, clientLat, clientLng) * 1000)
        : null;

    const checkoutDistanceMeters =
      clientLat != null && clientLng != null && visit.checkoutLat != null && visit.checkoutLng != null
        ? Math.round(haversineDistanceKm(visit.checkoutLat, visit.checkoutLng, clientLat, clientLng) * 1000)
        : null;

    return {
      ...visit,
      checkinDistanceMeters,
      checkoutDistanceMeters,
      checkinImprecise:
        visit.checkinAccuracy != null && visit.checkinAccuracy > GPS_IMPRECISE_THRESHOLD_METERS,
      checkoutImprecise:
        visit.checkoutAccuracy != null && visit.checkoutAccuracy > GPS_IMPRECISE_THRESHOLD_METERS,
    };
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

  async updateStatus(
    id: string,
    dto: UpdateVisitStatusDto,
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
        'Você não tem permissão para alterar o status desta visita',
      );
    }

    const allowedNextStatuses = VALID_STATUS_TRANSITIONS[visit.status];
    if (!allowedNextStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Transição de status inválida: ${visit.status} -> ${dto.status}`,
      );
    }

    const updated = await this.prisma.technicalVisit.update({
      where: { id },
      data: { status: dto.status },
      include: {
        client: { select: { id: true, companyName: true } },
        technician: { select: { id: true, name: true } },
      },
    });

    await this.auditService.record(
      userId,
      AuditAction.UPDATE,
      'TechnicalVisit',
      id,
      { from: visit.status, to: dto.status, reason: dto.reason },
    );

    return updated;
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
