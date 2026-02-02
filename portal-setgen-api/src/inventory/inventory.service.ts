import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockMovementDto } from './dto/stock-movement.dto';
import { Prisma, MovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ==================== PRODUTOS ====================

  async createProduct(createProductDto: CreateProductDto) {
    // Verificar se código já existe
    const existing = await this.prisma.product.findUnique({
      where: { code: createProductDto.code },
    });

    if (existing) {
      throw new ConflictException('Já existe um produto com este código');
    }

    const productData: Prisma.ProductCreateInput = {
      code: createProductDto.code,
      name: createProductDto.name,
      description: createProductDto.description,
      unit: createProductDto.unit,
      minStock: createProductDto.minStock,
      currentStock: createProductDto.currentStock || 0,
      unitCost: createProductDto.unitCost,
    };

    return this.prisma.product.create({
      data: productData,
    });
  }

  async findAllProducts(filters?: { active?: boolean; lowStock?: boolean }) {
    const where: Prisma.ProductWhereInput = {
      ...(filters?.active !== undefined && { active: filters.active }),
    };

    const products = await this.prisma.product.findMany({
      where,
      include: {
        _count: {
          select: {
            movements: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Filtrar produtos com estoque baixo se solicitado
    if (filters?.lowStock) {
      return products.filter((p) => p.currentStock <= p.minStock);
    }

    return products;
  }

  async findOneProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        movements: {
          take: 20,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            createdBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    await this.findOneProduct(id);

    // Verificar se novo código já existe (se estiver sendo alterado)
    if (updateProductDto.code) {
      const existing = await this.prisma.product.findFirst({
        where: {
          code: updateProductDto.code,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Já existe outro produto com este código');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async removeProduct(id: string) {
    const product = await this.findOneProduct(id);

    // Verificar se tem estoque
    if (product.currentStock > 0) {
      throw new BadRequestException(
        'Não é possível remover produto com estoque. Faça um ajuste de saída primeiro.',
      );
    }

    // Soft delete - apenas desativa
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
    });
  }

  // ==================== MOVIMENTAÇÕES ====================

  async createMovement(
    createMovementDto: CreateStockMovementDto,
    createdById: string,
  ) {
    const product = await this.findOneProduct(createMovementDto.productId);

    // Validar quantidade para saída
    if (
      createMovementDto.type === MovementType.EXIT &&
      product.currentStock < createMovementDto.quantity
    ) {
      throw new BadRequestException(
        `Estoque insuficiente. Disponível: ${product.currentStock} ${product.unit}`,
      );
    }

    // Calcular custo total
    const totalCost = createMovementDto.unitCost
      ? createMovementDto.unitCost * createMovementDto.quantity
      : null;

    const movementData: Prisma.StockMovementCreateInput = {
      product: { connect: { id: createMovementDto.productId } },
      type: createMovementDto.type,
      quantity: createMovementDto.quantity,
      unitCost: createMovementDto.unitCost,
      totalCost,
      reason: createMovementDto.reason,
      referenceId: createMovementDto.referenceId,
      createdBy: { connect: { id: createdById } },
    };

    // Criar movimentação
    const movement = await this.prisma.stockMovement.create({
      data: movementData,
      include: {
        product: {
          select: {
            code: true,
            name: true,
            unit: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Atualizar estoque do produto
    let newStock = product.currentStock;
    if (createMovementDto.type === MovementType.ENTRY) {
      newStock += createMovementDto.quantity;
    } else if (
      createMovementDto.type === MovementType.EXIT ||
      createMovementDto.type === MovementType.ADJUSTMENT
    ) {
      newStock -= createMovementDto.quantity;
    }

    await this.prisma.product.update({
      where: { id: createMovementDto.productId },
      data: {
        currentStock: newStock,
        ...(createMovementDto.unitCost && {
          unitCost: createMovementDto.unitCost,
        }),
      },
    });

    return {
      ...movement,
      previousStock: product.currentStock,
      newStock,
    };
  }

  async findAllMovements(filters?: {
    productId?: string;
    type?: MovementType;
    createdById?: string;
  }) {
    const where: Prisma.StockMovementWhereInput = {
      ...(filters?.productId && { productId: filters.productId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.createdById && { createdById: filters.createdById }),
    };

    return this.prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            code: true,
            name: true,
            unit: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneMovement(id: string) {
    const movement = await this.prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!movement) {
      throw new NotFoundException('Movimentação não encontrada');
    }

    return movement;
  }

  // ==================== RELATÓRIOS ====================

  async getLowStockProducts() {
    return this.prisma.product.findMany({
      where: {
        active: true,
        currentStock: {
          lte: this.prisma.product.fields.minStock,
        },
      },
      orderBy: {
        currentStock: 'asc',
      },
    });
  }

  async getInventoryValue() {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: {
        currentStock: true,
        unitCost: true,
      },
    });

    const totalValue = products.reduce((sum, product) => {
      const cost = product.unitCost ? Number(product.unitCost) : 0;
      return sum + product.currentStock * cost;
    }, 0);

    const totalItems = products.reduce(
      (sum, product) => sum + product.currentStock,
      0,
    );

    return {
      totalValue,
      totalItems,
      productsCount: products.length,
    };
  }

  async getMovementStatistics(startDate?: Date, endDate?: Date) {
    const where: Prisma.StockMovementWhereInput = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      select: {
        type: true,
        quantity: true,
        totalCost: true,
      },
    });

    const byType = movements.reduce(
      (acc, mov) => {
        acc[mov.type] = (acc[mov.type] || 0) + mov.quantity;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalCost = movements.reduce((sum, mov) => {
      return sum + (mov.totalCost ? Number(mov.totalCost) : 0);
    }, 0);

    return {
      total: movements.length,
      byType,
      totalCost,
    };
  }

  async getProductsNeedingRestock(threshold?: number) {
    const minThreshold = threshold || 0.2; // 20% do estoque mínimo por padrão

    const products = await this.prisma.product.findMany({
      where: {
        active: true,
      },
    });

    return products.filter((p) => {
      const stockPercentage = p.minStock > 0 ? p.currentStock / p.minStock : 1;
      return stockPercentage <= minThreshold;
    });
  }
}
