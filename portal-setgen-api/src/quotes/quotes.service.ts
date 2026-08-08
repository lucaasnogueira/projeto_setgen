import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { CreateQuoteLineDto } from './dto/create-quote-line.dto';
import { UpdateQuoteLineDto } from './dto/update-quote-line.dto';
import {
  Prisma,
  UserRole,
  QuoteStatus,
  ServiceOrderType,
  AuditAction,
} from '@prisma/client';

// Máquina de estados do orçamento (fase comercial). Ao chegar em ACCEPTED,
// a Ordem de Serviço de execução é criada separadamente — ver
// ServiceOrdersService.createFromQuote (disparado manual ou automaticamente
// pela confirmação de OC/OP em PurchaseOrdersService).
const VALID_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.PENDING_APPROVAL, QuoteStatus.CANCELLED],
  [QuoteStatus.PENDING_APPROVAL]: [
    QuoteStatus.APPROVED,
    QuoteStatus.REJECTED,
    QuoteStatus.CANCELLED,
  ],
  // APPROVED = engenharia/gerência aprovou internamente o escopo e valor.
  // A partir daqui o orçamento pode seguir dois caminhos: ser aceito
  // diretamente (ex: ordem de serviço interna) ou ser enviado ao cliente.
  [QuoteStatus.APPROVED]: [
    QuoteStatus.SENT_TO_CLIENT,
    QuoteStatus.ACCEPTED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.SENT_TO_CLIENT]: [
    QuoteStatus.AWAITING_RESPONSE,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.AWAITING_RESPONSE]: [
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  // Orçamento vencido sem resposta: só volta ao fluxo revisando o escopo/valor.
  [QuoteStatus.EXPIRED]: [QuoteStatus.PENDING_APPROVAL],
  [QuoteStatus.REJECTED]: [QuoteStatus.PENDING_APPROVAL, QuoteStatus.CANCELLED],
  // ACCEPTED é terminal do lado do orçamento: a partir daqui quem assume o
  // ciclo de vida é a ServiceOrder (execução) vinculada.
  [QuoteStatus.ACCEPTED]: [],
  [QuoteStatus.CANCELLED]: [],
};

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const sequenceName = `seq_quote_${year}`;

    try {
      const result = await this.prisma.$queryRawUnsafe<[{ nextval: bigint }]>(
        `SELECT nextval('${sequenceName}'::regclass)`,
      );
      return `ORC-${year}-${String(result[0].nextval).padStart(5, '0')}`;
    } catch {
      // Fallback: se a sequence não existir, cria e retorna 1
      await this.prisma.$executeRawUnsafe(
        `CREATE SEQUENCE IF NOT EXISTS ${sequenceName} START 1 INCREMENT 1`,
      );
      const result = await this.prisma.$queryRawUnsafe<[{ nextval: bigint }]>(
        `SELECT nextval('${sequenceName}'::regclass)`,
      );
      return `ORC-${year}-${String(result[0].nextval).padStart(5, '0')}`;
    }
  }

  async create(dto: CreateQuoteDto, createdById: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    if (dto.technicalVisitId) {
      const visit = await this.prisma.technicalVisit.findUnique({
        where: { id: dto.technicalVisitId },
      });
      if (!visit) {
        throw new NotFoundException('Visita técnica não encontrada');
      }
      if (visit.clientId !== dto.clientId) {
        throw new BadRequestException(
          'Cliente do orçamento não corresponde ao cliente da visita',
        );
      }
    }

    const quoteNumber = await this.generateQuoteNumber();

    const data: Prisma.QuoteCreateInput = {
      quoteNumber,
      type: dto.type,
      client: { connect: { id: dto.clientId } },
      ...(dto.technicalVisitId && {
        technicalVisit: { connect: { id: dto.technicalVisitId } },
      }),
      scope: dto.scope,
      reportedDefects: dto.reportedDefects,
      requestedServices: dto.requestedServices,
      notes: dto.notes,
      ...(dto.validUntil && { validUntil: new Date(dto.validUntil) }),
      createdBy: { connect: { id: createdById } },
      ...(dto.paymentMethod && { paymentMethod: dto.paymentMethod }),
      ...(dto.paymentTerms !== undefined && { paymentTerms: dto.paymentTerms }),
      ...(dto.paymentTermDays !== undefined && {
        paymentTermDays: dto.paymentTermDays,
      }),
      ...(dto.warrantyMonths !== undefined && {
        warrantyMonths: dto.warrantyMonths,
      }),
      ...(dto.salesRepId && { salesRep: { connect: { id: dto.salesRepId } } }),
      status:
        dto.type === ServiceOrderType.VISIT_REPORT
          ? QuoteStatus.PENDING_APPROVAL
          : QuoteStatus.DRAFT,
    };

    return this.prisma.quote.create({
      data,
      include: {
        client: {
          select: { id: true, companyName: true, tradeName: true, cnpjCpf: true },
        },
        technicalVisit: {
          select: {
            id: true,
            visitDate: true,
            visitType: true,
            technician: { select: { id: true, name: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async findAll(filters?: {
    clientId?: string;
    status?: QuoteStatus;
    type?: ServiceOrderType;
    createdById?: string;
  }) {
    const where: Prisma.QuoteWhereInput = {
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.createdById && { createdById: filters.createdById }),
    };

    return this.prisma.quote.findMany({
      where,
      include: {
        client: { select: { id: true, companyName: true, tradeName: true } },
        createdBy: { select: { id: true, name: true } },
        serviceOrder: { select: { id: true, orderNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
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
          include: { technician: { select: { id: true, name: true, email: true } } },
        },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        salesRep: { select: { id: true, name: true } },
        approvals: {
          include: {
            approver: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { approvedAt: 'desc' },
        },
        purchaseOrders: true,
        quoteLines: { orderBy: { createdAt: 'asc' } },
        serviceOrder: {
          select: { id: true, orderNumber: true, status: true, progress: true },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return quote;
  }

  async update(id: string, dto: UpdateQuoteDto, userId: string, userRole: UserRole) {
    const quote = await this.findOne(id);

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      quote.createdById !== userId
    ) {
      throw new ForbiddenException('Você não tem permissão para editar este orçamento');
    }

    if (
      quote.status !== QuoteStatus.DRAFT &&
      quote.status !== QuoteStatus.PENDING_APPROVAL &&
      quote.status !== QuoteStatus.REJECTED &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Não é possível editar orçamento já aprovado');
    }

    const updateData: Prisma.QuoteUpdateInput = {
      ...(dto.scope && { scope: dto.scope }),
      ...(dto.validUntil && { validUntil: new Date(dto.validUntil) }),
      ...(dto.reportedDefects !== undefined && { reportedDefects: dto.reportedDefects }),
      ...(dto.requestedServices !== undefined && {
        requestedServices: dto.requestedServices,
      }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.paymentMethod !== undefined && { paymentMethod: dto.paymentMethod }),
      ...(dto.paymentTerms !== undefined && { paymentTerms: dto.paymentTerms }),
      ...(dto.paymentTermDays !== undefined && { paymentTermDays: dto.paymentTermDays }),
      ...(dto.warrantyMonths !== undefined && { warrantyMonths: dto.warrantyMonths }),
      ...(dto.salesRepId !== undefined && {
        salesRep: dto.salesRepId
          ? { connect: { id: dto.salesRepId } }
          : { disconnect: true },
      }),
    };

    return this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, companyName: true, tradeName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateQuoteStatusDto,
    userId: string,
    userRole: UserRole,
  ) {
    const quote = await this.findOne(id);

    const allowedNextStatuses = VALID_STATUS_TRANSITIONS[quote.status];
    if (!allowedNextStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Transição de status inválida: ${quote.status} -> ${dto.status}`,
      );
    }

    if (
      (dto.status === QuoteStatus.APPROVED || dto.status === QuoteStatus.ACCEPTED) &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Apenas gerentes podem aprovar/aceitar orçamento');
    }

    if (
      dto.status === QuoteStatus.REJECTED &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Apenas gerentes podem rejeitar orçamento');
    }

    if (dto.status === QuoteStatus.SENT_TO_CLIENT && !quote.validUntil) {
      throw new BadRequestException(
        'Defina a validade do orçamento (validUntil) antes de enviar ao cliente',
      );
    }

    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status: dto.status },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await this.auditService.record(userId, AuditAction.UPDATE, 'Quote', id, {
      from: quote.status,
      to: dto.status,
      comments: dto.comments,
    });

    // Orçamento reprovado: se veio de uma visita técnica, marca a visita
    // como cobrável — cliente recusou, custo da visita deixa de ser cortesia.
    if (dto.status === QuoteStatus.REJECTED && quote.technicalVisitId) {
      await this.prisma.technicalVisit.update({
        where: { id: quote.technicalVisitId },
        data: { chargeable: true },
      });
    }

    return updated;
  }

  async remove(id: string, userRole: UserRole) {
    const quote = await this.findOne(id);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem deletar orçamentos');
    }

    if (quote.serviceOrder) {
      throw new BadRequestException(
        'Não é possível deletar orçamento que já gerou Ordem de Serviço',
      );
    }

    if ((quote.purchaseOrders && quote.purchaseOrders.length > 0)) {
      throw new BadRequestException(
        'Não é possível deletar orçamento com Ordem de Compra vinculada. Remova-a primeiro.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.approval.deleteMany({ where: { quoteId: id } });
      await tx.quoteLine.deleteMany({ where: { quoteId: id } });
      return tx.quote.delete({ where: { id } });
    });
  }

  async addQuoteLine(quoteId: string, dto: CreateQuoteLineDto) {
    await this.findOne(quoteId);

    const discount = dto.discount ?? 0;

    return this.prisma.quoteLine.create({
      data: {
        quote: { connect: { id: quoteId } },
        type: dto.type,
        description: dto.description,
        quantity: dto.quantity,
        unitValue: dto.unitValue,
        discount,
        totalValue: dto.quantity * dto.unitValue - discount,
      },
    });
  }

  async updateQuoteLine(quoteId: string, lineId: string, dto: UpdateQuoteLineDto) {
    const line = await this.prisma.quoteLine.findUnique({ where: { id: lineId } });

    if (!line || line.quoteId !== quoteId) {
      throw new NotFoundException('Linha de orçamento não encontrada');
    }

    const quantity = dto.quantity ?? Number(line.quantity);
    const unitValue = dto.unitValue ?? Number(line.unitValue);
    const discount = dto.discount ?? Number(line.discount);

    return this.prisma.quoteLine.update({
      where: { id: lineId },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.description && { description: dto.description }),
        quantity,
        unitValue,
        discount,
        totalValue: quantity * unitValue - discount,
      },
    });
  }

  async removeQuoteLine(quoteId: string, lineId: string) {
    const line = await this.prisma.quoteLine.findUnique({ where: { id: lineId } });

    if (!line || line.quoteId !== quoteId) {
      throw new NotFoundException('Linha de orçamento não encontrada');
    }

    return this.prisma.quoteLine.delete({ where: { id: lineId } });
  }

  async getAuditLog(quoteId: string) {
    await this.findOne(quoteId);

    return this.prisma.auditLog.findMany({
      where: { entity: 'Quote', entityId: quoteId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Varre orçamentos enviados ao cliente cuja validade expirou e marca como
  // EXPIRED automaticamente. Roda de hora em hora.
  @Cron(CronExpression.EVERY_HOUR)
  async expireOverdueQuotes() {
    const overdue = await this.prisma.quote.findMany({
      where: {
        status: { in: [QuoteStatus.SENT_TO_CLIENT, QuoteStatus.AWAITING_RESPONSE] },
        validUntil: { lt: new Date() },
      },
    });

    for (const quote of overdue) {
      await this.prisma.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.EXPIRED },
      });

      await this.auditService.record(quote.createdById, AuditAction.UPDATE, 'Quote', quote.id, {
        from: quote.status,
        to: QuoteStatus.EXPIRED,
        reason: 'Expiração automática (validUntil vencido)',
      });
    }

    return overdue.length;
  }

  async getStatistics() {
    const total = await this.prisma.quote.count();
    const byStatus = await this.prisma.quote.groupBy({ by: ['status'], _count: true });
    const byType = await this.prisma.quote.groupBy({ by: ['type'], _count: true });

    return {
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
    };
  }
}
