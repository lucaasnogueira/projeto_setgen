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
import { BatchMovementDto } from './dto/batch-movement.dto';
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
      barcode: createProductDto.barcode,
      ...(createProductDto.locationId && {
        location: { connect: { id: createProductDto.locationId } },
      }),
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
        location: true,
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
        location: true,
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

  async findProductByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      include: { location: true },
    });

    if (!product) {
      throw new NotFoundException('Nenhum produto encontrado com este código de barras');
    }

    return product;
  }

  async updateProductPhoto(id: string, photoUrl: string) {
    await this.findOneProduct(id);
    return this.prisma.product.update({ where: { id }, data: { photoUrl } });
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
    if (createMovementDto.type === MovementType.TRANSFER) {
      throw new BadRequestException(
        'Transferência entre depósitos ainda não é suportada (estoque de depósito único)',
      );
    }

    const isInbound =
      createMovementDto.type === MovementType.ENTRY ||
      createMovementDto.type === MovementType.ADJUSTMENT_IN;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: createMovementDto.productId },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Validar quantidade para saída (checagem otimista; a validação
      // definitiva contra estoque negativo ocorre após o update atômico abaixo)
      if (!isInbound && product.currentStock < createMovementDto.quantity) {
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
      const movement = await tx.stockMovement.create({
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

      // Atualizar estoque do produto de forma atômica (increment/decrement
      // no banco, não a partir do valor lido acima) para evitar corrida
      // entre movimentações concorrentes no mesmo produto.
      const updatedProduct = await tx.product.update({
        where: { id: createMovementDto.productId },
        data: {
          currentStock: isInbound
            ? { increment: createMovementDto.quantity }
            : { decrement: createMovementDto.quantity },
          ...(createMovementDto.unitCost && {
            unitCost: createMovementDto.unitCost,
          }),
        },
      });

      if (updatedProduct.currentStock < 0) {
        throw new BadRequestException(
          `Estoque insuficiente. Disponível: ${product.currentStock} ${product.unit}`,
        );
      }

      return {
        ...movement,
        previousStock: product.currentStock,
        newStock: updatedProduct.currentStock,
      };
    });
  }

  // Igual createMovement, mas cria N movimentações do mesmo tipo numa única
  // transação (tudo ou nada) — usado pelo fluxo de bipagem em lote.
  async createBatchMovement(dto: BatchMovementDto, createdById: string) {
    if (dto.type === MovementType.TRANSFER) {
      throw new BadRequestException(
        'Transferência entre depósitos ainda não é suportada (estoque de depósito único)',
      );
    }

    const isInbound =
      dto.type === MovementType.ENTRY || dto.type === MovementType.ADJUSTMENT_IN;

    return this.prisma.$transaction(async (tx) => {
      const movements: Prisma.StockMovementGetPayload<{
        include: { product: { select: { code: true; name: true; unit: true } } };
      }>[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Produto ${item.productId} não encontrado`);
        }

        if (!isInbound && product.currentStock < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para ${product.name}. Disponível: ${product.currentStock} ${product.unit}`,
          );
        }

        const movement = await tx.stockMovement.create({
          data: {
            product: { connect: { id: item.productId } },
            type: dto.type,
            quantity: item.quantity,
            reason: dto.reason,
            referenceId: dto.referenceId,
            createdBy: { connect: { id: createdById } },
          },
          include: {
            product: { select: { code: true, name: true, unit: true } },
          },
        });

        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: isInbound
              ? { increment: item.quantity }
              : { decrement: item.quantity },
          },
        });

        if (updatedProduct.currentStock < 0) {
          throw new BadRequestException(
            `Estoque insuficiente para ${product.name}. Disponível: ${product.currentStock} ${product.unit}`,
          );
        }

        movements.push(movement);
      }

      return movements;
    });
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
    // Comparação coluna-a-coluna (currentStock <= minStock) não é suportada
    // diretamente pelo `where` do Prisma Client; filtra em memória após buscar
    // os produtos ativos, mesma abordagem usada em findAllProducts({lowStock: true}).
    const products = await this.prisma.product.findMany({
      where: { active: true },
      orderBy: { currentStock: 'asc' },
    });

    return products.filter((p) => p.currentStock <= p.minStock);
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
