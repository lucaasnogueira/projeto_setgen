import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";

export function normalizeRoleKey(role?: string | null, roleName?: string | null): string {
  const normRole = (role || "").trim().toUpperCase();
  const normName = (roleName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (normRole === "ADMIN" || normName.includes("admin")) return "ADMIN";
  if (normRole === "MANAGER" || normName.includes("gestor") || normName.includes("gerente")) return "MANAGER";
  if (normName.includes("financeiro")) return "FINANCEIRO";
  if (normName.includes("compras") || normName.includes("administrativo")) return "ADMINISTRATIVO_COMPRAS";
  if (normRole === "WAREHOUSE" || normName.includes("almoxarife") || normName.includes("estoque")) return "ALMOXARIFE";
  if (normName.includes("atendimento")) return "ATENDIMENTO";
  if (normRole === "TECHNICIAN" || normName.includes("tecnico")) return "TECNICO";
  if (normRole === "ADMINISTRATIVE") return "ADMINISTRATIVO_COMPRAS";

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
 * Mapeamento de rotas para as permissões do sistema.
 */
const ROUTE_PERMISSION_MAP: { prefix: string; perms: string[] }[] = [
  { prefix: "/users", perms: ["users:view", "users:manage", "users:create", "users:edit"] },
  { prefix: "/roles", perms: ["roles:view", "roles:manage", "roles:create", "roles:edit"] },
  { prefix: "/settings", perms: ["roles:view", "users:view", "users:manage"] },
  { prefix: "/clients", perms: ["clients:view", "clients:create", "clients:edit"] },
  { prefix: "/visits", perms: ["visits:view", "visits:create", "visits:edit"] },
  { prefix: "/orders", perms: ["orders:view", "orders:create", "orders:edit"] },
  { prefix: "/deliveries", perms: ["orders:view"] },
  { prefix: "/fleet", perms: ["fleet:view", "fleet:manage", "fleet:fuel-request"] },
  { prefix: "/inventory", perms: ["inventory:view", "inventory:manage"] },
  { prefix: "/warehouse", perms: ["material-requests:view", "material-requests:manage", "inventory:view"] },
  { prefix: "/equipment", perms: ["equipment:view", "equipment:manage"] },
  { prefix: "/procurement", perms: ["procurement:view", "procurement:manage"] },
  { prefix: "/suppliers", perms: ["suppliers:view", "suppliers:manage"] },
  { prefix: "/financial", perms: ["expenses:view", "expenses:create", "expenses:edit"] },
  { prefix: "/invoices", perms: ["expenses:view", "invoices:view"] },
  { prefix: "/approvals", perms: ["orders:approve", "expenses:approve"] },
  { prefix: "/rh", perms: ["rh:view", "rh:manage"] },
];

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
    "PROCUREMENT", "COMPRAS", "INVENTORY", "ESTOQUE", "WAREHOUSE",
    "EQUIPMENT", "EQUIPMENTS", "SERVICE_ORDERS", "ORDERS", "CLIENTS",
    "FINANCIAL", "FINANCEIRO", "DASHBOARD"
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
    "/procurement", "/suppliers",
    "/inventory", "/warehouse", "/equipment",
    "/financial",
    "/clients", "/orders"
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
    "/clients", "/orders", "/visits"
  ],
};

export function isUserAuthorizedForRoute(
  role: string | undefined | null,
  pathname: string,
  roleName?: string | null,
  permissions?: string[] | null
): boolean {
  if (!role && !roleName) return false;
  const key = normalizeRoleKey(role, roleName);
  if (key === "ADMIN") return true;

  // 1. Verificação explícita por permissões ativas vindas do banco de dados
  if (permissions && permissions.length > 0) {
    if (pathname === "/" || pathname === "/dashboard" || pathname === "/modules" || pathname === "/profile") {
      return true;
    }
    const matchingRule = ROUTE_PERMISSION_MAP.find(
      (m) => pathname === m.prefix || pathname.startsWith(m.prefix + "/")
    );
    if (matchingRule) {
      const hasPerm = matchingRule.perms.some((p) => permissions.includes(p));
      if (hasPerm) return true;
    }
  }

  // 2. Verificação de fallback por perfil/cargo
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
  permissions?: string[] | null
): boolean {
  if (!role && !roleName) return false;
  const key = normalizeRoleKey(role, roleName);
  if (key === "ADMIN") return true;

  const code = moduleCode.trim().toUpperCase();

  // 1. Verificação por permissões específicas do banco
  if (permissions && permissions.length > 0) {
    if (code === "DASHBOARD") return true;
    if ((code === "PROCUREMENT" || code === "COMPRAS") && permissions.some(p => p.startsWith("procurement:") || p.startsWith("suppliers:"))) return true;
    if ((code === "INVENTORY" || code === "ESTOQUE" || code === "WAREHOUSE") && permissions.some(p => p.startsWith("inventory:") || p.startsWith("material-requests:"))) return true;
    if ((code === "EQUIPMENT" || code === "EQUIPMENTS") && permissions.some(p => p.startsWith("equipment:"))) return true;
    if ((code === "SERVICE_ORDERS" || code === "ORDERS") && permissions.some(p => p.startsWith("orders:"))) return true;
    if (code === "VISITS" && permissions.some(p => p.startsWith("visits:"))) return true;
    if (code === "CLIENTS" && permissions.some(p => p.startsWith("clients:"))) return true;
    if ((code === "FINANCIAL" || code === "FINANCEIRO") && permissions.some(p => p.startsWith("expenses:"))) return true;
    if (code === "RH" && permissions.some(p => p.startsWith("rh:"))) return true;
    if (code === "FLEET" && permissions.some(p => p.startsWith("fleet:"))) return true;
  }

  // 2. Fallback por cargo
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
