import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockLocationDto } from './dto/create-stock-location.dto';

@Injectable()
export class StockLocationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStockLocationDto) {
    const existing = await this.prisma.stockLocation.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Já existe uma localização com este código');
    }

    return this.prisma.stockLocation.create({ data: dto });
  }

  async findAll() {
    return this.prisma.stockLocation.findMany({ orderBy: { code: 'asc' } });
  }
}
