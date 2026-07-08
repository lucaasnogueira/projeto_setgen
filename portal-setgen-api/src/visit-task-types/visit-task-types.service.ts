import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitTaskTypeDto } from './dto/create-visit-task-type.dto';
import { UpdateVisitTaskTypeDto } from './dto/update-visit-task-type.dto';

@Injectable()
export class VisitTaskTypesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVisitTaskTypeDto) {
    const existing = await this.prisma.visitTaskType.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Já existe um tipo de tarefa com este nome');
    }

    return this.prisma.visitTaskType.create({ data: dto });
  }

  async findAll(active?: boolean) {
    return this.prisma.visitTaskType.findMany({
      where: active !== undefined ? { active } : undefined,
      include: { defaultChecklistTemplate: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const taskType = await this.prisma.visitTaskType.findUnique({
      where: { id },
      include: { defaultChecklistTemplate: { select: { id: true, name: true } } },
    });

    if (!taskType) {
      throw new NotFoundException('Tipo de tarefa não encontrado');
    }

    return taskType;
  }

  async update(id: string, dto: UpdateVisitTaskTypeDto) {
    await this.findOne(id);
    return this.prisma.visitTaskType.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);

    const inUse = await this.prisma.technicalVisit.count({
      where: { taskTypeId: id },
    });

    if (inUse > 0) {
      throw new BadRequestException(
        'Não é possível remover: tipo já utilizado em visitas. Desative-o em vez de remover.',
      );
    }

    return this.prisma.visitTaskType.delete({ where: { id } });
  }
}
