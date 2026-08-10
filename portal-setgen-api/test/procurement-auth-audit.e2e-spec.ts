/**
 * Auditoria dos módulos Compras/Estoque e Auth/Permissões.
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
import { ProcurementOrdersService } from '../src/procurement-orders/procurement-orders.service';
import { UserRole, ProcurementOrderStatus } from '@prisma/client';

jest.setTimeout(120000);

describe('Compras/Estoque e Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  let adminToken!: string;
  let adminId!: string;
  let secondAdminId!: string;
  let productId!: string;
  let supplierId!: string;

  const auth = (t = adminToken) => ({ Authorization: `Bearer ${t}` });

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
        procurement_order_items, procurement_orders,
        material_request_items, material_requests,
        stock_movements, products, suppliers, users
      RESTART IDENTITY CASCADE
    `);

    const admin = await prisma.user.create({
      data: {
        name: 'Admin Compras',
        email: 'admin.compras@test.local',
        password: 'x',
        role: UserRole.ADMIN,
      },
    });
    adminId = admin.id;
    adminToken = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role });

    const second = await prisma.user.create({
      data: {
        name: 'Segundo Admin',
        email: 'admin2@test.local',
        password: 'x',
        role: UserRole.ADMIN,
      },
    });
    secondAdminId = second.id;

    const product = await prisma.product.create({
      data: { code: 'PC-001', name: 'Disjuntor', unit: 'un', currentStock: 0, unitCost: 10 },
    });
    productId = product.id;

    const supplier = await prisma.supplier.create({
      data: { name: 'Fornecedor Teste', cnpj: '11222333000181' },
    });
    supplierId = supplier.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ------------------------------------------------------------------
  describe('Compras: recebimento', () => {
    async function orderAwaitingDelivery(quantity = 10) {
      const service = app.get(ProcurementOrdersService);
      const created = await service.create({
        supplierId,
        items: [{ productId, quantity, unitCost: 10 }],
      });
      await service.updateStatus(
        created.id,
        { status: ProcurementOrderStatus.ORDER_ISSUED },
        adminId,
      );
      await service.updateStatus(
        created.id,
        { status: ProcurementOrderStatus.AWAITING_DELIVERY },
        adminId,
      );
      return created.id;
    }

    it('recebimento dá entrada no estoque', async () => {
      const before = (await prisma.product.findUnique({ where: { id: productId } }))!
        .currentStock;
      const id = await orderAwaitingDelivery(10);

      await app
        .get(ProcurementOrdersService)
        .updateStatus(id, { status: ProcurementOrderStatus.RECEIVED }, adminId);

      const after = (await prisma.product.findUnique({ where: { id: productId } }))!
        .currentStock;
      expect(after - before).toBe(10);
    });

    it('dois recebimentos simultâneos dão entrada uma vez só (lock FOR UPDATE)', async () => {
      const before = (await prisma.product.findUnique({ where: { id: productId } }))!
        .currentStock;
      const id = await orderAwaitingDelivery(10);

      const service = app.get(ProcurementOrdersService);
      const results = await Promise.allSettled([
        service.updateStatus(id, { status: ProcurementOrderStatus.RECEIVED }, adminId),
        service.updateStatus(id, { status: ProcurementOrderStatus.RECEIVED }, adminId),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);

      // a perdedora tem que cair na revalidação dentro do lock, não em erro
      // qualquer que faria este teste passar pelo motivo errado
      const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(rejected.reason.message).toMatch(/Transição de status inválida/);

      const after = (await prisma.product.findUnique({ where: { id: productId } }))!
        .currentStock;
      expect(after - before).toBe(10);
    });

    it('produto inexistente retorna 400 explicativo em vez de erro de FK', async () => {
      const service = app.get(ProcurementOrdersService);
      const ghost = '00000000-0000-4000-8000-000000000000';

      await expect(
        service.create({ supplierId, items: [{ productId: ghost, quantity: 1, unitCost: 1 }] }),
      ).rejects.toThrow(/Produto\(s\) não encontrado\(s\)/);
    });
  });

  // ------------------------------------------------------------------
  describe('Auth: proteções que existem', () => {
    it('login inválido não distingue usuário inexistente de senha errada', async () => {
      const a = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'naoexiste@test.local', password: 'senha-longa-o-suficiente' });
      const b = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin.compras@test.local', password: 'senha-errada' });

      expect(a.status).toBe(401);
      expect(b.status).toBe(401);
      expect(a.body.message).toBe(b.body.message);
    });

    it('token de usuário desativado deixa de valer imediatamente', async () => {
      const temp = await prisma.user.create({
        data: {
          name: 'Temp',
          email: 'temp@test.local',
          password: 'x',
          role: UserRole.TECHNICIAN,
        },
      });
      const tempToken = jwt.sign({ sub: temp.id, email: temp.email, role: temp.role });

      await request(app.getHttpServer())
        .get('/users/me')
        .set(auth(tempToken))
        .expect(200);

      await prisma.user.update({ where: { id: temp.id }, data: { active: false } });

      await request(app.getHttpServer())
        .get('/users/me')
        .set(auth(tempToken))
        .expect(401);
    });

    it('perfil próprio não permite escalar privilégio', async () => {
      const tech = await prisma.user.create({
        data: {
          name: 'Tecnico',
          email: 'tec.audit@test.local',
          password: 'x',
          role: UserRole.TECHNICIAN,
        },
      });
      const techToken = jwt.sign({ sub: tech.id, email: tech.email, role: tech.role });

      // role não está no UpdateProfileDto: whitelist recusa
      await request(app.getHttpServer())
        .patch('/users/me')
        .set(auth(techToken))
        .send({ role: UserRole.ADMIN })
        .expect(400);

      const after = await prisma.user.findUnique({ where: { id: tech.id } });
      expect(after!.role).toBe(UserRole.TECHNICIAN);
    });
  });

  // ------------------------------------------------------------------
  describe('Auth: lacunas', () => {
    it('desativar o último ADMIN é bloqueado', async () => {
      await prisma.user.update({
        where: { id: secondAdminId },
        data: { active: false },
      });

      expect(
        await prisma.user.count({ where: { role: UserRole.ADMIN, active: true } }),
      ).toBe(1);

      const res = await request(app.getHttpServer())
        .patch(`/users/${adminId}/toggle-active`)
        .set(auth());
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/último administrador ativo/);

      expect(
        await prisma.user.count({ where: { role: UserRole.ADMIN, active: true } }),
      ).toBe(1);

      await prisma.user.update({ where: { id: secondAdminId }, data: { active: true } });
    });

    it('rebaixar o cargo do último ADMIN também é bloqueado', async () => {
      await prisma.user.update({
        where: { id: secondAdminId },
        data: { active: false },
      });

      const res = await request(app.getHttpServer())
        .patch(`/users/${adminId}`)
        .set(auth())
        .send({ role: UserRole.TECHNICIAN });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/último administrador ativo/);

      const after = await prisma.user.findUnique({ where: { id: adminId } });
      expect(after!.role).toBe(UserRole.ADMIN);

      await prisma.user.update({ where: { id: secondAdminId }, data: { active: true } });
    });

    it('com outro ADMIN ativo, desativar é permitido', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${secondAdminId}/toggle-active`)
        .set(auth())
        .expect(200);
      expect(res.body.active).toBe(false);

      await prisma.user.update({ where: { id: secondAdminId }, data: { active: true } });
    });
  });
});
