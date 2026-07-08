import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WarrantiesService } from './warranties.service';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../access-control/permissions.constants';

@ApiTags('Warranties')
@Controller('warranties')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class WarrantiesController {
  constructor(private readonly warrantiesService: WarrantiesService) {}

  @Get()
  @RequiredPermissions(PERMISSIONS.WARRANTY_VIEW, PERMISSIONS.WARRANTY_MANAGE)
  @ApiOperation({ summary: 'Listar garantias (opcionalmente por equipamento ou vencimento próximo)' })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiQuery({ name: 'expiringInDays', required: false, example: 30 })
  findAll(
    @Query('equipmentId') equipmentId?: string,
    @Query('expiringInDays') expiringInDays?: string,
  ) {
    return this.warrantiesService.findAll({
      equipmentId,
      expiringInDays: expiringInDays ? parseInt(expiringInDays, 10) : undefined,
    });
  }

  @Get(':id')
  @RequiredPermissions(PERMISSIONS.WARRANTY_VIEW, PERMISSIONS.WARRANTY_MANAGE)
  @ApiOperation({ summary: 'Buscar garantia por ID' })
  findOne(@Param('id') id: string) {
    return this.warrantiesService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermissions(PERMISSIONS.WARRANTY_MANAGE)
  @ApiOperation({ summary: 'Atualizar prazo/termos da garantia' })
  update(@Param('id') id: string, @Body() dto: UpdateWarrantyDto) {
    return this.warrantiesService.update(id, dto);
  }
}
