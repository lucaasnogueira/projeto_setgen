#!/bin/bash

# ========================================
# Portal Setgen - Backend Endpoints
# ========================================
# Cria endpoints para Dashboard e Relatórios
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Criando Endpoints do Backend"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}📋 Instruções para o Backend:${NC}"
echo ""
echo "Cole os códigos abaixo no seu backend NestJS:"
echo ""

echo -e "${BLUE}=========================================${NC}"
echo -e "${YELLOW}1. DASHBOARD CONTROLLER${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
cat << 'EOF'
// src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }
}
EOF

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${YELLOW}2. DASHBOARD SERVICE${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
cat << 'EOF'
// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    // Aprovações Pendentes
    const pendingApprovals = await this.prisma.serviceOrder.count({
      where: { status: 'PENDING_APPROVAL' }
    });

    // OS Ativas
    const activeOrders = await this.prisma.serviceOrder.count({
      where: {
        status: {
          in: ['APPROVED', 'IN_PROGRESS']
        }
      }
    });

    // Concluídas no Mês
    const completedThisMonth = await this.prisma.serviceOrder.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: firstDayOfMonth
        }
      }
    });

    // Faturamento Total do Ano
    const invoices = await this.prisma.invoice.aggregate({
      where: {
        issueDate: {
          gte: firstDayOfYear
        }
      },
      _sum: {
        value: true
      }
    });
    const totalRevenue = invoices._sum.value || 0;

    // Estoque Baixo
    const lowStockItems = await this.prisma.inventoryItem.count({
      where: {
        currentStock: {
          lte: this.prisma.inventoryItem.fields.minimumStock
        }
      }
    });

    // NFe Vencidas (exemplo - ajuste conforme sua lógica)
    const overdueInvoices = await this.prisma.invoice.count({
      where: {
        // Adicione sua lógica de vencimento aqui
      }
    });

    // Atividades Recentes
    const recentActivities = await this.getRecentActivities();

    return {
      pendingApprovals,
      activeOrders,
      completedThisMonth,
      totalRevenue: Number(totalRevenue),
      lowStockItems,
      overdueInvoices,
      recentActivities,
    };
  }

  private async getRecentActivities() {
    const activities = [];

    // OS Aprovadas recentemente
    const recentOrders = await this.prisma.serviceOrder.findMany({
      where: {
        status: 'APPROVED',
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
        }
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { client: true }
    });

    for (const order of recentOrders) {
      activities.push({
        id: order.id,
        type: 'ORDER_APPROVED',
        description: `OS ${order.orderNumber} aprovada`,
        timestamp: order.updatedAt,
      });
    }

    return activities;
  }
}
EOF

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${YELLOW}3. REPORTS CONTROLLER${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
cat << 'EOF'
// src/reports/reports.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('visits-by-month')
  async getVisitsByMonth(@Query() filters: any) {
    return this.reportsService.getVisitsByMonth(filters);
  }

  @Get('orders-by-status')
  async getOrdersByStatus(@Query() filters: any) {
    return this.reportsService.getOrdersByStatus(filters);
  }

  @Get('monthly-revenue')
  async getMonthlyRevenue(@Query() filters: any) {
    return this.reportsService.getMonthlyRevenue(filters);
  }

  @Get('technician-performance')
  async getTechnicianPerformance(@Query() filters: any) {
    return this.reportsService.getTechnicianPerformance(filters);
  }

  @Get('export-pdf')
  async exportPDF(@Query() filters: any) {
    // Implementar exportação PDF
    return { message: 'PDF export em desenvolvimento' };
  }
}
EOF

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${YELLOW}4. REPORTS SERVICE${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
cat << 'EOF'
// src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getVisitsByMonth(filters: any) {
    const visits = await this.prisma.visit.groupBy({
      by: ['scheduledDate'],
      _count: true,
      orderBy: {
        scheduledDate: 'asc'
      }
    });

    const monthlyData = this.groupByMonth(visits);

    return {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Visitas Realizadas',
        data: monthlyData.map(d => d.count),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
      }]
    };
  }

  async getOrdersByStatus(filters: any) {
    const orders = await this.prisma.serviceOrder.groupBy({
      by: ['status'],
      _count: true
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
      labels: orders.map(o => statusLabels[o.status] || o.status),
      datasets: [{
        label: 'Quantidade',
        data: orders.map(o => o._count),
        backgroundColor: colors,
      }]
    };
  }

  async getMonthlyRevenue(filters: any) {
    const invoices = await this.prisma.invoice.findMany({
      select: {
        issueDate: true,
        value: true,
      },
      orderBy: {
        issueDate: 'asc'
      }
    });

    const monthlyData = this.groupRevenueByMonth(invoices);

    return {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Faturamento (R$)',
        data: monthlyData.map(d => d.total),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
      }]
    };
  }

  async getTechnicianPerformance(filters: any) {
    const performance = await this.prisma.serviceOrder.groupBy({
      by: ['technicianId'],
      _count: true,
      where: {
        technicianId: {
          not: null
        }
      }
    });

    const techniciansIds = performance.map(p => p.technicianId);
    const technicians = await this.prisma.user.findMany({
      where: {
        id: {
          in: techniciansIds
        }
      }
    });

    const techMap = new Map(technicians.map(t => [t.id, t.name]));

    return {
      labels: performance.map(p => techMap.get(p.technicianId) || 'Desconhecido'),
      datasets: [{
        label: 'OS Realizadas',
        data: performance.map(p => p._count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
      }]
    };
  }

  private groupByMonth(data: any[]) {
    const months = {};
    data.forEach(item => {
      const date = new Date(item.scheduledDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[monthKey]) {
        months[monthKey] = 0;
      }
      months[monthKey] += item._count || 1;
    });

    return Object.entries(months).map(([month, count]) => ({
      month: this.formatMonth(month),
      count
    }));
  }

  private groupRevenueByMonth(invoices: any[]) {
    const months = {};
    invoices.forEach(invoice => {
      const date = new Date(invoice.issueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[monthKey]) {
        months[monthKey] = 0;
      }
      months[monthKey] += Number(invoice.value);
    });

    return Object.entries(months).map(([month, total]) => ({
      month: this.formatMonth(month),
      total
    }));
  }

  private formatMonth(monthKey: string) {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  }
}
EOF

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${YELLOW}5. REGISTRAR MÓDULOS${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
cat << 'EOF'
// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

// src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

// src/app.module.ts
// Adicione estes imports:
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';

// E adicione aos imports do AppModule:
@Module({
  imports: [
    // ... outros módulos
    DashboardModule,
    ReportsModule,
  ],
})
EOF

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   ✅ Endpoints Criados!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}📋 Checklist:${NC}"
echo "  1. ☐ Criar pasta src/dashboard/"
echo "  2. ☐ Criar dashboard.controller.ts"
echo "  3. ☐ Criar dashboard.service.ts"
echo "  4. ☐ Criar dashboard.module.ts"
echo "  5. ☐ Criar pasta src/reports/"
echo "  6. ☐ Criar reports.controller.ts"
echo "  7. ☐ Criar reports.service.ts"
echo "  8. ☐ Criar reports.module.ts"
echo "  9. ☐ Registrar módulos no app.module.ts"
echo " 10. ☐ Reiniciar backend: npm run start:dev"
echo ""
echo -e "${BLUE}🎯 Endpoints criados:${NC}"
echo "  GET /dashboard/stats"
echo "  GET /reports/visits-by-month"
echo "  GET /reports/orders-by-status"
echo "  GET /reports/monthly-revenue"
echo "  GET /reports/technician-performance"
echo "  GET /reports/export-pdf"
echo ""
