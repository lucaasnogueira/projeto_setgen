import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ServiceOrderStatus,
  StatusNota,
  PurchaseOrderStatus,
  MaterialRequestStatus,
  ProcurementOrderStatus,
  UserRole,
} from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /* =========================
     OVERVIEW
  ========================== */
  async getOverview() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalClients,
      totalVisits,
      totalServiceOrders,
      totalDeliveries,
      visitsThisMonth,
      serviceOrdersByStatus,
      invoicesByStatus,
      totalInvoiced,
      paidInvoices,
      overdueInvoices,
      completedThisMonth,
    ] = await Promise.all([
      this.prisma.client.count({ where: { status: 'ACTIVE' } }),
      this.prisma.technicalVisit.count(),
      this.prisma.serviceOrder.count(),
      this.prisma.delivery.count(),
      this.prisma.technicalVisit.count({
        where: { visitDate: { gte: firstDayOfMonth } },
      }),
      this.prisma.serviceOrder.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.notaFiscal.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.notaFiscal.aggregate({ _sum: { valorBruto: true } }),
      this.prisma.notaFiscal.aggregate({
        _sum: { valorBruto: true },
        where: { status: StatusNota.AUTORIZADA },
      }),
      this.prisma.notaFiscal.aggregate({
        _sum: { valorBruto: true },
        where: { status: StatusNota.REJEITADA },
      }),
      this.prisma.serviceOrder.count({
        where: {
          status: ServiceOrderStatus.COMPLETED,
          updatedAt: { gte: firstDayOfMonth },
        },
      }),
    ]);

    const totalInvoicedValue = Number(totalInvoiced._sum.valorBruto ?? 0);
    const paidValue = Number(paidInvoices._sum.valorBruto ?? 0);
    const overdueValue = Number(overdueInvoices._sum.valorBruto ?? 0);

    return {
      clients: { total: totalClients },
      visits: { total: totalVisits, thisMonth: visitsThisMonth },
      serviceOrders: {
        total: totalServiceOrders,
        completedThisMonth,
        byStatus: serviceOrdersByStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
      },
      deliveries: { total: totalDeliveries },
      financial: {
        totalInvoiced: totalInvoicedValue,
        paid: paidValue,
        overdue: overdueValue,
        pending: totalInvoicedValue - paidValue,
      },
      invoices: {
        byStatus: invoicesByStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
      },
    };
  }

  /* =========================
     SALES PIPELINE
  ========================== */
  async getSalesPipeline() {
    const pipeline = {
      visits: await this.prisma.technicalVisit.count(),
      osCreated: await this.prisma.serviceOrder.count({
        where: { type: 'VISIT_REPORT' },
      }),
      pendingApproval: await this.prisma.serviceOrder.count({
        where: { status: ServiceOrderStatus.PENDING_APPROVAL },
      }),
      approved: await this.prisma.serviceOrder.count({
        where: { status: ServiceOrderStatus.APPROVED },
      }),
      inProgress: await this.prisma.serviceOrder.count({
        where: { status: ServiceOrderStatus.IN_PROGRESS },
      }),
      completed: await this.prisma.serviceOrder.count({
        where: { status: ServiceOrderStatus.COMPLETED },
      }),
      rejected: await this.prisma.serviceOrder.count({
        where: { status: ServiceOrderStatus.REJECTED },
      }),
    };

    return {
      ...pipeline,
      metrics: {
        conversionRate:
          pipeline.visits > 0
            ? `${((pipeline.approved / pipeline.visits) * 100).toFixed(2)}%`
            : '0%',
        approvalRate:
          pipeline.osCreated > 0
            ? `${((pipeline.approved / pipeline.osCreated) * 100).toFixed(2)}%`
            : '0%',
      },
    };
  }

  /* =========================
     FINANCIAL ANALYSIS
  ========================== */
  async getFinancialAnalysis(year?: number, month?: number) {
    const currentYear = year ?? new Date().getFullYear();
    const currentMonth = month ?? new Date().getMonth() + 1;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const notas = await this.prisma.notaFiscal.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { valorBruto: true, status: true },
    });

    const totalIssued = notas.reduce((sum, i) => sum + Number(i.valorBruto), 0);
    const totalPaid = notas
      .filter((i) => i.status === StatusNota.AUTORIZADA)
      .reduce((sum, i) => sum + Number(i.valorBruto), 0);

    return {
      period: { year: currentYear, month: currentMonth },
      invoices: {
        count: notas.length,
        totalIssued,
        totalPaid,
        pending: totalIssued - totalPaid,
      },
    };
  }

  /* =========================
     TECHNICIAN PRODUCTIVITY
  ========================== */
  async getTechnicianProductivity() {
    const technicians = await this.prisma.user.findMany({
      where: { role: UserRole.TECHNICIAN, active: true },
      select: { id: true, name: true },
    });

    return Promise.all(
      technicians.map(async (tech) => {
        const [visits, orders, completed] = await Promise.all([
          this.prisma.technicalVisit.count({
            where: { technicianId: tech.id },
          }),
          this.prisma.serviceOrder.count({
            where: { responsibleIds: { has: tech.id } },
          }),
          this.prisma.serviceOrder.count({
            where: {
              responsibleIds: { has: tech.id },
              status: ServiceOrderStatus.COMPLETED,
            },
          }),
        ]);

        return {
          technician: tech,
          metrics: {
            visits,
            serviceOrders: orders,
            completedOrders: completed,
            completionRate:
              orders > 0 ? `${((completed / orders) * 100).toFixed(2)}%` : '0%',
          },
        };
      }),
    );
  }

  /* =========================
     TOP CLIENTS
  ========================== */
  async getTopClients(limit = 10) {
    const clients = await this.prisma.client.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        tradeName: true,
        companyName: true,
        cnpjCpf: true,
      },
    });

    // Uma única consulta para todas as notas em vez de uma por cliente
    // (evita N+1 — antes disparava 1 query por cliente ativo).
    const notas = await this.prisma.notaFiscal.findMany({
      where: {
        clientId: { in: clients.map((c) => c.id) },
        status: StatusNota.AUTORIZADA,
      },
      select: { valorBruto: true, clientId: true },
    });

    const revenueByClient = new Map<string, number>();
    for (const nota of notas) {
      revenueByClient.set(
        nota.clientId,
        (revenueByClient.get(nota.clientId) ?? 0) + Number(nota.valorBruto),
      );
    }

    const result = clients.map((client) => ({
      client: {
        id: client.id,
        name: client.tradeName || client.companyName,
        cnpjCpf: client.cnpjCpf,
      },
      totalRevenue: revenueByClient.get(client.id) ?? 0,
    }));

    return result
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  /* =========================
     PERFORMANCE METRICS
  ========================== */
  async getPerformanceMetrics() {
    const completed = await this.prisma.serviceOrder.findMany({
      where: { status: ServiceOrderStatus.COMPLETED, deadline: { not: null } },
      select: {
        deadline: true,
        delivery: { select: { deliveryDate: true } },
      },
    });

    const onTime = completed.filter(
      (o) =>
        o.delivery &&
        o.delivery.deliveryDate &&
        o.delivery.deliveryDate <= o.deadline!,
    ).length;

    return {
      totalCompleted: completed.length,
      onTime,
      late: completed.length - onTime,
      onTimeRate:
        completed.length > 0
          ? `${((onTime / completed.length) * 100).toFixed(2)}%`
          : '0%',
    };
  }

  /* =========================
     ALERTS
  ========================== */
  async getAlerts() {
    const [
      pendingApprovals,
      overdueInvoices,
      expiredPurchaseOrders,
    ] = await Promise.all([
      this.prisma.serviceOrder.count({
        where: { status: ServiceOrderStatus.PENDING_APPROVAL },
      }),
      // "overdueInvoices" passou a significar notas fiscais rejeitadas pela
      // SEFAZ (precisam de correção/reemissão) — não existe mais conceito
      // de "vencimento" numa nota fiscal.
      this.prisma.notaFiscal.count({
        where: { status: StatusNota.REJEITADA },
      }),
      this.prisma.purchaseOrder.count({
        where: { status: PurchaseOrderStatus.EXPIRED },
      }),
    ]);

    return {
      pendingApprovals,
      overdueInvoices,
      expiredPurchaseOrders,
    };
  }

  /* =========================
     TRENDS
  ========================== */
  async getVisitsTrend(months = 6) {
    const trends: { month: string; count: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const count = await this.prisma.technicalVisit.count({
        where: { visitDate: { gte: start, lt: end } },
      });

      trends.push({
        month: start.toLocaleDateString('pt-BR', {
          month: 'short',
          year: 'numeric',
        }),
        count,
      });
    }

    return trends;
  }

  async getRevenueTrend(months = 12) {
    const trends: {
      month: string;
      total: number;
      paid: number;
      pending: number;
    }[] = [];

    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const notas = await this.prisma.notaFiscal.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { valorBruto: true, status: true },
      });

      const total = notas.reduce((s, i) => s + Number(i.valorBruto), 0);
      const paid = notas
        .filter((i) => i.status === StatusNota.AUTORIZADA)
        .reduce((s, i) => s + Number(i.valorBruto), 0);

      trends.push({
        month: start.toLocaleDateString('pt-BR', {
          month: 'short',
          year: 'numeric',
        }),
        total,
        paid,
        pending: total - paid,
      });
    }

    return trends;
  }

  /* =========================
     FRONTEND COMPATIBILITY
  ========================== */
  async getStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      pendingApprovals,
      activeOrders,
      completedThisMonth,
      totalRevenue,
      lowStockItems,
      overdueInvoices,
      ordersByStatus,
      monthlyRevenue,
      visitsByMonth,
      recentActivities,
    ] = await Promise.all([
      this.prisma.serviceOrder.count({
        where: { status: ServiceOrderStatus.PENDING_APPROVAL },
      }),
      this.prisma.serviceOrder.count({
        where: {
          status: {
            in: [ServiceOrderStatus.IN_PROGRESS, ServiceOrderStatus.APPROVED],
          },
        },
      }),
      this.prisma.serviceOrder.count({
        where: {
          status: ServiceOrderStatus.COMPLETED,
          updatedAt: { gte: firstDayOfMonth },
        },
      }),
      this.prisma.notaFiscal.aggregate({
        _sum: { valorBruto: true },
        where: { status: StatusNota.AUTORIZADA },
      }),
      // Buscamos todos os produtos e filtramos via JS pois o Prisma não compara campos no `where`
      this.prisma.product
        .findMany({ select: { currentStock: true, minStock: true } })
        .then(
          (products) =>
            products.filter((p) => p.currentStock <= p.minStock).length,
        ),
      // "overdueInvoices" = notas fiscais rejeitadas (precisam de correção)
      this.prisma.notaFiscal.count({
        where: { status: StatusNota.REJEITADA },
      }),
      this.prisma.serviceOrder.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.getRevenueTrend(6),
      this.getVisitsTrend(6),
      this.getRecentActivities(),
    ]);

    const statusLabels: Record<string, string> = {
      DRAFT: 'Rascunho',
      PENDING_APPROVAL: 'Aguardando Aprovação',
      APPROVED: 'Aprovada',
      SENT_TO_CLIENT: 'Enviado ao Cliente',
      AWAITING_RESPONSE: 'Aguardando Resposta',
      EXPIRED: 'Expirado',
      REJECTED: 'Rejeitada',
      IN_PROGRESS: 'Em Andamento',
      AWAITING_MATERIALS: 'Aguardando Materiais',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
    };

    return {
      pendingApprovals,
      activeOrders,
      completedThisMonth,
      totalRevenue: Number(totalRevenue._sum.valorBruto ?? 0),
      lowStockItems,
      overdueInvoices,
      recentActivities,
      ordersByStatus: ordersByStatus.map((s) => ({
        label: statusLabels[s.status] || s.status,
        value: s._count,
      })),
      monthlyRevenue: monthlyRevenue.map((r) => ({
        month: r.month,
        value: r.total,
      })),
      visitsByMonth: visitsByMonth.map((v) => ({
        month: v.month,
        value: v.count,
      })),
    };
  }

  /* =========================
     KPIs OPERACIONAIS (diagnóstico BPM — fase 4)
  ========================== */
  async getOperationalKpis() {
    const [
      materialSla,
      quoteApproval,
      supplierLeadTime,
      reworkRate,
    ] = await Promise.all([
      this.getMaterialSeparationSla(),
      this.getQuoteApprovalRate(),
      this.getSupplierLeadTime(),
      this.getReworkRate(),
    ]);

    return {
      materialSeparationSla: materialSla,
      quoteApprovalRate: quoteApproval,
      supplierLeadTime,
      reworkRate,
    };
  }

  // Tempo médio entre a criação da solicitação de material e a separação
  // completa. Aproximação: usa updatedAt de solicitações que estão hoje em
  // SEPARATED (uma solicitação já liberada/RELEASED não entra, pois seu
  // updatedAt passaria a refletir a liberação, não a separação).
  private async getMaterialSeparationSla() {
    const separated = await this.prisma.materialRequest.findMany({
      where: { status: MaterialRequestStatus.SEPARATED },
      select: { createdAt: true, updatedAt: true },
    });

    if (separated.length === 0) {
      return { averageHours: 0, sampleSize: 0 };
    }

    const totalHours = separated.reduce((sum, mr) => {
      const hours = (mr.updatedAt.getTime() - mr.createdAt.getTime()) / 36e5;
      return sum + hours;
    }, 0);

    return {
      averageHours: Number((totalHours / separated.length).toFixed(1)),
      sampleSize: separated.length,
    };
  }

  // Orçamentos aprovados / orçamentos enviados ao cliente (excluindo os
  // que expiraram sem resposta, que não representam decisão do cliente).
  private async getQuoteApprovalRate() {
    const sentNotExpired = await this.prisma.serviceOrder.count({
      where: {
        status: {
          in: [
            ServiceOrderStatus.SENT_TO_CLIENT,
            ServiceOrderStatus.AWAITING_RESPONSE,
            ServiceOrderStatus.IN_PROGRESS,
            ServiceOrderStatus.AWAITING_MATERIALS,
            ServiceOrderStatus.COMPLETED,
            ServiceOrderStatus.REJECTED,
          ],
        },
      },
    });

    const approved = await this.prisma.serviceOrder.count({
      where: {
        status: {
          in: [
            ServiceOrderStatus.IN_PROGRESS,
            ServiceOrderStatus.AWAITING_MATERIALS,
            ServiceOrderStatus.COMPLETED,
          ],
        },
      },
    });

    return {
      rate: sentNotExpired > 0 ? Number(((approved / sentNotExpired) * 100).toFixed(1)) : 0,
      approved,
      sentNotExpired,
    };
  }

  // Lead time médio de fornecedor: da criação do pedido de compra até o
  // recebimento, por fornecedor. Aproximação: usa createdAt/updatedAt do
  // pedido (não há timestamp próprio de "data de emissão").
  private async getSupplierLeadTime() {
    const received = await this.prisma.procurementOrder.findMany({
      where: { status: ProcurementOrderStatus.RECEIVED, supplierId: { not: null } },
      select: {
        createdAt: true,
        updatedAt: true,
        supplier: { select: { id: true, name: true } },
      },
    });

    const bySupplier = new Map<string, { name: string; totalDays: number; count: number }>();
    for (const order of received) {
      if (!order.supplier) continue;
      const days = (order.updatedAt.getTime() - order.createdAt.getTime()) / 86400000;
      const entry = bySupplier.get(order.supplier.id) ?? { name: order.supplier.name, totalDays: 0, count: 0 };
      entry.totalDays += days;
      entry.count += 1;
      bySupplier.set(order.supplier.id, entry);
    }

    return Array.from(bySupplier.entries()).map(([supplierId, v]) => ({
      supplierId,
      supplierName: v.name,
      averageDays: Number((v.totalDays / v.count).toFixed(1)),
      sampleSize: v.count,
    }));
  }

  // Taxa de retrabalho: visitas cobráveis (2ª visita no mesmo equipamento
  // pelo mesmo motivo, ver VisitsService.suggestChargeable) sobre o total
  // de visitas concluídas.
  private async getReworkRate() {
    const [chargeable, total] = await Promise.all([
      this.prisma.technicalVisit.count({
        where: { chargeable: true, status: 'COMPLETED' },
      }),
      this.prisma.technicalVisit.count({ where: { status: 'COMPLETED' } }),
    ]);

    return {
      rate: total > 0 ? Number(((chargeable / total) * 100).toFixed(1)) : 0,
      chargeable,
      total,
    };
  }

  /* =========================
     RECEBÍVEIS (controle interno)
     Previsão de recebimento por mês, calculada a partir de OS concluídas
     (completedAt + paymentTermDays), independente de nota fiscal emitida.
  ========================== */
  async getReceivables(year?: number, month?: number) {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth() + 1;
    const periodStart = new Date(targetYear, targetMonth - 1, 1);
    const periodEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const orders = await this.prisma.serviceOrder.findMany({
      where: {
        status: ServiceOrderStatus.COMPLETED,
        completedAt: { not: null },
        paymentTermDays: { not: null },
      },
      select: {
        id: true,
        orderNumber: true,
        completedAt: true,
        paymentTermDays: true,
        paymentStatus: true,
        client: { select: { id: true, companyName: true, tradeName: true } },
        quoteLines: { select: { totalValue: true } },
      },
    });

    const dueThisMonth = orders
      .map((order) => {
        const dueDate = new Date(order.completedAt!);
        dueDate.setDate(dueDate.getDate() + order.paymentTermDays!);
        const totalValue = order.quoteLines.reduce(
          (sum, line) => sum + Number(line.totalValue),
          0,
        );
        return { order, dueDate, totalValue };
      })
      .filter(({ dueDate }) => dueDate >= periodStart && dueDate <= periodEnd);

    const pending = dueThisMonth.filter(
      ({ order }) => order.paymentStatus === 'PENDING',
    );
    const received = dueThisMonth.filter(
      ({ order }) => order.paymentStatus === 'RECEIVED',
    );

    return {
      period: { year: targetYear, month: targetMonth },
      totalExpected: dueThisMonth.reduce((sum, i) => sum + i.totalValue, 0),
      totalPending: pending.reduce((sum, i) => sum + i.totalValue, 0),
      totalReceived: received.reduce((sum, i) => sum + i.totalValue, 0),
      items: dueThisMonth
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .map(({ order, dueDate, totalValue }) => ({
          serviceOrderId: order.id,
          orderNumber: order.orderNumber,
          client: order.client.tradeName || order.client.companyName,
          dueDate: dueDate.toISOString(),
          totalValue,
          paymentStatus: order.paymentStatus,
        })),
    };
  }

  async getRecentActivities() {
    const activities: any[] = [];

    // OS Aprovadas recentemente
    const recentOrders = await this.prisma.serviceOrder.findMany({
      where: {
        status: ServiceOrderStatus.APPROVED,
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { client: true },
    });

    for (const order of recentOrders) {
      activities.push({
        id: order.id,
        type: 'ORDER_APPROVED',
        description: `OS ${order.orderNumber} aprovada para ${order.client.tradeName || order.client.companyName}`,
        timestamp: order.updatedAt.toISOString(),
      });
    }

    // Novos clientes
    const recentClients = await this.prisma.client.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    for (const client of recentClients) {
      activities.push({
        id: client.id,
        type: 'NEW_CLIENT',
        description: `Novo cliente cadastrado: ${client.tradeName || client.companyName}`,
        timestamp: client.createdAt.toISOString(),
      });
    }

    return activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }
}
