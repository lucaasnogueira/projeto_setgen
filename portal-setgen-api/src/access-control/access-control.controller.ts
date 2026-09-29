import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

const STANDARD_MODULE_PERMISSIONS: Record<string, string[]> = {
  DASHBOARD: [],
  COMMERCIAL: ['clients:view', 'quotes:view'],
  SERVICE_ORDERS: [
    'orders:view', 'orders:create', 'orders:edit', 'orders:delete', 'orders:approve',
    'visits:view', 'visits:create', 'visits:edit', 'visits:delete',
    'art:view', 'art:manage',
  ],
  CLIENTS: ['clients:view', 'clients:create', 'clients:edit', 'clients:delete'],
  INVENTORY: ['inventory:view', 'inventory:manage', 'material-requests:view', 'material-requests:manage'],
  EQUIPMENTS: ['equipment:view', 'equipment:manage', 'warranty:view', 'warranty:manage'],
  PROCUREMENT: ['procurement:view', 'procurement:manage', 'suppliers:view', 'suppliers:manage'],
  FINANCIAL: ['expenses:view', 'expenses:create', 'expenses:edit', 'expenses:delete', 'expenses:approve'],
  FLEET: ['fleet:view', 'fleet:manage', 'fleet:fuel-request', 'fleet:fuel-approve'],
  RH: ['rh:view', 'rh:manage'],
};

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

    const userPermNames = new Set<string>([
      ...(user?.roleRef?.permissions.map((p) => p.permission.name) || []),
      ...(user?.permissions.map((p) => p.permission.name) || []),
    ]);

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

        // Se o módulo possui permissões no banco ou nas constantes padrão, verifica se o usuário tem acesso
        let hasAccess = false;
        if (m.permissions.length > 0 && m.permissions.some((p) => userPermNames.has(p.name))) {
          hasAccess = true;
        } else {
          const fallbackPerms = STANDARD_MODULE_PERMISSIONS[m.code] || [];
          if (fallbackPerms.length > 0 && fallbackPerms.some((p) => userPermNames.has(p))) {
            hasAccess = true;
          }
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
