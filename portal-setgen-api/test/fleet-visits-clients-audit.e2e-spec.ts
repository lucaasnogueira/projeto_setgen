/**
 * Auditoria dos módulos Frota, Visitas Técnicas e Clientes.
 *
 * Todos os defeitos desta auditoria já foram corrigidos: os testes abaixo
 * asseguram o comportamento CORRETO e servem de regressão.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { VehiclesService } from '../src/vehicles/vehicles.service';
import { FuelRequestsService } from '../src/fuel-requests/fuel-requests.service';
import { ClientsService } from '../src/clients/clients.service';
import { BUSINESS_TIME_ZONE } from '../src/common/date/business-date.util';
import { UserRole, VehicleTripStatus } from '@prisma/client';

jest.setTimeout(120000);

const dayIn = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

describe('Frota, Visitas e Clientes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminId!: string;
  let driverId!: string;
  let vehicleId!: string;
  let clientId!: string;

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

    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        fuel_requests, vehicle_trips, vehicles,
        asos, employee_documents, employee_movements, employees,
        expense_attachments, cash_flow, expenses, expense_categories,
        quotes, technical_visits, clients, users
      RESTART IDENTITY CASCADE
    `);

    const admin = await prisma.user.create({
      data: {
        name: 'Admin Frota',
        email: 'admin.frota@test.local',
        password: 'x',
        role: UserRole.ADMIN,
      },
    });
    adminId = admin.id;

    // o motorista de uma saída é um Employee, não um User
    const driver = await prisma.employee.create({
      data: { name: 'Motorista Teste', cpf: '39053344705' },
    });
    driverId = driver.id;

    const vehicle = await prisma.vehicle.create({
      data: {
        name: 'Fiorino',
        plate: 'ABC1D23',
        currentKm: 50000,
        lastOilChangeKm: 45000,
        oilChangeIntervalKm: 10000,
      },
    });
    vehicleId = vehicle.id;

    const client = await prisma.client.create({
      data: {
        cnpjCpf: '11222333000181',
        companyName: 'Cliente Frota LTDA',
        address: {},
        phone: '11999999999',
        email: 'cliente.frota@test.local',
      },
    });
    clientId = client.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ------------------------------------------------------------------
  describe('Frota: saídas de veículo', () => {
    afterEach(async () => {
      await prisma.vehicleTrip.deleteMany({});
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { currentKm: 50000 },
      });
    });

    it('bloqueia abrir uma 2a saída com o veículo em trânsito', async () => {
      const service = app.get(VehiclesService);
      await service.createTrip(
        vehicleId,
        { driverId, destination: 'Cliente A', startKm: 50000 },
        adminId,
      );

      await expect(
        service.createTrip(
          vehicleId,
          { driverId, destination: 'Cliente B', startKm: 50000 },
          adminId,
        ),
      ).rejects.toThrow(/já está em trânsito/);
    });

    it('duas saídas simultâneas abrem só uma viagem', async () => {
      const service = app.get(VehiclesService);

      await Promise.allSettled([
        service.createTrip(
          vehicleId,
          { driverId, destination: 'Cliente A', startKm: 50000 },
          adminId,
        ),
        service.createTrip(
          vehicleId,
          { driverId, destination: 'Cliente B', startKm: 50000 },
          adminId,
        ),
      ]);

      const open = await prisma.vehicleTrip.count({
        where: { vehicleId, status: VehicleTripStatus.OUT },
      });
      expect(open).toBe(1);
    });

    it('recusa abrir saída com KM menor que o hodômetro do veículo', async () => {
      const service = app.get(VehiclesService);

      await expect(
        service.createTrip(
          vehicleId,
          { driverId, destination: 'Cliente A', startKm: 100 },
          adminId,
        ),
      ).rejects.toThrow(/não pode ser menor que o KM atual/);

      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      expect(vehicle!.currentKm).toBe(50000);
    });

    it('finalizar saída nunca faz o hodômetro retroceder', async () => {
      const service = app.get(VehiclesService);

      const trip = await service.createTrip(
        vehicleId,
        { driverId, destination: 'Cliente A', startKm: 50000 },
        adminId,
      );
      await service.finishTrip(trip.id, { endKm: 50120 });
      expect(
        (await prisma.vehicle.findUnique({ where: { id: vehicleId } }))!.currentKm,
      ).toBe(50120);

      // saída antiga finalizada depois de outra mais recente não puxa o KM de volta
      const stale = await prisma.vehicleTrip.create({
        data: {
          vehicleId,
          driverId,
          destination: 'Saída antiga',
          startKm: 50000,
          createdById: adminId,
        },
      });
      await service.finishTrip(stale.id, { endKm: 50050 });

      expect(
        (await prisma.vehicle.findUnique({ where: { id: vehicleId } }))!.currentKm,
      ).toBe(50120);
    });
  });

  // ------------------------------------------------------------------
  describe('Frota: abastecimento', () => {
    async function pendingFuelRequest() {
      const service = app.get(FuelRequestsService);
      return service.create(
        {
          vehicleId,
          liters: 40,
          unitPrice: 6.5,
          currentKm: 50100,
          fuelStation: 'Posto Teste',
        },
        adminId,
      );
    }

    it('aprovar cria a despesa correspondente', async () => {
      const req = await pendingFuelRequest();
      await app.get(FuelRequestsService).approve(req.id, adminId);

      const updated = await prisma.fuelRequest.findUnique({ where: { id: req.id } });
      expect(updated!.status).toBe('APPROVED');
      expect(updated!.expenseId).not.toBeNull();

      const expense = await prisma.expense.findUnique({
        where: { id: updated!.expenseId! },
      });
      expect(Number(expense!.amount)).toBe(260);
    });

    it('duas aprovações simultâneas geram uma despesa só', async () => {
      const req = await pendingFuelRequest();
      const service = app.get(FuelRequestsService);

      const results = await Promise.allSettled([
        service.approve(req.id, adminId),
        service.approve(req.id, adminId),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(rejected.reason.message).toMatch(/já foi analisada/);

      const expenses = await prisma.expense.findMany({
        where: { notes: { contains: req.id } },
      });
      expect(expenses).toHaveLength(1);
    });

    it('competência do abastecimento é o dia 1 do mês corrente no fuso da operação', async () => {
      const req = await pendingFuelRequest();
      await app.get(FuelRequestsService).approve(req.id, adminId);

      const updated = await prisma.fuelRequest.findUnique({ where: { id: req.id } });
      const expense = await prisma.expense.findUnique({
        where: { id: updated!.expenseId! },
      });

      // O mês corrente tem que ser lido no fuso do negócio, não no do servidor:
      // `new Date(ano, mês, 1)` num servidor UTC gera o dia 1 às 00:00Z, que em
      // Manaus é o último dia do mês ANTERIOR — competência no mês errado.
      const hoje = dayIn(new Date());
      const primeiroDoMes = `${hoje.slice(0, 7)}-01`;
      expect(dayIn(expense!.competenceDate)).toBe(primeiroDoMes);
    });
  });

  // ------------------------------------------------------------------
  describe('Clientes', () => {
    it('deletar cliente com orçamento é bloqueado com mensagem explicativa', async () => {
      const orphanClient = await prisma.client.create({
        data: {
          cnpjCpf: `9988776600${Math.floor(Math.random() * 10000)}`,
          companyName: 'Cliente com Vínculo',
          address: {},
          phone: '1',
          email: 'v@test.local',
        },
      });

      await prisma.quote.create({
        data: {
          quoteNumber: `ORC-TEST-${Date.now()}`,
          type: 'EXECUTION',
          clientId: orphanClient.id,
          scope: 'escopo qualquer',
          createdById: adminId,
        },
      });

      await expect(
        app.get(ClientsService).remove(orphanClient.id),
      ).rejects.toThrow(/1 orçamento\(s\) vinculado\(s\)/);

      expect(
        await prisma.client.findUnique({ where: { id: orphanClient.id } }),
      ).not.toBeNull();
    });

    it('cliente sem vínculo nenhum ainda pode ser excluído', async () => {
      const free = await prisma.client.create({
        data: {
          cnpjCpf: `5544332200${Math.floor(Math.random() * 10000)}`,
          companyName: 'Cliente Sem Vínculo',
          address: {},
          phone: '1',
          email: 'sv@test.local',
        },
      });

      await app.get(ClientsService).remove(free.id);
      expect(await prisma.client.findUnique({ where: { id: free.id } })).toBeNull();
    });
  });
});
