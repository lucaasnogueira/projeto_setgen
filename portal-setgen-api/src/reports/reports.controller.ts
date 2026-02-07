import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('visits-by-month')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Relatório de visitas por mês' })
  async getVisitsByMonth(@Query() filters: any) {
    return this.reportsService.getVisitsByMonth(filters);
  }

  @Get('orders-by-status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Relatório de OS por status' })
  async getOrdersByStatus(@Query() filters: any) {
    return this.reportsService.getOrdersByStatus(filters);
  }

  @Get('monthly-revenue')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Relatório de faturamento mensal' })
  async getMonthlyRevenue(@Query() filters: any) {
    return this.reportsService.getMonthlyRevenue(filters);
  }

  @Get('technician-performance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Relatório de performance por técnico' })
  async getTechnicianPerformance(@Query() filters: any) {
    return this.reportsService.getTechnicianPerformance(filters);
  }

  @Get('export-pdf')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Exportar relatório em PDF' })
  async exportPDF(@Query() filters: any) {
    return { message: 'PDF export em desenvolvimento' };
  }
}
