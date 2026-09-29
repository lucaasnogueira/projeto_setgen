import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; active?: boolean }) {
    const where: any = {};

    if (params?.active !== undefined) {
      where.active = params.active;
    }

    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { externalCode: { contains: params.search, mode: 'insensitive' } },
        { defaultObservation: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.service.findMany({
      where,
      include: {
        templates: true,
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        templates: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Serviço com ID ${id} não encontrado`);
    }

    return service;
  }

  async create(dto: CreateServiceDto) {
    if (dto.externalCode) {
      const exists = await this.prisma.service.findUnique({
        where: { externalCode: dto.externalCode },
      });
      if (exists) {
        throw new ConflictException(`Código externo ${dto.externalCode} já está em uso`);
      }
    }

    return this.prisma.service.create({
      data: {
        title: dto.title,
        price: dto.price,
        externalCode: dto.externalCode || null,
        defaultObservation: dto.defaultObservation || null,
        observationEditable: dto.observationEditable ?? true,
        active: dto.active ?? true,
      },
      include: {
        templates: true,
      },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);

    if (dto.externalCode) {
      const exists = await this.prisma.service.findFirst({
        where: {
          externalCode: dto.externalCode,
          NOT: { id },
        },
      });
      if (exists) {
        throw new ConflictException(`Código externo ${dto.externalCode} já está em uso`);
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.externalCode !== undefined && { externalCode: dto.externalCode }),
        ...(dto.defaultObservation !== undefined && { defaultObservation: dto.defaultObservation }),
        ...(dto.observationEditable !== undefined && { observationEditable: dto.observationEditable }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
      include: {
        templates: true,
      },
    });
  }

  async toggleActive(id: string) {
    const service = await this.findOne(id);
    return this.prisma.service.update({
      where: { id },
      data: { active: !service.active },
    });
  }

  async createTemplate(serviceId: string, dto: CreateTemplateDto) {
    await this.findOne(serviceId);

    return this.prisma.serviceTemplate.create({
      data: {
        serviceId,
        title: dto.title,
        templateContent: dto.templateContent,
      },
    });
  }

  async getTemplates(serviceId: string) {
    await this.findOne(serviceId);
    return this.prisma.serviceTemplate.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteTemplate(templateId: string) {
    const template = await this.prisma.serviceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template com ID ${templateId} não encontrado`);
    }

    return this.prisma.serviceTemplate.delete({
      where: { id: templateId },
    });
  }
}

