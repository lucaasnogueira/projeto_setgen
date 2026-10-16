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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
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
  @RequiredPermissions(
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.MATERIAL_REQUESTS_MANAGE,
  )
  @ApiOperation({ summary: 'Listar pedidos de compra' })
  @ApiQuery({ name: 'status', enum: ProcurementOrderStatus, required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('status') status?: ProcurementOrderStatus,
    @Query('supplierId') supplierId?: string,
    @Query('search') search?: string,
  ) {
    return this.procurementOrdersService.findAll({ status, supplierId, search });
  }

  @Get(':id')
  @RequiredPermissions(
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
  )
  @ApiOperation({ summary: 'Buscar pedido de compra por ID' })
  findOne(@Param('id') id: string) {
    return this.procurementOrdersService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermissions(
    PERMISSIONS.PROCUREMENT_MANAGE,
    PERMISSIONS.INVENTORY_MANAGE,
  )
  @ApiOperation({ summary: 'Atualizar pedido de compra (fornecedor, entrega, itens, preços, NF)' })
  update(@Param('id') id: string, @Body() dto: UpdateProcurementOrderDto) {
    return this.procurementOrdersService.update(id, dto);
  }

  @Post(':id/invoice-file')
  @RequiredPermissions(
    PERMISSIONS.PROCUREMENT_MANAGE,
    PERMISSIONS.INVENTORY_MANAGE,
  )
  @ApiOperation({ summary: 'Anexar arquivo da Nota Fiscal de compra (PDF, XML, imagem)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = './uploads/invoices';
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `nf-compra-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadInvoiceFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.procurementOrdersService.attachInvoiceFile(
      id,
      file.path.replace(/\\/g, '/'),
    );
  }

  @Patch(':id/status')
  @RequiredPermissions(
    PERMISSIONS.PROCUREMENT_MANAGE,
    PERMISSIONS.INVENTORY_MANAGE,
  )
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
