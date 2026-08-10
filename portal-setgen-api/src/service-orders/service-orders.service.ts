import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { MaterialRequestsService } from '../material-requests/material-requests.service';
import { snapshotChecklistFields } from '../common/checklist/snapshot-checklist-fields.util';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import {
  Prisma,
  UserRole,
  ServiceOrderStatus,
  QuoteStatus,
  AuditAction,
  MaterialRequestStatus,
  PaymentStatus,
} from '@prisma/client';

// Máquina de estados da OS de execução — nasce sempre a partir de um Quote
// ACCEPTED (ver createFromQuote). O ciclo comercial já ficou pra trás.
const VALID_STATUS_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  [ServiceOrderStatus.AWAITING_MATERIALS]: [
    ServiceOrderStatus.IN_PROGRESS,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.IN_PROGRESS]: [
    ServiceOrderStatus.AWAITING_MATERIALS,
    ServiceOrderStatus.COMPLETED,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.COMPLETED]: [],
  [ServiceOrderStatus.CANCELLED]: [],
};

@Injectable()
export class ServiceOrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private materialRequestsService: MaterialRequestsService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const sequenceName = `seq_service_order_${year}`;

    try {
      const result = await this.prisma.$queryRawUnsafe<[{ nextval: bigint }]>(
        `SELECT nextval('${sequenceName}'::regclass)`,
      );
      return `OS-${year}-${String(result[0].nextval).padStart(5, '0')}`;
    } catch {
      await this.prisma.$executeRawUnsafe(
        `CREATE SEQUENCE IF NOT EXISTS ${sequenceName} START 1 INCREMENT 1`,
      );
      const result = await this.prisma.$queryRawUnsafe<[{ nextval: bigint }]>(
        `SELECT nextval('${sequenceName}'::regclass)`,
      );
      return `OS-${year}-${String(result[0].nextval).padStart(5, '0')}`;
    }
  }

  /**
   * Sem isso, um productId inexistente vira erro de FK do Prisma (500) em vez
   * de um 400 dizendo qual produto não existe.
   */
  private async assertProductsExist(items: { productId: string }[]) {
    if (items.length === 0) return;

    const ids = [...new Set(items.map((item) => item.productId))];
    const found = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((p) => p.id));
      const missing = ids.filter((productId) => !foundIds.has(productId));
      throw new BadRequestException(
        `Produto(s) não encontrado(s): ${missing.join(', ')}`,
      );
    }
  }

  // Materializa a OS de execução a partir de um orçamento aceito. Chamado
  // manualmente (POST /service-orders) ou automaticamente pela confirmação
  // de OC/OP (ver PurchaseOrdersService.create).
  async createFromQuote(dto: CreateServiceOrderDto, createdById: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: dto.quoteId },
      include: { serviceOrder: true },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new BadRequestException(
        'Só é possível gerar Ordem de Serviço a partir de um orçamento aceito (ACCEPTED)',
      );
    }

    if (quote.serviceOrder) {
      throw new BadRequestException('Este orçamento já possui uma Ordem de Serviço');
    }

    if (dto.items) {
      await this.assertProductsExist(dto.items);
    }

    const orderNumber = await this.generateOrderNumber();

    let checklistData: Prisma.InputJsonValue[] =
      (dto.checklist as Prisma.InputJsonValue[]) || [];

    if (dto.checklistTemplateId) {
      const template = await this.prisma.checklistTemplate.findUnique({
        where: { id: dto.checklistTemplateId },
      });
      if (!template) {
        throw new NotFoundException('Template de checklist não encontrado');
      }
      checklistData = snapshotChecklistFields(template.fields);
    }

    const data: Prisma.ServiceOrderCreateInput = {
      orderNumber,
      quote: { connect: { id: dto.quoteId } },
      client: { connect: { id: quote.clientId } },
      scope: quote.scope,
      requiredResources: dto.requiredResources || {},
      ...(dto.deadline && { deadline: new Date(dto.deadline) }),
      responsibleIds: dto.responsibleIds || [],
      checklist: checklistData,
      ...(dto.checklistTemplateId && {
        checklistTemplate: { connect: { id: dto.checklistTemplateId } },
      }),
      createdBy: { connect: { id: createdById } },
      ...(dto.items && {
        items: {
          create: dto.items.map((item) => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      }),
    };

    const serviceOrder = await this.prisma.serviceOrder.create({
      data,
      include: {
        client: { select: { id: true, companyName: true, tradeName: true, cnpjCpf: true } },
        quote: { select: { id: true, quoteNumber: true, scope: true } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        items: { include: { product: true } },
      },
    });

    // Gera automaticamente a solicitação de separação de material (mesa do
    // almoxarife) a partir dos itens previstos, se houver.
    await this.materialRequestsService.createFromServiceOrder(serviceOrder.id);

    return serviceOrder;
  }

  async findAll(filters?: { clientId?: string; status?: ServiceOrderStatus; createdById?: string }) {
    const where: Prisma.ServiceOrderWhereInput = {
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.createdById && { createdById: filters.createdById }),
    };

    return this.prisma.serviceOrder.findMany({
      where,
      include: {
        client: { select: { id: true, companyName: true, tradeName: true } },
        createdBy: { select: { id: true, name: true } },
        quote: { select: { id: true, quoteNumber: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
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
        quote: {
          include: {
            technicalVisit: {
              select: { id: true, visitDate: true, visitType: true },
            },
            salesRep: { select: { id: true, name: true } },
            quoteLines: { orderBy: { createdAt: 'asc' } },
            purchaseOrders: true,
            approvals: { orderBy: { approvedAt: 'desc' } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        linkedVisits: {
          include: {
            technicalVisit: {
              select: { id: true, visitDate: true, visitType: true, status: true },
            },
          },
        },
        notasFiscais: true,
        delivery: true,
        art: true,
        checklistTemplate: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    return order;
  }

  async update(id: string, dto: UpdateServiceOrderDto, userId: string, userRole: UserRole) {
    const order = await this.findOne(id);

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      order.createdById !== userId
    ) {
      throw new ForbiddenException('Você não tem permissão para editar esta OS');
    }

    // Mesma ideia do congelamento do orçamento no aceite: OS concluída tem
    // entrega, aceite do cliente e garantia emitida em cima do que está aqui.
    // Cancelada é encerramento. Editar depois faz o registro divergir do fato.
    if (order.status === ServiceOrderStatus.COMPLETED) {
      throw new BadRequestException(
        'OS concluída não pode ser editada — a entrega e a garantia já foram emitidas sobre estes dados',
      );
    }

    if (order.status === ServiceOrderStatus.CANCELLED) {
      throw new BadRequestException('OS cancelada não pode ser editada');
    }

    const updateData: Prisma.ServiceOrderUpdateInput = {
      ...(dto.requiredResources && { requiredResources: dto.requiredResources }),
      ...(dto.deadline && { deadline: new Date(dto.deadline) }),
      ...(dto.responsibleIds && { responsibleIds: dto.responsibleIds }),
      ...(dto.checklist && { checklist: dto.checklist }),
    };

    if (dto.items) {
      const itemsToCreate = dto.items;
      await this.assertProductsExist(itemsToCreate);

      // Depois que o almoxarifado reservou estoque ou abriu pedido de compra,
      // a lista de materiais deixa de ser um plano e vira execução: trocá-la
      // aqui deixaria a solicitação do almoxarife divergindo da OS em silêncio.
      const materialRequests = await this.prisma.materialRequest.findMany({
        where: { serviceOrderId: id },
        include: {
          items: { select: { quantityReserved: true } },
          procurementOrders: { select: { id: true } },
        },
      });

      const locked = materialRequests.find(
        (mr) =>
          mr.procurementOrders.length > 0 ||
          mr.items.some((item) => item.quantityReserved > 0),
      );
      if (locked) {
        throw new BadRequestException(
          'Não é possível alterar os materiais: o almoxarifado já reservou estoque ou abriu pedido de compra para esta OS.',
        );
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.serviceOrderProduct.deleteMany({ where: { serviceOrderId: id } });

        // A solicitação do almoxarifado acompanha a lista de materiais da OS:
        // é recriada do zero a cada troca (e some junto, se a lista ficar vazia).
        const previous = materialRequests[0];
        const requestIds = materialRequests.map((mr) => mr.id);
        if (requestIds.length > 0) {
          await tx.materialRequestItem.deleteMany({
            where: { materialRequestId: { in: requestIds } },
          });
          await tx.materialRequest.deleteMany({ where: { id: { in: requestIds } } });
        }

        if (itemsToCreate.length > 0) {
          await tx.materialRequest.create({
            data: {
              serviceOrder: { connect: { id } },
              priority: previous?.priority ?? 0,
              expectedExecutionDate: previous?.expectedExecutionDate ?? null,
              items: {
                create: itemsToCreate.map((item) => ({
                  product: { connect: { id: item.productId } },
                  quantityNeeded: item.quantity,
                })),
              },
            },
          });
        }

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
            client: { select: { id: true, companyName: true, tradeName: true } },
            createdBy: { select: { id: true, name: true } },
          },
        });
      });
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, companyName: true, tradeName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateStatusDto, userId: string, userRole: UserRole) {
    const order = await this.findOne(id);

    const allowedNextStatuses = VALID_STATUS_TRANSITIONS[order.status];
    if (!allowedNextStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Transição de status inválida: ${order.status} -> ${dto.status}`,
      );
    }

    // Sair de AWAITING_MATERIALS só é permitido quando a mesa do almoxarife
    // já separou (ou liberou) os materiais vinculados a esta OS.
    if (
      order.status === ServiceOrderStatus.AWAITING_MATERIALS &&
      dto.status === ServiceOrderStatus.IN_PROGRESS
    ) {
      const materialRequest = await this.prisma.materialRequest.findFirst({
        where: { serviceOrderId: id },
      });

      if (materialRequest) {
        const isReady =
          materialRequest.status === MaterialRequestStatus.SEPARATED ||
          materialRequest.status === MaterialRequestStatus.RELEASED;

        if (!isReady) {
          throw new BadRequestException(
            'Materiais desta OS ainda não foram separados pelo almoxarifado',
          );
        }
      } else if (order.items.length > 0) {
        // OS tem materiais previstos mas nenhuma solicitação no almoxarifado:
        // estado inconsistente. Sem esta checagem, a OS entrava em execução
        // pulando a separação inteira só porque a solicitação sumiu.
        throw new BadRequestException(
          'Esta OS tem materiais previstos mas nenhuma solicitação no almoxarifado. Reabra a edição de materiais para regerá-la.',
        );
      }
      // Sem materiais previstos não há o que separar — segue direto.
    }

    const updated = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === ServiceOrderStatus.COMPLETED && { completedAt: new Date() }),
      },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await this.auditService.record(userId, AuditAction.UPDATE, 'ServiceOrder', id, {
      from: order.status,
      to: dto.status,
      comments: dto.comments,
    });

    return updated;
  }

  async updateProgress(
    id: string,
    progress: number,
    userId: string,
    userRole: UserRole,
  ) {
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      throw new BadRequestException('Progresso deve ser um inteiro entre 0 e 100');
    }

    const order = await this.findOne(id);

    // Técnico só reporta progresso da OS em que ele está escalado — senão
    // qualquer técnico podia concluir a OS de qualquer equipe.
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MANAGER &&
      !order.responsibleIds.includes(userId)
    ) {
      throw new ForbiddenException(
        'Você não faz parte da equipe responsável por esta OS',
      );
    }

    if (
      order.status === ServiceOrderStatus.COMPLETED ||
      order.status === ServiceOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Não é possível alterar o progresso de uma OS ${order.status === ServiceOrderStatus.COMPLETED ? 'concluída' : 'cancelada'}`,
      );
    }

    // Progresso 100% só conclui a OS a partir de IN_PROGRESS — a conclusão é
    // uma transição de status e tem que respeitar a mesma máquina de estados
    // de updateStatus. Em AWAITING_MATERIALS o progresso é gravado sem
    // concluir: os materiais ainda não foram separados.
    const completes =
      progress === 100 &&
      VALID_STATUS_TRANSITIONS[order.status].includes(ServiceOrderStatus.COMPLETED);

    const updated = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        progress,
        ...(completes && {
          status: ServiceOrderStatus.COMPLETED,
          completedAt: new Date(),
        }),
      },
    });

    if (completes) {
      await this.auditService.record(userId, AuditAction.UPDATE, 'ServiceOrder', id, {
        from: order.status,
        to: ServiceOrderStatus.COMPLETED,
        comments: 'Concluída automaticamente ao atingir 100% de progresso',
      });
    }

    return updated;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    await this.findOne(id);

    return this.prisma.serviceOrder.update({ where: { id }, data: { paymentStatus } });
  }

  async addAttachments(id: string, attachments: string[]) {
    const order = await this.findOne(id);

    return this.prisma.serviceOrder.update({
      where: { id },
      data: { attachments: [...(order.attachments ?? []), ...attachments] },
    });
  }

  async remove(id: string, userRole: UserRole) {
    const order = await this.findOne(id);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem deletar OS');
    }

    if (order.notasFiscais && order.notasFiscais.length > 0) {
      throw new BadRequestException(
        'Não é possível deletar esta OS pois existem Notas Fiscais vinculadas. Remova-as primeiro.',
      );
    }

    if (order.art) {
      throw new BadRequestException(
        'Não é possível deletar esta OS pois existe uma ART vinculada. Remova-a primeiro.',
      );
    }

    // A entrega é o aceite do cliente (com evidências, assinatura e garantia).
    // Apagar junto com a OS destruiria esse registro em silêncio.
    if (order.delivery) {
      throw new BadRequestException(
        'Não é possível deletar esta OS pois existe uma Entrega registrada. Remova-a primeiro.',
      );
    }

    const expenseCount = await this.prisma.expense.count({
      where: { serviceOrderId: id },
    });
    if (expenseCount > 0) {
      throw new BadRequestException(
        'Não é possível deletar esta OS pois existem Despesas apropriadas a ela. Remova-as primeiro.',
      );
    }

    // Solicitação de material só pode ir junto se nada foi reservado do
    // estoque nem virou pedido de compra — senão a exclusão sumiria com o
    // rastro de uma baixa de estoque que já aconteceu de verdade.
    const materialRequests = await this.prisma.materialRequest.findMany({
      where: { serviceOrderId: id },
      include: {
        items: { select: { quantityReserved: true } },
        procurementOrders: { select: { id: true } },
      },
    });

    const blocking = materialRequests.find(
      (mr) =>
        mr.procurementOrders.length > 0 ||
        mr.items.some((item) => item.quantityReserved > 0),
    );
    if (blocking) {
      throw new BadRequestException(
        'Não é possível deletar esta OS pois o almoxarifado já reservou material ou abriu pedido de compra para ela.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const requestIds = materialRequests.map((mr) => mr.id);
      if (requestIds.length > 0) {
        await tx.materialRequestItem.deleteMany({
          where: { materialRequestId: { in: requestIds } },
        });
        await tx.materialRequest.deleteMany({ where: { id: { in: requestIds } } });
      }
      await tx.serviceOrderProduct.deleteMany({ where: { serviceOrderId: id } });
      await tx.serviceOrderVisit.deleteMany({ where: { serviceOrderId: id } });
      return tx.serviceOrder.delete({ where: { id } });
    });
  }

  async linkVisit(serviceOrderId: string, technicalVisitId: string) {
    await this.findOne(serviceOrderId);

    const visit = await this.prisma.technicalVisit.findUnique({
      where: { id: technicalVisitId },
    });
    if (!visit) {
      throw new NotFoundException('Visita técnica não encontrada');
    }

    return this.prisma.serviceOrderVisit.upsert({
      where: { serviceOrderId_technicalVisitId: { serviceOrderId, technicalVisitId } },
      create: { serviceOrderId, technicalVisitId },
      update: {},
    });
  }

  async unlinkVisit(serviceOrderId: string, technicalVisitId: string) {
    await this.prisma.serviceOrderVisit
      .delete({
        where: { serviceOrderId_technicalVisitId: { serviceOrderId, technicalVisitId } },
      })
      .catch(() => {
        throw new NotFoundException('Vínculo de visita não encontrado');
      });
  }

  async getAuditLog(serviceOrderId: string) {
    await this.findOne(serviceOrderId);

    return this.prisma.auditLog.findMany({
      where: { entity: 'ServiceOrder', entityId: serviceOrderId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStatistics() {
    const total = await this.prisma.serviceOrder.count();
    const byStatus = await this.prisma.serviceOrder.groupBy({ by: ['status'], _count: true });

    return {
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    };
  }
}
