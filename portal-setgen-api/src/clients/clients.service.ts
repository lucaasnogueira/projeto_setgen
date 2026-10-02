import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Prisma, Client, ClientStatus } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Campo opcional em branco tem que virar NULL, não string vazia.
   *
   * `externalCode` é `String? @unique`. O Postgres aceita vários NULL numa
   * coluna unique, mas só UMA string vazia — então o primeiro cliente salvo
   * sem código externo gravava '' e todos os seguintes batiam em P2002
   * (unique constraint), que virava 500 na tela. O formulário manda '' quando
   * o campo fica em branco.
   */
  private nullIfBlank(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const existing = await this.prisma.client.findUnique({
      where: { cnpjCpf: createClientDto.cnpjCpf },
    });

    if (existing) {
      throw new ConflictException('CNPJ/CPF já cadastrado');
    }

    const externalCode = this.nullIfBlank(createClientDto.externalCode);

    if (externalCode) {
      const existingCode = await this.prisma.client.findUnique({
        where: { externalCode },
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
      email: createClientDto.email?.trim() || '',
      contacts: createClientDto.contacts ?? [],
      status: createClientDto.status,
      notes: createClientDto.notes ?? (createClientDto as any).nãotes,
      externalCode,
      onSiteContact: createClientDto.onSiteContact,
      corporatePhones: createClientDto.corporatePhones ?? [],
      corporateEmails: createClientDto.corporateEmails ?? [],
      internalNotes: createClientDto.internalNotes ?? (createClientDto as any).internalNãotes,
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
        addresses: true,
        contactList: true,
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

    // O create já checava duplicidade de código externo; o update não checava
    // nada e devolvia 500 (P2002) em vez de um conflito explicado.
    const externalCode = this.nullIfBlank(updateClientDto.externalCode);
    if (externalCode) {
      const existingCode = await this.prisma.client.findUnique({
        where: { externalCode },
      });

      if (existingCode && existingCode.id !== id) {
        throw new ConflictException('Código externo já cadastrado');
      }
    }

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
      ...(updateClientDto.email !== undefined && { email: updateClientDto.email ? updateClientDto.email.trim() : '' }),
      ...(updateClientDto.contacts && {
        contacts: updateClientDto.contacts,
      }),
      ...(updateClientDto.status && {
        status: updateClientDto.status,
      }),
      ...(updateClientDto.notes !== undefined && {
        notes: updateClientDto.notes !== undefined ? updateClientDto.notes : (updateClientDto as any).nãotes,
      }),
      ...(updateClientDto.externalCode !== undefined && {
        externalCode: this.nullIfBlank(updateClientDto.externalCode),
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
        internalNotes: updateClientDto.internalNotes !== undefined ? updateClientDto.internalNotes : (updateClientDto as any).internalNãotes,
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

    // Sem estas checagens o delete estourava violação de FK (500) sem dizer o
    // que estava preso. Cliente com histórico não se apaga: inative.
    const [quotes, serviceOrders, visits, expenses, purchaseOrders, equipments] =
      await Promise.all([
        this.prisma.quote.count({ where: { clientId: id } }),
        this.prisma.serviceOrder.count({ where: { clientId: id } }),
        this.prisma.technicalVisit.count({ where: { clientId: id } }),
        this.prisma.expense.count({ where: { clientId: id } }),
        this.prisma.purchaseOrder.count({ where: { clientId: id } }),
        this.prisma.equipment.count({ where: { clientId: id } }),
      ]);

    const blocking = [
      quotes && `${quotes} orçamento(s)`,
      serviceOrders && `${serviceOrders} ordem(ns) de serviço`,
      visits && `${visits} visita(s) técnica(s)`,
      purchaseOrders && `${purchaseOrders} ordem(ns) de compra`,
      expenses && `${expenses} despesa(s)`,
      equipments && `${equipments} equipamento(s)`,
    ].filter(Boolean);

    if (blocking.length > 0) {
      throw new BadRequestException(
        `Não é possível excluir este cliente: existe(m) ${blocking.join(', ')} vinculado(s). Marque o cliente como inativo.`,
      );
    }

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

  async addAddress(clientId: string, data: {
    label?: string;
    streetAddress: string;
    complement?: string;
    latitude?: number;
    longitude?: number;
    sourceExtraction?: string;
  }) {
    await this.findOne(clientId);
    return this.prisma.clientAddress.create({
      data: {
        clientId,
        label: data.label || 'Principal',
        streetAddress: data.streetAddress,
        complement: data.complement || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        sourceExtraction: data.sourceExtraction || 'MANUAL',
      },
    });
  }

  async deleteAddress(addressId: string) {
    const address = await this.prisma.clientAddress.findUnique({
      where: { id: addressId },
    });
    if (!address) {
      throw new NotFoundException('Endereço não encontrado');
    }
    return this.prisma.clientAddress.delete({
      where: { id: addressId },
    });
  }

  async addContact(clientId: string, data: {
    contactType: string;
    value: string;
    label?: string;
    name?: string;
  }) {
    await this.findOne(clientId);
    return this.prisma.clientContact.create({
      data: {
        clientId,
        contactType: data.contactType,
        value: data.value,
        label: data.label || null,
        name: data.name || null,
      },
    });
  }

  async deleteContact(contactId: string) {
    const contact = await this.prisma.clientContact.findUnique({
      where: { id: contactId },
    });
    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }
    return this.prisma.clientContact.delete({
      where: { id: contactId },
    });
  }
}
