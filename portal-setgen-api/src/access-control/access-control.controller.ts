import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

const MODULE_ROLE_ACCESS: Record<string, string[]> = {
  SETTINGS: ['ADMIN'],
  USERS: ['ADMIN'],
  CONFIGURADOR: ['ADMIN'],
  FINANCIAL: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'],
  RH: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'],
  COMMERCIAL: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'],
  PROCUREMENT: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE'],
  INVENTORY: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE'],
  WAREHOUSE: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE'],
  EQUIPMENTS: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE'],
  SERVICE_ORDERS: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'],
  FLEET: ['ADMIN', 'MANAGER', 'WAREHOUSE'],
  CLIENTS: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'],
  DASHBOARD: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE', 'TECHNICIAN'],
};

@ApiTags('Access Control - Modules')
@Controller('access-control')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccessControlController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me/modules')
  @ApiOperation({ summary: 'Obter módulos disponíveis para o usuário autenticado' })
  async getUserModules(@Req() req: any) {
    const userRole = (req.user?.role || 'TECHNICIAN').toUpperCase();
    const isAdmin = userRole === 'ADMIN';

    // Buscar módulos cadastrados no banco
    const dbModules = await this.prisma.systemModule.findMany({
      where: { isActive: true },
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { permissions: true },
        },
      },
    });

    if (dbModules.length > 0) {
      const mapped = dbModules
        .map((m) => {
          const allowedRoles = MODULE_ROLE_ACCESS[m.code] || [];
          const isAllowed = isAdmin || allowedRoles.includes(userRole);

          return {
            id: m.id,
            code: m.code,
            name: m.name,
            description: m.description || '',
            route: m.route,
            icon: m.icon || 'Layers',
            isEnabled: isAllowed,
            activityCount: m._count.permissions,
          };
        })
        .filter((m) => isAdmin || m.isEnabled);

      return {
        isAdmin,
        modules: mapped,
      };
    }

    return {
      isAdmin,
      modules: [],
    };
  }
}
