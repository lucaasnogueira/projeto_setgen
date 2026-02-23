import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.id) {
      return false;
    }

    // Usuário ADMIN sempre tem acesso total
    if (user.role === 'ADMIN') {
      return true;
    }

    // Buscar as permissões do usuário (diretas + via cargo)
    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        permissions: {
          include: { permission: true },
        },
        roleRef: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!userWithPermissions) {
      return false;
    }

    // Consolidar todas as permissões do usuário
    const userPermissions = new Set<string>();

    // Adicionar permissões individuais
    userWithPermissions.permissions.forEach((up) => {
      userPermissions.add(up.permission.name);
    });

    // Adicionar permissões do cargo
    if (userWithPermissions.roleRef) {
      userWithPermissions.roleRef.permissions.forEach((rp) => {
        userPermissions.add(rp.permission.name);
      });
    }

    // Verificar se o usuário possui todas as permissões requeridas (AND logic)
    // Ou se possui QUALQUER uma das permissões (OR logic - mais comum para acesso básico)
    // Aqui usaremos OR logic: se tiver uma das permissões requeridas, permite o acesso.
    return requiredPermissions.some((permission) =>
      userPermissions.has(permission),
    );
  }
}
