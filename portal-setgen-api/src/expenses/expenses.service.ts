import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { ExpenseStatus, CashFlowType, PaymentMethod, Prisma } from '@prisma/client';
import {
  parseBusinessDate,
  parseBusinessDateEndOfDay,
  addMonthsUtc,
  addDaysUtc,
} from '../common/date/business-date.util';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, userId: string) {
    // Validações
    await this.validateExpense(createExpenseDto);

    // Gerar código único
    const code = await this.generateExpenseCode();

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
        date: parseBusinessDate(createExpenseDto.date),
        dueDate: parseBusinessDate(createExpenseDto.dueDate),
        paymentDate: createExpenseDto.paymentDate
          ? parseBusinessDate(createExpenseDto.paymentDate)
          : null,
        competenceDate: parseBusinessDate(createExpenseDto.competenceDate),
      },
      include: {
        category: true,
        client: true,
        user: { select: { id: true, name: true, email: true } },
        visit: true,
        serviceOrder: true,
      },
    });

    // Se for parcelada, criar parcelas
    if (
      createExpenseDto.totalInstallments &&
      createExpenseDto.totalInstallments > 1
    ) {
      await this.createInstallments(expense, createExpenseDto, userId);
    }

    // Pagamento em dinheiro não passa por aprovação/baixa manual: já nasce paga.
    if (createExpenseDto.paymentMethod === PaymentMethod.CASH) {
      return this.applyPayment(
        expense.id,
        parseBusinessDate(createExpenseDto.date),
        Number(expense.amount),
      );
    }

    return expense;
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
      updateData.date = parseBusinessDate(updateExpenseDto.date);
    }
    if (updateExpenseDto.dueDate) {
      updateData.dueDate = parseBusinessDate(updateExpenseDto.dueDate);
    }
    if (updateExpenseDto.paymentDate) {
      updateData.paymentDate = parseBusinessDate(updateExpenseDto.paymentDate);
    }
    if (updateExpenseDto.competenceDate) {
      updateData.competenceDate = parseBusinessDate(updateExpenseDto.competenceDate);
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

  async markAsPaid(id: string, paymentDate: string | Date, paidAmount?: number) {
    const expense = await this.findOne(id);

    // PARTIALLY_PAID também aceita baixa: é assim que se quita o restante.
    // Sem isso a despesa ficava presa nesse status para sempre.
    if (
      expense.status !== ExpenseStatus.APPROVED &&
      expense.status !== ExpenseStatus.PARTIALLY_PAID
    ) {
      throw new BadRequestException(
        'Apenas despesas aprovadas ou parcialmente pagas podem receber baixa',
      );
    }

    return this.applyPayment(id, parseBusinessDate(paymentDate), paidAmount);
  }

  /** Marca a despesa como paga (total ou parcial), debita a conta bancária e
   * lança no fluxo de caixa quando houver conta vinculada. Não valida status
   * anterior — quem chama decide se a transição é permitida. */
  private async applyPayment(
    id: string,
    paymentDate: Date,
    paidAmount?: number,
  ) {
    const expense = await this.findOne(id);

    // `paidAmount ?? amount` e não `paidAmount ? ... :` — 0 é um valor pago
    // válido (e falsy), e caía no fallback "valor cheio", quitando a despesa.
    const parcel =
      paidAmount === undefined || paidAmount === null
        ? expense.amount.minus(expense.paidAmount ?? 0)
        : new Prisma.Decimal(paidAmount);

    if (parcel.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Valor pago deve ser maior que zero');
    }

    // Pagamentos parciais ACUMULAM. Antes, cada baixa sobrescrevia paidAmount
    // mas debitava a conta de novo: pagar 100 duas vezes tirava 200 do banco e
    // registrava 100 na despesa.
    const alreadyPaid = expense.paidAmount ?? new Prisma.Decimal(0);
    const totalPaid = alreadyPaid.plus(parcel);

    if (totalPaid.greaterThan(expense.amount)) {
      throw new BadRequestException(
        `Valor pago (${totalPaid.toFixed(2)}) não pode ser maior que o valor da despesa (${expense.amount.toFixed(2)})`,
      );
    }

    const finalPaidAmount = totalPaid;
    const status = totalPaid.equals(expense.amount)
      ? ExpenseStatus.PAID
      : ExpenseStatus.PARTIALLY_PAID;

    // Status da despesa, débito no saldo da conta e lançamento no fluxo de
    // caixa precisam ser atômicos: se qualquer um falhar, nada é gravado.
    return this.prisma.$transaction(async (tx) => {
      const updatedExpense = await tx.expense.update({
        where: { id },
        data: {
          status,
          paymentDate,
          paidAmount: finalPaidAmount,
        },
      });

      if (expense.bankAccountId) {
        // debita só a PARCELA desta baixa, não o acumulado
        const updatedAccount = await tx.bankAccount.update({
          where: { id: expense.bankAccountId },
          data: {
            balance: { decrement: parcel },
          },
        });

        await tx.cashFlow.create({
          data: {
            date: paymentDate,
            type: CashFlowType.OUTFLOW,
            category: expense.type,
            amount: parcel,
            balance: updatedAccount.balance,
            description: expense.description,
            expenseId: expense.id,
            bankAccountId: expense.bankAccountId,
          },
        });
      }

      return updatedExpense;
    });
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
    const categoryIds = byCategory.map((item) => item.categoryId);
    const categories = await this.prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = Object.fromEntries(
      categories.map((c) => [c.id, c]),
    );

    const categoriesData = byCategory.map((item) => ({
      category: categoryMap[item.categoryId],
      total: item._sum.amount,
      count: item._count,
    }));

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

    if (
      dto.installmentDaysOffsets &&
      dto.totalInstallments &&
      dto.installmentDaysOffsets.length !== dto.totalInstallments - 1
    ) {
      throw new BadRequestException(
        `installmentDaysOffsets deve ter ${dto.totalInstallments - 1} posições (uma por parcela a partir da 2ª)`,
      );
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
    const sequenceName = `seq_expense_code_${year}`;

    try {
      const result = await this.prisma.$queryRawUnsafe<[{ nextval: bigint }]> (
        `SELECT nextval('${sequenceName}'::regclass)`
      );
      return `DESP-${year}-${String(result[0].nextval).padStart(4, '0')}`;
    } catch {
      // Fallback: se a sequence não existir, cria e retorna 1
      await this.prisma.$executeRawUnsafe(
        `CREATE SEQUENCE IF NOT EXISTS ${sequenceName} START 1 INCREMENT 1`
      );
      const result = await this.prisma.$queryRawUnsafe<[{ nextval: bigint }]> (
        `SELECT nextval('${sequenceName}'::regclass)`
      );
      return `DESP-${year}-${String(result[0].nextval).padStart(4, '0')}`;
    }
  }

  private async createInstallments(
    parentExpense: any,
    dto: CreateExpenseDto,
    userId: string,
  ) {
    if (!dto.totalInstallments) return;

    const daysOffsets = dto.installmentDaysOffsets;

    // Divisão em centavos: 100/3 daria 33,33 em cada e a compra somaria 99,99.
    // O resto vai para a PRIMEIRA parcela (praxe de carnê/boleto).
    const totalCents = Math.round(Number(dto.amount) * 100);
    const baseCents = Math.floor(totalCents / dto.totalInstallments);
    const remainderCents = totalCents - baseCents * dto.totalInstallments;

    const firstAmount = (baseCents + remainderCents) / 100;
    const installmentAmount = baseCents / 100;

    const installments: Prisma.ExpenseCreateManyInput[] = [];

    for (let i = 2; i <= dto.totalInstallments; i++) {
      let dueDate: Date;
      if (daysOffsets) {
        // Offset em dias corridos a partir da data da compra (boleto 15/30/45/60 dias).
        dueDate = addDaysUtc(parseBusinessDate(dto.date), daysOffsets[i - 2]);
      } else {
        // addMonthsUtc em vez de setMonth: compra em 31/01 gerava parcela em
        // 03/03 (estouro do fim do mês) em vez de 28/02.
        dueDate = addMonthsUtc(parseBusinessDate(dto.dueDate), i - 1);
      }

      // Mesma sequence usada na despesa pai (generateExpenseCode) — não usar
      // count() aqui, que gera códigos duplicados sob concorrência.
      const code = await this.generateExpenseCode();

      installments.push({
        description: `${dto.description} - Parcela ${i}/${dto.totalInstallments}`,
        type: dto.type,
        amount: new Prisma.Decimal(installmentAmount),
        date: parseBusinessDate(dto.date),
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

    // Despesa pai vira a parcela 1 e absorve o resto da divisão, para que a
    // soma das parcelas feche exatamente com o valor da compra.
    await this.prisma.expense.update({
      where: { id: parentExpense.id },
      data: {
        installment: 1,
        amount: new Prisma.Decimal(firstAmount),
      },
    });
  }

  private buildWhereClause(filters: Partial<FilterExpenseDto>) {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = parseBusinessDate(filters.startDate);
      if (filters.endDate) where.date.lte = parseBusinessDateEndOfDay(filters.endDate);
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
}
