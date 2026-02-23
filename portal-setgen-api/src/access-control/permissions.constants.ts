export const PERMISSIONS = {
  // Usuários
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE: 'users:manage',

  // Cargos e Permissões
  ROLES_VIEW: 'roles:view',
  ROLES_CREATE: 'roles:create',
  ROLES_EDIT: 'roles:edit',
  ROLES_DELETE: 'roles:delete',

  // Clientes
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_EDIT: 'clients:edit',
  CLIENTS_DELETE: 'clients:delete',

  // Visitas Técnicas
  VISITS_VIEW: 'visits:view',
  VISITS_CREATE: 'visits:create',
  VISITS_EDIT: 'visits:edit',
  VISITS_DELETE: 'visits:delete',

  // Ordens de Serviço
  ORDERS_VIEW: 'orders:view',
  ORDERS_CREATE: 'orders:create',
  ORDERS_EDIT: 'orders:edit',
  ORDERS_DELETE: 'orders:delete',
  ORDERS_APPROVE: 'orders:approve',

  // Financeiro - Despesas
  EXPENSES_VIEW: 'expenses:view',
  EXPENSES_CREATE: 'expenses:create',
  EXPENSES_EDIT: 'expenses:edit',
  EXPENSES_DELETE: 'expenses:delete',
  EXPENSES_APPROVE: 'expenses:approve',

  // Estoque
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_MANAGE: 'inventory:manage',

  // RH
  RH_VIEW: 'rh:view',
  RH_MANAGE: 'rh:manage',
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export interface PermissionItem {
  id: string;
  label: string;
  description: string;
}

export interface PermissionGroup {
  name: string;
  permissions: PermissionItem[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Usuários',
    permissions: [
      { id: PERMISSIONS.USERS_VIEW, label: 'Visualizar Usuários', description: 'Permite ver a lista de usuários' },
      { id: PERMISSIONS.USERS_CREATE, label: 'Criar Usuários', description: 'Permite cadastrar novos usuários' },
      { id: PERMISSIONS.USERS_EDIT, label: 'Editar Usuários', description: 'Permite alterar dados de usuários' },
      { id: PERMISSIONS.USERS_DELETE, label: 'Excluir Usuários', description: 'Permite remover usuários do sistema' },
      { id: PERMISSIONS.USERS_MANAGE, label: 'Gerenciar Tudo', description: 'Acesso total ao módulo de usuários' },
    ],
  },
  {
    name: 'Cargos e Permissões',
    permissions: [
      { id: PERMISSIONS.ROLES_VIEW, label: 'Visualizar Cargos', description: 'Permite ver a lista de cargos e suas permissões' },
      { id: PERMISSIONS.ROLES_CREATE, label: 'Criar Cargos', description: 'Permite criar novos cargos' },
      { id: PERMISSIONS.ROLES_EDIT, label: 'Editar Cargos', description: 'Permite alterar cargos e suas permissões' },
      { id: PERMISSIONS.ROLES_DELETE, label: 'Excluir Cargos', description: 'Permite remover cargos' },
    ],
  },
  {
    name: 'Clientes',
    permissions: [
      { id: PERMISSIONS.CLIENTS_VIEW, label: 'Visualizar Clientes', description: 'Permite ver a lista de clientes' },
      { id: PERMISSIONS.CLIENTS_CREATE, label: 'Criar Clientes', description: 'Permite cadastrar novos clientes' },
      { id: PERMISSIONS.CLIENTS_EDIT, label: 'Editar Clientes', description: 'Permite alterar dados de clientes' },
      { id: PERMISSIONS.CLIENTS_DELETE, label: 'Excluir Clientes', description: 'Permite remover clientes' },
    ],
  },
  {
    name: 'Ordens de Serviço',
    permissions: [
      { id: PERMISSIONS.ORDERS_VIEW, label: 'Visualizar OS', description: 'Permite ver as ordens de serviço' },
      { id: PERMISSIONS.ORDERS_CREATE, label: 'Criar OS', description: 'Permite criar novas ordens de serviço' },
      { id: PERMISSIONS.ORDERS_EDIT, label: 'Editar OS', description: 'Permite alterar ordens de serviço' },
      { id: PERMISSIONS.ORDERS_DELETE, label: 'Excluir OS', description: 'Permite remover ordens de serviço' },
      { id: PERMISSIONS.ORDERS_APPROVE, label: 'Aprovar OS', description: 'Permite aprovar/rejeitar orçamentos de OS' },
    ],
  },
  {
    name: 'Financeiro',
    permissions: [
      { id: PERMISSIONS.EXPENSES_VIEW, label: 'Visualizar Despesas', description: 'Permite ver o módulo financeiro' },
      { id: PERMISSIONS.EXPENSES_CREATE, label: 'Lançar Despesas', description: 'Permite criar novos lançamentos' },
      { id: PERMISSIONS.EXPENSES_EDIT, label: 'Editar Despesas', description: 'Permite alterar lançamentos' },
      { id: PERMISSIONS.EXPENSES_DELETE, label: 'Excluir Despesas', description: 'Permite remover lançamentos' },
      { id: PERMISSIONS.EXPENSES_APPROVE, label: 'Aprovar Despesas', description: 'Permite aprovar pagamentos' },
    ],
  },
  {
    name: 'Estoque',
    permissions: [
      { id: PERMISSIONS.INVENTORY_VIEW, label: 'Visualizar Estoque', description: 'Permite ver o inventário' },
      { id: PERMISSIONS.INVENTORY_MANAGE, label: 'Gerenciar Estoque', description: 'Permite realizar movimentações' },
    ],
  },
  {
    name: 'RH',
    permissions: [
      { id: PERMISSIONS.RH_VIEW, label: 'Visualizar RH', description: 'Permite ver a lista de funcionários' },
      { id: PERMISSIONS.RH_MANAGE, label: 'Gerenciar RH', description: 'Permite gerir documentos e ASOs' },
    ],
  },
];
