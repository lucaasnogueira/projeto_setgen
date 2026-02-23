import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
    await this.findOne(id);

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
    await this.findOne(id);

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

  async toggleActive(id: string) {
    const user = await this.findOne(id);

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

  async resetPassword(id: string, resetPasswordDto: any) {
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
}
