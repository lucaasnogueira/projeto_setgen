/**
 * Auditoria ponta a ponta do processo Orçamento (Quote) -> Ordem de Serviço (ServiceOrder).
 *
 * Roda contra um banco isolado (DATABASE_URL apontando para setgen_bugtest).
 * Todos os defeitos desta auditoria já foram corrigidos: os testes abaixo
 * asseguram o comportamento CORRETO e servem de regressão.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { QuotesService } from '../src/quotes/quotes.service';
import { MaterialRequestsService } from '../src/material-requests/material-requests.service';
import { PurchaseOrdersService } from '../src/purchase-orders/purchase-orders.service';
import {
  UserRole,
  QuoteStatus,
  ServiceOrderType,
  ServiceOrderStatus,
  QuoteLineType,
} from '@prisma/client';

jest.setTimeout(120000);

describe('Processo Quote -> ServiceOrder (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  const tokens: Record<string, string> = {};
  const users: Record<string, { id: string; email: string; role: UserRole }> = {};
  let clientId: string;
  let productId: string;

  const auth = (role: keyof typeof tokens) => ({ Authorization: `Bearer ${tokens[role]}` });

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

    // limpa tudo relacionado ao processo
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        material_request_items, material_requests, procurement_order_items, procurement_orders,
        service_order_products, service_order_visits, deliveries, service_orders,
        approvals, purchase_orders, quote_lines, quotes,
        stock_movements, audit_logs, products, clients, users
      RESTART IDENTITY CASCADE
    `);

    for (const role of [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.ADMINISTRATIVE,
      UserRole.TECHNICIAN,
      UserRole.WAREHOUSE,
    ]) {
      const u = await prisma.user.create({
        data: {
          name: `User ${role}`,
          email: `${role.toLowerCase()}@test.local`,
          password: 'x',
          role,
        },
      });
      users[role] = { id: u.id, email: u.email, role };
      tokens[role] = jwt.sign({ sub: u.id, email: u.email, role });
    }

    const client = await prisma.client.create({
      data: {
        cnpjCpf: '11222333000181',
        companyName: 'Cliente Auditoria LTDA',
        address: { street: 'Rua A', number: '1', city: 'SP', state: 'SP' },
        phone: '11999999999',
        email: 'cliente@test.local',
      },
    });
    clientId = client.id;

    const product = await prisma.product.create({
      data: { code: 'P-001', name: 'Cabo UTP', unit: 'm', currentStock: 100, unitCost: 5 },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Cria orçamento EXECUTION (nasce DRAFT). Já sai com uma linha porque
   * aprovar exige ao menos uma — use `{ withLine: false }` nos testes que
   * medem justamente o comportamento das linhas.
   */
  async function newQuote(
    scope: string = 'Escopo de teste com mais de dez caracteres',
    opts: { withLine?: boolean } = {},
  ) {
    const res = await request(app.getHttpServer())
      .post('/quotes')
      .set(auth(UserRole.MANAGER))
      .send({ type: ServiceOrderType.EXECUTION, clientId, scope })
      .expect(201);

    if (opts.withLine !== false) {
      await request(app.getHttpServer())
        .post(`/quotes/${res.body.id}/lines`)
        .set(auth(UserRole.MANAGER))
        .send({
          type: QuoteLineType.SERVICE,
          description: 'Serviço contratado',
          quantity: 1,
          unitValue: 1000,
        })
        .expect(201);
    }

    return res.body;
  }

  function setStatus(id: string, status: QuoteStatus, role: UserRole = UserRole.MANAGER) {
    return request(app.getHttpServer())
      .patch(`/quotes/${id}/status`)
      .set(auth(role))
      .send({ status });
  }

  /** leva um orçamento até ACCEPTED pelo caminho curto APPROVED -> ACCEPTED */
  async function acceptedQuote(scope?: string) {
    const q = await newQuote(scope);
    await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
    await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
    await setStatus(q.id, QuoteStatus.ACCEPTED).expect(200);
    return q;
  }

  const ocFixture = path.join(__dirname, 'oc-fixture.pdf');
  beforeAll(() => fs.writeFileSync(ocFixture, '%PDF-1.4 fake'));
  afterAll(() => fs.existsSync(ocFixture) && fs.unlinkSync(ocFixture));

  function postOC(quoteId: string, role: UserRole, overrides: Record<string, string> = {}) {
    const req = request(app.getHttpServer())
      .post('/purchase-orders')
      .set(auth(role))
      .field('quoteId', quoteId)
      .field('clientId', clientId)
      .field('orderNumber', `OC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
      .field('value', '1000')
      .field('issueDate', new Date(Date.now() - 86400000).toISOString())
      .field('expiryDate', new Date(Date.now() + 30 * 86400000).toISOString());
    Object.entries(overrides).forEach(([k, v]) => req.field(k, v));
    return req.attach('file', ocFixture);
  }

  // ------------------------------------------------------------------
  // 1. CAMINHO FELIZ
  // ------------------------------------------------------------------
  describe('caminho feliz', () => {
    it('DRAFT -> PENDING_APPROVAL -> APPROVED -> ACCEPTED -> gera OS', async () => {
      const quote = await acceptedQuote();

      const os = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id, items: [{ productId, quantity: 2, unitPrice: 5 }] })
        .expect(201);

      expect(os.body.status).toBe(ServiceOrderStatus.AWAITING_MATERIALS);
      expect(os.body.scope).toBe(quote.scope);
      expect(os.body.orderNumber).toMatch(/^OS-\d{4}-\d{5}$/);

      const mr = await prisma.materialRequest.findFirst({
        where: { serviceOrderId: os.body.id },
        include: { items: true },
      });
      expect(mr).not.toBeNull();
      expect(mr!.items[0].quantityNeeded).toBe(2);
    });

    it('bloqueia 2a OS para o mesmo orçamento', async () => {
      const quote = await acceptedQuote();
      await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id })
        .expect(201);

      const dup = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id })
        .expect(400);
      expect(dup.body.message).toMatch(/já possui uma Ordem de Serviço/);
    });

    it('bloqueia OS a partir de orçamento não-ACCEPTED', async () => {
      const q = await newQuote();
      await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: q.id })
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // 2. OC/OP -> aceite automático do orçamento
  // ------------------------------------------------------------------
  describe('confirmação de OC/OP', () => {
    it('a partir de APPROVED: aceita orçamento e materializa a OS', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);

      await postOC(q.id, UserRole.MANAGER).expect(201);

      const after = await prisma.quote.findUnique({
        where: { id: q.id },
        include: { serviceOrder: true },
      });
      expect(after!.status).toBe(QuoteStatus.ACCEPTED);
      expect(after!.serviceOrder).not.toBeNull();
    });

    it('a partir de SENT_TO_CLIENT: aceita orçamento e materializa a OS', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
      await request(app.getHttpServer())
        .patch(`/quotes/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ validUntil: new Date(Date.now() + 10 * 86400000).toISOString() })
        .expect(200);
      await setStatus(q.id, QuoteStatus.SENT_TO_CLIENT).expect(200);

      await postOC(q.id, UserRole.MANAGER).expect(201);

      const after = await prisma.quote.findUnique({
        where: { id: q.id },
        include: { serviceOrder: true, purchaseOrders: true },
      });
      expect(after!.status).toBe(QuoteStatus.ACCEPTED);
      expect(after!.serviceOrder).not.toBeNull();
      expect(after!.purchaseOrders).toHaveLength(1);
    });

    it('ADMINISTRATIVE registra OC e o orçamento é aceito (sem gate de gerente)', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);

      await postOC(q.id, UserRole.ADMINISTRATIVE).expect(201);

      const after = await prisma.quote.findUnique({
        where: { id: q.id },
        include: { serviceOrder: true, purchaseOrders: true },
      });
      expect(after!.status).toBe(QuoteStatus.ACCEPTED);
      expect(after!.serviceOrder).not.toBeNull();
      expect(after!.purchaseOrders).toHaveLength(1);
    });

    it('status da OC é derivado da validade — não é editável', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
      await postOC(q.id, UserRole.MANAGER).expect(201);

      const po = (await prisma.purchaseOrder.findFirst({ where: { quoteId: q.id } }))!;
      expect(po.status).toBe('APPROVED');

      // marcar como vencida na mão liberaria cadastrar uma segunda OC
      await request(app.getHttpServer())
        .patch(`/purchase-orders/${po.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ status: 'EXPIRED' })
        .expect(400);

      // empurrar a validade para o passado vence a OC de verdade
      await request(app.getHttpServer())
        .patch(`/purchase-orders/${po.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ expiryDate: new Date(Date.now() - 86400000).toISOString() })
        .expect(200);

      const after = await prisma.purchaseOrder.findUnique({ where: { id: po.id } });
      expect(after!.status).toBe('EXPIRED');
    });

    it('editar OC deixando validade antes da emissão é recusado', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
      await postOC(q.id, UserRole.MANAGER).expect(201);

      const po = (await prisma.purchaseOrder.findFirst({ where: { quoteId: q.id } }))!;

      await request(app.getHttpServer())
        .patch(`/purchase-orders/${po.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ expiryDate: new Date(po.issueDate.getTime() - 86400000).toISOString() })
        .expect(400);
    });

    it('o cron marca OCs vencidas como EXPIRED', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
      await postOC(q.id, UserRole.MANAGER).expect(201);

      const po = (await prisma.purchaseOrder.findFirst({ where: { quoteId: q.id } }))!;
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { expiryDate: new Date(Date.now() - 86400000) },
      });

      await app.get(PurchaseOrdersService).checkExpiredOrders();

      const after = await prisma.purchaseOrder.findUnique({ where: { id: po.id } });
      expect(after!.status).toBe('EXPIRED');
    });

    it('OC sobre orçamento em status inelegível não grava nada', async () => {
      const q = await newQuote(); // DRAFT

      const res = await postOC(q.id, UserRole.MANAGER);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Apenas orçamentos aprovados/);

      const after = await prisma.quote.findUnique({
        where: { id: q.id },
        include: { serviceOrder: true, purchaseOrders: true },
      });
      expect(after!.purchaseOrders).toHaveLength(0); // nenhuma OC órfã
      expect(after!.status).toBe(QuoteStatus.DRAFT);
      expect(after!.serviceOrder).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // 3. APROVAÇÕES
  // ------------------------------------------------------------------
  describe('approvals', () => {
    it('rejeitar orçamento DRAFT é recusado sem gravar Approval órfã', async () => {
      const q = await newQuote();

      const res = await request(app.getHttpServer())
        .post(`/approvals/reject/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ comments: 'Motivo detalhado da rejeicao do orcamento' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Transição de status inválida: DRAFT -> REJECTED/);

      expect(await prisma.approval.findMany({ where: { quoteId: q.id } })).toHaveLength(0);

      const after = await prisma.quote.findUnique({ where: { id: q.id } });
      expect(after!.status).toBe(QuoteStatus.DRAFT);
    });

    it('aprovar grava Approval e muda o status juntos', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);

      await request(app.getHttpServer())
        .post(`/approvals/approve/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ comments: 'Escopo e valor conferidos' })
        .expect(201);

      const approvals = await prisma.approval.findMany({ where: { quoteId: q.id } });
      expect(approvals).toHaveLength(1);
      expect(approvals[0].status).toBe('APPROVED');

      const after = await prisma.quote.findUnique({ where: { id: q.id } });
      expect(after!.status).toBe(QuoteStatus.APPROVED);
    });

    it('rejeitar orçamento enviado ao cliente funciona e marca a visita como cobrável', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
      await request(app.getHttpServer())
        .patch(`/quotes/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ validUntil: new Date(Date.now() + 10 * 86400000).toISOString() })
        .expect(200);
      await setStatus(q.id, QuoteStatus.SENT_TO_CLIENT).expect(200);

      await request(app.getHttpServer())
        .post(`/approvals/reject/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ comments: 'Cliente optou por outro fornecedor' })
        .expect(201);

      const after = await prisma.quote.findUnique({ where: { id: q.id } });
      expect(after!.status).toBe(QuoteStatus.REJECTED);
      expect(await prisma.approval.findMany({ where: { quoteId: q.id } })).toHaveLength(1);
    });
  });

  // ------------------------------------------------------------------
  // 4. LINHAS DO ORÇAMENTO
  // ------------------------------------------------------------------
  describe('linhas do orçamento', () => {
    it('desconto maior que o subtotal é rejeitado (nada de total negativo)', async () => {
      const q = await newQuote(undefined, { withLine: false });
      const res = await request(app.getHttpServer())
        .post(`/quotes/${q.id}/lines`)
        .set(auth(UserRole.MANAGER))
        .send({
          type: QuoteLineType.SERVICE,
          description: 'Serviço',
          quantity: 1,
          unitValue: 100,
          discount: 500,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Desconto .* não pode ser maior que o subtotal/);
      expect(await prisma.quoteLine.findMany({ where: { quoteId: q.id } })).toHaveLength(0);
    });

    it('desconto igual ao subtotal é aceito e zera a linha', async () => {
      const q = await newQuote(undefined, { withLine: false });
      const line = await request(app.getHttpServer())
        .post(`/quotes/${q.id}/lines`)
        .set(auth(UserRole.MANAGER))
        .send({
          type: QuoteLineType.SERVICE,
          description: 'Cortesia',
          quantity: 2,
          unitValue: 50,
          discount: 100,
        })
        .expect(201);

      expect(Number(line.body.totalValue)).toBe(0);
    });

    it('total da linha é arredondado para 2 casas (sem sobra binária)', async () => {
      const q = await newQuote(undefined, { withLine: false });
      const line = await request(app.getHttpServer())
        .post(`/quotes/${q.id}/lines`)
        .set(auth(UserRole.MANAGER))
        .send({
          type: QuoteLineType.LABOR_HOUR,
          description: 'Hora técnica',
          quantity: 3,
          unitValue: 0.1,
        })
        .expect(201);

      expect(Number(line.body.totalValue)).toBe(0.3);
    });

    it('orçamento ACCEPTED tem as linhas congeladas (valor já fechado)', async () => {
      const quote = await acceptedQuote();
      const before = await prisma.quoteLine.findMany({ where: { quoteId: quote.id } });

      const add = await request(app.getHttpServer())
        .post(`/quotes/${quote.id}/lines`)
        .set(auth(UserRole.MANAGER))
        .send({
          type: QuoteLineType.SERVICE,
          description: 'Serviço extra depois do aceite',
          quantity: 1,
          unitValue: 999,
        });
      expect(add.status).toBe(400);
      expect(add.body.message).toMatch(/não pode ter suas linhas alteradas/);

      const after = await prisma.quoteLine.findMany({ where: { quoteId: quote.id } });
      expect(after).toHaveLength(before.length); // nada foi adicionado
    });

    it('remover e editar linha de orçamento ACCEPTED também são bloqueados', async () => {
      const quote = await acceptedQuote();
      const line = (await prisma.quoteLine.findFirst({ where: { quoteId: quote.id } }))!;

      await request(app.getHttpServer())
        .delete(`/quotes/${quote.id}/lines/${line.id}`)
        .set(auth(UserRole.MANAGER))
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/quotes/${quote.id}/lines/${line.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ unitValue: 1 })
        .expect(400);

      const after = await prisma.quoteLine.findUnique({ where: { id: line.id } });
      expect(after).not.toBeNull();
      expect(Number(after!.unitValue)).toBe(1000);
    });

    it('orçamento sem nenhuma linha não pode ser aprovado', async () => {
      const q = await newQuote(undefined, { withLine: false });
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);

      const res = await setStatus(q.id, QuoteStatus.APPROVED);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/ao menos uma linha/);

      const after = await prisma.quote.findUnique({ where: { id: q.id } });
      expect(after!.status).toBe(QuoteStatus.PENDING_APPROVAL);
    });

    it('o fluxo de aprovações também exige ao menos uma linha', async () => {
      const q = await newQuote(undefined, { withLine: false });
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);

      const res = await request(app.getHttpServer())
        .post(`/approvals/approve/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ comments: 'Aprovado sem conferir o valor' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/ao menos uma linha/);

      // e não deixa Approval órfã para trás
      expect(await prisma.approval.findMany({ where: { quoteId: q.id } })).toHaveLength(0);
    });

    it('linha de cortesia (valor zero) satisfaz a exigência', async () => {
      const q = await newQuote(undefined, { withLine: false });
      await request(app.getHttpServer())
        .post(`/quotes/${q.id}/lines`)
        .set(auth(UserRole.MANAGER))
        .send({
          type: QuoteLineType.SERVICE,
          description: 'Atendimento em cortesia',
          quantity: 1,
          unitValue: 0,
        })
        .expect(201);

      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
    });

    it('PATCH de linha recalcula o total', async () => {
      const q = await newQuote();
      const line = (await prisma.quoteLine.findFirst({ where: { quoteId: q.id } }))!;

      const res = await request(app.getHttpServer())
        .patch(`/quotes/${q.id}/lines/${line.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ quantity: 3, unitValue: 200, discount: 50 })
        .expect(200);

      expect(Number(res.body.totalValue)).toBe(550);
    });

    it('PATCH de linha recusa desconto acima do subtotal', async () => {
      const q = await newQuote();
      const line = (await prisma.quoteLine.findFirst({ where: { quoteId: q.id } }))!;

      await request(app.getHttpServer())
        .patch(`/quotes/${q.id}/lines/${line.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ discount: 99999 })
        .expect(400);

      const after = await prisma.quoteLine.findUnique({ where: { id: line.id } });
      expect(Number(after!.totalValue)).toBe(1000);
    });
  });

  // ------------------------------------------------------------------
  // 5. EXPIRAÇÃO AUTOMÁTICA
  // ------------------------------------------------------------------
  describe('expiração automática', () => {
    it('cron e API concordam: SENT_TO_CLIENT -> EXPIRED é válido nos dois caminhos', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
      await request(app.getHttpServer())
        .patch(`/quotes/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ validUntil: new Date(Date.now() + 10 * 86400000).toISOString() })
        .expect(200);
      await setStatus(q.id, QuoteStatus.SENT_TO_CLIENT).expect(200);

      // o cron aplica a mesma transição que a API aceitaria
      await prisma.quote.update({
        where: { id: q.id },
        data: { validUntil: new Date(Date.now() - 86400000) },
      });
      await app.get(QuotesService).expireOverdueQuotes();

      const after = await prisma.quote.findUnique({ where: { id: q.id } });
      expect(after!.status).toBe(QuoteStatus.EXPIRED);

      // e a expiração automática fica auditada como qualquer outra transição
      const logs = await prisma.auditLog.findMany({
        where: { entity: 'Quote', entityId: q.id },
      });
      expect(logs.some((l) => (l.changes as any)?.to === QuoteStatus.EXPIRED)).toBe(true);
    });

    it('orçamento ainda dentro da validade não é expirado pelo cron', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
      await request(app.getHttpServer())
        .patch(`/quotes/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ validUntil: new Date(Date.now() + 10 * 86400000).toISOString() })
        .expect(200);
      await setStatus(q.id, QuoteStatus.SENT_TO_CLIENT).expect(200);

      await app.get(QuotesService).expireOverdueQuotes();

      const after = await prisma.quote.findUnique({ where: { id: q.id } });
      expect(after!.status).toBe(QuoteStatus.SENT_TO_CLIENT);
    });
  });

  // ------------------------------------------------------------------
  // 6. OS — PROGRESSO E STATUS
  // ------------------------------------------------------------------
  describe('OS: progresso e status', () => {
    async function newOrder(items?: any[]) {
      const quote = await acceptedQuote();
      const res = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id, ...(items && { items }) })
        .expect(201);
      return res.body;
    }

    it('progresso=100 não conclui OS CANCELADA (respeita a máquina de estados)', async () => {
      const os = await newOrder();
      await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/status`)
        .set(auth(UserRole.MANAGER))
        .send({ status: ServiceOrderStatus.CANCELLED })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/progress/100`)
        .set(auth(UserRole.MANAGER))
        .expect(400);
      expect(res.body.message).toMatch(/cancelada/);

      const after = await prisma.serviceOrder.findUnique({ where: { id: os.id } });
      expect(after!.status).toBe(ServiceOrderStatus.CANCELLED);
      expect(after!.completedAt).toBeNull();
    });

    it('progresso=100 conclui a OS quando ela está IN_PROGRESS, e audita', async () => {
      const os = await newOrder();
      await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/status`)
        .set(auth(UserRole.MANAGER))
        .send({ status: ServiceOrderStatus.IN_PROGRESS })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/progress/100`)
        .set(auth(UserRole.MANAGER))
        .expect(200);
      expect(res.body.status).toBe(ServiceOrderStatus.COMPLETED);
      expect(res.body.completedAt).not.toBeNull();

      const logs = await prisma.auditLog.findMany({
        where: { entity: 'ServiceOrder', entityId: os.id },
      });
      expect(
        logs.some((l) => (l.changes as any)?.to === ServiceOrderStatus.COMPLETED),
      ).toBe(true);
    });

    it('progresso=100 em AWAITING_MATERIALS grava o percentual sem concluir a OS', async () => {
      const os = await newOrder([{ productId, quantity: 1, unitPrice: 5 }]);
      const res = await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/progress/100`)
        .set(auth(UserRole.MANAGER))
        .expect(200);
      expect(res.body.progress).toBe(100);
      expect(res.body.status).toBe(ServiceOrderStatus.AWAITING_MATERIALS);
      expect(res.body.completedAt).toBeNull();
    });

    it('progresso fora de 0-100 é rejeitado com 400', async () => {
      const os = await newOrder();
      await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/progress/9999`)
        .set(auth(UserRole.MANAGER))
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/progress/-50`)
        .set(auth(UserRole.MANAGER))
        .expect(400);

      const after = await prisma.serviceOrder.findUnique({ where: { id: os.id } });
      expect(after!.progress).toBe(0);
    });

    it('progresso não-numérico é rejeitado com 400', async () => {
      const os = await newOrder();
      await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/progress/abc`)
        .set(auth(UserRole.MANAGER))
        .expect(400);
    });

    it('TECHNICIAN fora da equipe responsável não altera o progresso', async () => {
      const os = await newOrder();
      expect(os.responsibleIds).toEqual([]);

      const res = await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/progress/50`)
        .set(auth(UserRole.TECHNICIAN));
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/não faz parte da equipe responsável/);

      const after = await prisma.serviceOrder.findUnique({ where: { id: os.id } });
      expect(after!.progress).toBe(0);
    });

    it('TECHNICIAN escalado na OS altera o progresso normalmente', async () => {
      const quote = await acceptedQuote();
      const os = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id, responsibleIds: [users[UserRole.TECHNICIAN].id] })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/service-orders/${os.body.id}/progress/50`)
        .set(auth(UserRole.TECHNICIAN))
        .expect(200);
    });

    it('bloqueia IN_PROGRESS enquanto o almoxarifado não separou', async () => {
      const os = await newOrder([{ productId, quantity: 1, unitPrice: 5 }]);
      const res = await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/status`)
        .set(auth(UserRole.MANAGER))
        .send({ status: ServiceOrderStatus.IN_PROGRESS })
        .expect(400);
      expect(res.body.message).toMatch(/ainda não foram separados/);
    });

    it('OS sem materiais previstos entra em execução direto (não há o que separar)', async () => {
      const os = await newOrder();
      const mr = await prisma.materialRequest.findFirst({ where: { serviceOrderId: os.id } });
      expect(mr).toBeNull();

      await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/status`)
        .set(auth(UserRole.MANAGER))
        .send({ status: ServiceOrderStatus.IN_PROGRESS })
        .expect(200);
    });

    it('OS com materiais mas sem MaterialRequest (estado inconsistente) é barrada', async () => {
      const os = await newOrder([{ productId, quantity: 1, unitPrice: 5 }]);

      // simula a solicitação some do almoxarifado sem os itens da OS sumirem
      const mr = await prisma.materialRequest.findFirst({
        where: { serviceOrderId: os.id },
      });
      await prisma.materialRequestItem.deleteMany({ where: { materialRequestId: mr!.id } });
      await prisma.materialRequest.delete({ where: { id: mr!.id } });

      const res = await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/status`)
        .set(auth(UserRole.MANAGER))
        .send({ status: ServiceOrderStatus.IN_PROGRESS });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/nenhuma solicitação no almoxarifado/);
    });
  });

  // ------------------------------------------------------------------
  // 7. OS — EDIÇÃO
  // ------------------------------------------------------------------
  describe('OS: edição', () => {
    async function newOrderWithItems() {
      const quote = await acceptedQuote();
      const res = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id, items: [{ productId, quantity: 3, unitPrice: 5 }] })
        .expect(201);
      return res.body;
    }

    it('trocar materiais da OS atualiza a MaterialRequest do almoxarifado junto', async () => {
      const os = await newOrderWithItems();
      const before = await prisma.materialRequest.findFirst({
        where: { serviceOrderId: os.id },
        include: { items: true },
      });
      expect(before!.items[0].quantityNeeded).toBe(3);

      await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ items: [{ productId, quantity: 50, unitPrice: 5 }] })
        .expect(200);

      const items = await prisma.serviceOrderProduct.findMany({
        where: { serviceOrderId: os.id },
      });
      expect(items[0].quantity).toBe(50);

      const after = await prisma.materialRequest.findFirst({
        where: { serviceOrderId: os.id },
        include: { items: true },
      });
      expect(after!.items).toHaveLength(1);
      expect(after!.items[0].quantityNeeded).toBe(50);
    });

    it('items: [] remove os materiais e a MaterialRequest junto', async () => {
      const os = await newOrderWithItems();
      await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ items: [] })
        .expect(200);

      expect(
        await prisma.serviceOrderProduct.findMany({ where: { serviceOrderId: os.id } }),
      ).toHaveLength(0);
      expect(
        await prisma.materialRequest.findFirst({ where: { serviceOrderId: os.id } }),
      ).toBeNull();
    });

    it('trocar materiais é bloqueado depois que o almoxarifado reservou', async () => {
      const os = await newOrderWithItems();
      const mr = await prisma.materialRequest.findFirst({
        where: { serviceOrderId: os.id },
      });
      await app
        .get(MaterialRequestsService)
        .separate(mr!.id, users[UserRole.WAREHOUSE].id);

      const res = await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ items: [{ productId, quantity: 50, unitPrice: 5 }] });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/almoxarifado já reservou estoque/);

      const items = await prisma.serviceOrderProduct.findMany({
        where: { serviceOrderId: os.id },
      });
      expect(items[0].quantity).toBe(3); // nada foi alterado
    });

    it('items com quantidade ou preço inválidos são rejeitados com 400', async () => {
      const quote = await acceptedQuote();
      const negative = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id, items: [{ productId, quantity: -10, unitPrice: -5 }] });
      expect(negative.status).toBe(400);

      const fractional = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id, items: [{ productId, quantity: 1.5, unitPrice: 5 }] });
      expect(fractional.status).toBe(400);

      expect(
        await prisma.serviceOrder.findFirst({ where: { quoteId: quote.id } }),
      ).toBeNull();
    });

    it('produto inexistente retorna 400 explicativo em vez de erro de FK', async () => {
      const quote = await acceptedQuote();
      const ghost = '00000000-0000-4000-8000-000000000000';
      const res = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id, items: [{ productId: ghost, quantity: 1, unitPrice: 5 }] });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Produto\(s\) não encontrado\(s\)/);
    });

    it('OS CONCLUÍDA é congelada (entrega e garantia já foram emitidas)', async () => {
      const quote = await acceptedQuote();
      const created = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id })
        .expect(201);
      await request(app.getHttpServer())
        .patch(`/service-orders/${created.body.id}/status`)
        .set(auth(UserRole.MANAGER))
        .send({ status: ServiceOrderStatus.IN_PROGRESS })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/service-orders/${created.body.id}/progress/100`)
        .set(auth(UserRole.MANAGER))
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/service-orders/${created.body.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ deadline: new Date(Date.now() + 999 * 86400000).toISOString(), items: [] });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/OS concluída não pode ser editada/);

      const after = await prisma.serviceOrder.findUnique({ where: { id: created.body.id } });
      expect(after!.deadline).toBeNull();
    });

    it('OS CANCELADA também é congelada', async () => {
      const os = await newOrderWithItems();
      await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}/status`)
        .set(auth(UserRole.MANAGER))
        .send({ status: ServiceOrderStatus.CANCELLED })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/service-orders/${os.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ responsibleIds: [] })
        .expect(400);
    });

    it('deletar OS remove a MaterialRequest ainda não reservada', async () => {
      const os = await newOrderWithItems();
      await request(app.getHttpServer())
        .delete(`/service-orders/${os.id}`)
        .set(auth(UserRole.ADMIN))
        .expect(200);

      expect(await prisma.serviceOrder.findUnique({ where: { id: os.id } })).toBeNull();
      expect(
        await prisma.materialRequest.findFirst({ where: { serviceOrderId: os.id } }),
      ).toBeNull();
    });

    it('deletar OS é bloqueado depois que o almoxarifado reservou material', async () => {
      const os = await newOrderWithItems();
      const mr = await prisma.materialRequest.findFirst({
        where: { serviceOrderId: os.id },
      });
      // o endpoint HTTP usa PermissionsGuard (permissões granulares), fora do
      // escopo deste teste — chamamos o serviço direto para simular o almoxarife
      await app
        .get(MaterialRequestsService)
        .separate(mr!.id, users[UserRole.WAREHOUSE].id);

      const res = await request(app.getHttpServer())
        .delete(`/service-orders/${os.id}`)
        .set(auth(UserRole.ADMIN));
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/almoxarifado já reservou material/);

      expect(await prisma.serviceOrder.findUnique({ where: { id: os.id } })).not.toBeNull();
    });

    it('deletar OS é bloqueado quando existe Entrega registrada', async () => {
      const quote = await acceptedQuote();
      const created = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id })
        .expect(201);
      await request(app.getHttpServer())
        .patch(`/service-orders/${created.body.id}/status`)
        .set(auth(UserRole.MANAGER))
        .send({ status: ServiceOrderStatus.IN_PROGRESS })
        .expect(200);
      await request(app.getHttpServer())
        .post('/deliveries')
        .set(auth(UserRole.MANAGER))
        .send({
          serviceOrderId: created.body.id,
          deliveryDate: new Date().toISOString(),
          receivedBy: 'Fulano',
          checklist: [{ item: 'ok', checked: true }],
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/service-orders/${created.body.id}`)
        .set(auth(UserRole.ADMIN));
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Entrega registrada/);
    });
  });

  // ------------------------------------------------------------------
  // 8. ORÇAMENTO — EDIÇÃO PÓS-ACEITE
  // ------------------------------------------------------------------
  describe('orçamento: edição pós-aceite', () => {
    it('orçamento ACCEPTED é congelado: nem MANAGER edita o escopo', async () => {
      const quote = await acceptedQuote('Escopo original acordado com o cliente');
      const os = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/quotes/${quote.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ scope: 'Escopo TROCADO depois do aceite do cliente' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Orçamento aceito não pode ser editado/);

      const updatedQuote = await prisma.quote.findUnique({ where: { id: quote.id } });
      const order = await prisma.serviceOrder.findUnique({ where: { id: os.body.id } });
      expect(updatedQuote!.scope).toBe(order!.scope); // escopo segue congelado junto
    });

    it('MANAGER preenche a validade de um orçamento já APROVADO (sem beco sem saída)', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);

      // sem validade, enviar ao cliente é barrado...
      const blocked = await setStatus(q.id, QuoteStatus.SENT_TO_CLIENT);
      expect(blocked.status).toBe(400);
      expect(blocked.body.message).toMatch(/Defina a validade/);

      // ...e dá para preencher sem precisar cancelar e recomeçar
      await request(app.getHttpServer())
        .patch(`/quotes/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ validUntil: new Date(Date.now() + 10 * 86400000).toISOString() })
        .expect(200);

      await setStatus(q.id, QuoteStatus.SENT_TO_CLIENT).expect(200);
    });

    it('PATCH /quotes recusa clientId e type em vez de aceitar e ignorar', async () => {
      const q = await newQuote();
      const other = await prisma.client.create({
        data: {
          cnpjCpf: `9988776600${Math.floor(Math.random() * 10000)}`,
          companyName: 'Outro Cliente',
          address: {},
          phone: '1',
          email: 'o@t.local',
        },
      });

      await request(app.getHttpServer())
        .patch(`/quotes/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ clientId: other.id })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/quotes/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ type: ServiceOrderType.VISIT_REPORT })
        .expect(400);

      const after = await prisma.quote.findUnique({ where: { id: q.id } });
      expect(after!.clientId).toBe(clientId);
      expect(after!.type).toBe(ServiceOrderType.EXECUTION);
    });

    it('PATCH /quotes com campos legítimos continua funcionando', async () => {
      const q = await newQuote();
      const res = await request(app.getHttpServer())
        .patch(`/quotes/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ scope: 'Escopo revisado com o cliente', warrantyMonths: 24 })
        .expect(200);

      expect(res.body.scope).toBe('Escopo revisado com o cliente');
      const after = await prisma.quote.findUnique({ where: { id: q.id } });
      expect(after!.warrantyMonths).toBe(24);
    });
  });

  // ------------------------------------------------------------------
  // 8b. ENTREGA E GARANTIA (fechamento do processo)
  // ------------------------------------------------------------------
  describe('entrega e garantia', () => {
    async function orderInProgress(warrantyMonths?: number) {
      const q = await newQuote();
      if (warrantyMonths !== undefined) {
        await request(app.getHttpServer())
          .patch(`/quotes/${q.id}`)
          .set(auth(UserRole.MANAGER))
          .send({ warrantyMonths })
          .expect(200);
      }
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
      await setStatus(q.id, QuoteStatus.ACCEPTED).expect(200);

      const os = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: q.id })
        .expect(201);
      await request(app.getHttpServer())
        .patch(`/service-orders/${os.body.id}/status`)
        .set(auth(UserRole.MANAGER))
        .send({ status: ServiceOrderStatus.IN_PROGRESS })
        .expect(200);
      return os.body;
    }

    function postDelivery(serviceOrderId: string, deliveryDate: string) {
      return request(app.getHttpServer())
        .post('/deliveries')
        .set(auth(UserRole.MANAGER))
        .send({
          serviceOrderId,
          deliveryDate,
          receivedBy: 'Fulano - TI',
          checklist: [{ item: 'Instalação concluída', checked: true }],
        });
    }

    it('entrega conclui a OS e gera a garantia com os meses do orçamento', async () => {
      const os = await orderInProgress(6);
      await postDelivery(os.id, new Date('2026-03-10T12:00:00.000Z').toISOString()).expect(201);

      const order = await prisma.serviceOrder.findUnique({ where: { id: os.id } });
      expect(order!.status).toBe(ServiceOrderStatus.COMPLETED);
      expect(order!.progress).toBe(100);

      const w = await prisma.warranty.findFirst({
        where: { delivery: { serviceOrderId: os.id } },
      });
      expect(w!.coverageMonths).toBe(6);
      expect(w!.endDate.toISOString().slice(0, 7)).toBe('2026-09');
    });

    it('entrega via multipart (com evidências) aceita o checklist', async () => {
      const os = await orderInProgress();

      // Em multipart tudo chega como string: o array vai como JSON e o
      // `checked` como "true". Antes isso batia em 400 de validação.
      const mp = await request(app.getHttpServer())
        .post('/deliveries')
        .set(auth(UserRole.MANAGER))
        .field('serviceOrderId', os.id)
        .field('deliveryDate', new Date().toISOString())
        .field('receivedBy', 'Fulano - TI')
        .field(
          'checklist',
          JSON.stringify([{ item: 'Instalação concluída', checked: 'true' }]),
        )
        .attach('evidences', ocFixture, 'evidencia.pdf');
      expect(mp.status).toBe(201);

      const delivery = await prisma.delivery.findUnique({
        where: { serviceOrderId: os.id },
      });
      expect(delivery!.evidences).toHaveLength(1);
      expect((delivery!.checklist as any[])[0]).toMatchObject({
        item: 'Instalação concluída',
        checked: true,
      });
    });

    it('entrega via multipart recusa checklist com item não marcado', async () => {
      const os = await orderInProgress();

      const res = await request(app.getHttpServer())
        .post('/deliveries')
        .set(auth(UserRole.MANAGER))
        .field('serviceOrderId', os.id)
        .field('deliveryDate', new Date().toISOString())
        .field('receivedBy', 'Fulano - TI')
        .field('checklist', JSON.stringify([{ item: 'Pendência', checked: 'false' }]));

      expect(res.status).toBe(400);
      // tem que ser a regra de negócio, não erro de validação do DTO —
      // "false" precisa ter sido reconhecido como booleano para chegar aqui
      expect(res.body.message).toMatch(/checklist devem estar marcados/);
    });

    it('conclusão pela entrega aparece no audit log da OS', async () => {
      const os = await orderInProgress();
      await postDelivery(os.id, new Date().toISOString()).expect(201);

      const logs = await prisma.auditLog.findMany({
        where: { entity: 'ServiceOrder', entityId: os.id },
      });
      const completion = logs.find(
        (l) => (l.changes as any)?.to === ServiceOrderStatus.COMPLETED,
      );
      expect(completion).toBeDefined();
      expect((completion!.changes as any).from).toBe(ServiceOrderStatus.IN_PROGRESS);
      expect((completion!.changes as any).comments).toMatch(/registro da entrega/);

      const order = await prisma.serviceOrder.findUnique({ where: { id: os.id } });
      expect(order!.completedAt).not.toBeNull();
    });

    it('deletar entrega remove a garantia junto e reabre a OS', async () => {
      const os = await orderInProgress();
      const del = await postDelivery(os.id, new Date().toISOString()).expect(201);

      await request(app.getHttpServer())
        .delete(`/deliveries/${del.body.id}`)
        .set(auth(UserRole.ADMIN))
        .expect(200);

      expect(await prisma.delivery.findUnique({ where: { id: del.body.id } })).toBeNull();
      expect(await prisma.warranty.findFirst({ where: { deliveryId: del.body.id } })).toBeNull();

      const order = await prisma.serviceOrder.findUnique({ where: { id: os.id } });
      expect(order!.status).toBe(ServiceOrderStatus.IN_PROGRESS);
      expect(order!.completedAt).toBeNull();
    });

    it('deletar entrega de uma OS cancelada não a ressuscita para IN_PROGRESS', async () => {
      const os = await orderInProgress();
      const del = await postDelivery(os.id, new Date().toISOString()).expect(201);
      await prisma.serviceOrder.update({
        where: { id: os.id },
        data: { status: ServiceOrderStatus.CANCELLED },
      });

      await request(app.getHttpServer())
        .delete(`/deliveries/${del.body.id}`)
        .set(auth(UserRole.ADMIN))
        .expect(200);

      const order = await prisma.serviceOrder.findUnique({ where: { id: os.id } });
      expect(order!.status).toBe(ServiceOrderStatus.CANCELLED);
    });

    it('fim da garantia não estoura o mês: 31/01 + 1 mês = 28/02', async () => {
      const os = await orderInProgress(1);
      await postDelivery(os.id, new Date('2026-01-31T12:00:00.000Z').toISOString()).expect(201);

      const w = await prisma.warranty.findFirst({
        where: { delivery: { serviceOrderId: os.id } },
      });
      expect(w!.endDate.toISOString().slice(0, 10)).toBe('2026-02-28');
    });

    it('fim da garantia preserva o dia quando o mês de destino comporta', async () => {
      const os = await orderInProgress(3);
      await postDelivery(os.id, new Date('2026-01-15T12:00:00.000Z').toISOString()).expect(201);

      const w = await prisma.warranty.findFirst({
        where: { delivery: { serviceOrderId: os.id } },
      });
      expect(w!.endDate.toISOString().slice(0, 10)).toBe('2026-04-15');
    });
  });

  // ------------------------------------------------------------------
  // 8c. CONCORRÊNCIA
  // ------------------------------------------------------------------
  describe('concorrência', () => {
    it('duas gerações simultâneas de OS: só uma passa (protegido pelo unique em quoteId)', async () => {
      const quote = await acceptedQuote();
      const results = await Promise.all([
        request(app.getHttpServer())
          .post('/service-orders')
          .set(auth(UserRole.MANAGER))
          .send({ quoteId: quote.id }),
        request(app.getHttpServer())
          .post('/service-orders')
          .set(auth(UserRole.MANAGER))
          .send({ quoteId: quote.id }),
      ]);
      const codes = results.map((r) => r.status).sort();
      expect(codes[0]).toBe(201);
      expect(codes[1]).toBe(400);

      const orders = await prisma.serviceOrder.findMany({ where: { quoteId: quote.id } });
      expect(orders).toHaveLength(1);
    });

    it('duas separações simultâneas não reservam o mesmo estoque duas vezes', async () => {
      const stockBefore = (await prisma.product.findUnique({ where: { id: productId } }))!
        .currentStock;

      const quote = await acceptedQuote();
      const os = await request(app.getHttpServer())
        .post('/service-orders')
        .set(auth(UserRole.MANAGER))
        .send({ quoteId: quote.id, items: [{ productId, quantity: 4, unitPrice: 5 }] })
        .expect(201);

      const mr = (await prisma.materialRequest.findFirst({
        where: { serviceOrderId: os.body.id },
      }))!;

      const service = app.get(MaterialRequestsService);
      const results = await Promise.allSettled([
        service.separate(mr.id, users[UserRole.WAREHOUSE].id),
        service.separate(mr.id, users[UserRole.WAREHOUSE].id),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);

      // a perdedora tem que cair na revalidação dentro do lock, não em um
      // erro qualquer que faria este teste passar pelo motivo errado
      const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(rejected.reason.message).toMatch(/já está separada/);

      // a baixa aconteceu uma vez só
      const stockAfter = (await prisma.product.findUnique({ where: { id: productId } }))!
        .currentStock;
      expect(stockAfter).toBe(stockBefore - 4);

      const items = await prisma.materialRequestItem.findMany({
        where: { materialRequestId: mr.id },
      });
      expect(items[0].quantityReserved).toBe(4);
    });

    it('duas OCs simultâneas para o mesmo orçamento: só uma passa (lock FOR UPDATE)', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);

      const results = await Promise.all([
        postOC(q.id, UserRole.MANAGER),
        postOC(q.id, UserRole.MANAGER),
      ]);

      const codes = results.map((r) => r.status).sort();
      expect(codes[0]).toBe(201);
      expect(codes[1]).toBe(400);

      const pos = await prisma.purchaseOrder.findMany({ where: { quoteId: q.id } });
      expect(pos).toHaveLength(1);

      const after = await prisma.quote.findUnique({
        where: { id: q.id },
        include: { serviceOrder: true },
      });
      expect(after!.status).toBe(QuoteStatus.ACCEPTED);
      expect(after!.serviceOrder).not.toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // 9. PÁGINA PÚBLICA DO ORÇAMENTO
  // ------------------------------------------------------------------
  describe('página pública', () => {
    it('orçamento interno (rascunho) não é exposto sem autenticação', async () => {
      const q = await newQuote();
      await request(app.getHttpServer()).get(`/public/quotes/${q.id}`).expect(404);
    });

    it('orçamento aprovado só internamente também não é exposto', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);

      await request(app.getHttpServer()).get(`/public/quotes/${q.id}`).expect(404);
    });

    it('orçamento enviado ao cliente é servido publicamente', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);
      await request(app.getHttpServer())
        .patch(`/quotes/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ validUntil: new Date(Date.now() + 10 * 86400000).toISOString() })
        .expect(200);
      await setStatus(q.id, QuoteStatus.SENT_TO_CLIENT).expect(200);

      const res = await request(app.getHttpServer())
        .get(`/public/quotes/${q.id}`)
        .expect(200);
      expect(res.text).toContain(q.quoteNumber);
      expect(res.text).toContain('Cliente Auditoria LTDA');
    });

    it('validade é renderizada no fuso do negócio, não no do servidor', async () => {
      const q = await newQuote();
      await setStatus(q.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.id, QuoteStatus.APPROVED).expect(200);

      // 23:59:59.999 do dia 08/08 em Manaus (UTC-4) = 09/08 03:59:59.999 UTC.
      // Se a renderização usar o fuso do servidor (UTC em produção), o cliente
      // enxerga 09/08 — um dia a mais de validade do que foi combinado.
      await request(app.getHttpServer())
        .patch(`/quotes/${q.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ validUntil: '2026-08-09T03:59:59.999Z' })
        .expect(200);
      await setStatus(q.id, QuoteStatus.SENT_TO_CLIENT).expect(200);

      const res = await request(app.getHttpServer())
        .get(`/public/quotes/${q.id}`)
        .expect(200);

      expect(res.text).toContain('Válido até: 08/08/2026');
      expect(res.text).not.toContain('Válido até: 09/08/2026');
    });

    it('escapeHtml neutraliza aspas e tags vindas do cadastro do cliente', async () => {
      const evil = await prisma.client.create({
        data: {
          cnpjCpf: `1122334455${Math.floor(Math.random() * 10000)}`,
          companyName: `Empresa "aspas" & <b>tag</b>`,
          address: {},
          phone: `" onload="alert(1)`,
          email: 'x@t.local',
        },
      });
      const q = await request(app.getHttpServer())
        .post('/quotes')
        .set(auth(UserRole.MANAGER))
        .send({
          type: ServiceOrderType.EXECUTION,
          clientId: evil.id,
          scope: 'escopo suficientemente longo',
        })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/quotes/${q.body.id}/lines`)
        .set(auth(UserRole.MANAGER))
        .send({
          type: QuoteLineType.SERVICE,
          description: 'Serviço',
          quantity: 1,
          unitValue: 500,
        })
        .expect(201);
      await setStatus(q.body.id, QuoteStatus.PENDING_APPROVAL).expect(200);
      await setStatus(q.body.id, QuoteStatus.APPROVED).expect(200);
      await request(app.getHttpServer())
        .patch(`/quotes/${q.body.id}`)
        .set(auth(UserRole.MANAGER))
        .send({ validUntil: new Date(Date.now() + 10 * 86400000).toISOString() })
        .expect(200);
      await setStatus(q.body.id, QuoteStatus.SENT_TO_CLIENT).expect(200);

      const res = await request(app.getHttpServer())
        .get(`/public/quotes/${q.body.id}`)
        .expect(200);
      // as aspas do cadastro viram entidade, então o texto não consegue fechar
      // um atributo e virar handler — sobra só conteúdo inerte
      expect(res.text).not.toContain('" onload="');
      expect(res.text).toContain('&quot; onload=&quot;');
      expect(res.text).not.toContain('<b>tag</b>');
      expect(res.text).toContain('&lt;b&gt;tag&lt;/b&gt;');
    });
  });
});
