import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { ExpenseCategory, ExpenseCategoryType, ExpenseGroup, Prisma } from '@prisma/client';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    const name = dto.name.trim();
    const code = (dto.code?.trim() || name.slice(0, 4).toUpperCase()).replace(/\s+/g, '_');

    const existingCode = await this.prisma.expenseCategory.findUnique({
      where: { code },
    });

    if (existingCode) {
      // Se já existir código igual, gera sufixo único
      const uniqueCode = `${code}_${Date.now().toString().slice(-4)}`;
      return this.prisma.expenseCategory.create({
        data: {
          name,
          code: uniqueCode,
          type: dto.type || ExpenseCategoryType.OPERATIONAL,
          group: dto.group || ExpenseGroup.SERVICE_EXPENSES,
          description: dto.description?.trim(),
          color: dto.color?.trim() || '#E2661D',
          icon: dto.icon?.trim() || 'Receipt',
          isActive: dto.isActive !== undefined ? dto.isActive : true,
          defaultBudget: dto.defaultBudget ? new Prisma.Decimal(dto.defaultBudget) : null,
        },
      });
    }

    return this.prisma.expenseCategory.create({
      data: {
        name,
        code,
        type: dto.type || ExpenseCategoryType.OPERATIONAL,
        group: dto.group || ExpenseGroup.SERVICE_EXPENSES,
        description: dto.description?.trim(),
        color: dto.color?.trim() || '#E2661D',
        icon: dto.icon?.trim() || 'Receipt',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        defaultBudget: dto.defaultBudget ? new Prisma.Decimal(dto.defaultBudget) : null,
      },
    });
  }

  async findAll(type?: ExpenseCategoryType, group?: ExpenseGroup, active?: boolean): Promise<ExpenseCategory[]> {
    return this.prisma.expenseCategory.findMany({
      where: {
        ...(type && { type }),
        ...(group && { group }),
        ...(active !== undefined && { isActive: active }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<ExpenseCategory> {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria de despesa não encontrada');
    }

    return category;
  }

  async update(id: string, dto: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
    await this.findOne(id);

    return this.prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.type && { type: dto.type }),
        ...(dto.group && { group: dto.group }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
        ...(dto.color !== undefined && { color: dto.color?.trim() }),
        ...(dto.icon !== undefined && { icon: dto.icon?.trim() }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.defaultBudget !== undefined && {
          defaultBudget: dto.defaultBudget ? new Prisma.Decimal(dto.defaultBudget) : null,
        }),
      },
    });
  }

  async remove(id: string): Promise<ExpenseCategory> {
    const category = await this.findOne(id);

    // Verificar se tem despesas vinculadas
    const count = await this.prisma.expense.count({
      where: { categoryId: id },
    });

    if (count > 0) {
      // Desativa em vez de deletar para manter integridade relacional
      return this.prisma.expenseCategory.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.expenseCategory.delete({
      where: { id },
    });
  }
}
