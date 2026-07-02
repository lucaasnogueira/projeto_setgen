import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import {
  ChecklistTemplate,
  Prisma,
  ServiceOrderType,
} from '@prisma/client';

@Injectable()
export class ChecklistTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChecklistTemplateDto): Promise<ChecklistTemplate> {
    return this.prisma.checklistTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        serviceOrderType: dto.serviceOrderType,
        active: dto.active ?? true,
        fields: dto.fields as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(
    serviceOrderType?: ServiceOrderType,
    active?: boolean,
  ): Promise<ChecklistTemplate[]> {
    return this.prisma.checklistTemplate.findMany({
      where: {
        ...(serviceOrderType && {
          OR: [{ serviceOrderType }, { serviceOrderType: null }],
        }),
        ...(active !== undefined && { active }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<ChecklistTemplate> {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    return template;
  }

  async update(
    id: string,
    dto: UpdateChecklistTemplateDto,
  ): Promise<ChecklistTemplate> {
    await this.findOne(id);

    const data: Prisma.ChecklistTemplateUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.serviceOrderType !== undefined && {
        serviceOrderType: dto.serviceOrderType,
      }),
      ...(dto.active !== undefined && { active: dto.active }),
      ...(dto.fields !== undefined && {
        fields: dto.fields as unknown as Prisma.InputJsonValue,
      }),
    };

    return this.prisma.checklistTemplate.update({ where: { id }, data });
  }

  async remove(id: string): Promise<ChecklistTemplate> {
    await this.findOne(id);

    const inUse = await this.prisma.serviceOrder.count({
      where: { checklistTemplateId: id },
    });

    if (inUse > 0) {
      throw new BadRequestException(
        'Não é possível remover: template já utilizado em Ordens de Serviço. Desative-o em vez de remover.',
      );
    }

    return this.prisma.checklistTemplate.delete({ where: { id } });
  }
}
