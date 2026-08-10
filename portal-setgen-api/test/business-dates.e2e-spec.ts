/**
 * Datas puras ("YYYY-MM-DD", vindas de <input type="date">) têm que cair no dia
 * certo do fuso da operação, não no do servidor — que em produção é UTC.
 *
 * O bug: `new Date('2026-08-08')` é meia-noite UTC = 20h do dia 7 em Manaus.
 * Despesa lançada no dia errado, vencimento antecipado, admissão fora do mês.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  BUSINESS_TIME_ZONE,
  parseBusinessDate,
  parseBusinessDateEndOfDay,
  addMonthsUtc,
  addYearsUtc,
} from '../src/common/date/business-date.util';
import {
  UserRole,
  ExpenseType,
  ExpenseGroup,
  ExpenseCategoryType,
  PaymentMethod,
} from '@prisma/client';

jest.setTimeout(120000);

/** Em que dia daquele fuso o instante caiu. */
const dayIn = (date: Date, timeZone = BUSINESS_TIME_ZONE) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

describe('Datas no fuso da operação (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let adminToken!: string;
  let adminId!: string;
  let categoryId!: string;

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
        asos, employee_documents, employee_movements, employees,
        users
      RESTART IDENTITY CASCADE
    `);

    const admin = await prisma.user.create({
      data: {
        name: 'Admin Datas',
        email: 'admin.datas@test.local',
        password: 'x',
        role: UserRole.ADMIN,
      },
    });
    adminId = admin.id;
    adminToken = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role });

    const category = await prisma.expenseCategory.create({
      data: {
        name: 'Categoria Teste',
        code: 'CAT-TESTE',
        type: ExpenseCategoryType.OPERATIONAL,
        group: ExpenseGroup.MONTHLY_EXPENSES,
      },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // função, não constante: o token só existe depois do beforeAll
  const auth = () => ({ Authorization: `Bearer ${adminToken}` });

  // ------------------------------------------------------------------
  describe('helper', () => {
    it('data pura vira o INÍCIO daquele dia no fuso do negócio', () => {
      expect(dayIn(parseBusinessDate('2026-08-08'))).toBe('2026-08-08');
      expect(dayIn(parseBusinessDate('2026-01-01'))).toBe('2026-01-01');
      expect(dayIn(parseBusinessDate('2026-12-31'))).toBe('2026-12-31');
    });

    it('data pura no fim do dia continua no mesmo dia do negócio', () => {
      expect(dayIn(parseBusinessDateEndOfDay('2026-08-08'))).toBe('2026-08-08');
    });

    it('ISO completo passa direto (o cliente já escolheu o instante)', () => {
      const iso = '2026-08-09T03:59:59.999Z';
      expect(parseBusinessDate(iso).toISOString()).toBe(iso);
    });

    it('soma de meses e anos não estoura o fim do mês', () => {
      const jan31 = new Date('2026-01-31T12:00:00.000Z');
      expect(addMonthsUtc(jan31, 1).toISOString().slice(0, 10)).toBe('2026-02-28');
      expect(addMonthsUtc(jan31, 13).toISOString().slice(0, 10)).toBe('2027-02-28');

      const leapDay = new Date('2024-02-29T12:00:00.000Z');
      expect(addYearsUtc(leapDay, 1).toISOString().slice(0, 10)).toBe('2025-02-28');
    });
  });

  // ------------------------------------------------------------------
  describe('despesas', () => {
    function newExpense(overrides: Record<string, unknown> = {}) {
      return request(app.getHttpServer())
        .post('/expenses')
        .set(auth())
        .send({
          description: 'Despesa de teste',
          amount: 100,
          type: ExpenseType.SERVICE,
          categoryId,
          date: '2026-08-08',
          dueDate: '2026-08-20',
          competenceDate: '2026-08-01',
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          ...overrides,
        });
    }

    it('lançamento, vencimento e competência caem no dia digitado', async () => {
      const res = await newExpense().expect(201);

      const expense = await prisma.expense.findUnique({ where: { id: res.body.id } });
      expect(dayIn(expense!.date)).toBe('2026-08-08');
      expect(dayIn(expense!.dueDate)).toBe('2026-08-20');
      expect(dayIn(expense!.competenceDate)).toBe('2026-08-01');
    });

    it('primeiro dia do mês não escorrega para o mês anterior', async () => {
      const res = await newExpense({
        date: '2026-09-01',
        dueDate: '2026-09-01',
        competenceDate: '2026-09-01',
      }).expect(201);

      const expense = await prisma.expense.findUnique({ where: { id: res.body.id } });
      // era exatamente aqui que doía: 01/09 virava 31/08 e a despesa entrava
      // na competência do mês errado
      expect(dayIn(expense!.date)).toBe('2026-09-01');
      expect(dayIn(expense!.competenceDate)).toBe('2026-09-01');
    });

    it('edição também respeita o fuso', async () => {
      const created = await newExpense().expect(201);

      await request(app.getHttpServer())
        .patch(`/expenses/${created.body.id}`)
        .set(auth())
        .send({ dueDate: '2026-10-05' })
        .expect(200);

      const expense = await prisma.expense.findUnique({ where: { id: created.body.id } });
      expect(dayIn(expense!.dueDate)).toBe('2026-10-05');
    });

    it('filtro por período inclui as despesas do último dia do intervalo', async () => {
      await newExpense({ date: '2026-11-30' }).expect(201);

      const res = await request(app.getHttpServer())
        .get('/expenses')
        .set(auth())
        .query({ startDate: '2026-11-01', endDate: '2026-11-30' })
        .expect(200);

      const rows = Array.isArray(res.body) ? res.body : res.body.data;
      // com `lte = meia-noite do dia 30`, a despesa do próprio dia 30 ficava de fora
      expect(rows.some((e: any) => e.date && dayIn(new Date(e.date)) === '2026-11-30')).toBe(
        true,
      );
    });
  });

  // ------------------------------------------------------------------
  describe('RH', () => {
    it('admissão e nascimento caem no dia digitado', async () => {
      const res = await request(app.getHttpServer())
        .post('/employees')
        .set(auth())
        .send({
          name: 'Colaborador Teste',
          cpf: '39053344705',
          birthDate: '1990-03-01',
          admissionDate: '2026-09-01',
        });

      // se o módulo exigir campos extras, o teste ainda precisa falhar de forma
      // legível em vez de mascarar o bug de data
      expect(res.status).toBe(201);

      const employee = await prisma.employee.findUnique({ where: { id: res.body.id } });
      expect(dayIn(employee!.birthDate!)).toBe('1990-03-01');
      expect(dayIn(employee!.admissionDate!)).toBe('2026-09-01');
    });
  });
});
