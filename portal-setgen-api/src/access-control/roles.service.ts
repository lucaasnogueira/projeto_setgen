import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PERMISSION_GROUPS } from './permissions.constants';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name, description, permissionIds } = createRoleDto;

    const existingRole = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException('Já existe um cargo com este nome');
    }

    // Garantir que todas as permissões existem no banco
    if (permissionIds && permissionIds.length > 0) {
      await this.syncPermissionsWithDatabase();
    }

    return this.prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissionIds?.map((id) => ({
            permission: {
              connect: { name: id },
            },
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        _count: {
          select: { users: true, permissions: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Cargo não encontrado');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { name, description, permissionIds } = updateRoleDto;

    const role = await this.findOne(id);

    if (name && name !== role.name) {
      const existingRole = await this.prisma.role.findUnique({
        where: { name },
      });
      if (existingRole) {
        throw new ConflictException('Já existe um cargo com este nome');
      }
    }

    // Se as permissões forem enviadas, removemos as antigas e adicionamos as novas
    if (permissionIds) {
      await this.syncPermissionsWithDatabase();
      
      return this.prisma.role.update({
        where: { id },
        data: {
          name,
          description,
          permissions: {
            deleteMany: {}, // Remove todas as permissões atuais do cargo
            create: permissionIds.map((pId) => ({
              permission: {
                connect: { name: pId },
              },
            })),
          },
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    }

    return this.prisma.role.update({
      where: { id },
      data: { name, description },
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    // Verificar se existem usuários vinculados
    const usersCount = await this.prisma.user.count({
      where: { roleId: id },
    });

    if (usersCount > 0) {
      throw new ConflictException('Não é possível excluir um cargo que possui usuários vinculados');
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }

  // Método auxiliar para garantir que as permissões do arquivo de constantes existem no BD
  private async syncPermissionsWithDatabase() {
    const allFlatPermissions = PERMISSION_GROUPS.flatMap((g) => g.permissions);

    for (const p of allFlatPermissions) {
      await this.prisma.permission.upsert({
        where: { name: p.id },
        update: { description: p.description },
        create: {
          name: p.id,
          description: p.description,
        },
      });
    }
  }
}
