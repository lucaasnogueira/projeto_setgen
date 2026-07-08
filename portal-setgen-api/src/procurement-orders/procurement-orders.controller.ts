import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProcurementOrdersService } from './procurement-orders.service';
import { CreateProcurementOrderDto } from './dto/create-procurement-order.dto';
import { UpdateProcurementOrderDto } from './dto/update-procurement-order.dto';
import { UpdateProcurementOrderStatusDto } from './dto/update-procurement-order-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../access-control/permissions.constants';
import { ProcurementOrderStatus } from '@prisma/client';

@ApiTags('Procurement Orders')
@Controller('procurement-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProcurementOrdersController {
  constructor(private readonly procurementOrdersService: ProcurementOrdersService) {}

  @Post()
  @RequiredPermissions(PERMISSIONS.PROCUREMENT_MANAGE)
  @ApiOperation({ summary: 'Criar pedido de compra a fornecedor' })
  create(@Body() dto: CreateProcurementOrderDto) {
    return this.procurementOrdersService.create(dto);
  }

  @Get()
  @RequiredPermissions(PERMISSIONS.PROCUREMENT_VIEW, PERMISSIONS.PROCUREMENT_MANAGE)
  @ApiOperation({ summary: 'Listar pedidos de compra' })
  @ApiQuery({ name: 'status', enum: ProcurementOrderStatus, required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  findAll(
    @Query('status') status?: ProcurementOrderStatus,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.procurementOrdersService.findAll({ status, supplierId });
  }

  @Get(':id')
  @RequiredPermissions(PERMISSIONS.PROCUREMENT_VIEW, PERMISSIONS.PROCUREMENT_MANAGE)
  @ApiOperation({ summary: 'Buscar pedido de compra por ID' })
  findOne(@Param('id') id: string) {
    return this.procurementOrdersService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermissions(PERMISSIONS.PROCUREMENT_MANAGE)
  @ApiOperation({ summary: 'Atualizar pedido de compra (somente em cotação)' })
  update(@Param('id') id: string, @Body() dto: UpdateProcurementOrderDto) {
    return this.procurementOrdersService.update(id, dto);
  }

  @Patch(':id/status')
  @RequiredPermissions(PERMISSIONS.PROCUREMENT_MANAGE)
  @ApiOperation({ summary: 'Atualizar status (cotação → emitido → aguardando entrega → recebido)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProcurementOrderStatusDto,
    @Request() req,
  ) {
    return this.procurementOrdersService.updateStatus(id, dto, req.user.id);
  }

  @Delete(':id')
  @RequiredPermissions(PERMISSIONS.PROCUREMENT_MANAGE)
  @ApiOperation({ summary: 'Remover pedido de compra (somente em cotação ou cancelado)' })
  remove(@Param('id') id: string) {
    return this.procurementOrdersService.remove(id);
  }
}
