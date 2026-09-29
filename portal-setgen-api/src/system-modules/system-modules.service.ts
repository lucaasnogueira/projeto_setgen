import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSystemModuleDto } from './dto/create-system-module.dto';
import { UpdateSystemModuleDto } from './dto/update-system-module.dto';

@Injectable()
export class SystemModulesService {
  constructor(private readonly prisma: PrismaService) {}

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
