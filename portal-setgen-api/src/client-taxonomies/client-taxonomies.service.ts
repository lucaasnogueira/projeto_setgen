import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientTaxonomyDto } from './dto/create-client-taxonomy.dto';
import { UpdateClientTaxonomyDto } from './dto/update-client-taxonomy.dto';
import { ClientTaxonomy, ClientTaxonomyKind, Prisma } from '@prisma/client';

@Injectable()
export class ClientTaxonomiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientTaxonomyDto): Promise<ClientTaxonomy> {
    const existing = await this.prisma.clientTaxonomy.findUnique({
      where: { kind_name: { kind: dto.kind, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException('Já existe um registro com esse nome nessa categoria');
    }

    return this.prisma.clientTaxonomy.create({
      data: {
        kind: dto.kind,
        name: dto.name,
        color: dto.color,
        active: dto.active ?? true,
      },
    });
  }

  async findAll(kind?: ClientTaxonomyKind, active?: boolean): Promise<ClientTaxonomy[]> {
    return this.prisma.clientTaxonomy.findMany({
      where: {
        ...(kind && { kind }),
        ...(active !== undefined && { active }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<ClientTaxonomy> {
    const taxonomy = await this.prisma.clientTaxonomy.findUnique({ where: { id } });

    if (!taxonomy) {
      throw new NotFoundException('Registro não encontrado');
    }

    return taxonomy;
  }

  async update(id: string, dto: UpdateClientTaxonomyDto): Promise<ClientTaxonomy> {
    await this.findOne(id);

    const data: Prisma.ClientTaxonomyUpdateInput = {
      ...(dto.kind !== undefined && { kind: dto.kind }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.active !== undefined && { active: dto.active }),
    };

    return this.prisma.clientTaxonomy.update({ where: { id }, data });
  }

  async remove(id: string): Promise<ClientTaxonomy> {
    await this.findOne(id);
    return this.prisma.clientTaxonomy.delete({ where: { id } });
  }
}
