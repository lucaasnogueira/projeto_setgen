import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    if (dto.cnpj) {
      const existing = await this.prisma.supplier.findUnique({
        where: { cnpj: dto.cnpj },
      });
      if (existing) {
        throw new ConflictException('Já existe um fornecedor com este CNPJ');
      }
    }

    return this.prisma.supplier.create({ data: dto });
  }

  async findAll(active?: boolean) {
    return this.prisma.supplier.findMany({
      where: active !== undefined ? { active } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        procurementOrders: {
          select: { id: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const supplier = await this.findOne(id);

    if (supplier.procurementOrders && supplier.procurementOrders.length > 0) {
      throw new BadRequestException(
        'Não é possível remover fornecedor com pedidos de compra vinculados. Desative-o em vez disso.',
      );
    }

    return this.prisma.supplier.delete({ where: { id } });
  }
}
