import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, PERMISSION_GROUPS } from '../../src/access-control/permissions.constants';

const prisma = new PrismaClient();

// Cargos operacionais que a matriz de permissões do diagnóstico BPM prevê.
// ADMIN continua com bypass total (ver PermissionsGuard) e não precisa de Role aqui.
const ROLE_DEFINITIONS: { name: string; description: string; permissionIds: string[] }[] = [
  {
    name: 'Atendimento',
    description: 'Primeiro contato, cadastro de cliente/equipamento e agendamento de visitas',
    permissionIds: [
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.CLIENTS_CREATE,
      PERMISSIONS.CLIENTS_EDIT,
      PERMISSIONS.VISITS_VIEW,
      PERMISSIONS.VISITS_CREATE,
      PERMISSIONS.VISITS_EDIT,
      PERMISSIONS.EQUIPMENT_VIEW,
      PERMISSIONS.EQUIPMENT_MANAGE,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.WARRANTY_VIEW,
    ],
  },
  {
    name: 'Técnico',
    description: 'Execução de visitas técnicas e ordens de serviço',
    permissionIds: [
      PERMISSIONS.VISITS_VIEW,
      PERMISSIONS.VISITS_EDIT,
      PERMISSIONS.EQUIPMENT_VIEW,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_EDIT,
      PERMISSIONS.ART_VIEW,
    ],
  },
  {
    name: 'Almoxarife',
    description: 'Separação de materiais e controle de estoque',
    permissionIds: [
      PERMISSIONS.EQUIPMENT_VIEW,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.MATERIAL_REQUESTS_VIEW,
      PERMISSIONS.MATERIAL_REQUESTS_MANAGE,
    ],
  },
  {
    name: 'Administrativo/Compras',
    description: 'Compras a fornecedor e administração geral',
    permissionIds: [
      PERMISSIONS.EQUIPMENT_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.MATERIAL_REQUESTS_VIEW,
      PERMISSIONS.PROCUREMENT_VIEW,
      PERMISSIONS.PROCUREMENT_MANAGE,
      PERMISSIONS.SUPPLIERS_VIEW,
      PERMISSIONS.SUPPLIERS_MANAGE,
    ],
  },
  {
    name: 'Financeiro',
    description: 'Contas a pagar/receber, faturamento e fluxo de caixa',
    permissionIds: [
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_CREATE,
      PERMISSIONS.EXPENSES_EDIT,
      PERMISSIONS.EXPENSES_APPROVE,
    ],
  },
  {
    name: 'Gestor',
    description: 'Visão gerencial completa e aprovações',
    permissionIds: [
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.VISITS_VIEW,
      PERMISSIONS.EQUIPMENT_VIEW,
      PERMISSIONS.EQUIPMENT_MANAGE,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_APPROVE,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_APPROVE,
      PERMISSIONS.ART_VIEW,
      PERMISSIONS.ART_MANAGE,
      PERMISSIONS.MATERIAL_REQUESTS_VIEW,
      PERMISSIONS.PROCUREMENT_VIEW,
      PERMISSIONS.SUPPLIERS_VIEW,
      PERMISSIONS.WARRANTY_VIEW,
      PERMISSIONS.WARRANTY_MANAGE,
    ],
  },
];

export async function seedRolesAndPermissions() {
  const allFlatPermissions = PERMISSION_GROUPS.flatMap((g) => g.permissions);

  const permissionIdByName = new Map<string, string>();
  for (const p of allFlatPermissions) {
    const permission = await prisma.permission.upsert({
      where: { name: p.id },
      update: { description: p.description },
      create: { name: p.id, description: p.description },
    });
    permissionIdByName.set(permission.name, permission.id);
  }

  for (const roleDef of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: { name: roleDef.name, description: roleDef.description },
    });

    // Idempotente: substitui o conjunto de permissões do cargo pelo definido acima.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: roleDef.permissionIds.map((permissionName) => ({
        roleId: role.id,
        permissionId: permissionIdByName.get(permissionName)!,
      })),
      skipDuplicates: true,
    });
  }

  console.log(`✅ ${ROLE_DEFINITIONS.length} cargos operacionais com permissões sincronizados`);
}
