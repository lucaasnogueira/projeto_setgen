import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';
import {
  parseBusinessDate,
  businessYearMonth,
} from '../common/date/business-date.util';
import { CreateFuelRequestDto } from './dto/create-fuel-request.dto';
import { RejectFuelRequestDto } from './dto/reject-fuel-request.dto';
import {
  FuelRequestStatus,
  ExpenseType,
  ExpenseCategoryType,
  ExpenseGroup,
  Prisma,
} from '@prisma/client';

const FUEL_CATEGORY_CODE = 'COMBUSTIVEL';

@Injectable()
export class FuelRequestsService {
  constructor(
    private prisma: PrismaService,
    private expensesService: ExpensesService,
  ) {}

  async create(dto: CreateFuelRequestDto, requestedById: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    const totalValue = Number((dto.liters * dto.unitPrice).toFixed(2));

    return this.prisma.fuelRequest.create({
      data: {
        vehicle: { connect: { id: dto.vehicleId } },
        requestedBy: { connect: { id: requestedById } },
        liters: new Prisma.Decimal(dto.liters),
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        totalValue: new Prisma.Decimal(totalValue),
        currentKm: dto.currentKm,
        fuelStation: dto.fuelStation,
      },
      include: {
        vehicle: { select: { id: true, name: true, plate: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(filters?: { status?: FuelRequestStatus; vehicleId?: string }) {
    return this.prisma.fuelRequest.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.vehicleId && { vehicleId: filters.vehicleId }),
      },
      include: {
        vehicle: { select: { id: true, name: true, plate: true } },
        requestedBy: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const fuelRequest = await this.prisma.fuelRequest.findUnique({
      where: { id },
      include: {
        vehicle: { select: { id: true, name: true, plate: true } },
        requestedBy: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });
    if (!fuelRequest) {
      throw new NotFoundException('Requisição de abastecimento não encontrada');
    }
    return fuelRequest;
  }

  async approve(id: string, approverId: string) {
    // Reserva a requisição antes de gastar dinheiro: a checagem de PENDING era
    // read-then-write, e duas aprovações simultâneas criavam DUAS despesas
    // para o mesmo abastecimento. O updateMany condicional só afeta linhas que
    // ainda estão PENDING — quem perder a corrida altera 0 linhas.
    const claimed = await this.prisma.fuelRequest.updateMany({
      where: { id, status: FuelRequestStatus.PENDING },
      data: { status: FuelRequestStatus.APPROVED, approverId, approvedAt: new Date() },
    });

    if (claimed.count === 0) {
      const exists = await this.prisma.fuelRequest.findUnique({ where: { id } });
      if (!exists) {
        throw new NotFoundException('Requisição de abastecimento não encontrada');
      }
      throw new BadRequestException('Esta requisição já foi analisada');
    }

    const fuelRequest = (await this.prisma.fuelRequest.findUnique({
      where: { id },
      include: { vehicle: true },
    }))!;

    const category = await this.ensureFuelCategory();

    const now = new Date();
    // Primeiro dia do mês no fuso da OPERAÇÃO. `new Date(ano, mês, 1)` usa o
    // fuso do servidor (UTC em produção) e cairia no último dia do mês
    // anterior em Manaus — competência lançada no mês errado.
    const competenceDate = parseBusinessDate(`${businessYearMonth(now)}-01`);

    const expense = await this.expensesService.create(
      {
        description: `Abastecimento ${fuelRequest.vehicle.name} (${fuelRequest.vehicle.plate})`,
        type: ExpenseType.SERVICE,
        amount: Number(fuelRequest.totalValue),
        date: now.toISOString(),
        dueDate: now.toISOString(),
        competenceDate: competenceDate.toISOString(),
        categoryId: category.id,
        notes: `Requisição de abastecimento ${fuelRequest.id} — ${fuelRequest.liters}L a R$${fuelRequest.unitPrice}/L`,
      },
      fuelRequest.requestedById,
    );

    // status/approver já foram gravados no claim acima — aqui só amarra a despesa
    return this.prisma.fuelRequest.update({
      where: { id },
      data: { expenseId: expense.id },
      include: {
        vehicle: { select: { id: true, name: true, plate: true } },
        requestedBy: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });
  }

  async reject(id: string, dto: RejectFuelRequestDto, approverId: string) {
    const fuelRequest = await this.prisma.fuelRequest.findUnique({ where: { id } });
    if (!fuelRequest) {
      throw new NotFoundException('Requisição de abastecimento não encontrada');
    }
    if (fuelRequest.status !== FuelRequestStatus.PENDING) {
      throw new BadRequestException('Esta requisição já foi analisada');
    }

    return this.prisma.fuelRequest.update({
      where: { id },
      data: {
        status: FuelRequestStatus.REJECTED,
        approverId,
        rejectionReason: dto.rejectionReason,
      },
      include: {
        vehicle: { select: { id: true, name: true, plate: true } },
        requestedBy: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });
  }

  private async ensureFuelCategory() {
    return this.prisma.expenseCategory.upsert({
      where: { code: FUEL_CATEGORY_CODE },
      update: {},
      create: {
        name: 'Combustível',
        code: FUEL_CATEGORY_CODE,
        type: ExpenseCategoryType.OPERATIONAL,
        group: ExpenseGroup.SERVICE_EXPENSES,
        description: 'Abastecimento de veículos da frota',
      },
    });
  }
}
