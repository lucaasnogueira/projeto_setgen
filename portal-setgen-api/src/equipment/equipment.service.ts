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
    let clientConnect: any = undefined;
    if (createEquipmentDto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: createEquipmentDto.clientId },
      });
      if (client) {
        clientConnect = { connect: { id: createEquipmentDto.clientId } };
      }
    }

    const data: Prisma.EquipmentCreateInput = {
      ...(clientConnect && { client: clientConnect }),
      ...(createEquipmentDto.assignedUserId && {
        assignedUser: { connect: { id: createEquipmentDto.assignedUserId } },
      }),
      type: createEquipmentDto.type || EquipmentType.GENERATOR,
      name: createEquipmentDto.name || 'Equipamento sem nome',
      identifier: createEquipmentDto.identifier,
      category: createEquipmentDto.category,
      brand: createEquipmentDto.brand,
      model: createEquipmentDto.model,
      serialNumber: createEquipmentDto.serialNumber,
      powerRating: createEquipmentDto.powerRating,
      installLocation: createEquipmentDto.installLocation,
      ...(createEquipmentDto.purchaseDate && {
        purchaseDate: new Date(createEquipmentDto.purchaseDate),
      }),
      notes: createEquipmentDto.notes,
      ...(createEquipmentDto.expirationDate && {
        expirationDate: new Date(createEquipmentDto.expirationDate),
      }),
      ...(createEquipmentDto.warrantyStartDate && {
        warrantyStartDate: new Date(createEquipmentDto.warrantyStartDate),
      }),
      ...(createEquipmentDto.warrantyEndDate && {
        warrantyEndDate: new Date(createEquipmentDto.warrantyEndDate),
      }),
      active: createEquipmentDto.active !== undefined ? createEquipmentDto.active : true,
      photoUrl: createEquipmentDto.photoUrl,
      specifications: createEquipmentDto.specifications,
      ...(createEquipmentDto.parentEquipmentId && {
        parentEquipment: { connect: { id: createEquipmentDto.parentEquipmentId } },
      }),
    };

    return this.prisma.equipment.create({
      data,
      include: {
        client: {
          select: { id: true, companyName: true, tradeName: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
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
      ...(updateEquipmentDto.name !== undefined && {
        name: updateEquipmentDto.name,
      }),
      ...(updateEquipmentDto.identifier !== undefined && {
        identifier: updateEquipmentDto.identifier,
      }),
      ...(updateEquipmentDto.category !== undefined && {
        category: updateEquipmentDto.category,
      }),
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

  async bulkImport(items: any[]) {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    const allClients = await this.prisma.client.findMany({
      select: { id: true, companyName: true, tradeName: true, cnpjCpf: true },
    });

    const parseDate = (val: any): Date | undefined => {
      if (!val) return undefined;
      if (val instanceof Date) return val;
      const str = String(val).trim();
      if (!str) return undefined;
      const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dmy) {
        return new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`);
      }
      const parsed = new Date(str);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const mapType = (cat?: string): EquipmentType => {
      const c = (cat || '').toUpperCase();
      if (c.includes('SUB') || c.includes('SUBESTACAO')) return EquipmentType.SUBSTATION;
      if (c.includes('GERADOR') || c.includes('GMG')) return EquipmentType.GENERATOR;
      return EquipmentType.OTHER;
    };

    for (let i = 0; i < items.length; i++) {
      const raw = items[i];
      const name = String(raw.Nome || raw.name || raw['Nome do equipamento'] || '').trim();
      if (!name || name.toLowerCase().includes('nome do equipamento')) {
        skipped++;
        continue;
      }

      const description = String(raw.Descrição || raw.description || raw['Descrição do equipamento'] || '').trim();
      const identifier = String(raw.Identificador || raw.identifier || raw['Código de barras'] || '').trim() || null;
      const rawCategory = String(raw.Categoria || raw.category || '').trim();
      const type = mapType(rawCategory);
      const rawStatus = String(raw.Status || raw.status || '').toLowerCase();
      const active = rawStatus.includes('inativ') ? false : true;

      const rawClient = String(raw.Cliente || raw.client || '').trim();
      let matchedClientId: string | null = null;
      if (rawClient) {
        const cnpjMatch = rawClient.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        if (cnpjMatch) {
          const cleanDoc = cnpjMatch[0].replace(/\D/g, '');
          const c = allClients.find((cl) => cl.cnpjCpf && cl.cnpjCpf.replace(/\D/g, '') === cleanDoc);
          if (c) matchedClientId = c.id;
        }
        if (!matchedClientId) {
          const clientNamePart = rawClient.split('/')[0].trim().toLowerCase();
          const c = allClients.find(
            (cl) =>
              (cl.companyName && cl.companyName.toLowerCase().includes(clientNamePart)) ||
              (cl.tradeName && cl.tradeName.toLowerCase().includes(clientNamePart)),
          );
          if (c) matchedClientId = c.id;
        }
      }

      const warrantyStartDate = parseDate(raw['Início da garantia'] || raw.warrantyStartDate);
      const warrantyEndDate = parseDate(raw['Fim da garantia'] || raw.warrantyEndDate);
      const expirationDate = parseDate(raw['Data de validade'] || raw.expirationDate);

      try {
        const orClauses: Prisma.EquipmentWhereInput[] = [];
        if (identifier) orClauses.push({ identifier });
        if (name && matchedClientId) orClauses.push({ name, clientId: matchedClientId });

        const existing = orClauses.length > 0
          ? await this.prisma.equipment.findFirst({
              where: { OR: orClauses },
            })
          : null;

        if (existing) {
          await this.prisma.equipment.update({
            where: { id: existing.id },
            data: {
              name,
              model: description || existing.model,
              notes: description ? `${description}${existing.notes ? ' | ' + existing.notes : ''}` : existing.notes,
              category: rawCategory || existing.category,
              type,
              active,
              ...(matchedClientId && { clientId: matchedClientId }),
              ...(warrantyStartDate && { warrantyStartDate }),
              ...(warrantyEndDate && { warrantyEndDate }),
              ...(expirationDate && { expirationDate }),
            },
          });
          updated++;
        } else {
          await this.prisma.equipment.create({
            data: {
              name,
              identifier,
              category: rawCategory || null,
              type,
              model: description || null,
              notes: description || null,
              active,
              clientId: matchedClientId,
              warrantyStartDate,
              warrantyEndDate,
              expirationDate,
            },
          });
          created++;
        }
      } catch (err: any) {
        errors.push(`Linha ${i + 1} (${name}): ${err.message || 'Erro ao importar'}`);
      }
    }

    return { total: items.length, created, updated, skipped, errors };
  }
}
