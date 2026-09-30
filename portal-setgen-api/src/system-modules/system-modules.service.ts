import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSystemModuleDto } from './dto/create-system-module.dto';
import { UpdateSystemModuleDto } from './dto/update-system-module.dto';

@Injectable()
export class SystemModulesService implements OnModuleInit {
  async onModuleInit() {
    await this.ensureStandardModules();
  }
  constructor(private readonly prisma: PrismaService) {}

  private async ensureStandardModules() {
    const STANDARD_MODULES = [
      {
        code: 'DASHBOARD',
        name: 'Dashboard Geral',
        description: 'Visão executiva, métricas operacionais e indicadores em tempo real.',
        route: '/dashboard',
        icon: 'LayoutGrid',
        orderIndex: 1,
        permissionNames: [] as string[],
      },
      {
        code: 'COMMERCIAL',
        name: 'Comercial & Propostas',
        description: 'Elaboração e precificação de orçamentos e propostas comerciais.',
        route: '/quotes',
        icon: 'Briefcase',
        orderIndex: 2,
        permissionNames: ['clients:view'],
      },
      {
        code: 'SERVICE_ORDERS',
        name: 'Ordens de Serviço & Campo',
        description: 'Gestão de ordens de serviço externas, visitas técnicas, laudos e ART.',
        route: '/orders',
        icon: 'FileText',
        orderIndex: 3,
        permissionNames: [
          'orders:view', 'orders:create', 'orders:edit', 'orders:delete', 'orders:approve',
          'visits:view', 'visits:create', 'visits:edit', 'visits:delete',
          'art:view', 'art:manage'
        ],
      },
      {
        code: 'CLIENTS',
        name: 'Clientes',
        description: 'Gestão cadastral de clientes, contratos e contatos corporativos.',
        route: '/clients',
        icon: 'Users',
        orderIndex: 4,
        permissionNames: ['clients:view', 'clients:create', 'clients:edit', 'clients:delete'],
      },
      {
        code: 'INVENTORY',
        name: 'Almoxarifado & Estoque',
        description: 'Controle de saldo, movimentações de peças e mesa de separação.',
        route: '/inventory',
        icon: 'Package',
        orderIndex: 5,
        permissionNames: ['inventory:view', 'inventory:manage', 'material-requests:view', 'material-requests:manage'],
      },
      {
        code: 'EQUIPMENTS',
        name: 'Equipamentos & Geradores',
        description: 'Rastreabilidade de geradores, contratos e termos de garantia.',
        route: '/equipment',
        icon: 'Zap',
        orderIndex: 6,
        permissionNames: ['equipment:view', 'equipment:manage', 'warranty:view', 'warranty:manage'],
      },
      {
        code: 'PROCUREMENT',
        name: 'Compras & Suprimentos',
        description: 'Pedidos de compra para fornecedores e cotações de peças.',
        route: '/procurement',
        icon: 'ShoppingCart',
        orderIndex: 7,
        permissionNames: ['procurement:view', 'procurement:manage', 'suppliers:view', 'suppliers:manage'],
      },
      {
        code: 'FINANCIAL',
        name: 'Financeiro & Faturamento',
        description: 'Controle de despesas operacionais, reembolsos e faturamento.',
        route: '/financial',
        icon: 'Wallet',
        orderIndex: 8,
        permissionNames: ['expenses:view', 'expenses:create', 'expenses:edit', 'expenses:delete', 'expenses:approve'],
      },
      {
        code: 'FLEET',
        name: 'Frotas & Veículos',
        description: 'Gestão de veículos, viagens, combustível e quilometragem.',
        route: '/fleet',
        icon: 'Truck',
        orderIndex: 9,
        permissionNames: ['fleet:view', 'fleet:manage', 'fleet:fuel-request', 'fleet:fuel-approve'],
      },
      {
        code: 'RH',
        name: 'Recursos Humanos',
        description: 'Gestão de colaboradores, documentações funcionais e ASOs.',
        route: '/rh/employees',
        icon: 'Contact',
        orderIndex: 10,
        permissionNames: ['rh:view', 'rh:manage'],
      },
      {
        code: 'SETTINGS',
        name: 'Configurador',
        description: 'Gestão de macro-módulos, perfis de acesso, permissões e usuários.',
        route: '/settings/modules',
        icon: 'Shield',
        orderIndex: 11,
        permissionNames: [
          'users:view', 'users:create', 'users:edit', 'users:delete', 'users:manage',
          'roles:view', 'roles:create', 'roles:edit', 'roles:delete'
        ],
      },
    ];

    for (const modDef of STANDARD_MODULES) {
      const module = await this.prisma.systemModule.upsert({
        where: { code: modDef.code },
        update: {
          name: modDef.name,
          route: modDef.route,
          icon: modDef.icon,
          orderIndex: modDef.orderIndex,
          isActive: true,
        },
        create: {
          code: modDef.code,
          name: modDef.name,
          description: modDef.description,
          route: modDef.route,
          icon: modDef.icon,
          orderIndex: modDef.orderIndex,
          isActive: true,
        },
      });

      if (modDef.permissionNames.length > 0) {
        await this.prisma.permission.updateMany({
          where: { name: { in: modDef.permissionNames } },
          data: { moduleId: module.id },
        });
      }
    }
  }

  private slugifyCode(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async findAll(onlyActive = false) {
    const where = onlyActive ? { isActive: true } : {};
    return this.prisma.systemModule.findMany({
      where,
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { permissions: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const mod = await this.prisma.systemModule.findUnique({
      where: { id },
      include: {
        permissions: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!mod) {
      throw new NotFoundException(`Módulo com ID ${id} não encontrado.`);
    }

    return mod;
  }

  async create(dto: CreateSystemModuleDto) {
    const code = dto.code?.trim() || this.slugifyCode(dto.name);

    const existing = await this.prisma.systemModule.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(
        `Já existe um módulo com o código/identificador "${code}".`,
      );
    }

    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined || orderIndex === null) {
      const highestOrder = await this.prisma.systemModule.aggregate({
        _max: { orderIndex: true },
      });
      orderIndex = (highestOrder._max.orderIndex || 0) + 1;
    }

    return this.prisma.systemModule.create({
      data: {
        name: dto.name.trim(),
        code,
        description: dto.description?.trim(),
        route: dto.route.trim(),
        icon: dto.icon?.trim() || 'Layers',
        orderIndex,
        isActive: dto.isActive ?? true,
      },
      include: {
        _count: {
          select: { permissions: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateSystemModuleDto) {
    const mod = await this.findOne(id);

    let code = dto.code ? dto.code.trim() : undefined;
    if (code && code !== mod.code) {
      const existing = await this.prisma.systemModule.findUnique({
        where: { code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Já existe outro módulo com o código/identificador "${code}".`,
        );
      }
    }

    return this.prisma.systemModule.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(code && { code }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.route && { route: dto.route.trim() }),
        ...(dto.icon && { icon: dto.icon.trim() }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        _count: {
          select: { permissions: true },
        },
      },
    });
  }

  async toggleStatus(id: string) {
    const mod = await this.findOne(id);
    return this.prisma.systemModule.update({
      where: { id },
      data: { isActive: !mod.isActive },
      include: {
        _count: {
          select: { permissions: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.permission.updateMany({
      where: { moduleId: id },
      data: { moduleId: null },
    });

    return this.prisma.systemModule.delete({
      where: { id },
    });
  }
}
