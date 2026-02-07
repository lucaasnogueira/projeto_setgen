import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Visão geral do sistema - KPIs principais' })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('sales-pipeline')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Pipeline de vendas e serviços' })
  getSalesPipeline() {
    return this.dashboardService.getSalesPipeline();
  }

  @Get('financial-analysis')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Análise financeira detalhada' })
  @ApiQuery({ name: 'year', required: false, example: 2024 })
  @ApiQuery({ name: 'month', required: false, example: 1 })
  getFinancialAnalysis(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const yearNum = year && !isNaN(+year) ? Number(year) : undefined;
    const monthNum = month && !isNaN(+month) ? Number(month) : undefined;

    return this.dashboardService.getFinancialAnalysis(yearNum, monthNum);
  }

  @Get('technician-productivity')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Produtividade por técnico' })
  getTechnicianProductivity() {
    return this.dashboardService.getTechnicianProductivity();
  }

  @Get('top-clients')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Top clientes por faturamento' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getTopClients(@Query('limit') limit?: string) {
    const limitNum = limit && !isNaN(+limit) ? Number(limit) : 10;
    return this.dashboardService.getTopClients(limitNum);
  }

  @Get('performance-metrics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Métricas de performance e prazos' })
  getPerformanceMetrics() {
    return this.dashboardService.getPerformanceMetrics();
  }

  @Get('alerts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Alertas e pendências críticas' })
  getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('visits-trend')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Tendência de visitas (últimos meses)' })
  @ApiQuery({ name: 'months', required: false, example: 6 })
  getVisitsTrend(@Query('months') months?: string) {
    const monthsNum = months && !isNaN(+months) ? Number(months) : 6;
    return this.dashboardService.getVisitsTrend(monthsNum);
  }

  @Get('revenue-trend')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Tendência de faturamento (últimos meses)' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  getRevenueTrend(@Query('months') months?: string) {
    const monthsNum = months && !isNaN(+months) ? Number(months) : 12;
    return this.dashboardService.getRevenueTrend(monthsNum);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE, UserRole.WAREHOUSE, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Estatísticas simplificadas para o Dashboard' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('activities')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE, UserRole.WAREHOUSE, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Atividades recentes do sistema' })
  getActivities() {
    return this.dashboardService.getRecentActivities();
  }
}
