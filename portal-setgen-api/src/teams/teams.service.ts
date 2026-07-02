import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Prisma, Team } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeamDto): Promise<Team> {
    const data: Prisma.TeamCreateInput = {
      name: dto.name,
      description: dto.description,
      active: dto.active ?? true,
      members: dto.memberIds ? { connect: dto.memberIds.map((id) => ({ id })) } : undefined,
    };

    return this.prisma.team.create({
      data,
      include: { members: { select: { id: true, name: true } } },
    });
  }

  async findAll(active?: boolean): Promise<Team[]> {
    return this.prisma.team.findMany({
      where: active !== undefined ? { active } : undefined,
      include: { members: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Team> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { members: { select: { id: true, name: true } } },
    });

    if (!team) {
      throw new NotFoundException('Equipe não encontrada');
    }

    return team;
  }

  async update(id: string, dto: UpdateTeamDto): Promise<Team> {
    await this.findOne(id);

    const data: Prisma.TeamUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.active !== undefined && { active: dto.active }),
      ...(dto.memberIds !== undefined && {
        members: { set: dto.memberIds.map((id) => ({ id })) },
      }),
    };

    return this.prisma.team.update({
      where: { id },
      data,
      include: { members: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string): Promise<Team> {
    await this.findOne(id);
    return this.prisma.team.delete({ where: { id } });
  }
}
