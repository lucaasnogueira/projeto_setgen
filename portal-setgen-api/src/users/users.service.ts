import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '@prisma/client';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role,
        roleId: createUserDto.roleId,
        active: createUserDto.active ?? true,
        permissions: {
          create: createUserDto.permissionIds?.map((pId) => ({
            permission: {
              connect: { name: pId },
            },
          })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        active: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        roleRef: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Lista enxuta para preencher dropdown de "responsável"/"técnico".
   *
   * Existe separada de findAll() porque aquela exige ADMIN/MANAGER e devolve
   * e-mail, cargo e permissões — dado demais para quem só precisa escolher um
   * nome numa combo. Sem isso, quem é ADMINISTRATIVE tomava 403 ao abrir o
   * formulário de cliente, visita ou OS.
   */
  async findSelectable() {
    return this.prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        roleRef: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const current = await this.findOne(id);

    // Rebaixar o último ADMIN, ou desativá-lo por aqui, tranca o sistema igual
    // ao toggle-active.
    const losesAdmin =
      (updateUserDto.role !== undefined && updateUserDto.role !== UserRole.ADMIN) ||
      updateUserDto.active === false;

    if (losesAdmin) {
      await this.assertNotLastActiveAdmin(current);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const { permissionIds, ...data } = updateUserDto;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        permissions: permissionIds ? {
          deleteMany: {},
          create: permissionIds.map((pId) => ({
            permission: {
              connect: { name: pId },
            },
          })),
        } : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        active: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.assertNotLastActiveAdmin(user);

    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });
  }

  /**
   * Impede que o sistema fique sem nenhum administrador ativo — daí não
   * haveria mais como cadastrar usuários, cargos ou permissões, e a única
   * saída seria mexer no banco na unha.
   */
  private async assertNotLastActiveAdmin(user: {
    id: string;
    role: UserRole;
    active: boolean;
  }) {
    if (user.role !== UserRole.ADMIN || !user.active) return;

    const otherActiveAdmins = await this.prisma.user.count({
      where: { role: UserRole.ADMIN, active: true, id: { not: user.id } },
    });

    if (otherActiveAdmins === 0) {
      throw new BadRequestException(
        'Este é o último administrador ativo — promova outro usuário a ADMIN antes de desativá-lo ou alterar seu perfil.',
      );
    }
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);

    if (user.active) {
      await this.assertNotLastActiveAdmin(user);
    }

    return this.prisma.user.update({
      where: { id },
      data: { active: !user.active },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });
  }

  async findMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        active: true,
        createdAt: true,
        notifyPrefs: true,
        roleRef: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { roleRef, permissions, ...rest } = user;
    const effectivePermissions = Array.from(
      new Set([
        ...(roleRef?.permissions.map((p) => p.permission.name) || []),
        ...permissions.map((p) => p.permission.name),
      ]),
    );

    return { ...rest, permissions: effectivePermissions };
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    await this.findOne(id);

    if (updateProfileDto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: updateProfileDto.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('E-mail já cadastrado');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateProfileDto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });
  }

  async updateNotificationPrefs(
    id: string,
    dto: UpdateNotificationPrefsDto,
  ) {
    const user = await this.findMe(id);
    const currentPrefs = (user.notifyPrefs as Record<string, boolean>) ?? {};

    const notifyPrefs = { ...currentPrefs, ...dto };

    const updated = await this.prisma.user.update({
      where: { id },
      data: { notifyPrefs },
      select: {
        id: true,
        notifyPrefs: true,
      },
    });

    return updated;
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    await this.findOne(id);
    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });
  }

  async changeOwnPassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}
