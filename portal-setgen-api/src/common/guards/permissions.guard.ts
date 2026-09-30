import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { expandImpliedPermissions } from '../../access-control/expand-permissions.util';

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

    // Consolidar todas as permissões do usuário (individuais + do cargo) e
    // derivar as implícitas: quem cria/edita/exclui/aprova/gerencia também vê.
    // Sem isso, um cargo com `expenses:create` e sem `expenses:view` tomava 403
    // ao abrir a listagem que ele mesmo alimenta.
    let rolePermissions =
      userWithPermissions.roleRef?.permissions.map(
        (rp) => rp.permission.name,
      ) || [];

    // Fallback de resiliência: se o usuário não tiver roleId vinculado diretamente,
    // mas possuir o enum User.role (ex: ADMINISTRATIVE, WAREHOUSE, etc.),
    // buscamos o cargo correspondente pelo nome e vinculamos opportunistically.
    if (rolePermissions.length === 0 && userWithPermissions.role) {
      const candidates =
        userWithPermissions.role === 'ADMINISTRATIVE'
          ? ['Administrativo/Compras', 'Administrativo', 'Administrativo / Compras']
          : userWithPermissions.role === 'WAREHOUSE'
          ? ['Almoxarife', 'Almoxarifado']
          : userWithPermissions.role === 'TECHNICIAN'
          ? ['Técnico', 'Tecnico']
          : userWithPermissions.role === 'MANAGER'
          ? ['Gestor', 'Gerente']
          : [];

      for (const cand of candidates) {
        const fallbackRole = await this.prisma.role.findFirst({
          where: { name: { equals: cand, mode: 'insensitive' } },
          include: { permissions: { include: { permission: true } } },
        });
        if (fallbackRole && fallbackRole.permissions.length > 0) {
          rolePermissions = fallbackRole.permissions.map(
            (p) => p.permission.name,
          );
          await this.prisma.user
            .update({
              where: { id: user.id },
              data: { roleId: fallbackRole.id },
            })
            .catch(() => null);
          break;
        }
      }
    }

    const granted = [
      ...userWithPermissions.permissions.map((up) => up.permission.name),
      ...rolePermissions,
    ];

    const userPermissions = new Set(expandImpliedPermissions(granted));

    // Verificar se o usuário possui todas as permissões requeridas (AND logic)
    // Ou se possui QUALQUER uma das permissões (OR logic - mais comum para acesso básico)
    // Aqui usaremos OR logic: se tiver uma das permissões requeridas, permite o acesso.
    return requiredPermissions.some((permission) =>
      userPermissions.has(permission),
    );
  }
}
