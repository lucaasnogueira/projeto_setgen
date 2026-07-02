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

    if (createClientDto.externalCode) {
      const existingCode = await this.prisma.client.findUnique({
        where: { externalCode: createClientDto.externalCode },
      });

      if (existingCode) {
        throw new ConflictException('Código externo já cadastrado');
      }
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
      externalCode: createClientDto.externalCode,
      onSiteContact: createClientDto.onSiteContact,
      corporatePhones: createClientDto.corporatePhones ?? [],
      corporateEmails: createClientDto.corporateEmails ?? [],
      internalNotes: createClientDto.internalNotes,
      icmsTaxpayerType: createClientDto.icmsTaxpayerType,
      stateRegistration: createClientDto.stateRegistration,
      municipalRegistration: createClientDto.municipalRegistration,
      billingEmail: createClientDto.billingEmail,
      latitude: createClientDto.latitude,
      longitude: createClientDto.longitude,
      responsibleUser: createClientDto.responsibleUserId
        ? { connect: { id: createClientDto.responsibleUserId } }
        : undefined,
      responsibleTeam: createClientDto.responsibleTeamId
        ? { connect: { id: createClientDto.responsibleTeamId } }
        : undefined,
      group: createClientDto.groupId
        ? { connect: { id: createClientDto.groupId } }
        : undefined,
      segment: createClientDto.segmentId
        ? { connect: { id: createClientDto.segmentId } }
        : undefined,
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
        responsibleUser: { select: { id: true, name: true } },
        responsibleTeam: { select: { id: true, name: true } },
        group: { select: { id: true, name: true, color: true } },
        segment: { select: { id: true, name: true, color: true } },
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
      ...(updateClientDto.externalCode !== undefined && {
        externalCode: updateClientDto.externalCode,
      }),
      ...(updateClientDto.onSiteContact !== undefined && {
        onSiteContact: updateClientDto.onSiteContact,
      }),
      ...(updateClientDto.corporatePhones !== undefined && {
        corporatePhones: updateClientDto.corporatePhones,
      }),
      ...(updateClientDto.corporateEmails !== undefined && {
        corporateEmails: updateClientDto.corporateEmails,
      }),
      ...(updateClientDto.internalNotes !== undefined && {
        internalNotes: updateClientDto.internalNotes,
      }),
      ...(updateClientDto.icmsTaxpayerType !== undefined && {
        icmsTaxpayerType: updateClientDto.icmsTaxpayerType,
      }),
      ...(updateClientDto.stateRegistration !== undefined && {
        stateRegistration: updateClientDto.stateRegistration,
      }),
      ...(updateClientDto.municipalRegistration !== undefined && {
        municipalRegistration: updateClientDto.municipalRegistration,
      }),
      ...(updateClientDto.billingEmail !== undefined && {
        billingEmail: updateClientDto.billingEmail,
      }),
      ...(updateClientDto.latitude !== undefined && {
        latitude: updateClientDto.latitude,
      }),
      ...(updateClientDto.longitude !== undefined && {
        longitude: updateClientDto.longitude,
      }),
      ...(updateClientDto.responsibleUserId !== undefined && {
        responsibleUser: updateClientDto.responsibleUserId
          ? { connect: { id: updateClientDto.responsibleUserId } }
          : { disconnect: true },
      }),
      ...(updateClientDto.responsibleTeamId !== undefined && {
        responsibleTeam: updateClientDto.responsibleTeamId
          ? { connect: { id: updateClientDto.responsibleTeamId } }
          : { disconnect: true },
      }),
      ...(updateClientDto.groupId !== undefined && {
        group: updateClientDto.groupId
          ? { connect: { id: updateClientDto.groupId } }
          : { disconnect: true },
      }),
      ...(updateClientDto.segmentId !== undefined && {
        segment: updateClientDto.segmentId
          ? { connect: { id: updateClientDto.segmentId } }
          : { disconnect: true },
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
