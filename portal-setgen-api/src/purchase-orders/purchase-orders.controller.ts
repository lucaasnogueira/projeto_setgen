import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, PurchaseOrderStatus } from '@prisma/client';

@ApiTags('Purchase Orders')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({
    summary: 'Criar nova Ordem de Compra (com upload de arquivo)',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/purchase-orders',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `purchase-order-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException(
              'Apenas arquivos PDF ou imagens são permitidos',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo da Ordem de Compra é obrigatório');
    }

    return this.purchaseOrdersService.create(
      createPurchaseOrderDto,
      file.path,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as Ordens de Compra' })
  @ApiQuery({ name: 'serviceOrderId', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'status', enum: PurchaseOrderStatus, required: false })
  findAll(
    @Query('serviceOrderId') serviceOrderId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: PurchaseOrderStatus,
  ) {
    return this.purchaseOrdersService.findAll({
      serviceOrderId,
      clientId,
      status,
    });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Obter estatísticas das Ordens de Compra' })
  getStatistics() {
    return this.purchaseOrdersService.getStatistics();
  }

  @Get('expiring')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Listar OCs próximas do vencimento' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  getExpiringOrders(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days) : 7;
    return this.purchaseOrdersService.getExpiringOrders(daysAhead);
  }

  @Post('check-expired')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Verificar e marcar OCs vencidas' })
  checkExpiredOrders() {
    return this.purchaseOrdersService.checkExpiredOrders();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar Ordem de Compra por ID' })
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar Ordem de Compra' })
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @Request() req,
  ) {
    return this.purchaseOrdersService.update(
      id,
      updatePurchaseOrderDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deletar Ordem de Compra (apenas ADMIN)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.purchaseOrdersService.remove(id, req.user.role);
  }
}
