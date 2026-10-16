import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; active?: boolean; category?: string }) {
    const where: any = {};

    if (params?.active !== undefined) {
      where.active = params.active;
    }

    if (params?.category && params.category !== 'TODAS') {
      where.category = params.category;
    }

    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { category: { contains: params.search, mode: 'insensitive' } },
        { externalCode: { contains: params.search, mode: 'insensitive' } },
        { defaultObservation: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.service.findMany({
      where,
      include: {
        templates: true,
      },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
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
        category: dto.category || null,
        unit: dto.unit || 'sv',
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
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
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

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.service.delete({
      where: { id },
    });
  }

  async bulkImport(services: CreateServiceDto[]) {
    let count = 0;
    for (const s of services) {
      if (!s.title || !s.title.trim()) continue;
      const cleanTitle = s.title.trim();
      let cleanCode = s.externalCode?.trim() || null;
      const cleanPrice = Number(s.price) || 0;

      try {
        // 1. Tentar encontrar por externalCode primeiro (se fornecido)
        let existing: any = null;
        if (cleanCode) {
          existing = await this.prisma.service.findFirst({
            where: { externalCode: cleanCode },
          });
        }

        // 2. Se não encontrou por código, tentar por título
        if (!existing) {
          existing = await this.prisma.service.findFirst({
            where: { title: cleanTitle },
          });
        }

        if (existing) {
          // Se já existe, verificar se o código a ser atualizado já pertence a OUTRO registro
          if (cleanCode && cleanCode !== existing.externalCode) {
            const conflict = await this.prisma.service.findFirst({
              where: {
                externalCode: cleanCode,
                NOT: { id: existing.id },
              },
            });
            if (conflict) {
              cleanCode = existing.externalCode;
            }
          } else if (!cleanCode) {
            cleanCode = existing.externalCode;
          }

          await this.prisma.service.update({
            where: { id: existing.id },
            data: {
              title: cleanTitle,
              category: s.category || existing.category,
              unit: s.unit || existing.unit,
              price: cleanPrice,
              externalCode: cleanCode,
              defaultObservation:
                s.defaultObservation !== undefined
                  ? s.defaultObservation
                  : existing.defaultObservation,
              active: s.active !== undefined ? s.active : existing.active,
            },
          });
        } else {
          // Novo registro: verificar se o código já está em uso por algum outro
          if (cleanCode) {
            const codeTaken = await this.prisma.service.findFirst({
              where: { externalCode: cleanCode },
            });
            if (codeTaken) {
              cleanCode = null;
            }
          }

          await this.prisma.service.create({
            data: {
              title: cleanTitle,
              category: s.category || null,
              unit: s.unit || 'sv',
              price: cleanPrice,
              externalCode: cleanCode,
              defaultObservation: s.defaultObservation || null,
              active: s.active ?? true,
            },
          });
        }
        count++;
      } catch (rowErr) {
        console.warn(`[bulkImport] Aviso ao importar serviço "${cleanTitle}":`, rowErr);
      }
    }
    return { count };
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

