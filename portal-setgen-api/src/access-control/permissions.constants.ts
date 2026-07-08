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

  // Equipamentos
  EQUIPMENT_VIEW: 'equipment:view',
  EQUIPMENT_MANAGE: 'equipment:manage',

  // ART (Anotação de Responsabilidade Técnica)
  ART_VIEW: 'art:view',
  ART_MANAGE: 'art:manage',

  // Solicitação de Material (mesa do almoxarife)
  MATERIAL_REQUESTS_VIEW: 'material-requests:view',
  MATERIAL_REQUESTS_MANAGE: 'material-requests:manage',

  // Compras a fornecedor
  PROCUREMENT_VIEW: 'procurement:view',
  PROCUREMENT_MANAGE: 'procurement:manage',

  // Fornecedores
  SUPPLIERS_VIEW: 'suppliers:view',
  SUPPLIERS_MANAGE: 'suppliers:manage',

  // Garantia
  WARRANTY_VIEW: 'warranty:view',
  WARRANTY_MANAGE: 'warranty:manage',

  // RH
  RH_VIEW: 'rh:view',
  RH_MANAGE: 'rh:manage',

  // Frota
  FLEET_VIEW: 'fleet:view',
  FLEET_MANAGE: 'fleet:manage',
  FLEET_FUEL_REQUEST: 'fleet:fuel-request',
  FLEET_FUEL_APPROVE: 'fleet:fuel-approve',
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
    name: 'Visitas Técnicas',
    permissions: [
      { id: PERMISSIONS.VISITS_VIEW, label: 'Visualizar Visitas', description: 'Permite ver as visitas técnicas agendadas' },
      { id: PERMISSIONS.VISITS_CREATE, label: 'Criar Visitas', description: 'Permite agendar novas visitas técnicas' },
      { id: PERMISSIONS.VISITS_EDIT, label: 'Editar Visitas', description: 'Permite alterar visitas técnicas' },
      { id: PERMISSIONS.VISITS_DELETE, label: 'Excluir Visitas', description: 'Permite remover visitas técnicas' },
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
    name: 'Equipamentos',
    permissions: [
      { id: PERMISSIONS.EQUIPMENT_VIEW, label: 'Visualizar Equipamentos', description: 'Permite ver os equipamentos cadastrados por cliente' },
      { id: PERMISSIONS.EQUIPMENT_MANAGE, label: 'Gerenciar Equipamentos', description: 'Permite cadastrar e editar equipamentos' },
    ],
  },
  {
    name: 'ART',
    permissions: [
      { id: PERMISSIONS.ART_VIEW, label: 'Visualizar ART', description: 'Permite ver as ARTs emitidas' },
      { id: PERMISSIONS.ART_MANAGE, label: 'Emitir ART', description: 'Permite emitir e vincular ART a uma Ordem de Serviço' },
    ],
  },
  {
    name: 'Solicitação de Material',
    permissions: [
      { id: PERMISSIONS.MATERIAL_REQUESTS_VIEW, label: 'Visualizar Solicitações', description: 'Permite ver a mesa de separação de materiais' },
      { id: PERMISSIONS.MATERIAL_REQUESTS_MANAGE, label: 'Gerenciar Solicitações', description: 'Permite separar materiais e acionar compras' },
    ],
  },
  {
    name: 'Compras',
    permissions: [
      { id: PERMISSIONS.PROCUREMENT_VIEW, label: 'Visualizar Compras', description: 'Permite ver os pedidos de compra a fornecedores' },
      { id: PERMISSIONS.PROCUREMENT_MANAGE, label: 'Gerenciar Compras', description: 'Permite cotar, emitir e receber pedidos de compra' },
      { id: PERMISSIONS.SUPPLIERS_VIEW, label: 'Visualizar Fornecedores', description: 'Permite ver o cadastro de fornecedores' },
      { id: PERMISSIONS.SUPPLIERS_MANAGE, label: 'Gerenciar Fornecedores', description: 'Permite cadastrar e editar fornecedores' },
    ],
  },
  {
    name: 'Garantia',
    permissions: [
      { id: PERMISSIONS.WARRANTY_VIEW, label: 'Visualizar Garantias', description: 'Permite ver as garantias emitidas e seus vencimentos' },
      { id: PERMISSIONS.WARRANTY_MANAGE, label: 'Gerenciar Garantias', description: 'Permite editar termos e prazos de garantia' },
    ],
  },
  {
    name: 'RH',
    permissions: [
      { id: PERMISSIONS.RH_VIEW, label: 'Visualizar RH', description: 'Permite ver a lista de funcionários' },
      { id: PERMISSIONS.RH_MANAGE, label: 'Gerenciar RH', description: 'Permite gerir documentos e ASOs' },
    ],
  },
  {
    name: 'Frota',
    permissions: [
      { id: PERMISSIONS.FLEET_VIEW, label: 'Visualizar Frota', description: 'Permite ver veículos, saídas e histórico' },
      { id: PERMISSIONS.FLEET_MANAGE, label: 'Gerenciar Frota', description: 'Permite cadastrar veículos, registrar troca de óleo e saídas/retornos' },
      { id: PERMISSIONS.FLEET_FUEL_REQUEST, label: 'Solicitar Abastecimento', description: 'Permite criar requisições de abastecimento' },
      { id: PERMISSIONS.FLEET_FUEL_APPROVE, label: 'Aprovar Abastecimento', description: 'Permite aprovar ou rejeitar requisições de abastecimento' },
    ],
  },
];
