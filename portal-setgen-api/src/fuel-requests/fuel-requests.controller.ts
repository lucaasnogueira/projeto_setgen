import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FuelRequestsService } from './fuel-requests.service';
import { CreateFuelRequestDto } from './dto/create-fuel-request.dto';
import { RejectFuelRequestDto } from './dto/reject-fuel-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../access-control/permissions.constants';
import { FuelRequestStatus } from '@prisma/client';

@ApiTags('Fuel Requests')
@Controller('fuel-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class FuelRequestsController {
  constructor(private readonly fuelRequestsService: FuelRequestsService) {}

  @Post()
  @RequiredPermissions(PERMISSIONS.FLEET_FUEL_REQUEST)
  @ApiOperation({ summary: 'Criar requisição de abastecimento (pendente de aprovação)' })
  create(@Body() dto: CreateFuelRequestDto, @Request() req) {
    return this.fuelRequestsService.create(dto, req.user.id);
  }

  @Get()
  @RequiredPermissions(PERMISSIONS.FLEET_VIEW, PERMISSIONS.FLEET_FUEL_REQUEST, PERMISSIONS.FLEET_FUEL_APPROVE)
  @ApiOperation({ summary: 'Listar requisições de abastecimento' })
  @ApiQuery({ name: 'status', enum: FuelRequestStatus, required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  findAll(@Query('status') status?: FuelRequestStatus, @Query('vehicleId') vehicleId?: string) {
    return this.fuelRequestsService.findAll({ status, vehicleId });
  }

  @Get(':id')
  @RequiredPermissions(PERMISSIONS.FLEET_VIEW, PERMISSIONS.FLEET_FUEL_REQUEST, PERMISSIONS.FLEET_FUEL_APPROVE)
  @ApiOperation({ summary: 'Buscar requisição de abastecimento por ID' })
  findOne(@Param('id') id: string) {
    return this.fuelRequestsService.findOne(id);
  }

  @Post(':id/approve')
  @RequiredPermissions(PERMISSIONS.FLEET_FUEL_APPROVE)
  @ApiOperation({ summary: 'Aprovar requisição de abastecimento (gera despesa automaticamente)' })
  approve(@Param('id') id: string, @Request() req) {
    return this.fuelRequestsService.approve(id, req.user.id);
  }

  @Post(':id/reject')
  @RequiredPermissions(PERMISSIONS.FLEET_FUEL_APPROVE)
  @ApiOperation({ summary: 'Rejeitar requisição de abastecimento' })
  reject(@Param('id') id: string, @Body() dto: RejectFuelRequestDto, @Request() req) {
    return this.fuelRequestsService.reject(id, dto, req.user.id);
  }
}
