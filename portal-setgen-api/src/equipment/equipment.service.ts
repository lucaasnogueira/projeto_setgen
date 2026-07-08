import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { Prisma, EquipmentType } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async create(createEquipmentDto: CreateEquipmentDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: createEquipmentDto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const data: Prisma.EquipmentCreateInput = {
      client: { connect: { id: createEquipmentDto.clientId } },
      type: createEquipmentDto.type,
      brand: createEquipmentDto.brand,
      model: createEquipmentDto.model,
      serialNumber: createEquipmentDto.serialNumber,
      powerRating: createEquipmentDto.powerRating,
      installLocation: createEquipmentDto.installLocation,
      ...(createEquipmentDto.purchaseDate && {
        purchaseDate: new Date(createEquipmentDto.purchaseDate),
      }),
      notes: createEquipmentDto.notes,
    };

    return this.prisma.equipment.create({
      data,
      include: {
        client: {
          select: { id: true, companyName: true, tradeName: true },
        },
      },
    });
  }

  async findAll(filters?: { clientId?: string; type?: EquipmentType }) {
    const where: Prisma.EquipmentWhereInput = {
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.type && { type: filters.type }),
    };

    return this.prisma.equipment.findMany({
      where,
      include: {
        client: {
          select: { id: true, companyName: true, tradeName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, companyName: true, tradeName: true },
        },
        technicalVisits: {
          select: {
            id: true,
            visitDate: true,
            status: true,
            chargeable: true,
            failureCategoryId: true,
          },
          orderBy: { visitDate: 'desc' },
          take: 10,
        },
        visitLinks: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipamento não encontrado');
    }

    return equipment;
  }

  async update(id: string, updateEquipmentDto: UpdateEquipmentDto) {
    await this.findOne(id);

    const data: Prisma.EquipmentUpdateInput = {
      ...(updateEquipmentDto.type && { type: updateEquipmentDto.type }),
      ...(updateEquipmentDto.brand !== undefined && {
        brand: updateEquipmentDto.brand,
      }),
      ...(updateEquipmentDto.model !== undefined && {
        model: updateEquipmentDto.model,
      }),
      ...(updateEquipmentDto.serialNumber !== undefined && {
        serialNumber: updateEquipmentDto.serialNumber,
      }),
      ...(updateEquipmentDto.powerRating !== undefined && {
        powerRating: updateEquipmentDto.powerRating,
      }),
      ...(updateEquipmentDto.installLocation !== undefined && {
        installLocation: updateEquipmentDto.installLocation,
      }),
      ...(updateEquipmentDto.purchaseDate && {
        purchaseDate: new Date(updateEquipmentDto.purchaseDate),
      }),
      ...(updateEquipmentDto.notes !== undefined && {
        notes: updateEquipmentDto.notes,
      }),
    };

    return this.prisma.equipment.update({
      where: { id },
      data,
      include: {
        client: {
          select: { id: true, companyName: true, tradeName: true },
        },
      },
    });
  }

  async remove(id: string) {
    const equipment = await this.findOne(id);

    if (
      (equipment.technicalVisits && equipment.technicalVisits.length > 0) ||
      (equipment.visitLinks && equipment.visitLinks.length > 0)
    ) {
      throw new BadRequestException(
        'Não é possível remover equipamento com visitas técnicas vinculadas',
      );
    }

    return this.prisma.equipment.delete({ where: { id } });
  }
}
