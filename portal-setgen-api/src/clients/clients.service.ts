import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Prisma, Client, ClientStatus } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const existing = await this.prisma.client.findUnique({
      where: { cnpjCpf: createClientDto.cnpjCpf },
    });

    if (existing) {
      throw new ConflictException('CNPJ/CPF já cadastrado');
    }

    const clientData: Prisma.ClientCreateInput = {
      cnpjCpf: createClientDto.cnpjCpf,
      companyName: createClientDto.companyName,
      tradeName: createClientDto.tradeName,
      address: createClientDto.address as Prisma.InputJsonValue,
      phone: createClientDto.phone,
      email: createClientDto.email,
      contacts: createClientDto.contacts ?? [],
      status: createClientDto.status,
      notes: createClientDto.notes,
    };

    return this.prisma.client.create({
      data: clientData,
    });
  }

  async findAll(status?: ClientStatus): Promise<Client[]> {
    return this.prisma.client.findMany({
      where: status ? { status } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        technicalVisits: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        serviceOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    await this.findOne(id);

    const updateData: Prisma.ClientUpdateInput = {
      ...(updateClientDto.cnpjCpf && { cnpjCpf: updateClientDto.cnpjCpf }),
      ...(updateClientDto.companyName && {
        companyName: updateClientDto.companyName,
      }),
      ...(updateClientDto.tradeName && {
        tradeName: updateClientDto.tradeName,
      }),
      ...(updateClientDto.address && {
        address: updateClientDto.address as Prisma.InputJsonValue,
      }),
      ...(updateClientDto.phone && { phone: updateClientDto.phone }),
      ...(updateClientDto.email && { email: updateClientDto.email }),
      ...(updateClientDto.contacts && {
        contacts: updateClientDto.contacts,
      }),
      ...(updateClientDto.status && {
        status: updateClientDto.status,
      }),
      ...(updateClientDto.notes !== undefined && {
        notes: updateClientDto.notes,
      }),
    };

    return this.prisma.client.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<Client> {
    await this.findOne(id);

    return this.prisma.client.delete({
      where: { id },
    });
  }

  async search(query: string): Promise<Client[]> {
    return this.prisma.client.findMany({
      where: {
        OR: [
          { companyName: { contains: query, mode: 'insensitive' } },
          { tradeName: { contains: query, mode: 'insensitive' } },
          { cnpjCpf: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }
}
