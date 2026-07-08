import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateOilDto } from './dto/update-oil.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { FinishTripDto } from './dto/finish-trip.dto';
import { VehicleTripStatus } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  // Status do óleo é sempre calculado a partir do KM atual — nunca persistido,
  // pra não repetir o bug do sistema antigo (KM Última Troca travado em 0
  // gerando "Faltam -87800 km").
  private withOilStatus<T extends { currentKm: number; lastOilChangeKm: number; oilChangeIntervalKm: number }>(
    vehicle: T,
  ) {
    const rodadosDesdeTroca = vehicle.currentKm - vehicle.lastOilChangeKm;
    const remaining = vehicle.oilChangeIntervalKm - rodadosDesdeTroca;
    return {
      ...vehicle,
      nextOilChangeKm: vehicle.lastOilChangeKm + vehicle.oilChangeIntervalKm,
      oilStatus: remaining <= 0 ? 'TROCAR' : 'OK',
      kmUntilOilChange: remaining,
    };
  }

  async create(dto: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({ where: { plate: dto.plate } });
    if (existing) {
      throw new BadRequestException('Já existe um veículo cadastrado com essa placa');
    }

    const vehicle = await this.prisma.vehicle.create({ data: dto });
    return this.withOilStatus(vehicle);
  }

  async findAll() {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return vehicles.map((v) => this.withOilStatus(v));
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }
    return this.withOilStatus(vehicle);
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);
    const vehicle = await this.prisma.vehicle.update({ where: { id }, data: dto });
    return this.withOilStatus(vehicle);
  }

  async updatePhoto(id: string, photoUrl: string) {
    await this.findOne(id);
    const vehicle = await this.prisma.vehicle.update({ where: { id }, data: { photoUrl } });
    return this.withOilStatus(vehicle);
  }

  async updateOil(id: string, dto: UpdateOilDto) {
    await this.findOne(id);
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        lastOilChangeKm: dto.lastOilChangeKm,
        oilChangeIntervalKm: dto.oilChangeIntervalKm,
      },
    });
    return this.withOilStatus(vehicle);
  }

  async createTrip(vehicleId: string, dto: CreateTripDto, createdById: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    const openTrip = await this.prisma.vehicleTrip.findFirst({
      where: { vehicleId, status: VehicleTripStatus.OUT },
    });
    if (openTrip) {
      throw new BadRequestException('Este veículo já está em trânsito — finalize a saída atual antes de abrir outra');
    }

    return this.prisma.vehicleTrip.create({
      data: {
        vehicle: { connect: { id: vehicleId } },
        driver: { connect: { id: dto.driverId } },
        destination: dto.destination,
        startKm: dto.startKm,
        createdBy: { connect: { id: createdById } },
      },
      include: {
        vehicle: { select: { id: true, name: true, plate: true } },
        driver: { select: { id: true, name: true } },
      },
    });
  }

  async finishTrip(tripId: string, dto: FinishTripDto) {
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.vehicleTrip.findUnique({ where: { id: tripId } });
      if (!trip) {
        throw new NotFoundException('Saída não encontrada');
      }
      if (trip.status === VehicleTripStatus.RETURNED) {
        throw new BadRequestException('Esta saída já foi finalizada');
      }
      if (dto.endKm < trip.startKm) {
        throw new BadRequestException('KM de chegada não pode ser menor que o KM de saída');
      }

      const updatedTrip = await tx.vehicleTrip.update({
        where: { id: tripId },
        data: {
          endKm: dto.endKm,
          endedAt: new Date(),
          status: VehicleTripStatus.RETURNED,
        },
        include: {
          vehicle: { select: { id: true, name: true, plate: true } },
          driver: { select: { id: true, name: true } },
        },
      });

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { currentKm: dto.endKm },
      });

      return updatedTrip;
    });
  }

  async findOpenTrips() {
    return this.prisma.vehicleTrip.findMany({
      where: { status: VehicleTripStatus.OUT },
      include: {
        vehicle: { select: { id: true, name: true, plate: true } },
        driver: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findTrips(filters?: { vehicleId?: string; driverId?: string; from?: string; to?: string }) {
    return this.prisma.vehicleTrip.findMany({
      where: {
        ...(filters?.vehicleId && { vehicleId: filters.vehicleId }),
        ...(filters?.driverId && { driverId: filters.driverId }),
        ...(filters?.from || filters?.to
          ? {
              startedAt: {
                ...(filters.from && { gte: new Date(filters.from) }),
                ...(filters.to && { lte: new Date(filters.to) }),
              },
            }
          : {}),
      },
      include: {
        vehicle: { select: { id: true, name: true, plate: true } },
        driver: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}
