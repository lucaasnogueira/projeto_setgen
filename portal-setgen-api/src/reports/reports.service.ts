import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, QuoteStatus } from '@prisma/client';
import { ReportFiltersDto } from './dto/report-filters.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private dateRange(filters: ReportFiltersDto) {
    if (!filters.startDate && !filters.endDate) return undefined;
    return {
      ...(filters.startDate && { gte: new Date(filters.startDate) }),
      ...(filters.endDate && { lte: new Date(filters.endDate) }),
    };
  }

  async getOverview(filters: ReportFiltersDto) {
    const dateRange = this.dateRange(filters);

    const soWhere: Prisma.ServiceOrderWhereInput = {
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(dateRange && { createdAt: dateRange }),
    };

    const visitWhere: Prisma.TechnicalVisitWhereInput = {
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(dateRange && { visitDate: dateRange }),
    };

    const nfWhere: Prisma.NotaFiscalWhereInput = {
      ...(filters.clientId && { clientId: filters.clientId }),
      status: 'AUTORIZADA',
      ...(dateRange && { createdAt: dateRange }),
    };

    const [
      totalVisits,
      totalOrders,
      completedOrders,
      inProgressOrders,
      awaitingOrders,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      this.prisma.technicalVisit.count({ where: visitWhere }),
      this.prisma.serviceOrder.count({ where: soWhere }),
      this.prisma.serviceOrder.count({ where: { ...soWhere, status: 'COMPLETED' } }),
      this.prisma.serviceOrder.count({ where: { ...soWhere, status: 'IN_PROGRESS' } }),
      this.prisma.serviceOrder.count({ where: { ...soWhere, status: 'AWAITING_MATERIALS' } }),
      this.prisma.notaFiscal.aggregate({
        where: nfWhere,
        _sum: { valorBruto: true },
      }),
      this.prisma.serviceOrder.findMany({
        where: soWhere,
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          scope: true,
          createdAt: true,
          client: {
            select: {
              companyName: true,
              tradeName: true,
            },
          },
          equipment: {
            select: {
              model: true,
              serialNumber: true,
            },
          },
        },
      }),
    ]);

    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    const totalRevenue = Number(revenueResult._sum?.valorBruto || 0);

    return {
      kpis: {
        totalVisits,
        totalOrders,
        completedOrders,
        inProgressOrders,
        awaitingOrders,
        completionRate,
        totalRevenue,
      },
      recentOrders,
    };
  }

  async getVisitsByMonth(filters: ReportFiltersDto) {
    const visits = await this.prisma.technicalVisit.findMany({
      where: {
        ...(filters.clientId && { clientId: filters.clientId }),
        ...(this.dateRange(filters) && { visitDate: this.dateRange(filters) }),
      },
      select: {
        visitDate: true,
      },
      orderBy: {
        visitDate: 'asc',
      },
    });

    const monthlyData = this.groupByMonth(visits, 'visitDate');

    return {
      labels: monthlyData.map((d) => d.month),
      datasets: [
        {
          label: 'Visitas Realizadas',
          data: monthlyData.map((d) => d.count),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }

  async getOrdersByStatus(filters: ReportFiltersDto) {
    const dateRange = this.dateRange(filters);

    const soWhere: Prisma.ServiceOrderWhereInput = {
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(dateRange && { createdAt: dateRange }),
    };
    const quoteWhere: Prisma.QuoteWhereInput = {
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(dateRange && { createdAt: dateRange }),
      status: { not: QuoteStatus.ACCEPTED },
    };

    const [quoteOrders, soOrders] = await Promise.all([
      this.prisma.quote.groupBy({ by: ['status'], where: quoteWhere, _count: true }),
      this.prisma.serviceOrder.groupBy({ by: ['status'], where: soWhere, _count: true }),
    ]);

    const orders = [
      ...quoteOrders.map((o) => ({ status: o.status as string, _count: o._count })),
      ...soOrders.map((o) => ({ status: o.status as string, _count: o._count })),
    ];

    const statusLabels: Record<string, string> = {
      DRAFT: 'Rascunho',
      PENDING_APPROVAL: 'Aguardando Aprovação',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      SENT_TO_CLIENT: 'Enviada ao Cliente',
      AWAITING_RESPONSE: 'Aguardando Resposta',
      EXPIRED: 'Expirada',
      ACCEPTED: 'Aceita',
      AWAITING_MATERIALS: 'Aguardando Materiais',
      IN_PROGRESS: 'Em Andamento',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
    };

    const statusColors: Record<string, string> = {
      COMPLETED: 'rgba(16, 185, 129, 0.85)',
      ACCEPTED: 'rgba(16, 185, 129, 0.85)',
      IN_PROGRESS: 'rgba(59, 130, 246, 0.85)',
      AWAITING_MATERIALS: 'rgba(245, 158, 11, 0.85)',
      PENDING_APPROVAL: 'rgba(251, 191, 36, 0.85)',
      SENT_TO_CLIENT: 'rgba(139, 92, 246, 0.85)',
      AWAITING_RESPONSE: 'rgba(236, 72, 153, 0.85)',
      APPROVED: 'rgba(6, 182, 212, 0.85)',
      DRAFT: 'rgba(148, 163, 184, 0.85)',
      REJECTED: 'rgba(239, 68, 68, 0.85)',
      CANCELLED: 'rgba(100, 116, 139, 0.85)',
      EXPIRED: 'rgba(156, 163, 175, 0.85)',
    };

    return {
      labels: orders.map((o) => statusLabels[o.status] || o.status),
      datasets: [
        {
          label: 'Quantidade',
          data: orders.map((o) => o._count),
          backgroundColor: orders.map(
            (o) => statusColors[o.status] || 'rgba(107, 114, 128, 0.85)'
          ),
        },
      ],
    };
  }

  async getMonthlyRevenue(filters: ReportFiltersDto) {
    const notas = await this.prisma.notaFiscal.findMany({
      where: {
        ...(filters.clientId && { clientId: filters.clientId }),
        status: 'AUTORIZADA',
        ...(this.dateRange(filters) && { createdAt: this.dateRange(filters) }),
      },
      select: {
        createdAt: true,
        valorBruto: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const monthlyData = this.groupRevenueByMonth(notas);

    return {
      labels: monthlyData.map((d) => d.month),
      datasets: [
        {
          label: 'Faturamento (R$)',
          data: monthlyData.map((d) => d.total),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
        },
      ],
    };
  }

  async getTechnicianPerformance(filters: ReportFiltersDto) {
    // Buscar todas as OS que têm responsáveis técnicos
    const orders = await this.prisma.serviceOrder.findMany({
      where: {
        ...(filters.clientId && { clientId: filters.clientId }),
        ...(this.dateRange(filters) && { createdAt: this.dateRange(filters) }),
      },
      select: {
        responsibleIds: true,
        status: true,
      },
    });

    const performanceMap = new Map<string, number>();

    orders.forEach((order) => {
      if (order.responsibleIds && Array.isArray(order.responsibleIds)) {
        order.responsibleIds.forEach((techId) => {
          performanceMap.set(techId, (performanceMap.get(techId) || 0) + 1);
        });
      }
    });

    const technicianIds = Array.from(performanceMap.keys());
    const technicians = await this.prisma.user.findMany({
      where: {
        id: { in: technicianIds },
      },
      select: { id: true, name: true },
    });

    const techNamesMap = new Map(technicians.map((t) => [t.id, t.name]));

    return {
      labels: technicianIds.map((id) => techNamesMap.get(id) || 'Desconhecido'),
      datasets: [
        {
          label: 'OS Realizadas',
          data: technicianIds.map((id) => performanceMap.get(id)),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
        },
      ],
    };
  }

  private groupByMonth(data: any[], dateField: string) {
    const months = {};
    data.forEach((item) => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[monthKey]) {
        months[monthKey] = 0;
      }
      months[monthKey] += 1;
    });

    return Object.entries(months).map(([month, count]) => ({
      month: this.formatMonth(month),
      count,
    }));
  }

  private groupRevenueByMonth(notas: any[]) {
    const months = {};
    notas.forEach((nota) => {
      const date = new Date(nota.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[monthKey]) {
        months[monthKey] = 0;
      }
      months[monthKey] += Number(nota.valorBruto);
    });

    return Object.entries(months).map(([month, total]) => ({
      month: this.formatMonth(month),
      total,
    }));
  }

  private formatMonth(monthKey: string) {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  }
}
