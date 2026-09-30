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
  MovementType,
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
      ...(dto.equipmentId && {
        equipment: { connect: { id: dto.equipmentId } },
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
        equipment: true,
        assignedCollaborator: {
          select: {
            id: true,
            name: true,
            jobTitle: true,
            hourlyRate: true,
            kmRate: true,
            email: true,
            phone: true,
            basePointAddress: true,
          },
        },
        signature: true,
        expenses: {
          include: {
            category: true,
            user: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
        },
        itemServices: {
          include: {
            service: true,
          },
        },
        items: {
          include: {
            product: { select: { id: true, code: true, name: true, unit: true, unitCost: true, salePrice: true } },
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

    if (dto.equipmentId !== undefined) {
      if (dto.equipmentId) {
        updateData.equipment = { connect: { id: dto.equipmentId } };
      } else {
        updateData.equipment = { disconnect: true };
      }
    }

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

  /**
   * Visão do Cliente (OS Digital): exibe apenas escopo acordado, produtos e serviços pelo preço de venda,
   * anexos marcados como públicos e a assinatura digital coletada.
   */
  async getClientView(id: string) {
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
        equipment: {
          select: {
            id: true,
            name: true,
            identifier: true,
            model: true,
            serialNumber: true,
          },
        },
        itemServices: {
          include: {
            service: {
              select: { title: true, externalCode: true },
            },
          },
        },
        items: {
          include: {
            product: {
              select: { name: true, code: true, unit: true },
            },
          },
        },
        quote: {
          include: {
            quoteAttachments: {
              where: { showToClient: true },
              select: { id: true, fileName: true, fileUrl: true, createdAt: true },
            },
          },
        },
        signature: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    const services = order.itemServices.map((is) => ({
      title: is.service.title,
      code: is.service.externalCode,
      quantity: Number(is.quantity),
      unitPrice: Number(is.unitPrice),
      totalPrice: Number(is.quantity) * Number(is.unitPrice),
      scopeObservation: is.scopeObservation,
      completed: is.completed,
    }));

    const products = order.items.map((it) => ({
      name: it.product.name,
      code: it.product.code,
      unit: it.product.unit,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
    }));

    const totalBilled =
      services.reduce((acc, s) => acc + s.totalPrice, 0) +
      products.reduce((acc, p) => acc + p.totalPrice, 0);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      client: order.client,
      equipment: order.equipment,
      deadline: order.deadline,
      completedAt: order.completedAt,
      scope: order.scope,
      services,
      products,
      totalAmount: totalBilled,
      attachments: order.quote?.quoteAttachments || [],
      signature: order.signature,
      isSigned: !!order.signature,
    };
  }

  /**
   * Coleta de Assinatura Digital do Cliente
   */
  async collectClientSignature(
    id: string,
    dto: {
      signerName: string;
      signerDocument: string;
      signatureImageUrl: string;
      ipAddress?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    return this.prisma.workOrderSignature.upsert({
      where: { serviceOrderId: id },
      update: {
        signerName: dto.signerName,
        signerDocument: dto.signerDocument,
        signatureImageUrl: dto.signatureImageUrl,
        signedAt: new Date(),
        ipAddress: dto.ipAddress || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
      },
      create: {
        serviceOrderId: id,
        signerName: dto.signerName,
        signerDocument: dto.signerDocument,
        signatureImageUrl: dto.signatureImageUrl,
        signedAt: new Date(),
        ipAddress: dto.ipAddress || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
      },
    });
  }

  /**
   * Visão Interna (Gestão Operacional, Custos Reais e Margem Bruta)
   */
  async getInternalView(id: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        client: true,
        quote: {
          include: {
            quoteLines: true,
          },
        },
        expenses: {
          include: {
            category: true,
            user: { select: { id: true, name: true } },
          },
        },
        assignedCollaborator: {
          select: {
            id: true,
            name: true,
            jobTitle: true,
            hourlyRate: true,
            kmRate: true,
            basePointAddress: true,
          },
        },
        equipment: true,
        items: {
          include: {
            product: true,
          },
        },
        itemServices: {
          include: {
            service: true,
          },
        },
        executionLogs: {
          orderBy: { recordedAt: 'asc' },
          include: { user: { select: { id: true, name: true } } },
        },
        signature: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    // Apuração de Receita Bruta Faturada
    const servicesRevenue = order.itemServices.reduce(
      (acc, s) => acc + Number(s.quantity) * Number(s.unitPrice),
      0,
    );
    const productsRevenue = order.items.reduce(
      (acc, it) => acc + Number(it.totalPrice),
      0,
    );
    let grossRevenue = servicesRevenue + productsRevenue;

    // Se a OS nasceu de um orçamento com linhas faturadas e os itens diretos ainda não foram copiados
    if (grossRevenue === 0 && order.quote?.quoteLines?.length) {
      grossRevenue = order.quote.quoteLines.reduce(
        (acc, l) => acc + Number(l.totalValue || 0),
        0,
      );
    }

    // Custos Reais de Mão de Obra (Horas x Taxa/Hora)
    const hourlyRate = Number(order.hourlyRateSnapshot) || Number(order.assignedCollaborator?.hourlyRate) || 0;
    const workedHours = Number(order.totalWorkedHours) || 0;
    const laborCost = workedHours * hourlyRate;

    // Custos Reais de Deslocamento e Frota (KM x Taxa/KM)
    const kmRate = Number(order.kmRateSnapshot) || Number(order.assignedCollaborator?.kmRate) || 0;
    const kmTraveled = Number(order.totalKmTraveled) || 0;
    const displacementCost = kmTraveled * kmRate;

    // Custo Real de Insumos/Materiais (com base no custo de reposição/CMV do estoque)
    const materialCost = order.items.reduce(
      (acc, it) => acc + it.quantity * (Number(it.product.unitCost) || 0),
      0,
    );

    // Despesas Operacionais de Campo (Alimentação, Pedágio, Hospedagem, etc.)
    const fieldExpensesCost = (order.expenses || []).reduce(
      (acc, exp) => acc + Number(exp.amount || 0),
      0,
    );

    const totalOperationalCost = laborCost + displacementCost + materialCost + fieldExpensesCost;
    const grossProfit = grossRevenue - totalOperationalCost;
    const profitMarginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      collaborator: order.assignedCollaborator,
      laborTracking: {
        checkinTime: order.checkinTime,
        checkoutTime: order.checkoutTime,
        totalWorkedHours: workedHours,
        hourlyRateSnapshot: hourlyRate,
        laborCostReal: Number(laborCost.toFixed(2)),
      },
      displacementTracking: {
        totalKm: kmTraveled,
        kmRateSnapshot: kmRate,
        displacementCostReal: Number(displacementCost.toFixed(2)),
      },
      fieldExpensesTracking: {
        totalExpenses: Number(fieldExpensesCost.toFixed(2)),
        items: order.expenses || [],
      },
      materialProfitability: {
        billedMaterialsRevenue: Number(productsRevenue.toFixed(2)),
        realMaterialCost: Number(materialCost.toFixed(2)),
        grossMarginMaterials: Number((productsRevenue - materialCost).toFixed(2)),
      },
      financialSummary: {
        grossRevenue: Number(grossRevenue.toFixed(2)),
        totalOperationalCost: Number(totalOperationalCost.toFixed(2)),
        netOperatingProfit: Number(grossProfit.toFixed(2)),
        profitMarginPercentage: Number(profitMarginPercent.toFixed(2)),
      },
      executionLogs: order.executionLogs,
      signature: order.signature,
    };
  }

  /**
   * Registro de Início de Deslocamento
   */
  async startDisplacement(
    id: string,
    userId: string,
    data: { latitude?: number; longitude?: number; odometerKm?: number; notes?: string },
  ) {
    const order = await this.findOne(id);

    await this.prisma.workOrderExecutionLog.create({
      data: {
        serviceOrderId: id,
        userId,
        actionType: 'START_DISPLACEMENT',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        odometerKm: data.odometerKm !== undefined ? data.odometerKm : null,
        notes: data.notes || 'Início de deslocamento registrado',
      },
    });

    return { message: 'Deslocamento iniciado com sucesso' };
  }

  /**
   * Registro de Check-in operacional
   */
  async checkin(
    id: string,
    userId: string,
    data: { latitude?: number; longitude?: number; notes?: string },
  ) {
    const order = await this.findOne(id);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.serviceOrder.update({
        where: { id },
        data: {
          checkinTime: now,
          status: ServiceOrderStatus.IN_PROGRESS,
        },
      }),
      this.prisma.workOrderExecutionLog.create({
        data: {
          serviceOrderId: id,
          userId,
          actionType: 'CHECKIN',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          notes: data.notes || 'Check-in realizado no local do cliente',
        },
      }),
    ]);

    return { message: 'Check-in registrado com sucesso' };
  }

  /**
   * Registro de Check-out e Baixa Automática de Estoque
   */
  async addExpenseToOrder(
    serviceOrderId: string,
    userId: string,
    data: { description: string; amount: number; categoryName?: string },
  ) {
    const order = await this.findOne(serviceOrderId);
    let category = await this.prisma.expenseCategory.findFirst({
      where: { name: { contains: data.categoryName || 'Operacional' } },
    });
    if (!category) {
      category = await this.prisma.expenseCategory.findFirst();
    }

    const year = new Date().getFullYear();
    const count = await this.prisma.expense.count();
    const code = `DESP-${year}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.expense.create({
      data: {
        code,
        description: data.description,
        type: 'SERVICE',
        amount: data.amount,
        date: new Date(),
        dueDate: new Date(),
        competenceDate: new Date(),
        categoryId: category ? category.id : 'default',
        serviceOrderId,
        clientId: order.clientId,
        userId,
      },
      include: {
        category: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async checkout(
    id: string,
    userId: string,
    data: {
      latitude?: number;
      longitude?: number;
      odometerKm?: number;
      notes?: string;
      totalKmTraveled?: number;
    },
  ) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        items: true,
        assignedCollaborator: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    const now = new Date();
    const checkin = order.checkinTime || now;
    const diffHours = Math.max(0.1, (now.getTime() - checkin.getTime()) / (1000 * 60 * 60));
    const totalKm = data.totalKmTraveled || 0;

    const hourlyRate = Number(order.assignedCollaborator?.hourlyRate) || 0;
    const kmRate = Number(order.assignedCollaborator?.kmRate) || 0;

    const laborCost = diffHours * hourlyRate;
    const displacementCost = totalKm * kmRate;

    // Realiza checkout e dedução de estoque numa transação atômica
    await this.prisma.$transaction(async (tx) => {
      // 1. Atualiza OS
      await tx.serviceOrder.update({
        where: { id },
        data: {
          checkoutTime: now,
          status: ServiceOrderStatus.COMPLETED,
          completedAt: now,
          progress: 100,
          totalWorkedHours: diffHours,
          hourlyRateSnapshot: hourlyRate,
          laborCostReal: laborCost,
          totalKmTraveled: totalKm,
          kmRateSnapshot: kmRate,
          displacementCostReal: displacementCost,
        },
      });

      // 2. Registra Log
      await tx.workOrderExecutionLog.create({
        data: {
          serviceOrderId: id,
          userId,
          actionType: 'CHECKOUT',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          odometerKm: data.odometerKm !== undefined ? data.odometerKm : null,
          notes: data.notes || 'Check-out e conclusão do atendimento',
        },
      });

      // 3. Dedução de Estoque de Materiais/Peças
      for (const item of order.items) {
        // Tenta deduzir do estoque do colaborador responsável
        if (order.assignedCollaboratorId) {
          const collabStock = await tx.productCollaboratorStock.findUnique({
            where: {
              productId_userId: {
                productId: item.productId,
                userId: order.assignedCollaboratorId,
              },
            },
          });

          if (collabStock && collabStock.quantity >= item.quantity) {
            await tx.productCollaboratorStock.update({
              where: {
                productId_userId: {
                  productId: item.productId,
                  userId: order.assignedCollaboratorId,
                },
              },
              data: {
                quantity: collabStock.quantity - item.quantity,
              },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: MovementType.EXIT,
                quantity: item.quantity,
                reason: `Baixa automática OS ${order.orderNumber} (estoque de rota)`,
                createdById: userId,
              },
            });
            continue;
          }
        }

        // Se não deduziu do colaborador, deduz do almoxarifado central
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: MovementType.EXIT,
            quantity: item.quantity,
            reason: `Baixa automática OS ${order.orderNumber} (almoxarifado central)`,
            createdById: userId,
          },
        });
      }
    });

    return { message: 'Check-out realizado e estoque baixado com sucesso' };
  }

  async setEquipment(id: string, equipmentId: string | null) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }
    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        equipment: equipmentId ? { connect: { id: equipmentId } } : { disconnect: true },
      },
      include: {
        equipment: true,
      },
    });
  }

  async updateKm(id: string, km: number, kmRate?: number) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: { assignedCollaborator: true },
    });
    if (!order) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }
    const effectiveKmRate = kmRate !== undefined ? kmRate : (Number(order.kmRateSnapshot) || Number(order.assignedCollaborator?.kmRate) || 0);
    const displacementCostReal = Number((km * effectiveKmRate).toFixed(2));
    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        totalKmTraveled: km,
        ...(kmRate !== undefined && { kmRateSnapshot: kmRate }),
        displacementCostReal,
      },
    });
  }

  async updateWorkedHours(id: string, hours: number, hourlyRate?: number) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: { assignedCollaborator: true },
    });
    if (!order) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }
    const effectiveHourlyRate = hourlyRate !== undefined ? hourlyRate : (Number(order.hourlyRateSnapshot) || Number(order.assignedCollaborator?.hourlyRate) || 0);
    const laborCostReal = Number((hours * effectiveHourlyRate).toFixed(2));
    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        totalWorkedHours: hours,
        ...(hourlyRate !== undefined && { hourlyRateSnapshot: hourlyRate }),
        laborCostReal,
      },
    });
  }

  // --- MULTI-CRUD: DESPESAS DE CAMPO ---
  async updateExpense(serviceOrderId: string, expenseId: string, data: { description?: string; amount?: number; categoryName?: string }) {
    let categoryId: string | undefined;
    if (data.categoryName) {
      const cat = await this.prisma.expenseCategory.findFirst({
        where: { name: { contains: data.categoryName } },
      });
      if (cat) categoryId = cat.id;
    }
    return this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(data.description && { description: data.description }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(categoryId && { categoryId }),
      },
      include: { category: true, user: { select: { id: true, name: true } } },
    });
  }

  async deleteExpense(serviceOrderId: string, expenseId: string) {
    return this.prisma.expense.delete({
      where: { id: expenseId },
    });
  }

  // --- MULTI-CRUD: PEÇAS & MATERIAIS (CMV) ---
  async addItemToOrder(serviceOrderId: string, data: { productId: string; quantity: number; unitPrice: number }) {
    const existing = await this.prisma.serviceOrderProduct.findFirst({
      where: { serviceOrderId, productId: data.productId },
    });
    if (existing) {
      const newQty = existing.quantity + data.quantity;
      return this.prisma.serviceOrderProduct.update({
        where: { id: existing.id },
        data: {
          quantity: newQty,
          unitPrice: data.unitPrice,
          totalPrice: newQty * data.unitPrice,
        },
        include: { product: true },
      });
    }
    return this.prisma.serviceOrderProduct.create({
      data: {
        serviceOrderId,
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.quantity * data.unitPrice,
      },
      include: { product: true },
    });
  }

  async updateOrderItem(serviceOrderId: string, itemId: string, data: { quantity?: number; unitPrice?: number }) {
    const item = await this.prisma.serviceOrderProduct.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item não encontrado');
    const quantity = data.quantity !== undefined ? data.quantity : item.quantity;
    const unitPrice = data.unitPrice !== undefined ? data.unitPrice : Number(item.unitPrice);
    return this.prisma.serviceOrderProduct.update({
      where: { id: itemId },
      data: {
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
      },
      include: { product: true },
    });
  }

  async deleteOrderItem(serviceOrderId: string, itemId: string) {
    return this.prisma.serviceOrderProduct.delete({
      where: { id: itemId },
    });
  }

  // --- MULTI-CRUD: SERVIÇOS TÉCNICOS ---
  async addServiceToOrder(serviceOrderId: string, data: { serviceId: string; quantity: number; unitPrice: number; scopeObservation?: string }) {
    return this.prisma.workOrderItemService.create({
      data: {
        serviceOrderId,
        serviceId: data.serviceId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        scopeObservation: data.scopeObservation || null,
      },
      include: { service: true },
    });
  }

  async updateOrderService(serviceOrderId: string, serviceItemId: string, data: { quantity?: number; unitPrice?: number; scopeObservation?: string }) {
    return this.prisma.workOrderItemService.update({
      where: { id: serviceItemId },
      data: {
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
        ...(data.scopeObservation !== undefined && { scopeObservation: data.scopeObservation }),
      },
      include: { service: true },
    });
  }

  async deleteOrderService(serviceOrderId: string, serviceItemId: string) {
    return this.prisma.workOrderItemService.delete({
      where: { id: serviceItemId },
    });
  }

  // --- MULTI-CRUD: MÃO DE OBRA & DESLOCAMENTO (EXECUTION LOGS) ---
  async addLaborLog(serviceOrderId: string, currentUserId: string, dto: { userId: string; hours: number; hourlyRate: number; description: string }) {
    const log = await this.prisma.workOrderExecutionLog.create({
      data: {
        serviceOrderId,
        userId: dto.userId || currentUserId,
        actionType: 'LABOR_LOG',
        notes: JSON.stringify({
          hours: dto.hours,
          hourlyRate: dto.hourlyRate,
          description: dto.description,
          laborCost: Number((dto.hours * dto.hourlyRate).toFixed(2)),
        }),
      },
      include: { user: { select: { id: true, name: true } } },
    });
    const allLabor = await this.prisma.workOrderExecutionLog.findMany({
      where: { serviceOrderId, actionType: 'LABOR_LOG' },
    });
    let totalH = 0;
    let totalCost = 0;
    for (const l of allLabor) {
      try {
        const parsed = JSON.parse(l.notes || '{}');
        totalH += Number(parsed.hours || 0);
        totalCost += Number(parsed.laborCost || (parsed.hours * parsed.hourlyRate) || 0);
      } catch {}
    }
    if (totalH > 0) {
      await this.prisma.serviceOrder.update({
        where: { id: serviceOrderId },
        data: {
          totalWorkedHours: totalH,
          laborCostReal: Number(totalCost.toFixed(2)),
        },
      });
    }
    return log;
  }

  async addDisplacementLog(serviceOrderId: string, currentUserId: string, dto: { route: string; km: number; kmRate: number; notes?: string }) {
    const log = await this.prisma.workOrderExecutionLog.create({
      data: {
        serviceOrderId,
        userId: currentUserId,
        actionType: 'DISPLACEMENT_LOG',
        odometerKm: dto.km,
        notes: JSON.stringify({
          route: dto.route,
          kmRate: dto.kmRate,
          notes: dto.notes,
          displacementCost: Number((dto.km * dto.kmRate).toFixed(2)),
        }),
      },
      include: { user: { select: { id: true, name: true } } },
    });
    const allDisp = await this.prisma.workOrderExecutionLog.findMany({
      where: { serviceOrderId, actionType: 'DISPLACEMENT_LOG' },
    });
    let totalKm = 0;
    let totalCost = 0;
    for (const d of allDisp) {
      try {
        const parsed = JSON.parse(d.notes || '{}');
        totalKm += Number(d.odometerKm || parsed.km || 0);
        totalCost += Number(parsed.displacementCost || 0);
      } catch {}
    }
    if (totalKm > 0) {
      await this.prisma.serviceOrder.update({
        where: { id: serviceOrderId },
        data: {
          totalKmTraveled: totalKm,
          displacementCostReal: Number(totalCost.toFixed(2)),
        },
      });
    }
    return log;
  }

  async deleteExecutionLog(serviceOrderId: string, logId: string) {
    const log = await this.prisma.workOrderExecutionLog.findUnique({ where: { id: logId } });
    if (!log) return { success: false };
    await this.prisma.workOrderExecutionLog.delete({ where: { id: logId } });
    if (log.actionType === 'LABOR_LOG') {
      const allLabor = await this.prisma.workOrderExecutionLog.findMany({
        where: { serviceOrderId, actionType: 'LABOR_LOG' },
      });
      let totalH = 0;
      let totalCost = 0;
      for (const l of allLabor) {
        try {
          const parsed = JSON.parse(l.notes || '{}');
          totalH += Number(parsed.hours || 0);
          totalCost += Number(parsed.laborCost || 0);
        } catch {}
      }
      await this.prisma.serviceOrder.update({
        where: { id: serviceOrderId },
        data: { totalWorkedHours: totalH, laborCostReal: Number(totalCost.toFixed(2)) },
      });
    } else if (log.actionType === 'DISPLACEMENT_LOG') {
      const allDisp = await this.prisma.workOrderExecutionLog.findMany({
        where: { serviceOrderId, actionType: 'DISPLACEMENT_LOG' },
      });
      let totalKm = 0;
      let totalCost = 0;
      for (const d of allDisp) {
        try {
          const parsed = JSON.parse(d.notes || '{}');
          totalKm += Number(d.odometerKm || parsed.km || 0);
          totalCost += Number(parsed.displacementCost || 0);
        } catch {}
      }
      await this.prisma.serviceOrder.update({
        where: { id: serviceOrderId },
        data: { totalKmTraveled: totalKm, displacementCostReal: Number(totalCost.toFixed(2)) },
      });
    }
    return { success: true };
  }
  async updateExecutionLog(
    serviceOrderId: string,
    logId: string,
    dto: {
      userId?: string;
      hours?: number;
      hourlyRate?: number;
      description?: string;
      route?: string;
      km?: number;
      kmRate?: number;
      notes?: string;
    },
  ) {
    const log = await this.prisma.workOrderExecutionLog.findUnique({ where: { id: logId } });
    if (!log || log.serviceOrderId !== serviceOrderId) {
      throw new NotFoundException('Registro de execução não encontrado nesta OS');
    }

    let existingNotes: any = {};
    try {
      existingNotes = JSON.parse(log.notes || '{}');
    } catch {}

    const updatedData: Prisma.WorkOrderExecutionLogUpdateInput = {};

    if (log.actionType === 'LABOR_LOG') {
      const hours = dto.hours !== undefined ? Number(dto.hours) : Number(existingNotes.hours || 0);
      const hourlyRate = dto.hourlyRate !== undefined ? Number(dto.hourlyRate) : Number(existingNotes.hourlyRate || 85);
      const description = dto.description !== undefined ? dto.description : (existingNotes.description || '');
      const laborCost = Number((hours * hourlyRate).toFixed(2));

      if (dto.userId) {
        updatedData.user = { connect: { id: dto.userId } };
      }
      updatedData.notes = JSON.stringify({
        hours,
        hourlyRate,
        description,
        laborCost,
      });
    } else if (log.actionType === 'DISPLACEMENT_LOG') {
      const km = dto.km !== undefined ? Number(dto.km) : Number(log.odometerKm || existingNotes.km || 0);
      const kmRate = dto.kmRate !== undefined ? Number(dto.kmRate) : Number(existingNotes.kmRate || 1.85);
      const route = dto.route !== undefined ? dto.route : (existingNotes.route || '');
      const notes = dto.notes !== undefined ? dto.notes : (existingNotes.notes || '');
      const displacementCost = Number((km * kmRate).toFixed(2));

      updatedData.odometerKm = km;
      updatedData.notes = JSON.stringify({
        route,
        kmRate,
        notes,
        displacementCost,
      });
    }

    const updatedLog = await this.prisma.workOrderExecutionLog.update({
      where: { id: logId },
      data: updatedData,
      include: { user: { select: { id: true, name: true } } },
    });

    if (log.actionType === 'LABOR_LOG') {
      const allLabor = await this.prisma.workOrderExecutionLog.findMany({
        where: { serviceOrderId, actionType: 'LABOR_LOG' },
      });
      let totalH = 0;
      let totalCost = 0;
      for (const l of allLabor) {
        try {
          const parsed = JSON.parse(l.notes || '{}');
          totalH += Number(parsed.hours || 0);
          totalCost += Number(parsed.laborCost || (parsed.hours * parsed.hourlyRate) || 0);
        } catch {}
      }
      await this.prisma.serviceOrder.update({
        where: { id: serviceOrderId },
        data: {
          totalWorkedHours: totalH,
          laborCostReal: Number(totalCost.toFixed(2)),
        },
      });
    } else if (log.actionType === 'DISPLACEMENT_LOG') {
      const allDisp = await this.prisma.workOrderExecutionLog.findMany({
        where: { serviceOrderId, actionType: 'DISPLACEMENT_LOG' },
      });
      let totalKm = 0;
      let totalCost = 0;
      for (const d of allDisp) {
        try {
          const parsed = JSON.parse(d.notes || '{}');
          totalKm += Number(d.odometerKm || parsed.km || 0);
          totalCost += Number(parsed.displacementCost || 0);
        } catch {}
      }
      await this.prisma.serviceOrder.update({
        where: { id: serviceOrderId },
        data: {
          totalKmTraveled: totalKm,
          displacementCostReal: Number(totalCost.toFixed(2)),
        },
      });
    }

    return updatedLog;
  }

  async resetLaborLogs(serviceOrderId: string) {
    await this.prisma.workOrderExecutionLog.deleteMany({
      where: { serviceOrderId, actionType: 'LABOR_LOG' },
    });
    await this.prisma.serviceOrder.update({
      where: { id: serviceOrderId },
      data: {
        totalWorkedHours: 0,
        laborCostReal: 0,
      },
    });
    return { success: true, message: 'Mão de obra zerada com sucesso' };
  }

  async resetDisplacementLogs(serviceOrderId: string) {
    await this.prisma.workOrderExecutionLog.deleteMany({
      where: { serviceOrderId, actionType: 'DISPLACEMENT_LOG' },
    });
    await this.prisma.serviceOrder.update({
      where: { id: serviceOrderId },
      data: {
        totalKmTraveled: 0,
        displacementCostReal: 0,
      },
    });
    return { success: true, message: 'Deslocamento zerado com sucesso' };
  }
}
