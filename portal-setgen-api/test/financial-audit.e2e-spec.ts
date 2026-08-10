/**
 * Auditoria do módulo Financeiro (despesas, parcelamento, pagamento).
 *
 * Todos os defeitos desta auditoria já foram corrigidos: os testes abaixo
 * asseguram o comportamento CORRETO e servem de regressão.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BUSINESS_TIME_ZONE } from '../src/common/date/business-date.util';
import {
  UserRole,
  ExpenseType,
  ExpenseGroup,
  ExpenseCategoryType,
  ExpenseStatus,
  PaymentMethod,
} from '@prisma/client';

jest.setTimeout(120000);

const dayIn = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

describe('Financeiro (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let token!: string;
  let userId!: string;
  let categoryId!: string;
  let bankAccountId!: string;

  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        expense_attachments, cash_flow, expenses, expense_categories,
        bank_accounts, users
      RESTART IDENTITY CASCADE
    `);

    const admin = await prisma.user.create({
      data: {
        name: 'Admin Financeiro',
        email: 'admin.fin@test.local',
        password: 'x',
        role: UserRole.ADMIN,
      },
    });
    userId = admin.id;
    token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role });

    const category = await prisma.expenseCategory.create({
      data: {
        name: 'Categoria Fin',
        code: 'CAT-FIN',
        type: ExpenseCategoryType.OPERATIONAL,
        group: ExpenseGroup.MONTHLY_EXPENSES,
      },
    });
    categoryId = category.id;

    const account = await prisma.bankAccount.create({
      data: {
        name: 'Conta Teste',
        bankName: 'Banco Teste',
        agency: '0001',
        account: '12345-6',
        type: 'Corrente',
        balance: 10000,
      },
    });
    bankAccountId = account.id;
  });

  afterAll(async () => {
    await app.close();
  });

  function newExpense(overrides: Record<string, unknown> = {}) {
    return request(app.getHttpServer())
      .post('/expenses')
      .set(auth())
      .send({
        description: 'Despesa auditoria',
        amount: 300,
        type: ExpenseType.SERVICE,
        categoryId,
        date: '2026-05-10',
        dueDate: '2026-05-20',
        competenceDate: '2026-05-01',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        ...overrides,
      });
  }

  // ------------------------------------------------------------------
  describe('parcelamento', () => {
    it('valor exato: as parcelas somam o total da compra', async () => {
      const res = await newExpense({ totalInstallments: 3 }).expect(201);

      const all = await prisma.expense.findMany({
        where: { OR: [{ id: res.body.id }, { parentExpenseId: res.body.id }] },
        orderBy: { installment: 'asc' },
      });

      expect(all).toHaveLength(3);
      expect(all.map((e) => Number(e.amount))).toEqual([100, 100, 100]);
      expect(all.reduce((sum, e) => sum + Number(e.amount), 0)).toBe(300);
    });

    it('valor que não divide exato: o centavo residual vai para a 1a parcela', async () => {
      const res = await newExpense({ amount: 100, totalInstallments: 3 }).expect(201);

      const all = await prisma.expense.findMany({
        where: { OR: [{ id: res.body.id }, { parentExpenseId: res.body.id }] },
        orderBy: { installment: 'asc' },
      });

      const total = all.reduce((sum, e) => sum + Number(e.amount), 0);
      // 100/3 = 33,33 em cada somaria 99,99 — o centavo residual vai para a 1ª
      expect(all.map((e) => Number(e.amount))).toEqual([33.34, 33.33, 33.33]);
      expect(total).toBe(100);
    });

    it('parcela mensal não estoura o fim do mês (31/01 -> 28/02)', async () => {
      const res = await newExpense({
        date: '2026-01-31',
        dueDate: '2026-01-31',
        competenceDate: '2026-01-31',
        totalInstallments: 2,
      }).expect(201);

      const second = await prisma.expense.findFirst({
        where: { parentExpenseId: res.body.id, installment: 2 },
      });

      expect(dayIn(second!.dueDate)).toBe('2026-02-28');
    });
  });

  // ------------------------------------------------------------------
  describe('pagamento', () => {
    async function approvedExpense(overrides: Record<string, unknown> = {}) {
      const res = await newExpense({ bankAccountId, ...overrides }).expect(201);
      await request(app.getHttpServer())
        .post(`/expenses/${res.body.id}/approve`)
        .set(auth())
        .send({ comments: 'ok' })
        .expect(201);
      return res.body.id as string;
    }

    it('pagamento integral debita a conta e lança no fluxo de caixa', async () => {
      const id = await approvedExpense();
      const before = (await prisma.bankAccount.findUnique({ where: { id: bankAccountId } }))!;

      await request(app.getHttpServer())
        .post(`/expenses/${id}/pay`)
        .set(auth())
        .send({ paymentDate: '2026-05-20' })
        .expect(201);

      const expense = await prisma.expense.findUnique({ where: { id } });
      expect(expense!.status).toBe(ExpenseStatus.PAID);

      const after = (await prisma.bankAccount.findUnique({ where: { id: bankAccountId } }))!;
      expect(Number(before.balance) - Number(after.balance)).toBe(300);

      const flow = await prisma.cashFlow.findFirst({ where: { expenseId: id } });
      expect(flow).not.toBeNull();
    });

    it('pagamentos parciais acumulam e quitam a despesa, debitando só a parcela', async () => {
      const id = await approvedExpense();
      const start = (await prisma.bankAccount.findUnique({ where: { id: bankAccountId } }))!;

      await request(app.getHttpServer())
        .post(`/expenses/${id}/pay`)
        .set(auth())
        .send({ paymentDate: '2026-05-20', paidAmount: 100 })
        .expect(201);

      const partial = await prisma.expense.findUnique({ where: { id } });
      expect(partial!.status).toBe(ExpenseStatus.PARTIALLY_PAID);
      expect(Number(partial!.paidAmount)).toBe(100);

      // quita o restante
      await request(app.getHttpServer())
        .post(`/expenses/${id}/pay`)
        .set(auth())
        .send({ paymentDate: '2026-05-25', paidAmount: 200 })
        .expect(201);

      const paid = await prisma.expense.findUnique({ where: { id } });
      expect(paid!.status).toBe(ExpenseStatus.PAID);
      expect(Number(paid!.paidAmount)).toBe(300);

      // o banco foi debitado em 300 no total, não 400
      const end = (await prisma.bankAccount.findUnique({ where: { id: bankAccountId } }))!;
      expect(Number(start.balance) - Number(end.balance)).toBe(300);
    });

    it('pagamento que ultrapassa o saldo devedor é recusado', async () => {
      const id = await approvedExpense();

      await request(app.getHttpServer())
        .post(`/expenses/${id}/pay`)
        .set(auth())
        .send({ paymentDate: '2026-05-20', paidAmount: 200 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/expenses/${id}/pay`)
        .set(auth())
        .send({ paymentDate: '2026-05-25', paidAmount: 200 });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/não pode ser maior/);
    });

    it('pagar com valor 0 é recusado (antes quitava a despesa inteira)', async () => {
      const id = await approvedExpense();

      const res = await request(app.getHttpServer())
        .post(`/expenses/${id}/pay`)
        .set(auth())
        .send({ paymentDate: '2026-05-20', paidAmount: 0 });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/maior que zero/);

      const expense = await prisma.expense.findUnique({ where: { id } });
      expect(expense!.status).toBe(ExpenseStatus.APPROVED);
    });

    it('data de pagamento é interpretada no fuso da operação', async () => {
      const id = await approvedExpense();

      await request(app.getHttpServer())
        .post(`/expenses/${id}/pay`)
        .set(auth())
        .send({ paymentDate: '2026-06-01' })
        .expect(201);

      const expense = await prisma.expense.findUnique({ where: { id } });
      expect(dayIn(expense!.paymentDate!)).toBe('2026-06-01');
    });
  });
});
