import api from "../api";
import { UserModulesAccessStatus, ToggleModuleDto } from "@/types/access-control";

export const userModuleAccessService = {
  async getUserModulesAccess(userId: string): Promise<UserModulesAccessStatus> {
    try {
      const { data } = await api.get(`/access/users/${userId}/modules`);
      return data;
    } catch {
      // Fallback em desenvolvimento
      return {
        user: { id: userId, name: "Usuário Selecionado", email: "user@setgen.com.br", role: "EMPLOYEE" },
        modules: [
          {
            id: 1,
            name: "Orçamentos (Comercial)",
            description: "Elaboração, envio, precificação de produtos e serviços e aprovação com geração de OS.",
            isEnabled: true,
            userModuleAccessId: 101,
            route: "/quotes",
            icon: "Receipt",
            totalActivities: 3,
            activeActivities: 3,
            activities: [
              { id: 11, name: "Listagem de Orçamentos", label: "Visualizar Orçamentos", route: "/quotes", isMandatory: true, isActive: true, permissions: ["quotes.view"] },
              { id: 12, name: "Elaboração de Orçamento", label: "Criar/Editar Orçamento", route: "/quotes/new", isMandatory: false, isActive: true, permissions: ["quotes.create", "quotes.edit"] },
              { id: 13, name: "Aprovação Comercial", label: "Aprovar e Converter em OS", route: "/quotes/approve", isMandatory: false, isActive: true, permissions: ["quotes.approve"] },
            ],
          },
          {
            id: 2,
            name: "Ordens de Serviço",
            description: "Gestão operacional de campo, visão cliente (OS digital) e visão interna de custos.",
            isEnabled: true,
            userModuleAccessId: 102,
            route: "/orders",
            icon: "FileText",
            totalActivities: 3,
            activeActivities: 2,
            activities: [
              { id: 21, name: "Listagem de OS", label: "Visualizar Ordens de Serviço", route: "/orders", isMandatory: true, isActive: true, permissions: ["orders.view"] },
              { id: 22, name: "Execução & Check-in", label: "Operação de Campo", route: "/orders/execute", isMandatory: false, isActive: true, permissions: ["orders.execute"] },
              { id: 23, name: "Visão Interna de Margem", label: "Custos Reais e Lucro", route: "/orders/internal", isMandatory: false, isActive: false, permissions: ["orders.internal_view"] },
            ],
          },
          {
            id: 3,
            name: "Clientes & Geolocalização",
            description: "Gestão cadastral, extração de links do Google Maps e múltiplos endereços.",
            isEnabled: true,
            userModuleAccessId: 103,
            route: "/clients",
            icon: "Building2",
            totalActivities: 2,
            activeActivities: 2,
            activities: [
              { id: 31, name: "Visualizar Clientes", label: "Consulta de Clientes", route: "/clients", isMandatory: true, isActive: true, permissions: ["clients.view"] },
              { id: 32, name: "Cadastrar / Editar", label: "Cadastro de Clientes", route: "/clients/new", isMandatory: false, isActive: true, permissions: ["clients.create", "clients.edit"] },
            ],
          },
          {
            id: 4,
            name: "Estoque & Almoxarifado",
            description: "Saldos centrais, peças em rota com colaboradores e baixas automáticas.",
            isEnabled: false,
            userModuleAccessId: null,
            route: "/inventory",
            icon: "Package",
            totalActivities: 2,
            activeActivities: 0,
            activities: [
              { id: 41, name: "Consulta de Saldo", label: "Visualizar Estoque", route: "/inventory", isMandatory: true, isActive: false, permissions: ["inventory.view"] },
              { id: 42, name: "Movimentação & Baixa", label: "Dar Baixa em Estoque", route: "/inventory/movements", isMandatory: false, isActive: false, permissions: ["inventory.move"] },
            ],
          },
          {
            id: 5,
            name: "Módulo Configurador & Acessos",
            description: "Governança de usuários, controle hierárquico e matriz de permissões.",
            isEnabled: true,
            userModuleAccessId: 105,
            route: "/permissoes",
            icon: "Shield",
            totalActivities: 3,
            activeActivities: 3,
            activities: [
              { id: 51, name: "Dashboard Configurador", label: "Indicadores de Acesso", route: "/permissoes", isMandatory: true, isActive: true, permissions: ["config.view"] },
              { id: 52, name: "Gestão de Usuários", label: "Cadastro de Usuários", route: "/permissoes/usuario", isMandatory: false, isActive: true, permissions: ["users.view", "users.create", "users.edit"] },
              { id: 53, name: "Matriz de Permissões", label: "Configurar Acessos", route: "/permissoes/gestao", isMandatory: false, isActive: true, permissions: ["permissions.manage"] },
            ],
          },
        ],
        summary: {
          totalModules: 5,
          enabledModules: 4,
          totalActivities: 13,
          activeActivities: 10,
        },
      };
    }
  },

  async toggleModuleAccess(userId: string, moduleId: number, data: ToggleModuleDto): Promise<any> {
    const response = await api.post(`/access/users/${userId}/modules/${moduleId}/toggle`, data);
    return response.data;
  },
};

export default userModuleAccessService;

