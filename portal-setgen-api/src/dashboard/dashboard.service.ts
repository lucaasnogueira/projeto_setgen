import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ServiceOrderStatus,
  InvoiceStatus,
  PurchaseOrderStatus,
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
      this.prisma.invoice.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.invoice.aggregate({ _sum: { value: true } }),
      this.prisma.invoice.aggregate({
        _sum: { value: true },
        where: { status: InvoiceStatus.PAID },
      }),
      this.prisma.invoice.aggregate({
        _sum: { value: true },
        where: { status: InvoiceStatus.OVERDUE },
      }),
      this.prisma.serviceOrder.count({
        where: {
          status: ServiceOrderStatus.COMPLETED,
          updatedAt: { gte: firstDayOfMonth },
        },
      }),
    ]);

    const totalInvoicedValue = Number(totalInvoiced._sum.value ?? 0);
    const paidValue = Number(paidInvoices._sum.value ?? 0);
    const overdueValue = Number(overdueInvoices._sum.value ?? 0);

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

    const invoices = await this.prisma.invoice.findMany({
      where: { issueDate: { gte: startDate, lte: endDate } },
      select: { value: true, status: true },
    });

    const totalIssued = invoices.reduce((sum, i) => sum + Number(i.value), 0);
    const totalPaid = invoices
      .filter((i) => i.status === InvoiceStatus.PAID)
      .reduce((sum, i) => sum + Number(i.value), 0);

    return {
      period: { year: currentYear, month: currentMonth },
      invoices: {
        count: invoices.length,
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

    const result = await Promise.all(
      clients.map(async (client) => {
        const invoices = await this.prisma.invoice.findMany({
          where: { serviceOrder: { clientId: client.id } },
          select: { value: true, status: true },
        });

        const total = invoices.reduce((s, i) => s + Number(i.value), 0);

        return {
          client: {
            id: client.id,
            name: client.tradeName || client.companyName,
            cnpjCpf: client.cnpjCpf,
          },
          totalRevenue: total,
        };
      }),
    );

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
    const now = new Date();
    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);

    const [
      pendingApprovals,
      overdueInvoices,
      invoicesDueSoon,
      expiredPurchaseOrders,
    ] = await Promise.all([
      this.prisma.serviceOrder.count({
        where: { status: ServiceOrderStatus.PENDING_APPROVAL },
      }),
      this.prisma.invoice.count({
        where: { status: InvoiceStatus.OVERDUE },
      }),
      this.prisma.invoice.count({
        where: {
          status: InvoiceStatus.ISSUED,
          dueDate: { gte: now, lte: next7Days },
        },
      }),
      this.prisma.purchaseOrder.count({
        where: { status: PurchaseOrderStatus.EXPIRED },
      }),
    ]);

    return {
      pendingApprovals,
      overdueInvoices,
      invoicesDueSoon,
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

      const invoices = await this.prisma.invoice.findMany({
        where: { issueDate: { gte: start, lt: end } },
        select: { value: true, status: true },
      });

      const total = invoices.reduce((s, i) => s + Number(i.value), 0);
      const paid = invoices
        .filter((i) => i.status === InvoiceStatus.PAID)
        .reduce((s, i) => s + Number(i.value), 0);

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
}
