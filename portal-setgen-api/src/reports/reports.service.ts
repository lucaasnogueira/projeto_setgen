import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getVisitsByMonth(filters: any) {
    const visits = await this.prisma.technicalVisit.findMany({
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
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.5)',
        },
      ],
    };
  }

  async getOrdersByStatus(filters: any) {
    const orders = await this.prisma.serviceOrder.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusLabels = {
      DRAFT: 'Rascunho',
      PENDING_APPROVAL: 'Aguardando Aprovação',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      IN_PROGRESS: 'Em Andamento',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
    };

    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(46, 204, 113, 0.8)',
      'rgba(231, 76, 60, 0.8)',
    ];

    return {
      labels: orders.map((o) => statusLabels[o.status] || o.status),
      datasets: [
        {
          label: 'Quantidade',
          data: orders.map((o) => o._count),
          backgroundColor: colors,
        },
      ],
    };
  }

  async getMonthlyRevenue(filters: any) {
    const invoices = await this.prisma.invoice.findMany({
      select: {
        issueDate: true,
        value: true,
      },
      orderBy: {
        issueDate: 'asc',
      },
    });

    const monthlyData = this.groupRevenueByMonth(invoices);

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

  async getTechnicianPerformance(filters: any) {
    // Buscar todas as OS que têm responsáveis técnicos
    const orders = await this.prisma.serviceOrder.findMany({
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

  private groupRevenueByMonth(invoices: any[]) {
    const months = {};
    invoices.forEach((invoice) => {
      const date = new Date(invoice.issueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[monthKey]) {
        months[monthKey] = 0;
      }
      months[monthKey] += Number(invoice.value);
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
