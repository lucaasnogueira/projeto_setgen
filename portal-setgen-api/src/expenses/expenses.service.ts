import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { ExpenseStatus, Prisma } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, userId: string) {
    try {
      console.log('🔍 Starting expense creation...');
      console.log('📦 DTO:', JSON.stringify(createExpenseDto, null, 2));
      console.log('👤 User ID:', userId);

      // Validações
      await this.validateExpense(createExpenseDto);
      console.log('✅ Validation passed');

      // Gerar código único
      const code = await this.generateExpenseCode();
      console.log('🔢 Generated code:', code);

      // Criar despesa
      const expense = await this.prisma.expense.create({
        data: {
          ...createExpenseDto,
          amount: new Prisma.Decimal(createExpenseDto.amount),
          paidAmount: createExpenseDto.paidAmount
            ? new Prisma.Decimal(createExpenseDto.paidAmount)
            : null,
          code,
          userId,
          status: ExpenseStatus.PENDING,
          date: new Date(createExpenseDto.date),
          dueDate: new Date(createExpenseDto.dueDate),
          paymentDate: createExpenseDto.paymentDate
            ? new Date(createExpenseDto.paymentDate)
            : null,
          competenceDate: new Date(createExpenseDto.competenceDate),
        },
        include: {
          category: true,
          client: true,
          user: { select: { id: true, name: true, email: true } },
          visit: true,
          serviceOrder: true,
        },
      });

      console.log('✅ Expense created successfully:', expense.id);

      // Se for parcelada, criar parcelas
      if (
        createExpenseDto.totalInstallments &&
        createExpenseDto.totalInstallments > 1
      ) {
        console.log('📊 Creating installments...');
        await this.createInstallments(expense, createExpenseDto, userId);
      }

      return expense;
    } catch (error) {
      console.error('❌ Error in create method:', error);
      console.error('📋 DTO that caused error:', JSON.stringify(createExpenseDto, null, 2));
      
      // Log specific error types
      if (error.code) {
        console.error('🔴 Database error code:', error.code);
      }
      if (error.meta) {
        console.error('🔴 Error metadata:', error.meta);
      }
      
      throw error;
    }
  }

  async getBankAccounts() {
    return this.prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAll(filters: FilterExpenseDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
      ...where
    } = filters;

    // Construir where clause
    const whereClause = this.buildWhereClause(where);

    // Buscar com paginação
    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where: whereClause,
        include: {
          category: true,
          client: { select: { id: true, companyName: true, tradeName: true } },
          user: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true, email: true } },
          visit: { select: { id: true, visitDate: true, location: true } },
          serviceOrder: { select: { id: true, orderNumber: true } },
          bankAccount: true,
          attachments: true,
          parentExpense: {
            select: { id: true, code: true, description: true },
          },
          installments: {
            select: {
              id: true,
              code: true,
              installment: true,
              totalInstallments: true,
              amount: true,
              status: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expense.count({ where: whereClause }),
    ]);

    return {
      data: expenses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        costCenter: true,
        client: true,
        user: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        visit: true,
        serviceOrder: true,
        bankAccount: true,
        recurring: true,
        attachments: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        parentExpense: true,
        installments: {
          orderBy: { installment: 'asc' },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException(`Despesa com ID ${id} não encontrada`);
    }

    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    await this.findOne(id);

    const updateData: any = { ...updateExpenseDto };

    // Converter valores Decimal
    if (updateExpenseDto.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(updateExpenseDto.amount);
    }
    if (updateExpenseDto.paidAmount !== undefined) {
      updateData.paidAmount = new Prisma.Decimal(updateExpenseDto.paidAmount);
    }

    // Converter datas
    if (updateExpenseDto.date) {
      updateData.date = new Date(updateExpenseDto.date);
    }
    if (updateExpenseDto.dueDate) {
      updateData.dueDate = new Date(updateExpenseDto.dueDate);
    }
    if (updateExpenseDto.paymentDate) {
      updateData.paymentDate = new Date(updateExpenseDto.paymentDate);
    }
    if (updateExpenseDto.competenceDate) {
      updateData.competenceDate = new Date(updateExpenseDto.competenceDate);
    }

    return this.prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        client: true,
        user: true,
        approver: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.expense.delete({
      where: { id },
    });
  }

  async approve(id: string, approverId: string, comments?: string) {
    const expense = await this.findOne(id);

    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        'Apenas despesas pendentes podem ser aprovadas',
      );
    }

    return this.prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.APPROVED,
        approvedBy: approverId,
        approvalDate: new Date(),
        notes: comments
          ? `${expense.notes || ''}\n[Aprovação] ${comments}`
          : expense.notes,
      },
      include: {
        category: true,
        user: true,
        approver: true,
      },
    });
  }

  async reject(id: string, approverId: string, reason: string) {
    const expense = await this.findOne(id);

    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        'Apenas despesas pendentes podem ser rejeitadas',
      );
    }

    return this.prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.REJECTED,
        approvedBy: approverId,
        approvalDate: new Date(),
        rejectionReason: reason,
      },
      include: {
        category: true,
        user: true,
        approver: true,
      },
    });
  }

  async markAsPaid(id: string, paymentDate: Date, paidAmount?: number) {
    const expense = await this.findOne(id);

    if (expense.status !== ExpenseStatus.APPROVED) {
      throw new BadRequestException(
        'Apenas despesas aprovadas podem ser marcadas como pagas',
      );
    }

    const finalPaidAmount = paidAmount
      ? new Prisma.Decimal(paidAmount)
      : expense.amount;
    const status =
      finalPaidAmount.equals(expense.amount)
        ? ExpenseStatus.PAID
        : ExpenseStatus.PARTIALLY_PAID;

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data: {
        status,
        paymentDate,
        paidAmount: finalPaidAmount,
      },
    });

    // Atualizar saldo da conta bancária
    if (expense.bankAccountId) {
      await this.updateBankAccountBalance(
        expense.bankAccountId,
        -Number(finalPaidAmount),
      );
    }

    return updatedExpense;
  }

  async getDashboardData(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Total de despesas do mês
    const totalExpenses = await this.prisma.expense.aggregate({
      where: {
        competenceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Despesas pagas
    const paidExpenses = await this.prisma.expense.aggregate({
      where: {
        competenceDate: {
          gte: startDate,
          lte: endDate,
        },
        status: ExpenseStatus.PAID,
      },
      _sum: { amount: true },
      _count: true,
    });

    // Despesas pendentes
    const pendingExpenses = await this.prisma.expense.aggregate({
      where: {
        competenceDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: [ExpenseStatus.PENDING, ExpenseStatus.APPROVED] },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Por categoria
    const byCategory = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        competenceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Incluir dados da categoria
    const categoriesData = await Promise.all(
      byCategory.map(async (item) => {
        const category = await this.prisma.expenseCategory.findUnique({
          where: { id: item.categoryId },
        });
        return {
          category,
          total: item._sum.amount,
          count: item._count,
        };
      }),
    );

    // Por tipo
    const byType = await this.prisma.expense.groupBy({
      by: ['type'],
      where: {
        competenceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    // Saldo das contas
    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: { isActive: true },
    });

    const totalBalance = bankAccounts.reduce(
      (sum, acc) => sum + Number(acc.balance),
      0,
    );


  // Fluxo de caixa diário (apenas despesas por enquanto)
  const dailyExpenses = await this.prisma.expense.groupBy({
    by: ['paymentDate'],
    where: {
      paymentDate: {
        gte: startDate,
        lte: endDate,
      },
      status: ExpenseStatus.PAID,
    },
    _sum: { amount: true },
  });

  // Mapear para o formato do gráfico
  // Criar mapa de dias do mês
  const daysInMonth = new Date(year, month, 0).getDate();
  const cashFlow: any[] = [];
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayExpense = dailyExpenses.find(e => 
      e.paymentDate && new Date(e.paymentDate).toISOString().split('T')[0] === dateStr
    );

    const expenseAmount = Number(dayExpense?._sum?.amount || 0);
    const incomeAmount = 0; // Futuro: Implementar receitas

    cashFlow.push({
      date: dateStr,
      income: incomeAmount,
      expense: expenseAmount,
      balance: incomeAmount - expenseAmount
    });
  }

  return {
    summary: {
      totalExpenses: Number(totalExpenses._sum.amount || 0),
      totalCount: totalExpenses._count,
      paidExpenses: Number(paidExpenses._sum.amount || 0),
      paidCount: paidExpenses._count,
      pendingExpenses: Number(pendingExpenses._sum.amount || 0),
      pendingCount: pendingExpenses._count,
      totalBalance,
    },
    byCategory: categoriesData.sort(
      (a, b) => Number(b.total) - Number(a.total),
    ),
    byType,
    bankAccounts,
    cashFlow,
  };
}

  // Métodos auxiliares privados

  private async validateExpense(dto: CreateExpenseDto) {
    // Validar categoria existe
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Categoria não encontrada');
    }

    // Se vinculada a OS, validar que cliente é o mesmo
    if (dto.serviceOrderId && dto.clientId) {
      const serviceOrder = await this.prisma.serviceOrder.findUnique({
        where: { id: dto.serviceOrderId },
      });
      if (serviceOrder && serviceOrder.clientId !== dto.clientId) {
        throw new BadRequestException(
          'Cliente da despesa deve ser o mesmo da Ordem de Serviço',
        );
      }
    }
  }

  private async generateExpenseCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.expense.count({
      where: {
        code: {
          startsWith: `DESP-${year}-`,
        },
      },
    });
    return `DESP-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async createInstallments(
    parentExpense: any,
    dto: CreateExpenseDto,
    userId: string,
  ) {
    if (!dto.totalInstallments) return;

    const installmentAmount = Number(dto.amount) / dto.totalInstallments;
    const installments: Prisma.ExpenseCreateManyInput[] = [];

    const year = new Date().getFullYear();
    // Contar despesas existentes para gerar códigos sequenciais
    // Nota: Como a despesa pai já foi criada, o count a inclui.
    let currentCount = await this.prisma.expense.count({
      where: { code: { startsWith: `DESP-${year}-` } },
    });

    for (let i = 2; i <= dto.totalInstallments; i++) {
      const dueDate = new Date(dto.dueDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      currentCount++;
      const code = `DESP-${year}-${String(currentCount).padStart(4, '0')}`;

      installments.push({
        description: `${dto.description} - Parcela ${i}/${dto.totalInstallments}`,
        type: dto.type,
        amount: new Prisma.Decimal(installmentAmount),
        date: new Date(dto.date),
        dueDate,
        competenceDate: dueDate,
        categoryId: dto.categoryId,
        costCenterId: dto.costCenterId,
        paymentMethod: dto.paymentMethod,
        bankAccountId: dto.bankAccountId,
        userId,
        status: ExpenseStatus.PENDING,
        parentExpenseId: parentExpense.id,
        installment: i,
        totalInstallments: dto.totalInstallments,
        code,
        supplier: dto.supplier,
        tags: dto.tags,
        isFixed: false,
      });
    }

    await this.prisma.expense.createMany({
      data: installments,
    });

    // Atualizar despesa pai
    await this.prisma.expense.update({
      where: { id: parentExpense.id },
      data: {
        installment: 1,
        amount: new Prisma.Decimal(installmentAmount),
      },
    });
  }

  private buildWhereClause(filters: Partial<FilterExpenseDto>) {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    if (filters.competenceMonth) {
      const [year, month] = filters.competenceMonth.split('-');
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      where.competenceDate = { gte: startDate, lte: endDate };
    }

    if (filters.type) where.type = { in: filters.type };
    if (filters.status) where.status = { in: filters.status };
    if (filters.categoryId) where.categoryId = { in: filters.categoryId };
    if (filters.costCenterId)
      where.costCenterId = { in: filters.costCenterId };
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.visitId) where.visitId = filters.visitId;
    if (filters.serviceOrderId)
      where.serviceOrderId = filters.serviceOrderId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.paymentMethod)
      where.paymentMethod = { in: filters.paymentMethod };
    if (filters.bankAccountId) where.bankAccountId = filters.bankAccountId;
    if (filters.isRecurring !== undefined)
      where.isRecurring = filters.isRecurring;
    if (filters.isFixed !== undefined) where.isFixed = filters.isFixed;
    if (filters.reconciled !== undefined)
      where.reconciled = filters.reconciled;

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined)
        where.amount.gte = filters.minAmount;
      if (filters.maxAmount !== undefined)
        where.amount.lte = filters.maxAmount;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    return where;
  }

  private async updateBankAccountBalance(accountId: string, amount: number) {
    await this.prisma.bankAccount.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }
}
