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
/** Arredonda para 2 casas (o mesmo Decimal(10,2) da coluna) sem sobra binária. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

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
  // O cliente pode responder com a OC/OP assim que recebe o orçamento, sem
  // passar por AWAITING_RESPONSE — daí ACCEPTED ser alcançável direto daqui
  // (ver PurchaseOrdersService.create, que registra a OC nesse estado).
  [QuoteStatus.SENT_TO_CLIENT]: [
    QuoteStatus.AWAITING_RESPONSE,
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.AWAITING_RESPONSE]: [
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  // Orçamento vencido sem resposta: só volta ao fluxo revisando o escopo/valor.
  [QuoteStatus.EXPIRED]: [QuoteStatus.PENDING_APPROVAL, QuoteStatus.CANCELLED],
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

    // Aceite do cliente congela o orçamento: a partir daqui o escopo e as
    // condições comerciais viraram contrato e foram copiados para a OS de
    // execução. Editar aqui faria o orçamento divergir da OS em silêncio.
    if (quote.status === QuoteStatus.ACCEPTED) {
      throw new BadRequestException(
        'Orçamento aceito não pode ser editado — o escopo já virou Ordem de Serviço',
      );
    }

    if (quote.status === QuoteStatus.CANCELLED) {
      throw new BadRequestException('Orçamento cancelado não pode ser editado');
    }

    // Antes do aceite, gerência pode ajustar em qualquer estágio (inclusive
    // preencher a validade de um orçamento já aprovado, sem a qual ele não
    // pode ser enviado ao cliente). O autor só mexe enquanto está na mão dele.
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

  /**
   * Aprovar é assinar embaixo de um valor. Sem nenhuma linha não há valor
   * nenhum, e o orçamento seguia o fluxo inteiro até virar OS valendo R$ 0,00.
   * Uma linha de valor zero continua válida — é assim que se registra cortesia.
   */
  private async assertQuoteHasLines(quoteId: string) {
    const lines = await this.prisma.quoteLine.count({ where: { quoteId } });
    if (lines === 0) {
      throw new BadRequestException(
        'Adicione ao menos uma linha ao orçamento antes de aprová-lo',
      );
    }
  }

  /**
   * Valida a transição sem escrever nada. Serve para que fluxos compostos
   * (ex: registro de OC/OP) falhem ANTES de persistir qualquer coisa.
   */
  assertTransitionAllowed(from: QuoteStatus, to: QuoteStatus) {
    if (!VALID_STATUS_TRANSITIONS[from].includes(to)) {
      throw new BadRequestException(
        `Transição de status inválida: ${from} -> ${to}`,
      );
    }
  }

  async updateStatus(
    id: string,
    dto: UpdateQuoteStatusDto,
    userId: string,
    userRole: UserRole,
  ) {
    const quote = await this.findOne(id);

    this.assertTransitionAllowed(quote.status, dto.status);

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

    if (dto.status === QuoteStatus.APPROVED) {
      await this.assertQuoteHasLines(id);
    }

    return this.applyStatusTransition(
      { id, status: quote.status, technicalVisitId: quote.technicalVisitId },
      dto.status,
      userId,
      dto.comments,
    );
  }

  /**
   * Aceite disparado pela confirmação de OC/OP do cliente. Não é uma aprovação
   * manual do usuário logado — é o registro de um fato comercial —, por isso
   * não passa pelo gate de ADMIN/MANAGER de updateStatus: quem pode registrar
   * a OC já foi decidido pelo @Roles do endpoint de Ordens de Compra.
   *
   * Aceita um client de transação para participar da mesma transação da OC.
   */
  async acceptFromPurchaseOrder(
    quote: { id: string; status: QuoteStatus; technicalVisitId: string | null },
    userId: string,
    comments: string,
    tx?: Prisma.TransactionClient,
  ) {
    this.assertTransitionAllowed(quote.status, QuoteStatus.ACCEPTED);
    return this.applyStatusTransition(
      quote,
      QuoteStatus.ACCEPTED,
      userId,
      comments,
      tx,
    );
  }

  /**
   * Transição disparada pelo fluxo de aprovação (ApprovalsService). Igual ao
   * acceptFromPurchaseOrder: quem pode aprovar/rejeitar já foi decidido pelo
   * @Roles do endpoint de Aprovações, então não repete o gate de gerente.
   *
   * Aceita um client de transação para que o registro da aprovação e a
   * mudança de status sejam gravados juntos — ou nenhum dos dois.
   */
  async applyApprovalDecision(
    quote: { id: string; status: QuoteStatus; technicalVisitId: string | null },
    to: typeof QuoteStatus.APPROVED | typeof QuoteStatus.REJECTED,
    approverId: string,
    comments: string | undefined,
    tx?: Prisma.TransactionClient,
  ) {
    this.assertTransitionAllowed(quote.status, to);

    if (to === QuoteStatus.APPROVED) {
      await this.assertQuoteHasLines(quote.id);
    }

    return this.applyStatusTransition(quote, to, approverId, comments, tx);
  }

  /**
   * Aplica a transição já validada: grava o status, audita e dispara os
   * efeitos colaterais de negócio. Ponto único de escrita de status do Quote.
   */
  private async applyStatusTransition(
    quote: { id: string; status: QuoteStatus; technicalVisitId: string | null },
    to: QuoteStatus,
    userId: string,
    comments?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    const updated = await db.quote.update({
      where: { id: quote.id },
      data: { status: to },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await this.auditService.record(userId, AuditAction.UPDATE, 'Quote', quote.id, {
      from: quote.status,
      to,
      comments,
    });

    // Orçamento reprovado: se veio de uma visita técnica, marca a visita
    // como cobrável — cliente recusou, custo da visita deixa de ser cortesia.
    if (to === QuoteStatus.REJECTED && quote.technicalVisitId) {
      await db.technicalVisit.update({
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

  /**
   * Mesma regra de congelamento de update(): depois do aceite o valor virou
   * contrato. Sem isso, dava para congelar o escopo mas continuar mexendo no
   * preço de um orçamento já aceito.
   */
  private assertLinesEditable(status: QuoteStatus) {
    if (status === QuoteStatus.ACCEPTED) {
      throw new BadRequestException(
        'Orçamento aceito não pode ter suas linhas alteradas — o valor já foi fechado com o cliente',
      );
    }
    if (status === QuoteStatus.CANCELLED) {
      throw new BadRequestException(
        'Orçamento cancelado não pode ter suas linhas alteradas',
      );
    }
  }

  /**
   * Desconto é valor absoluto, não percentual. Sem teto, um desconto maior que
   * o subtotal gerava linha com total negativo — o orçamento passava a "dever"
   * dinheiro ao cliente e o total somava errado.
   */
  private computeLineTotal(quantity: number, unitValue: number, discount: number) {
    const subtotal = round2(quantity * unitValue);

    if (discount > subtotal) {
      throw new BadRequestException(
        `Desconto (${discount}) não pode ser maior que o subtotal da linha (${subtotal})`,
      );
    }

    return round2(subtotal - discount);
  }

  async addQuoteLine(quoteId: string, dto: CreateQuoteLineDto) {
    const quote = await this.findOne(quoteId);
    this.assertLinesEditable(quote.status);

    const discount = dto.discount ?? 0;

    return this.prisma.quoteLine.create({
      data: {
        quote: { connect: { id: quoteId } },
        type: dto.type,
        description: dto.description,
        quantity: dto.quantity,
        unitValue: dto.unitValue,
        discount,
        totalValue: this.computeLineTotal(dto.quantity, dto.unitValue, discount),
      },
    });
  }

  async updateQuoteLine(quoteId: string, lineId: string, dto: UpdateQuoteLineDto) {
    const quote = await this.findOne(quoteId);
    this.assertLinesEditable(quote.status);

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
        totalValue: this.computeLineTotal(quantity, unitValue, discount),
      },
    });
  }

  async removeQuoteLine(quoteId: string, lineId: string) {
    const quote = await this.findOne(quoteId);
    this.assertLinesEditable(quote.status);

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
      // Passa pela mesma máquina de estados da API: o cron não pode produzir
      // um status que o fluxo manual consideraria inválido.
      this.assertTransitionAllowed(quote.status, QuoteStatus.EXPIRED);

      await this.applyStatusTransition(
        quote,
        QuoteStatus.EXPIRED,
        quote.createdById,
        'Expiração automática (validUntil vencido)',
      );
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
