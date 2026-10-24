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
    if (createClientDto.cnpjCpf?.trim()) {
      const existing = await this.prisma.client.findFirst({
        where: {
          cnpjCpf: createClientDto.cnpjCpf.trim(),
          companyName: createClientDto.companyName.trim(),
        },
      });

      if (existing) {
        throw new ConflictException('Já existe um cliente cadastrado com esta Razão Social e CNPJ/CPF');
      }
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
      phone: createClientDto.phone?.trim() || '',
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
      auvoId: this.nullIfBlank(createClientDto.auvoId),
      billingAddress: createClientDto.billingAddress ? (createClientDto.billingAddress as Prisma.InputJsonValue) : undefined,
      lastVisitDate: createClientDto.lastVisitDate ? new Date(createClientDto.lastVisitDate) : undefined,
    };

    return this.prisma.client.create({
      data: clientData,
    });
  }

  async findAll(status?: ClientStatus): Promise<Client[]> {
    return this.prisma.client.findMany({
      where: status ? { status } : undefined,
      include: {
        responsibleUser: { select: { id: true, name: true, email: true, role: true } },
        responsibleTeam: { select: { id: true, name: true } },
        group: { select: { id: true, name: true, color: true } },
        segment: { select: { id: true, name: true, color: true } },
      },
      orderBy: {
        companyName: 'asc',
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
      ...((updateClientDto as any).auvoId !== undefined && {
        auvoId: this.nullIfBlank((updateClientDto as any).auvoId),
      }),
      ...((updateClientDto as any).billingAddress !== undefined && {
        billingAddress: (updateClientDto as any).billingAddress as Prisma.InputJsonValue,
      }),
      ...((updateClientDto as any).lastVisitDate !== undefined && {
        lastVisitDate: (updateClientDto as any).lastVisitDate ? new Date((updateClientDto as any).lastVisitDate) : null,
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
      include: {
        responsibleUser: { select: { id: true, name: true, email: true, role: true } },
        responsibleTeam: { select: { id: true, name: true } },
        group: { select: { id: true, name: true, color: true } },
        segment: { select: { id: true, name: true, color: true } },
      },
      orderBy: { companyName: 'asc' },
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

  async bulkImport(items: any[]) {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

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

    const parseAddress = (rawAddr?: string, rawComp?: string) => {
      if (!rawAddr || !rawAddr.trim()) {
        return {
          street: 'Não informado',
          number: 'S/N',
          neighborhood: '',
          city: 'Manaus',
          state: 'AM',
          zipCode: '69000-000',
          complement: rawComp || '',
        };
      }
      const parts = rawAddr.split(',').map((p) => p.trim());
      return {
        street: parts[0] || 'Não informado',
        number: parts[1] || 'S/N',
        neighborhood: parts[2] || '',
        city: parts[3] || 'Manaus',
        state: parts[4] || 'AM',
        zipCode: parts[5] || '69000-000',
        complement: rawComp || '',
      };
    };

    for (let i = 0; i < items.length; i++) {
      const raw = items[i];
      // Ignorar cabeçalho repetido ou instrução do Auvo
      const code = String(raw.Código || raw.codigo || raw.code || '').trim();
      const rawRazao = String(raw['Razão social'] || raw.companyName || raw.razaoSocial || '').trim();
      const rawNome = String(raw.Nome || raw.tradeName || raw.nome || '').trim();

      if (
        (!rawRazao && !rawNome) ||
        rawRazao.toLowerCase().includes('razão social') ||
        rawNome.toLowerCase().includes('nome do cliente')
      ) {
        skipped++;
        continue;
      }

      const companyName = rawRazao || rawNome || `Cliente ${code || i + 1}`;
      const tradeName = rawNome || rawRazao || null;
      const externalCode = this.nullIfBlank(String(raw['Código externo'] || raw.externalCode || ''));
      const auvoId = this.nullIfBlank(code);

      const rawCnpj = String(raw['CPF ou CNPJ'] || raw.cnpjCpf || raw.cpfCnpj || '').trim();
      const cleanDoc = rawCnpj ? rawCnpj.replace(/\s+/g, '') : null;

      const rawPhones = String(raw['Telefone corporativo'] || raw.phone || '').trim();
      const phoneList = rawPhones ? rawPhones.split(';').map((p) => p.trim()).filter(Boolean) : [];
      const phone = phoneList[0] || '';

      const rawEmails = String(raw['E-mail corporativo'] || raw.email || '').trim();
      const emailList = rawEmails ? rawEmails.split(';').map((e) => e.trim()).filter(Boolean) : [];
      const email = emailList[0] || '';

      const onSiteContact = String(raw['Falar com'] || raw.onSiteContact || '').trim() || null;
      const notes = String(raw.Observação || raw.notes || '').trim() || null;
      const internalNotes = String(raw['Observação Interna'] || raw.internalNotes || '').trim() || null;

      const rawStatus = String(raw.Status || raw.status || '').toLowerCase();
      const status: ClientStatus = rawStatus.includes('inativ') ? ClientStatus.INACTIVE : ClientStatus.ACTIVE;

      const lastVisitDate = parseDate(raw['Última visita'] || raw.lastVisitDate);
      const stateRegistration = String(raw['Inscrição Estadual'] || raw.stateRegistration || '').trim() || null;
      const municipalRegistration = String(raw['Inscrição Municipal'] || raw.municipalRegistration || '').trim() || null;
      const billingEmail = String(raw['E-mail de cobrança'] || raw.billingEmail || '').trim() || null;

      const lat = raw.Latitude ? parseFloat(String(raw.Latitude).replace(',', '.')) : undefined;
      const lng = raw.Longitude ? parseFloat(String(raw.Longitude).replace(',', '.')) : undefined;

      const address = parseAddress(
        String(raw['Endereço'] || raw.address || ''),
        String(raw['Complemento do Endereço'] || raw.complement || ''),
      );

      const billingAddress = {
        zipCode: String(raw['CEP de cobrança'] || '').trim(),
        street: String(raw['Logradouro endereço de cobrança'] || '').trim(),
        number: String(raw['Número endereço de cobrança'] || '').trim(),
        complement: String(raw['Complemento endereço de cobrança'] || '').trim(),
        neighborhood: String(raw['Bairro de cobrança'] || '').trim(),
        city: String(raw['Cidade de cobrança'] || '').trim(),
        state: String(raw['Estado de cobrança'] || '').trim(),
      };

      try {
        const orConditions: Prisma.ClientWhereInput[] = [];
        if (auvoId) orConditions.push({ auvoId });
        if (externalCode) orConditions.push({ externalCode });
        if (cleanDoc) orConditions.push({ cnpjCpf: cleanDoc, companyName });
        if (!cleanDoc && companyName) orConditions.push({ companyName, tradeName });

        const existing = orConditions.length > 0
          ? await this.prisma.client.findFirst({
              where: { OR: orConditions },
            })
          : null;

        if (existing) {
          await this.prisma.client.update({
            where: { id: existing.id },
            data: {
              companyName,
              tradeName: tradeName || existing.tradeName,
              cnpjCpf: cleanDoc || existing.cnpjCpf,
              phone: phone || existing.phone,
              email: email || existing.email,
              onSiteContact: onSiteContact || existing.onSiteContact,
              notes: notes ? `${notes}${existing.notes ? ' | ' + existing.notes : ''}` : existing.notes,
              internalNotes: internalNotes || existing.internalNotes,
              status,
              corporatePhones: phoneList.length > 0 ? phoneList : existing.corporatePhones,
              corporateEmails: emailList.length > 0 ? emailList : existing.corporateEmails,
              stateRegistration: stateRegistration || existing.stateRegistration,
              municipalRegistration: municipalRegistration || existing.municipalRegistration,
              billingEmail: billingEmail || existing.billingEmail,
              ...(lat !== undefined && !isNaN(lat) && { latitude: lat }),
              ...(lng !== undefined && !isNaN(lng) && { longitude: lng }),
              ...(lastVisitDate && { lastVisitDate }),
              ...(auvoId && { auvoId }),
              ...(externalCode && { externalCode }),
              ...(billingAddress.street && { billingAddress: billingAddress as Prisma.InputJsonValue }),
            },
          });
          updated++;
        } else {
          await this.prisma.client.create({
            data: {
              companyName,
              tradeName,
              cnpjCpf: cleanDoc,
              phone,
              email,
              address: address as any,
              onSiteContact,
              notes,
              internalNotes,
              status,
              corporatePhones: phoneList,
              corporateEmails: emailList,
              stateRegistration,
              municipalRegistration,
              billingEmail,
              latitude: lat !== undefined && !isNaN(lat) ? lat : null,
              longitude: lng !== undefined && !isNaN(lng) ? lng : null,
              lastVisitDate,
              auvoId,
              externalCode,
              ...(billingAddress.street && { billingAddress: billingAddress as Prisma.InputJsonValue }),
            },
          });
          created++;
        }
      } catch (err: any) {
        errors.push(`Linha ${i + 1} (${companyName}): ${err.message || 'Erro ao importar'}`);
      }
    }

    return { total: items.length, created, updated, skipped, errors };
  }
}
