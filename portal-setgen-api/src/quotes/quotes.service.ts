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
  [QuoteStatus.DRAFT]: [
    QuoteStatus.PENDING_APPROVAL,
    QuoteStatus.APPROVED,
    QuoteStatus.SENT_TO_CLIENT,
    QuoteStatus.ACCEPTED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.PENDING_APPROVAL]: [
    QuoteStatus.DRAFT,
    QuoteStatus.APPROVED,
    QuoteStatus.REJECTED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.APPROVED]: [
    QuoteStatus.DRAFT,
    QuoteStatus.PENDING_APPROVAL,
    QuoteStatus.SENT_TO_CLIENT,
    QuoteStatus.AWAITING_RESPONSE,
    QuoteStatus.ACCEPTED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.SENT_TO_CLIENT]: [
    QuoteStatus.DRAFT,
    QuoteStatus.AWAITING_RESPONSE,
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.AWAITING_RESPONSE]: [
    QuoteStatus.DRAFT,
    QuoteStatus.SENT_TO_CLIENT,
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  [QuoteStatus.EXPIRED]: [QuoteStatus.DRAFT, QuoteStatus.PENDING_APPROVAL, QuoteStatus.CANCELLED],
  [QuoteStatus.REJECTED]: [QuoteStatus.DRAFT, QuoteStatus.PENDING_APPROVAL, QuoteStatus.CANCELLED],
  [QuoteStatus.ACCEPTED]: [QuoteStatus.DRAFT, QuoteStatus.APPROVED, QuoteStatus.CANCELLED],
  [QuoteStatus.CANCELLED]: [QuoteStatus.DRAFT],
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
      ...(dto.clientId && quote.status === QuoteStatus.DRAFT && {
        client: { connect: { id: dto.clientId } },
      }),
      ...(dto.type && quote.status === QuoteStatus.DRAFT && {
        type: dto.type,
      }),
      ...(dto.technicalVisitId !== undefined && quote.status === QuoteStatus.DRAFT && {
        technicalVisit: dto.technicalVisitId
          ? { connect: { id: dto.technicalVisitId } }
          : { disconnect: true },
      }),
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
  assertTransitionAllowed(from: QuoteStatus, to: QuoteStatus, userRole?: UserRole) {
    if (from === to) return;
    if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
      return;
    }
    const allowed = VALID_STATUS_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
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

    this.assertTransitionAllowed(quote.status, dto.status, userRole);

    if (
      (dto.status === QuoteStatus.APPROVED || dto.status === QuoteStatus.ACCEPTED) &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      userRole !== UserRole.ADMINISTRATIVE
    ) {
      throw new ForbiddenException('Apenas usuários autorizados podem aprovar/aceitar orçamento');
    }

    if (
      dto.status === QuoteStatus.REJECTED &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      userRole !== UserRole.ADMINISTRATIVE
    ) {
      throw new ForbiddenException('Apenas usuários autorizados podem rejeitar orçamento');
    }

    if (dto.status === QuoteStatus.SENT_TO_CLIENT && !quote.validUntil) {
      const defValid = new Date();
      defValid.setDate(defValid.getDate() + 15);
      await this.prisma.quote.update({
        where: { id },
        data: { validUntil: defValid },
      });
    }

    if (dto.status === QuoteStatus.APPROVED) {
      await this.assertQuoteHasLines(id);
    }

    if (dto.status === QuoteStatus.ACCEPTED || dto.status === QuoteStatus.APPROVED) {
      try {
        return await this.approveAndCreateWorkOrder(id, userId);
      } catch (e) {
        console.warn('Criação automática de OS não aplicada, mantendo transição direta:', e);
      }
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
    const result = await this.applyStatusTransition(
      quote,
      QuoteStatus.ACCEPTED,
      userId,
      comments,
      tx,
    );
    try {
      await this.approveAndCreateWorkOrder(quote.id, userId);
    } catch (e) {
      console.warn('Criação automática de OS a partir de OC não aplicada:', e);
    }
    return result;
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
      return {
        quote,
        serviceOrder: quote.serviceOrder,
        alreadyExisted: true,
      };
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

  /**
   * Recálculo atômico e determinístico dos totais consolidados do orçamento
   */
  async recalculateQuoteTotals(quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        itemProducts: true,
        itemServices: true,
        additionalCosts: true,
      },
    });

    if (!quote) return;

    const subtotalProducts = quote.itemProducts.reduce(
      (acc, it) => acc + Number(it.totalPrice),
      0,
    );
    const subtotalServices = quote.itemServices.reduce(
      (acc, it) => acc + Number(it.totalPrice),
      0,
    );
    const subtotalAdditionalCosts = quote.additionalCosts.reduce(
      (acc, it) => acc + Number(it.amount),
      0,
    );

    const subtotalGeneral = subtotalProducts + subtotalServices + subtotalAdditionalCosts;
    const discountVal = Number(quote.discountValue) || 0;
    let discountTotal = 0;

    if (quote.discountType === 'PERCENTUAL') {
      discountTotal = subtotalGeneral * (discountVal / 100);
    } else {
      discountTotal = discountVal;
    }

    const totalAmount = Math.max(0, subtotalGeneral - discountTotal);

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        subtotalProducts: round2(subtotalProducts),
        subtotalServices: round2(subtotalServices),
        subtotalAdditionalCosts: round2(subtotalAdditionalCosts),
        totalAmount: round2(totalAmount),
      },
    });
  }

  // --- MultiCRUD: Produtos do Orçamento ---
  async addItemProduct(
    quoteId: string,
    dto: { productId: string; quantity: number; unitPrice: number; discountAmount?: number },
  ) {
    await this.findOne(quoteId);
    const discount = dto.discountAmount || 0;
    const total = Math.max(0, dto.quantity * dto.unitPrice - discount);

    const item = await this.prisma.quoteItemProduct.create({
      data: {
        quoteId,
        productId: dto.productId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        discountAmount: discount,
        totalPrice: total,
      },
      include: { product: true },
    });

    await this.recalculateQuoteTotals(quoteId);
    return item;
  }

  async removeItemProduct(quoteId: string, itemId: string) {
    await this.prisma.quoteItemProduct.delete({
      where: { id: itemId },
    });
    await this.recalculateQuoteTotals(quoteId);
    return { message: 'Produto removido com sucesso' };
  }

  // --- MultiCRUD: Serviços do Orçamento ---
  async addItemService(
    quoteId: string,
    dto: {
      serviceId: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
      customObservation?: string;
    },
  ) {
    await this.findOne(quoteId);
    const discount = dto.discountAmount || 0;
    const total = Math.max(0, dto.quantity * dto.unitPrice - discount);

    const item = await this.prisma.quoteItemService.create({
      data: {
        quoteId,
        serviceId: dto.serviceId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        discountAmount: discount,
        totalPrice: total,
        customObservation: dto.customObservation || null,
      },
      include: { service: true },
    });

    await this.recalculateQuoteTotals(quoteId);
    return item;
  }

  async removeItemService(quoteId: string, itemId: string) {
    await this.prisma.quoteItemService.delete({
      where: { id: itemId },
    });
    await this.recalculateQuoteTotals(quoteId);
    return { message: 'Serviço removido com sucesso' };
  }

  // --- MultiCRUD: Custos Adicionais ---
  async addAdditionalCost(
    quoteId: string,
    dto: { description: string; amount: number },
  ) {
    await this.findOne(quoteId);
    const cost = await this.prisma.quoteAdditionalCost.create({
      data: {
        quoteId,
        description: dto.description,
        amount: dto.amount,
      },
    });

    await this.recalculateQuoteTotals(quoteId);
    return cost;
  }

  async removeAdditionalCost(quoteId: string, costId: string) {
    await this.prisma.quoteAdditionalCost.delete({
      where: { id: costId },
    });
    await this.recalculateQuoteTotals(quoteId);
    return { message: 'Custo adicional removido com sucesso' };
  }

  // --- MultiCRUD: Tarefas Vinculadas ---
  async addTask(
    quoteId: string,
    dto: {
      taskCode?: string;
      taskType: string;
      executionDate: Date;
      assignedCollaboratorId?: string;
    },
  ) {
    await this.findOne(quoteId);
    return this.prisma.quoteTask.create({
      data: {
        quoteId,
        taskCode: dto.taskCode || null,
        taskType: dto.taskType,
        executionDate: new Date(dto.executionDate),
        assignedCollaboratorId: dto.assignedCollaboratorId || null,
      },
      include: { assignedCollaborator: { select: { id: true, name: true } } },
    });
  }

  async removeTask(quoteId: string, taskId: string) {
    await this.prisma.quoteTask.delete({
      where: { id: taskId },
    });
    return { message: 'Tarefa removida com sucesso' };
  }

  // --- MultiCRUD: Anexos do Orçamento ---
  async addAttachment(
    quoteId: string,
    userId: string,
    dto: { fileName: string; fileUrl: string; showToClient?: boolean },
  ) {
    await this.findOne(quoteId);
    return this.prisma.quoteAttachment.create({
      data: {
        quoteId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        uploadedById: userId,
        showToClient: dto.showToClient ?? false,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
  }

  async removeAttachment(quoteId: string, attachmentId: string) {
    await this.prisma.quoteAttachment.delete({
      where: { id: attachmentId },
    });
    return { message: 'Anexo removido com sucesso' };
  }

  /**
   * Ciclo Crítico de Conversão: Aprovação de Orçamento -> Geração Automática de Ordem de Serviço
   */
  async approveAndCreateWorkOrder(quoteId: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        serviceOrder: true,
        technicalVisit: { select: { id: true, equipmentId: true } },
        itemProducts: { include: { product: true } },
        itemServices: { include: { service: true } },
        quoteLines: true,
        createdBy: true,
        salesRep: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (quote.serviceOrder) {
      return {
        quote,
        serviceOrder: quote.serviceOrder,
        alreadyExisted: true,
      };
    }

    const year = new Date().getFullYear();
    const allOrders = await this.prisma.serviceOrder.findMany({ select: { orderNumber: true } });
    let nextNum = 1;
    for (const o of allOrders) {
      const parts = o.orderNumber.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(n) && n >= nextNum) {
        nextNum = n + 1;
      }
    }
    const osNumber = `OS-${year}-${String(nextNum).padStart(5, '0')}`;

    // Responsável operacional: o salesRep ou createdBy do orçamento
    const responsibleId = quote.salesRepId || quote.createdById;
    const collaborator = await this.prisma.user.findUnique({
      where: { id: responsibleId },
    });

    const hourlyRate = Number(collaborator?.hourlyRate) || 0;
    const kmRate = Number(collaborator?.kmRate) || 0;

    // Só vincula equipamento se a visita técnica de origem definiu expressamente um equipamento
    const linkedEquipmentId = quote.technicalVisit?.equipmentId || null;

    // Mapeamento de Produtos/Materiais
    let itemsToCreate = quote.itemProducts.map((p) => ({
      productId: p.productId,
      quantity: Math.max(1, Math.round(Number(p.quantity))),
      unitPrice: Number(p.unitPrice),
      totalPrice: Number(p.totalPrice || (Number(p.quantity) * Number(p.unitPrice))),
    }));

    if (itemsToCreate.length === 0 && quote.quoteLines?.length > 0) {
      const materialLines = quote.quoteLines.filter((l) => l.type === 'MATERIAL');
      if (materialLines.length > 0) {
        const allProducts = await this.prisma.product.findMany();
        for (const line of materialLines) {
          const matched = allProducts.find(
            (p) => p.name.toLowerCase() === line.description.toLowerCase() ||
                   line.description.toLowerCase().includes(p.name.toLowerCase()) ||
                   p.name.toLowerCase().includes(line.description.toLowerCase())
          );
          if (matched) {
            itemsToCreate.push({
              productId: matched.id,
              quantity: Math.max(1, Math.round(Number(line.quantity))),
              unitPrice: Number(line.unitValue),
              totalPrice: Number(line.totalValue),
            });
          }
        }
      }
    }

    // Mapeamento de Serviços Técnicos
    let servicesToCreate = quote.itemServices.map((s) => ({
      serviceId: s.serviceId,
      quantity: pToDec(s.quantity),
      unitPrice: Number(s.unitPrice),
      scopeObservation: s.customObservation || s.service.defaultObservation || null,
    }));

    if (servicesToCreate.length === 0 && quote.quoteLines?.length > 0) {
      const serviceLines = quote.quoteLines.filter((l) => l.type === 'SERVICE');
      if (serviceLines.length > 0) {
        const allServices = await this.prisma.service.findMany();
        for (const line of serviceLines) {
          const matched = allServices.find(
            (s) => (s.title && s.title.toLowerCase() === line.description.toLowerCase()) ||
                   (s.title && line.description.toLowerCase().includes(s.title.toLowerCase())) ||
                   (s.title && s.title.toLowerCase().includes(line.description.toLowerCase()))
          );
          if (matched) {
            servicesToCreate.push({
              serviceId: matched.id,
              quantity: pToDec(line.quantity),
              unitPrice: Number(line.unitValue),
              scopeObservation: line.description,
            });
          }
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Marca Orçamento como ACCEPTED
      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.ACCEPTED },
      });

      // 2. Instancia Ordem de Serviço
      const serviceOrder = await tx.serviceOrder.create({
        data: {
          orderNumber: osNumber,
          quoteId: quote.id,
          clientId: quote.clientId,
          equipmentId: linkedEquipmentId,
          assignedCollaboratorId: responsibleId,
          scope: quote.scope,
          hourlyRateSnapshot: hourlyRate,
          kmRateSnapshot: kmRate,
          status: 'AWAITING_MATERIALS',
          createdById: userId,
          items: {
            create: itemsToCreate,
          },
          itemServices: {
            create: servicesToCreate,
          },
        },
        include: {
          client: true,
          items: true,
          itemServices: true,
        },
      });

      return {
        quote: updatedQuote,
        serviceOrder,
      };
    });
  }
}

function pToDec(val: any): number {
  return Number(val) || 1;
}
