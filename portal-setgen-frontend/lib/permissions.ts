import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";

export const ADMINISTRATIVE_ROLES = ["ADMIN", "MANAGER", "ADMINISTRATIVE"] as const;

export function canViewFinancialValues(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase();
  return (ADMINISTRATIVE_ROLES as readonly string[]).includes(normalized);
}

export function useCanViewValues(): boolean {
  const storeUser = useAuthStore((state) => state.user);

  const [canView, setCanView] = useState<boolean>(() => {
    if (storeUser?.role) return canViewFinancialValues(storeUser.role);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          return canViewFinancialValues(parsed.role);
        }
      } catch {
        // no-op
      }
    }
    return false;
  });

  useEffect(() => {
    if (storeUser?.role) {
      setCanView(canViewFinancialValues(storeUser.role));
    } else if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          setCanView(canViewFinancialValues(parsed.role));
        }
      } catch {
        // no-op
      }
    }
  }, [storeUser?.role]);

  return canView;
}

/**
 * Mapeamento oficial de quais papéis (roles) têm acesso autorizado a cada módulo do sistema.
 */
export const MODULE_ALLOWED_ROLES: Record<string, readonly string[]> = {
  // Configurações e Usuários: Apenas Administrador
  SETTINGS: ["ADMIN"],
  CONFIGURADOR: ["ADMIN"],
  USERS: ["ADMIN"],

  // Financeiro & Faturamento / Caixa: Apenas Administração e Gestão
  FINANCIAL: ["ADMIN", "MANAGER", "ADMINISTRATIVE"],
  FINANCEIRO: ["ADMIN", "MANAGER", "ADMINISTRATIVE"],

  // Recursos Humanos: Apenas Administração e Gestão
  RH: ["ADMIN", "MANAGER", "ADMINISTRATIVE"],

  // Comercial & Propostas / Orçamentos: Apenas Administração e Gestão
  COMMERCIAL: ["ADMIN", "MANAGER", "ADMINISTRATIVE"],
  COMERCIAL: ["ADMIN", "MANAGER", "ADMINISTRATIVE"],
  QUOTES: ["ADMIN", "MANAGER", "ADMINISTRATIVE"],

  // Compras & Suprimentos: Administração, Gestão e Almoxarife (repor peças)
  PROCUREMENT: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"],
  COMPRAS: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"],

  // Estoque & Armazém / Equipamentos: Administração, Gestão e Almoxarife
  INVENTORY: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"],
  ESTOQUE: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"],
  WAREHOUSE: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"],
  EQUIPMENT: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"],
  EQUIPMENTS: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"],

  // Ordens de Serviço & Campo: Administração, Gestão e Técnico
  SERVICE_ORDERS: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "TECHNICIAN"],
  ORDERS: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "TECHNICIAN"],
  VISITS: ["ADMIN", "MANAGER", "TECHNICIAN"],
  DELIVERIES: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "TECHNICIAN"],

  // Frotas & Veículos: Administração, Gestão e Almoxarife (liberação de veículos)
  FLEET: ["ADMIN", "MANAGER", "WAREHOUSE"],

  // Clientes: Administração, Gestão e Técnico (para visualização de local de atendimento)
  CLIENTS: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "TECHNICIAN"],

  // Dashboard Geral: Todos os colaboradores autorizados
  DASHBOARD: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE", "TECHNICIAN"],
};

/**
 * Regras estritas de autorização de rotas e URLs no frontend.
 */
export const ROUTE_ACCESS_RULES: { prefix: string; roles: readonly string[] }[] = [
  // Configurações e Usuários
  { prefix: "/users", roles: ["ADMIN"] },
  { prefix: "/roles", roles: ["ADMIN"] },
  { prefix: "/settings/modules", roles: ["ADMIN"] },
  { prefix: "/settings", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/config-permissoes", roles: ["ADMIN"] },

  // Financeiro & Faturamento
  { prefix: "/financial", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE"] },
  { prefix: "/invoices", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE"] },
  { prefix: "/approvals", roles: ["ADMIN", "MANAGER"] },

  // Recursos Humanos
  { prefix: "/rh", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE"] },

  // Comercial
  { prefix: "/quotes", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE"] },
  { prefix: "/purchase-orders", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE"] },
  { prefix: "/clients", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "TECHNICIAN"] },

  // Compras & Suprimentos
  { prefix: "/procurement", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"] },
  { prefix: "/suppliers", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE"] },

  // Estoque & Armazém
  { prefix: "/inventory", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"] },
  { prefix: "/warehouse", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"] },
  { prefix: "/equipment", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE"] },

  // Ordens de Serviço & Campo
  { prefix: "/orders", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "TECHNICIAN"] },
  { prefix: "/visits", roles: ["ADMIN", "MANAGER", "TECHNICIAN"] },
  { prefix: "/deliveries", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "TECHNICIAN"] },
  { prefix: "/fleet", roles: ["ADMIN", "MANAGER", "WAREHOUSE"] },
  { prefix: "/fuel-requests", roles: ["ADMIN", "MANAGER", "WAREHOUSE"] },

  // Dashboard & Hub
  { prefix: "/dashboard", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE", "TECHNICIAN"] },
  { prefix: "/reports", roles: ["ADMIN", "MANAGER"] },
  { prefix: "/modules", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE", "TECHNICIAN"] },
  { prefix: "/profile", roles: ["ADMIN", "MANAGER", "ADMINISTRATIVE", "WAREHOUSE", "TECHNICIAN"] },
];

export function isUserAuthorizedForRoute(role: string | undefined | null, pathname: string): boolean {
  if (!role) return false;
  const upperRole = role.trim().toUpperCase();
  if (upperRole === "ADMIN") return true;

  const matchedRule = ROUTE_ACCESS_RULES.find((rule) =>
    pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")
  );

  if (!matchedRule) {
    return true; // Rota pública ou não protegida explicitamente
  }

  return (matchedRule.roles as readonly string[]).includes(upperRole);
}

export function isUserAuthorizedForModule(role: string | undefined | null, moduleCode: string): boolean {
  if (!role) return false;
  const upperRole = role.trim().toUpperCase();
  if (upperRole === "ADMIN") return true;

  const allowedRoles = MODULE_ALLOWED_ROLES[moduleCode.trim().toUpperCase()];
  if (!allowedRoles) return false;

  return allowedRoles.includes(upperRole);
}

export function getDefaultRouteForRole(role: string | undefined | null): string {
  if (!role) return "/auth/login";
  const upperRole = role.trim().toUpperCase();
  switch (upperRole) {
    case "ADMIN":
    case "MANAGER":
    case "ADMINISTRATIVE":
      return "/modules";
    case "WAREHOUSE":
      return "/inventory";
    case "TECHNICIAN":
      return "/orders";
    default:
      return "/modules";
  }
}
