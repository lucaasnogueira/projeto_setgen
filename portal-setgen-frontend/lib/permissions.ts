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
    "PROCUREMENT", "COMPRAS", "SERVICE_ORDERS", "ORDERS", "CLIENTS", "DASHBOARD"
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
    "/clients", "/visits", "/orders"
  ],
};

export function isUserAuthorizedForRoute(
  role: string | undefined | null,
  pathname: string,
  roleName?: string | null,
  userPerms: string[] = []
): boolean {
  if (!role && !roleName) return false;
  const key = normalizeRoleKey(role, roleName);
  const isExplicitNonAdmin =
    key === "ADMINISTRATIVO_COMPRAS" ||
    key === "FINANCEIRO" ||
    key === "ALMOXARIFE" ||
    key === "TECNICO" ||
    key === "ATENDIMENTO";

  const isAdmin = !isExplicitNonAdmin && key === "ADMIN";

  // Bloqueio rigoroso de telas administrativas para qualquer usuário não-admin
  if (
    pathname.startsWith("/users") ||
    pathname.startsWith("/roles") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/config-permissoes")
  ) {
    return isAdmin;
  }

  if (isAdmin) return true;

  // Rotas comuns a todos os usuários autenticados
  if (
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/modules" ||
    pathname === "/profile"
  ) {
    return true;
  }

  // Validação dinâmica por permissões reais do usuário (DB)
  if (userPerms && userPerms.length > 0) {
    if (pathname.startsWith("/quotes")) return userPerms.includes("quotes:view") || userPerms.includes("clients:view");
    if (pathname.startsWith("/clients")) return userPerms.includes("clients:view");
    if (pathname.startsWith("/purchase-orders")) return userPerms.includes("orders:view") || userPerms.includes("procurement:view");
    if (pathname.startsWith("/orders")) return userPerms.includes("orders:view");
    if (pathname.startsWith("/visits")) return userPerms.includes("visits:view");
    if (pathname.startsWith("/deliveries")) return userPerms.includes("orders:view");
    if (pathname.startsWith("/fleet") || pathname.startsWith("/fuel-requests")) return userPerms.includes("fleet:view") || userPerms.includes("fleet:fuel-request");
    if (pathname.startsWith("/inventory")) return userPerms.includes("inventory:view");
    if (pathname.startsWith("/warehouse")) return userPerms.includes("material-requests:view") || userPerms.includes("inventory:view");
    if (pathname.startsWith("/equipment")) return userPerms.includes("equipment:view") || userPerms.includes("warranty:view");
    if (pathname.startsWith("/procurement") || pathname.startsWith("/suppliers")) return userPerms.includes("procurement:view") || userPerms.includes("suppliers:view");
    if (pathname.startsWith("/financial") || pathname.startsWith("/invoices") || pathname.startsWith("/approvals")) return userPerms.includes("expenses:view") || userPerms.includes("expenses:approve");
    if (pathname.startsWith("/rh")) return userPerms.includes("rh:view");
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
  userPerms: string[] = []
): boolean {
  if (!role && !roleName) return false;
  const key = normalizeRoleKey(role, roleName);
  const isExplicitNonAdmin =
    key === "ADMINISTRATIVO_COMPRAS" ||
    key === "FINANCEIRO" ||
    key === "ALMOXARIFE" ||
    key === "TECNICO" ||
    key === "ATENDIMENTO";

  const isAdmin = !isExplicitNonAdmin && key === "ADMIN";

  const code = moduleCode.trim().toUpperCase();
  // Bloqueio estrito de Configurador e Usuários para não-admin
  if (code === "SETTINGS" || code === "CONFIGURADOR" || code === "USERS") {
    return isAdmin;
  }

  if (isAdmin) return true;

  // Dashboard sempre acessível
  if (code === "DASHBOARD") return true;

  // Validação dinâmica por permissões reais do usuário
  if (userPerms && userPerms.length > 0) {
    if (code === "COMMERCIAL" || code === "COMERCIAL" || code === "QUOTES") {
      return userPerms.includes("clients:view") || userPerms.includes("quotes:view");
    }
    if (code === "SERVICE_ORDERS" || code === "ORDERS") {
      return userPerms.includes("orders:view") || userPerms.includes("visits:view") || userPerms.includes("art:view");
    }
    if (code === "CLIENTS") {
      return userPerms.includes("clients:view");
    }
    if (code === "INVENTORY" || code === "ESTOQUE" || code === "WAREHOUSE") {
      return userPerms.includes("inventory:view") || userPerms.includes("material-requests:view");
    }
    if (code === "EQUIPMENT" || code === "EQUIPMENTS") {
      return userPerms.includes("equipment:view") || userPerms.includes("warranty:view");
    }
    if (code === "PROCUREMENT" || code === "COMPRAS") {
      return userPerms.includes("procurement:view") || userPerms.includes("suppliers:view");
    }
    if (code === "FINANCIAL" || code === "FINANCEIRO") {
      return userPerms.includes("expenses:view");
    }
    if (code === "RH") {
      return userPerms.includes("rh:view");
    }
    if (code === "FLEET") {
      return userPerms.includes("fleet:view") || userPerms.includes("fleet:fuel-request");
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
