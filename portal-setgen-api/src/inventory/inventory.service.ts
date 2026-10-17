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

    const rawSalePrice = createProductDto.salePrice ?? createProductDto.unitPrice;
    const rawFixedSalePrice = createProductDto.fixedSalePrice;
    const productData: Prisma.ProductCreateInput = {
      code: createProductDto.code,
      name: createProductDto.name,
      description: createProductDto.description,
      unit: createProductDto.unit,
      minStock: createProductDto.minStock,
      currentStock: createProductDto.currentStock || 0,
      unitCost: createProductDto.unitCost,
      salePrice: rawSalePrice !== undefined && rawSalePrice !== null ? new Prisma.Decimal(rawSalePrice) : undefined,
      marginPercent: createProductDto.marginPercent ?? 30,
      fixedSalePrice: rawFixedSalePrice !== undefined && rawFixedSalePrice !== null ? new Prisma.Decimal(rawFixedSalePrice) : undefined,
      supplierQuotations: createProductDto.supplierQuotations,
      notes: createProductDto.notes,
      sheetId: createProductDto.sheetId,
      ncm: createProductDto.ncm,
      category: createProductDto.category,
      externalCode: createProductDto.externalCode,
      photoUrl: createProductDto.photoUrl,
      active: createProductDto.active ?? true,
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

    const { unitPrice, locationId, fixedSalePrice, unitCost, ...rest } = updateProductDto as any;
    const rawSalePrice = updateProductDto.salePrice ?? unitPrice;

    const data: Prisma.ProductUpdateInput = {
      ...rest,
      ...(rawSalePrice !== undefined && {
        salePrice: rawSalePrice !== null ? new Prisma.Decimal(rawSalePrice) : null,
      }),
      ...(fixedSalePrice !== undefined && {
        fixedSalePrice: fixedSalePrice !== null ? new Prisma.Decimal(fixedSalePrice) : null,
      }),
      ...(unitCost !== undefined && {
        unitCost: unitCost !== null ? new Prisma.Decimal(unitCost) : null,
      }),
      ...(locationId !== undefined && {
        location: locationId ? { connect: { id: locationId } } : { disconnect: true },
      }),
    };

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async bulkImportProducts(items: any[]) {
    const results = {
      created: 0,
      updated: 0,
      total: items.length,
      errors: [] as string[],
    };

    for (const item of items) {
      try {
        const parseNum = (val: any): number => {
          if (val === undefined || val === null || val === '') return 0;
          if (typeof val === 'number') return val;
          const s = String(val).replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
          const n = parseFloat(s);
          return isNaN(n) ? 0 : n;
        };

        const name = (item.Nome || item.name || item.product || item.produto || '').trim();
        if (!name || name.toLowerCase().includes('nome do produto')) {
          continue;
        }

        const sheetId = item.sheetId ? Number(item.sheetId) : (item.id ? Number(item.id) : null);
        const code = (item.code || item.codigo || item['Código'] || '').trim() || (sheetId ? `PRD-${sheetId}` : `PRD-${Date.now()}-${Math.floor(Math.random()*1000)}`);
        const unit = (item.unit || item.unidade || item.Unidade || 'un').trim();
        const category = (item.Categoria || item.category || item.categoria || '').trim() || null;
        const description = (item.Descrição || item.description || '').trim() || null;
        const marginPercent = item.marginPercent !== undefined && item.marginPercent !== '' ? parseNum(item.marginPercent) : 30;
        
        const rawFixedSale = item['Valor unitário'] !== undefined ? item['Valor unitário'] : item.fixedSalePrice;
        const fixedSalePrice = rawFixedSale !== undefined && rawFixedSale !== '' && parseNum(rawFixedSale) > 0 ? parseNum(rawFixedSale) : null;
        
        const notes = item.notes || item.observacoes || description || null;
        const supplierQuotations = item.supplierQuotations || [];
        
        const minStock = parseNum(item['Estoque mínimo'] !== undefined ? item['Estoque mínimo'] : item.minStock);
        let currentStock = parseNum(
          item['Estoque total'] !== undefined 
            ? item['Estoque total'] 
            : (item['Estoque empresa'] !== undefined ? item['Estoque empresa'] : item.currentStock)
        );

        // Sanitização de estoque dummy/ilimitado do Auvo (ex: 9999, 10000, 10000000)
        const rawNameLower = name.toLowerCase();
        if (
          currentStock >= 9999 ||
          (currentStock >= 2000 && !rawNameLower.includes('cabo') && !rawNameLower.includes('terminal')) ||
          rawNameLower.includes('cabos elétricos de força (cabo de baixa)')
        ) {
          currentStock = 0;
        }

        // Calcular custo e venda de forma fidedigna (sem fabricar custos irreais)
        let unitCost: number | null = null;
        if (item['Custo unitário'] !== undefined && item['Custo unitário'] !== '') {
          const parsedCusto = parseNum(item['Custo unitário']);
          unitCost = parsedCusto > 0 ? parsedCusto : null;
        } else if (Array.isArray(supplierQuotations) && supplierQuotations.length > 0) {
          const usedQuotation = supplierQuotations.find((q: any) => q.isUsed || q.useQuotation === 'x');
          if (usedQuotation && parseNum(usedQuotation.costPrice) > 0) {
            unitCost = parseNum(usedQuotation.costPrice);
          } else {
            const validCosts = supplierQuotations
              .map((q: any) => parseNum(q.costPrice))
              .filter((c: number) => !isNaN(c) && c > 0);
            if (validCosts.length > 0) {
              unitCost = Math.min(...validCosts);
            }
          }
        } else if (item.unitCost !== undefined && item.unitCost !== '') {
          const parsedCusto = parseNum(item.unitCost);
          unitCost = parsedCusto > 0 ? parsedCusto : null;
        } else if (item.costPrice !== undefined && item.costPrice !== '') {
          const parsedCusto = parseNum(item.costPrice);
          unitCost = parsedCusto > 0 ? parsedCusto : null;
        } else if (item.precoCusto !== undefined && item.precoCusto !== '') {
          const parsedCusto = parseNum(item.precoCusto);
          unitCost = parsedCusto > 0 ? parsedCusto : null;
        }

        let salePrice: number | null = null;
        if (fixedSalePrice !== null && fixedSalePrice > 0) {
          salePrice = fixedSalePrice;
        } else if (item.salePrice && Number(item.salePrice) > 0) {
          salePrice = Number(item.salePrice);
        } else if (unitCost !== null && unitCost > 0) {
          salePrice = Number((unitCost * (1 + marginPercent / 100)).toFixed(2));
        }

        // Buscar se já existe por sheetId, código ou nome
        const orClauses: Prisma.ProductWhereInput[] = [];
        if (sheetId) orClauses.push({ sheetId });
        if (code) orClauses.push({ code });
        if (name) orClauses.push({ name });

        const existing = orClauses.length > 0
          ? await this.prisma.product.findFirst({
              where: { OR: orClauses },
            })
          : null;

        if (existing) {
          await this.prisma.product.update({
            where: { id: existing.id },
            data: {
              name: name || existing.name,
              unit: unit || existing.unit,
              category: category || existing.category,
              marginPercent,
              minStock: minStock > 0 ? minStock : existing.minStock,
              currentStock: currentStock > 0 ? currentStock : existing.currentStock,
              fixedSalePrice: fixedSalePrice !== null ? new Prisma.Decimal(fixedSalePrice) : existing.fixedSalePrice,
              unitCost: unitCost !== null && unitCost > 0 ? new Prisma.Decimal(unitCost) : existing.unitCost,
              salePrice: salePrice !== null && salePrice > 0 ? new Prisma.Decimal(salePrice) : existing.salePrice,
              supplierQuotations: supplierQuotations.length > 0 ? supplierQuotations : existing.supplierQuotations,
              notes: notes || existing.notes,
              sheetId: sheetId ?? existing.sheetId,
            },
          });
          results.updated++;
        } else {
          await this.prisma.product.create({
            data: {
              code,
              name,
              unit,
              category,
              minStock,
              currentStock,
              marginPercent,
              fixedSalePrice: fixedSalePrice !== null ? new Prisma.Decimal(fixedSalePrice) : null,
              unitCost: unitCost !== null && unitCost > 0 ? new Prisma.Decimal(unitCost) : null,
              salePrice: salePrice !== null && salePrice > 0 ? new Prisma.Decimal(salePrice) : null,
              supplierQuotations,
              notes,
              sheetId,
              active: true,
            },
          });
          results.created++;
        }
      } catch (err: any) {
        results.errors.push(`Erro no item ${item.name || item.code}: ${err.message}`);
      }
    }

    return results;
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

  /**
   * `externalTx` permite que a movimentação participe de uma transação maior
   * (ex: separação de material, que dá baixa em vários produtos e só então
   * muda o status da solicitação). Sem isso, cada baixa commitava sozinha e
   * uma falha no meio deixava estoque baixado sem a solicitação separada.
   */
  async createMovement(
    createMovementDto: CreateStockMovementDto,
    createdById: string,
    externalTx?: Prisma.TransactionClient,
  ) {
    if (createMovementDto.type === MovementType.TRANSFER) {
      throw new BadRequestException(
        'Transferência entre depósitos ainda não é suportada (estoque de depósito único)',
      );
    }

    const isInbound =
      createMovementDto.type === MovementType.ENTRY ||
      createMovementDto.type === MovementType.ADJUSTMENT_IN;

    const run = async (tx: Prisma.TransactionClient) => {
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
    };

    // Prisma não suporta transação aninhada — se já estamos dentro de uma,
    // reaproveita o client em vez de abrir outra.
    return externalTx ? run(externalTx) : this.prisma.$transaction(run);
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
