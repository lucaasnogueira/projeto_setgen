import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFailureCategoryDto } from './dto/create-failure-category.dto';
import { UpdateFailureCategoryDto } from './dto/update-failure-category.dto';

@Injectable()
export class FailureCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFailureCategoryDto) {
    const existing = await this.prisma.failureCategory.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Já existe uma categoria de falha com este nome');
    }

    return this.prisma.failureCategory.create({ data: dto });
  }

  async findAll(active?: boolean) {
    return this.prisma.failureCategory.findMany({
      where: active !== undefined ? { active } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.failureCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoria de falha não encontrada');
    }

    return category;
  }

  async update(id: string, dto: UpdateFailureCategoryDto) {
    await this.findOne(id);
    return this.prisma.failureCategory.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);

    const inUse = await this.prisma.technicalVisit.count({
      where: { failureCategoryId: id },
    });

    if (inUse > 0) {
      throw new BadRequestException(
        'Não é possível remover: categoria já utilizada em visitas. Desative-a em vez de remover.',
      );
    }

    return this.prisma.failureCategory.delete({ where: { id } });
  }
}
