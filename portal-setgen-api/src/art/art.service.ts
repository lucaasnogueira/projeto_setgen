import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtDto } from './dto/create-art.dto';
import { UpdateArtDto } from './dto/update-art.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ArtService {
  constructor(private prisma: PrismaService) {}

  // Toda ServiceOrder já nasce de um orçamento aceito (ver
  // ServiceOrdersService.createFromQuote) — bastando ela existir, a ART já
  // pode ser emitida. Não há mais lista de status elegíveis a checar aqui.
  async create(dto: CreateArtDto, fileUrl?: string) {
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: dto.serviceOrderId },
      include: { art: true },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    if (serviceOrder.art) {
      throw new ConflictException('Esta OS já possui uma ART emitida');
    }

    const data: Prisma.ARTCreateInput = {
      serviceOrder: { connect: { id: dto.serviceOrderId } },
      number: dto.number,
      engineerName: dto.engineerName,
      creaNumber: dto.creaNumber,
      issueDate: new Date(dto.issueDate),
      fileUrl,
    };

    return this.prisma.aRT.create({
      data,
      include: {
        serviceOrder: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.aRT.findMany({
      include: {
        serviceOrder: {
          select: { id: true, orderNumber: true, status: true, clientId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const art = await this.prisma.aRT.findUnique({
      where: { id },
      include: {
        serviceOrder: {
          select: { id: true, orderNumber: true, status: true, clientId: true },
        },
      },
    });

    if (!art) {
      throw new NotFoundException('ART não encontrada');
    }

    return art;
  }

  async findByServiceOrder(serviceOrderId: string) {
    const art = await this.prisma.aRT.findUnique({
      where: { serviceOrderId },
    });

    if (!art) {
      throw new NotFoundException('Esta OS ainda não possui ART emitida');
    }

    return art;
  }

  async update(id: string, dto: UpdateArtDto, fileUrl?: string) {
    await this.findOne(id);

    const data: Prisma.ARTUpdateInput = {
      ...(dto.number && { number: dto.number }),
      ...(dto.engineerName && { engineerName: dto.engineerName }),
      ...(dto.creaNumber && { creaNumber: dto.creaNumber }),
      ...(dto.issueDate && { issueDate: new Date(dto.issueDate) }),
      ...(fileUrl && { fileUrl }),
    };

    return this.prisma.aRT.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.aRT.delete({ where: { id } });
  }
}
