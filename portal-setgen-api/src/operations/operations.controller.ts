import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Operations')
@ApiBearerAuth()
@Controller('operations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get('pipeline')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Esteira operacional e comercial de clientes de ponta a ponta' })
  getPipeline() {
    return this.operationsService.getPipeline();
  }

  @Get('calendar')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Visitas técnicas consolidadas para o quadro calendário' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getCalendar(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.operationsService.getCalendarVisits(startDate, endDate);
  }

  @Patch('processes/:processId/stages/:stageId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Atualiza o status de uma etapa operacional da esteira' })
  updateStageStatus(
    @Param('processId') processId: string,
    @Param('stageId') stageId: string,
    @Body('status') status: 'completed' | 'in_progress' | 'pending',
  ) {
    return this.operationsService.updateStageStatus(processId, stageId, status);
  }
}

