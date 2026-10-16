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
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Purchase Orders')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({
    summary: 'Criar nova Ordem de Compra / Autorização de Retirada',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/purchase-orders',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `purchase-order-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/i)) {
          return callback(
            new BadRequestException('Apenas arquivos PDF ou imagens são permitidos'),
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
  create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (typeof createPurchaseOrderDto.items === 'string') {
      try {
        createPurchaseOrderDto.items = JSON.parse(createPurchaseOrderDto.items as string);
      } catch (e) {
        // ignore
      }
    }
    const filePath = file?.path || undefined;
    return this.purchaseOrdersService.create(
      createPurchaseOrderDto,
      filePath,
      req.user?.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as Ordens de Compra / Retiradas' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.purchaseOrdersService.findAll({ search, status });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Obter estatísticas das Ordens de Compra' })
  getStatistics() {
    return this.purchaseOrdersService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar Ordem de Compra por ID' })
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar Ordem de Compra / Autorização de Retirada' })
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ) {
    if (typeof updatePurchaseOrderDto.items === 'string') {
      try {
        updatePurchaseOrderDto.items = JSON.parse(updatePurchaseOrderDto.items as string);
      } catch (e) {
        // ignore
      }
    }
    return this.purchaseOrdersService.update(id, updatePurchaseOrderDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Deletar Ordem de Compra' })
  remove(@Param('id') id: string) {
    return this.purchaseOrdersService.remove(id);
  }
}
