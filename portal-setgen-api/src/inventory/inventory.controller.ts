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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { InventoryService } from './inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockMovementDto } from './dto/stock-movement.dto';
import { BatchMovementDto } from './dto/batch-movement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, MovementType } from '@prisma/client';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==================== PRODUTOS ====================

  @Post('products')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Criar novo produto' })
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.inventoryService.createProduct(createProductDto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Listar todos os produtos' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean })
  findAllProducts(
    @Query('active') active?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.inventoryService.findAllProducts({
      active: active === 'true' ? true : active === 'false' ? false : undefined,
      lowStock: lowStock === 'true',
    });
  }

  @Get('products/low-stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Listar produtos com estoque baixo' })
  getLowStockProducts() {
    return this.inventoryService.getLowStockProducts();
  }

  @Get('products/needing-restock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Produtos que precisam reposição urgente' })
  @ApiQuery({ name: 'threshold', required: false, example: 0.2 })
  getProductsNeedingRestock(@Query('threshold') threshold?: string) {
    const thresholdNum = threshold ? parseFloat(threshold) : undefined;
    return this.inventoryService.getProductsNeedingRestock(thresholdNum);
  }

  @Get('products/barcode/:barcode')
  @ApiOperation({ summary: 'Buscar produto por código de barras (usado no scanner)' })
  findProductByBarcode(@Param('barcode') barcode: string) {
    return this.inventoryService.findProductByBarcode(barcode);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  findOneProduct(@Param('id') id: string) {
    return this.inventoryService.findOneProduct(id);
  }

  @Patch('products/:id')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Atualizar produto' })
  updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.inventoryService.updateProduct(id, updateProductDto);
  }

  @Post('products/:id/photo')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Enviar foto do produto' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
          return callback(new BadRequestException('Apenas imagens são permitidas'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  uploadProductPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem é obrigatório');
    }
    return this.inventoryService.updateProductPhoto(id, file.path);
  }

  @Delete('products/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desativar produto (apenas ADMIN)' })
  removeProduct(@Param('id') id: string) {
    return this.inventoryService.removeProduct(id);
  }

  // ==================== MOVIMENTAÇÕES ====================

  @Post('movements')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Registrar movimentação de estoque' })
  createMovement(
    @Body() createMovementDto: CreateStockMovementDto,
    @Request() req,
  ) {
    return this.inventoryService.createMovement(createMovementDto, req.user.id);
  }

  @Post('movements/batch')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Registrar movimentação em lote (bipagem de vários itens de uma vez)' })
  createBatchMovement(@Body() dto: BatchMovementDto, @Request() req) {
    return this.inventoryService.createBatchMovement(dto, req.user.id);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Listar todas as movimentações' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'type', enum: MovementType, required: false })
  @ApiQuery({ name: 'createdById', required: false })
  findAllMovements(
    @Query('productId') productId?: string,
    @Query('type') type?: MovementType,
    @Query('createdById') createdById?: string,
  ) {
    return this.inventoryService.findAllMovements({
      productId,
      type,
      createdById,
    });
  }

  @Get('movements/:id')
  @ApiOperation({ summary: 'Buscar movimentação por ID' })
  findOneMovement(@Param('id') id: string) {
    return this.inventoryService.findOneMovement(id);
  }

  // ==================== RELATÓRIOS ====================

  @Get('reports/inventory-value')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Valor total do estoque' })
  getInventoryValue() {
    return this.inventoryService.getInventoryValue();
  }

  @Get('reports/movement-statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Estatísticas de movimentação' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getMovementStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.inventoryService.getMovementStatistics(start, end);
  }
}
