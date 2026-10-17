import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  async bulkImport(services: any[]) {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    const parseMoney = (val: any): number => {
      if (val === undefined || val === null || val === '') return 0;
      if (typeof val === 'number') return val;
      const str = String(val).replace('R$', '').trim();
      const cleaned = str.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      const rawTitle = String(s['Titulo do serviço'] || s.title || s.nome || '').trim();
      if (!rawTitle || rawTitle.toLowerCase().includes('nome do serviço') || rawTitle.toLowerCase() === 'titulo do serviço') {
        skipped++;
        continue;
      }

      const cleanTitle = rawTitle;
      let cleanCode = String(s['Código externo'] || s.externalCode || s.code || '').trim() || null;
      const cleanPrice = parseMoney(s['Preço'] !== undefined ? s['Preço'] : s.price);
      const nfseDescription = String(s['Descrição do serviço na NFS-e'] || s.nfseDescription || '').trim() || null;
      
      const rawFormat = String(s['Formatação do texto na NFS-e'] || s.nfseFormatText || '').toLowerCase();
      const nfseFormatText = rawFormat.includes('inativ') ? false : true;

      const rawObsEdit = String(s['A observação pode ser editada'] || s.observationEditable || '').toLowerCase();
      const observationEditable = rawObsEdit.includes('ativ') ? true : false;

      const cnae = String(s['CNAE do serviço'] || s.cnae || '').trim() || null;
      const templateTitle = String(s['Template de observação'] || s.templateTitle || '').trim() || null;
      const defaultObservation = String(s['Observação'] || s.defaultObservation || s.notes || '').trim() || null;

      const rawStatus = String(s.Status || s.status || '').toLowerCase();
      const active = rawStatus.includes('inativ') ? false : true;
      const category = String(s.Categoria || s.category || '').trim() || null;
      const unit = String(s.Unidade || s.unit || 'sv').trim() || 'sv';

      try {
        const orClauses: Prisma.ServiceWhereInput[] = [];
        if (cleanCode) orClauses.push({ externalCode: cleanCode });
        if (cleanTitle) orClauses.push({ title: cleanTitle });

        const existing = orClauses.length > 0
          ? await this.prisma.service.findFirst({
              where: { OR: orClauses },
            })
          : null;

        if (existing) {
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
              category: category || existing.category,
              unit: unit || existing.unit,
              price: cleanPrice,
              externalCode: cleanCode,
              defaultObservation: defaultObservation !== null ? defaultObservation : existing.defaultObservation,
              observationEditable,
              active,
              nfseDescription: nfseDescription || existing.nfseDescription,
              nfseFormatText,
              cnae: cnae || existing.cnae,
              templateTitle: templateTitle || existing.templateTitle,
            },
          });
          updated++;
        } else {
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
              category,
              unit,
              price: cleanPrice,
              externalCode: cleanCode,
              defaultObservation,
              observationEditable,
              active,
              nfseDescription,
              nfseFormatText,
              cnae,
              templateTitle,
            },
          });
          created++;
        }
      } catch (rowErr: any) {
        errors.push(`Serviço "${cleanTitle}": ${rowErr.message || 'Erro ao importar'}`);
      }
    }
    return { total: services.length, created, updated, skipped, errors };
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

