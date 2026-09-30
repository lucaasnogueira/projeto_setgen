import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";

export function normalizeRoleKey(role?: string | null, roleName?: string | null): string {
  const normRole = (role || "").trim().toUpperCase();
  const normName = (roleName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // ATENÇÃO CRÍTICA: "administrativo" contém a substring "admin"!
  // Devemos testar "administrativo" e "compras" ANTES de qualquer teste de "admin"!
  if (normName.includes("administrativo") || normName.includes("compras") || normRole === "ADMINISTRATIVE") {
    return "ADMINISTRATIVO_COMPRAS";
  }
  if (normName.includes("financeiro")) {
    return "FINANCEIRO";
  }
  if (normRole === "ADMIN" || normName.includes("administrador") || normName === "admin") {
    return "ADMIN";
  }
  if (normRole === "MANAGER" || normName.includes("gestor") || normName.includes("gerente")) {
    return "MANAGER";
  }
  if (normRole === "WAREHOUSE" || normName.includes("almoxarife") || normName.includes("estoque")) {
    return "ALMOXARIFE";
  }
  if (normName.includes("atendimento")) {
    return "ATENDIMENTO";
  }
  if (normRole === "TECHNICIAN" || normName.includes("tecnico")) {
    return "TECNICO";
  }

  return normRole || "TECNICO";
}

/**
 * Apenas ADMIN, Gestor, Financeiro e Administrativo/Compras podem visualizar valores monetários e custos.
 * Técnicos, Almoxarifes, Atendimento e RH NÃO visualizam.
 */
export function canViewFinancialValues(role?: string | null, roleName?: string | null): boolean {
  if (!role && !roleName) return false;
  const key = normalizeRoleKey(role, roleName);
  return key === "ADMIN" || key === "MANAGER" || key === "FINANCEIRO" || key === "ADMINISTRATIVO_COMPRAS";
}

export function useCanViewValues(): boolean {
  const storeUser = useAuthStore((state) => state.user);

  const [canView, setCanView] = useState<boolean>(() => {
    if (storeUser) return canViewFinancialValues(storeUser.role, storeUser.roleName || storeUser.roleRef?.name);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          return canViewFinancialValues(parsed.role, parsed.roleName || parsed.roleRef?.name);
        }
      } catch {
        // no-op
      }
    }
    return false;
  });

  useEffect(() => {
    if (storeUser) {
      setCanView(canViewFinancialValues(storeUser.role, storeUser.roleName || storeUser.roleRef?.name));
    } else if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          setCanView(canViewFinancialValues(parsed.role, parsed.roleName || parsed.roleRef?.name));
        }
      } catch {
        // no-op
      }
    }
  }, [storeUser?.role, storeUser?.roleName, storeUser?.roleRef?.name]);

  return canView;
}

/**
 * Módulos autorizados por perfil/cargo do sistema.
 */
export const ROLE_ALLOWED_MODULES: Record<string, readonly string[]> = {
  ADMIN: [
    "SETTINGS", "CONFIGURADOR", "USERS", "FINANCIAL", "FINANCEIRO", "RH",
    "COMMERCIAL", "COMERCIAL", "QUOTES", "PROCUREMENT", "COMPRAS",
    "INVENTORY", "ESTOQUE", "WAREHOUSE", "EQUIPMENT", "EQUIPMENTS",
    "SERVICE_ORDERS", "ORDERS", "VISITS", "DELIVERIES", "FLEET", "CLIENTS", "DASHBOARD"
  ],
  MANAGER: [
    "FINANCIAL", "FINANCEIRO", "RH", "COMMERCIAL", "COMERCIAL", "QUOTES",
    "PROCUREMENT", "COMPRAS", "INVENTORY", "ESTOQUE", "WAREHOUSE",
    "EQUIPMENT", "EQUIPMENTS", "SERVICE_ORDERS", "ORDERS", "VISITS",
    "DELIVERIES", "FLEET", "CLIENTS", "DASHBOARD"
  ],
  FINANCEIRO: [
    "FINANCIAL", "FINANCEIRO", "COMMERCIAL", "COMERCIAL", "QUOTES",
    "CLIENTS", "DASHBOARD"
  ],
  ADMINISTRATIVO_COMPRAS: [
    "COMMERCIAL", "COMERCIAL", "QUOTES", "CLIENTS",
    "SERVICE_ORDERS", "ORDERS", "VISITS", "DELIVERIES",
    "INVENTORY", "ESTOQUE", "WAREHOUSE", "EQUIPMENT", "EQUIPMENTS",
    "PROCUREMENT", "COMPRAS", "SUPPLIERS",
    "FINANCIAL", "FINANCEIRO",
    "FLEET", "RH", "DASHBOARD"
  ],
  ALMOXARIFE: [
    "INVENTORY", "ESTOQUE", "WAREHOUSE", "EQUIPMENT", "EQUIPMENTS",
    "PROCUREMENT", "COMPRAS", "FLEET", "DASHBOARD"
  ],
  TECNICO: [
    "SERVICE_ORDERS", "ORDERS", "VISITS", "DELIVERIES", "CLIENTS", "DASHBOARD"
  ],
  ATENDIMENTO: [
    "CLIENTS", "SERVICE_ORDERS", "ORDERS", "VISITS", "DASHBOARD"
  ],
};

/**
 * Rotas e URLs autorizadas por perfil/cargo do sistema.
 */
export const ROLE_ALLOWED_ROUTES: Record<string, readonly string[]> = {
  ADMIN: ["*"],
  MANAGER: [
    "/dashboard", "/reports", "/modules", "/profile",
    "/financial", "/invoices", "/approvals",
    "/rh",
    "/quotes", "/purchase-orders", "/clients",
    "/procurement", "/suppliers",
    "/inventory", "/warehouse", "/equipment",
    "/orders", "/visits", "/deliveries", "/fleet", "/fuel-requests"
  ],
  FINANCEIRO: [
    "/dashboard", "/modules", "/profile",
    "/financial", "/invoices", "/approvals",
    "/quotes", "/purchase-orders", "/clients"
  ],
  ADMINISTRATIVO_COMPRAS: [
    "/dashboard", "/modules", "/profile",
    "/quotes", "/clients", "/purchase-orders",
    "/orders", "/visits", "/deliveries",
    "/inventory", "/warehouse", "/equipment",
    "/procurement", "/suppliers",
    "/financial", "/invoices",
    "/fleet", "/rh"
  ],
  ALMOXARIFE: [
    "/dashboard", "/modules", "/profile",
    "/inventory", "/warehouse", "/equipment",
    "/procurement",
    "/fleet", "/fuel-requests"
  ],
  TECNICO: [
    "/dashboard", "/modules", "/profile",
    "/orders", "/visits", "/deliveries",
    "/clients"
  ],
  ATENDIMENTO: [
    "/dashboard", "/modules", "/profile",
    "/clients", "/visits", "/orders"
  ],
};

export const ROUTE_PERMISSION_MAP: Record<string, string[]> = {
  "/quotes": ["clients:view", "quotes:view"],
  "/clients": ["clients:view"],
  "/orders": ["orders:view"],
  "/visits": ["visits:view"],
  "/deliveries": ["orders:view"],
  "/inventory": ["inventory:view"],
  "/warehouse": ["inventory:view", "material-requests:view"],
  "/equipment": ["equipment:view"],
  "/procurement": ["procurement:view"],
  "/suppliers": ["suppliers:view", "procurement:view"],
  "/purchase-orders": ["procurement:view", "clients:view"],
  "/financial": ["expenses:view"],
  "/invoices": ["expenses:view"],
  "/approvals": ["orders:approve", "expenses:approve"],
  "/fleet": ["fleet:view"],
  "/fuel-requests": ["fleet:fuel-request", "fleet:fuel-approve", "fleet:view"],
  "/rh": ["rh:view"],
  "/reports": ["expenses:view", "orders:view"],
};

export const MODULE_CODE_PERMISSION_MAP: Record<string, string[]> = {
  COMMERCIAL: ["clients:view", "quotes:view"],
  COMERCIAL: ["clients:view", "quotes:view"],
  QUOTES: ["clients:view", "quotes:view"],
  SERVICE_ORDERS: ["orders:view", "visits:view", "art:view"],
  ORDERS: ["orders:view", "visits:view", "art:view"],
  VISITS: ["visits:view"],
  DELIVERIES: ["orders:view"],
  CLIENTS: ["clients:view"],
  INVENTORY: ["inventory:view", "material-requests:view", "equipment:view"],
  ESTOQUE: ["inventory:view", "material-requests:view", "equipment:view"],
  WAREHOUSE: ["inventory:view", "material-requests:view"],
  EQUIPMENTS: ["equipment:view", "warranty:view"],
  EQUIPMENT: ["equipment:view", "warranty:view"],
  PROCUREMENT: ["procurement:view", "suppliers:view"],
  COMPRAS: ["procurement:view", "suppliers:view"],
  SUPPLIERS: ["suppliers:view", "procurement:view"],
  FINANCIAL: ["expenses:view", "expenses:create"],
  FINANCEIRO: ["expenses:view", "expenses:create"],
  FLEET: ["fleet:view", "fleet:fuel-request"],
  RH: ["rh:view"],
  DASHBOARD: [],
};

export function isUserAuthorizedForRoute(
  role: string | undefined | null,
  pathname: string,
  roleName?: string | null,
  userPermissions?: string[]
): boolean {
  if (!role && !roleName) return false;
  const key = normalizeRoleKey(role, roleName);
  if (key === "ADMIN") return true;

  // Bloqueio rigoroso de telas administrativas para qualquer usuário não-admin
  if (
    pathname.startsWith("/users") ||
    pathname.startsWith("/roles") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/config-permissoes")
  ) {
    return false;
  }

  // Rotas sempre públicas/gerais para qualquer usuário autenticado
  if (
    pathname === "/" ||
    pathname === "/modules" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/profile")
  ) {
    return true;
  }

  // Se o usuário possui permissões dinâmicas retornadas pelo backend, valida por elas primeiro
  if (userPermissions && userPermissions.length > 0) {
    for (const [routePrefix, requiredPerms] of Object.entries(ROUTE_PERMISSION_MAP)) {
      if (pathname === routePrefix || pathname.startsWith(routePrefix + "/")) {
        if (requiredPerms.some((p) => userPermissions.includes(p))) {
          return true;
        }
      }
    }
  }

  const allowedRoutes = ROLE_ALLOWED_ROUTES[key];
  if (!allowedRoutes) return false;

  return allowedRoutes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export function isUserAuthorizedForModule(
  role: string | undefined | null,
  moduleCode: string,
  roleName?: string | null,
  userPermissions?: string[]
): boolean {
  if (!role && !roleName) return false;
  const key = normalizeRoleKey(role, roleName);
  if (key === "ADMIN") return true;

  const code = moduleCode.trim().toUpperCase();
  // Bloqueio estrito de Configurador e Usuários para não-admin
  if (code === "SETTINGS" || code === "CONFIGURADOR" || code === "USERS") {
    return false;
  }

  // Se o usuário possui permissões dinâmicas do banco, verifica se alguma coincide
  if (userPermissions && userPermissions.length > 0) {
    const requiredPerms = MODULE_CODE_PERMISSION_MAP[code];
    if (requiredPerms && requiredPerms.length > 0) {
      if (requiredPerms.some((p) => userPermissions.includes(p))) {
        return true;
      }
    }
  }

  const allowedModules = ROLE_ALLOWED_MODULES[key];
  if (!allowedModules) return false;

  return allowedModules.includes(code);
}

export function getDefaultRouteForRole(
  role: string | undefined | null,
  roleName?: string | null
): string {
  if (!role && !roleName) return "/auth/login";
  const key = normalizeRoleKey(role, roleName);

  switch (key) {
    case "ADMIN":
    case "MANAGER":
      return "/modules";
    case "FINANCEIRO":
      return "/financial";
    case "ADMINISTRATIVO_COMPRAS":
      return "/procurement";
    case "ALMOXARIFE":
      return "/inventory";
    case "TECNICO":
    case "ATENDIMENTO":
      return "/orders";
    default:
      return "/modules";
  }
}
