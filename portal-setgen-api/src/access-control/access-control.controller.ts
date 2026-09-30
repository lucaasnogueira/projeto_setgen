import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { expandImpliedPermissions } from './expand-permissions.util';

@ApiTags('Access Control - Modules')
@Controller('access-control')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccessControlController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me/modules')
  @ApiOperation({ summary: 'Obter módulos disponíveis para o usuário autenticado com base em permissões reais' })
  async getUserModules(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const userRole = (req.user?.role || 'TECHNICIAN').toUpperCase();
    const isAdmin = userRole === 'ADMIN';

    // 1. Se for ADMIN, tem acesso irrestrito a todos os módulos ativos cadastrados
    if (isAdmin) {
      const dbModules = await this.prisma.systemModule.findMany({
        where: { isActive: true },
        orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: { permissions: true },
          },
        },
      });

      return {
        isAdmin: true,
        modules: dbModules.map((m) => ({
          id: m.id,
          code: m.code,
          name: m.name,
          description: m.description || '',
          route: m.route,
          icon: m.icon || 'Layers',
          isEnabled: true,
          activityCount: m._count.permissions,
        })),
      };
    }

    // 2. Para usuários não-ADMIN, busca as permissões ativas reais do usuário e do seu cargo no banco
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleRef: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        permissions: {
          include: { permission: true },
        },
      },
    });

    let rolePerms = user?.roleRef?.permissions.map((p) => p.permission.name) || [];

    if (rolePerms.length === 0 && user?.role) {
      const candidates =
        user.role === 'ADMINISTRATIVE'
          ? ['Administrativo/Compras', 'Administrativo', 'Administrativo / Compras']
          : user.role === 'WAREHOUSE'
          ? ['Almoxarife', 'Almoxarifado']
          : user.role === 'TECHNICIAN'
          ? ['Técnico', 'Tecnico']
          : user.role === 'MANAGER'
          ? ['Gestor', 'Gerente']
          : [];

      for (const cand of candidates) {
        const fallbackRole = await this.prisma.role.findFirst({
          where: { name: { equals: cand, mode: 'insensitive' } },
          include: { permissions: { include: { permission: true } } },
        });
        if (fallbackRole && fallbackRole.permissions.length > 0) {
          rolePerms = fallbackRole.permissions.map((p) => p.permission.name);
          break;
        }
      }
    }

    const rawGranted = [
      ...rolePerms,
      ...(user?.permissions.map((p) => p.permission.name) || []),
    ];
    const userPermNames = new Set<string>(expandImpliedPermissions(rawGranted));

    const dbModules = await this.prisma.systemModule.findMany({
      where: { isActive: true },
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: {
        permissions: true,
        _count: {
          select: { permissions: true },
        },
      },
    });

    const mapped = dbModules
      .map((m) => {
        // Bloquear configurações, usuários e perfis para qualquer usuário que não seja ADMIN
        if (m.code === 'SETTINGS' || m.code === 'CONFIGURADOR' || m.code === 'USERS') {
          return null;
        }

        // Dashboard geral é concedido a todos os usuários autenticados
        if (m.code === 'DASHBOARD') {
          return {
            id: m.id,
            code: m.code,
            name: m.name,
            description: m.description || '',
            route: m.route,
            icon: m.icon || 'LayoutGrid',
            isEnabled: true,
            activityCount: m._count.permissions,
          };
        }

        const CODE_FALLBACK_PERMS: Record<string, string[]> = {
          COMMERCIAL: ['clients:view', 'quotes:view'],
          SERVICE_ORDERS: ['orders:view', 'visits:view', 'art:view'],
          CLIENTS: ['clients:view'],
          INVENTORY: ['inventory:view', 'material-requests:view', 'equipment:view'],
          EQUIPMENTS: ['equipment:view', 'warranty:view'],
          PROCUREMENT: ['procurement:view', 'suppliers:view'],
          FINANCIAL: ['expenses:view', 'expenses:create'],
          FLEET: ['fleet:view', 'fleet:fuel-request'],
          RH: ['rh:view'],
        };

        let hasAccess = false;
        if (m.permissions.length > 0) {
          hasAccess = m.permissions.some((p) => userPermNames.has(p.name));
        }
        if (!hasAccess && CODE_FALLBACK_PERMS[m.code]) {
          hasAccess = CODE_FALLBACK_PERMS[m.code].some((p) => userPermNames.has(p));
        }

        if (!hasAccess) {
          return null;
        }

        return {
          id: m.id,
          code: m.code,
          name: m.name,
          description: m.description || '',
          route: m.route,
          icon: m.icon || 'Layers',
          isEnabled: true,
          activityCount: m._count.permissions,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    return {
      isAdmin: false,
      modules: mapped,
    };
  }
}
