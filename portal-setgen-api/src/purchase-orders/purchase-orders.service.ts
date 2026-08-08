import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuotesService } from '../quotes/quotes.service';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import {
  Prisma,
  PurchaseOrderStatus,
  QuoteStatus,
  UserRole,
} from '@prisma/client';

// Status do orçamento a partir dos quais uma OC/OP do cliente pode ser
// registrada: já aprovado internamente, e possivelmente já enviado/aguardando
// resposta do cliente (é exatamente quando a OC/OP costuma chegar).
const OC_ELIGIBLE_QUOTE_STATUSES: QuoteStatus[] = [
  QuoteStatus.APPROVED,
  QuoteStatus.SENT_TO_CLIENT,
  QuoteStatus.AWAITING_RESPONSE,
];

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private quotesService: QuotesService,
    private serviceOrdersService: ServiceOrdersService,
  ) {}

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    fileUrl: string,
    uploadedById: string,
    uploadedByRole: UserRole,
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: createPurchaseOrderDto.quoteId },
      include: { purchaseOrders: true },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (!OC_ELIGIBLE_QUOTE_STATUSES.includes(quote.status)) {
      throw new BadRequestException(
        'Apenas orçamentos aprovados (ou já enviados ao cliente) podem receber Ordem de Compra/Pedido',
      );
    }

    if (quote.purchaseOrders && quote.purchaseOrders.length > 0) {
      const activeOC = quote.purchaseOrders.find(
        (po) => po.status !== PurchaseOrderStatus.EXPIRED,
      );
      if (activeOC) {
        throw new BadRequestException('Este orçamento já possui uma Ordem de Compra ativa');
      }
    }

    if (quote.clientId !== createPurchaseOrderDto.clientId) {
      throw new BadRequestException('Cliente da OC não corresponde ao cliente do orçamento');
    }

    const issueDate = new Date(createPurchaseOrderDto.issueDate);
    const expiryDate = new Date(createPurchaseOrderDto.expiryDate);

    if (expiryDate <= issueDate) {
      throw new BadRequestException('Data de validade deve ser posterior à data de emissão');
    }

    const now = new Date();
    const status =
      expiryDate < now ? PurchaseOrderStatus.EXPIRED : PurchaseOrderStatus.APPROVED;

    const purchaseOrderData: Prisma.PurchaseOrderCreateInput = {
      quote: { connect: { id: createPurchaseOrderDto.quoteId } },
      client: { connect: { id: createPurchaseOrderDto.clientId } },
      orderNumber: createPurchaseOrderDto.orderNumber,
      value: createPurchaseOrderDto.value,
      issueDate,
      expiryDate,
      status,
      fileUrl,
      uploadedBy: { connect: { id: uploadedById } },
    };

    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: purchaseOrderData,
      include: {
        quote: { select: { id: true, quoteNumber: true, type: true, status: true } },
        client: { select: { id: true, companyName: true, tradeName: true, cnpjCpf: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // OC/OP válida confirma o orçamento: aceita o orçamento e materializa a
    // Ordem de Serviço de execução (equivale ao antigo "verificar OC/OP" do
    // fluxograma comercial, logo antes de emitir ART e programar o início).
    if (status === PurchaseOrderStatus.APPROVED) {
      if (quote.status !== QuoteStatus.ACCEPTED) {
        await this.quotesService.updateStatus(
          createPurchaseOrderDto.quoteId,
          { status: QuoteStatus.ACCEPTED, comments: 'OC/OP confirmada' },
          uploadedById,
          uploadedByRole,
        );
      }
      await this.serviceOrdersService.createFromQuote(
        { quoteId: createPurchaseOrderDto.quoteId },
        uploadedById,
      );
    }

    return purchaseOrder;
  }

  async findAll(filters?: { quoteId?: string; clientId?: string; status?: PurchaseOrderStatus }) {
    const where: Prisma.PurchaseOrderWhereInput = {
      ...(filters?.quoteId && { quoteId: filters.quoteId }),
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.status && { status: filters.status }),
    };

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        quote: { select: { id: true, quoteNumber: true, type: true, status: true } },
        client: { select: { id: true, companyName: true, tradeName: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        quote: {
          include: {
            client: {
              select: {
                companyName: true,
                tradeName: true,
                cnpjCpf: true,
                phone: true,
                email: true,
              },
            },
            createdBy: { select: { name: true, email: true } },
          },
        },
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
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException('Ordem de Compra não encontrada');
    }

    return purchaseOrder;
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    userId: string,
    userRole: UserRole,
  ) {
    const purchaseOrder = await this.findOne(id);

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.ADMINISTRATIVE &&
      userRole !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Você não tem permissão para editar Ordens de Compra');
    }

    if (purchaseOrder.status === PurchaseOrderStatus.EXPIRED) {
      throw new BadRequestException('Não é possível editar Ordem de Compra vencida');
    }

    const updateData: Prisma.PurchaseOrderUpdateInput = {
      ...(updatePurchaseOrderDto.orderNumber && { orderNumber: updatePurchaseOrderDto.orderNumber }),
      ...(updatePurchaseOrderDto.value !== undefined && { value: updatePurchaseOrderDto.value }),
      ...(updatePurchaseOrderDto.issueDate && { issueDate: new Date(updatePurchaseOrderDto.issueDate) }),
      ...(updatePurchaseOrderDto.expiryDate && { expiryDate: new Date(updatePurchaseOrderDto.expiryDate) }),
      ...(updatePurchaseOrderDto.status && { status: updatePurchaseOrderDto.status }),
    };

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        quote: { select: { id: true, quoteNumber: true } },
        client: { select: { companyName: true } },
      },
    });
  }

  async checkExpiredOrders() {
    const now = new Date();

    const expired = await this.prisma.purchaseOrder.updateMany({
      where: { expiryDate: { lt: now }, status: { not: PurchaseOrderStatus.EXPIRED } },
      data: { status: PurchaseOrderStatus.EXPIRED },
    });

    return {
      message: `${expired.count} Ordens de Compra marcadas como vencidas`,
      count: expired.count,
    };
  }

  async getExpiringOrders(daysAhead: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.purchaseOrder.findMany({
      where: {
        expiryDate: { gte: now, lte: futureDate },
        status: PurchaseOrderStatus.APPROVED,
      },
      include: {
        quote: { select: { quoteNumber: true } },
        client: { select: { companyName: true, email: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async remove(id: string, userRole: UserRole) {
    await this.findOne(id);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem deletar Ordens de Compra');
    }

    return this.prisma.purchaseOrder.delete({ where: { id } });
  }

  async getStatistics() {
    const total = await this.prisma.purchaseOrder.count();

    const byStatus = await this.prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalValue = await this.prisma.purchaseOrder.aggregate({
      _sum: { value: true },
      where: { status: PurchaseOrderStatus.APPROVED },
    });

    return {
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      totalValue: totalValue._sum.value || 0,
    };
  }
}
