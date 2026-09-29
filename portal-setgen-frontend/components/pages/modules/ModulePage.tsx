"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Package,
  FileText,
  Users,
  ShoppingCart,
  Building2,
  Wallet,
  Truck,
  Shield,
  Layers,
  Briefcase,
  LayoutGrid,
  Car,
  Zap,
  Settings,
  AlertCircle,
  FolderOpen,
  Calendar,
  LucideIcon,
  RefreshCw,
} from "lucide-react";
import { ModuleCard, ModuleItem } from "./ModuleCard";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { isUserAuthorizedForModule } from "@/lib/permissions";

// Mapeamento dinâmico de strings do banco para ícones Lucide
const ICON_MAP: Record<string, LucideIcon> = {
  Package,
  FileText,
  Users,
  ShoppingCart,
  Building2,
  Wallet,
  Truck,
  Shield,
  Layers,
  Briefcase,
  LayoutGrid,
  Car,
  Zap,
  Settings,
  Calendar,
};

const DEFAULT_ICON: LucideIcon = Layers;

interface ModulePageProps {
  announcement?: {
    type?: "info" | "warning";
    message: string;
  };
}

export function ModulePage({ announcement }: ModulePageProps) {
  const { user } = useAuthStore();
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return formatter.format(new Date()).toUpperCase();
    } catch {
      return "HOJE";
    }
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    setError(null);

    const DEFAULT_MODULES: ModuleItem[] = [
      {
        id: "armazem-geral",
        name: "Armazém Geral",
        code: "WAREHOUSE",
        description: "Controle de saldo, recebimento e armazenamento de cargas.",
        route: "/inventory",
        icon: "Truck",
        isEnabled: true,
      },
      {
        id: "clients",
        name: "Clientes",
        code: "CLIENTS",
        description: "Gestão cadastral, contratos e contatos corporativos.",
        route: "/clients",
        icon: "Building2",
        isEnabled: true,
      },
      {
        id: "comercial",
        name: "Comercial & Propostas",
        code: "COMMERCIAL",
        description: "Elaboração e precificação de orçamentos e propostas.",
        route: "/quotes",
        icon: "Briefcase",
        isEnabled: true,
      },
      {
        id: "compras",
        name: "Compras & Suprimentos",
        code: "PROCUREMENT",
        description: "Pedidos de compra para fornecedores e cotações.",
        route: "/procurement",
        icon: "ShoppingCart",
        isEnabled: true,
      },
      {
        id: "configurador",
        name: "Configurador",
        code: "SETTINGS",
        description: "Gestão de macro-módulos, perfis, acessos e permissões.",
        route: "/settings/modules",
        icon: "Shield",
        isEnabled: true,
      },
      {
        id: "dashboard",
        name: "Dashboard Geral",
        code: "DASHBOARD",
        description: "Indicadores executivos, metas e visão consolidada.",
        route: "/dashboard",
        icon: "LayoutGrid",
        isEnabled: true,
      },
      {
        id: "equipment",
        name: "Equipamentos & Geradores",
        code: "EQUIPMENTS",
        description: "Rastreabilidade por QR Code e planos de manutenção.",
        route: "/equipment",
        icon: "Zap",
        isEnabled: true,
      },
      {
        id: "estoque",
        name: "Estoque & Peças",
        code: "INVENTORY",
        description: "Controle de saldo central e peças de reposição.",
        route: "/inventory",
        icon: "Package",
        isEnabled: true,
      },
      {
        id: "financeiro",
        name: "Financeiro & Caixa",
        code: "FINANCIAL",
        description: "Controle de reembolsos, despesas e fluxo de caixa.",
        route: "/financial",
        icon: "Wallet",
        isEnabled: true,
      },
      {
        id: "fleet",
        name: "Frotas & Veículos",
        code: "FLEET",
        description: "Gestão de veículos, viagens, combustível e quilometragem.",
        route: "/fleet",
        icon: "Truck",
        isEnabled: true,
      },
      {
        id: "orders",
        name: "Ordens de Serviço & Campo",
        code: "SERVICE_ORDERS",
        description: "Gestão de OS externa, laudos técnicos e custos.",
        route: "/orders",
        icon: "FileText",
        isEnabled: true,
      },
      {
        id: "rh",
        name: "Recursos Humanos",
        code: "RH",
        description: "Gestão de colaboradores, turnos e taxas horárias.",
        route: "/rh/employees",
        icon: "Users",
        isEnabled: true,
      },
    ];

    const userRole = user?.role;
    const userRoleName = user?.roleName || (user as any)?.roleRef?.name;
    const isAdmin = userRole === "ADMIN" || (userRoleName && userRoleName.toLowerCase().includes("admin"));

    const filteredDefaults = DEFAULT_MODULES.filter(
      (m) => isAdmin || isUserAuthorizedForModule(userRole, m.code, userRoleName, user?.permissions)
    ).sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));

    try {
      const response = await api.get("/access-control/me/modules").catch(() => {
        return api.get("/user-modules/status").catch(() => null);
      });

      if (!response || !response.data) {
        setModules(filteredDefaults);
        return;
      }

      const data = response.data;
      const rawModules: any[] = Array.isArray(data) ? data : data.modules || [];

      if (rawModules.length === 0) {
        setModules(filteredDefaults);
        return;
      }

      const isAdminUser = isAdmin || data.isAdmin === true;
      const enabledModules = rawModules
        .filter((mod: any) => {
          const code = mod.code || mod.name;
          const authorized = isAdminUser || isUserAuthorizedForModule(userRole, code, userRoleName, user?.permissions);
          const active = isAdminUser || mod.isEnabled === true || mod.active === true;
          return authorized && active;
        })
        .map((mod: any) => ({
          id: String(mod.id),
          name: mod.name,
          code: mod.code || mod.name,
          description: mod.description || "Acesse as funcionalidades deste módulo operacional.",
          route: mod.route,
          icon: mod.icon || "Layers",
          isEnabled: true,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));

      setModules(enabledModules.length > 0 ? enabledModules : filteredDefaults);
    } catch (err: any) {
      console.error("Erro ao buscar catálogo de módulos:", err);
      setError(
        "Não foi possível carregar os módulos disponíveis. Verifique sua conexão ou tente novamente."
      );
      setModules(filteredDefaults);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [user?.id, user?.role, user?.roleName]);

  const resolveIcon = (iconName: string): LucideIcon => {
    if (!iconName) return DEFAULT_ICON;
    return ICON_MAP[iconName] || DEFAULT_ICON;
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#F8FAFC]">
      <section className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        <div className="mb-8 text-center">
          <h2 className="text-sm md:text-base font-medium text-slate-700">
            Selecione o ambiente operacional que deseja acessar.
          </h2>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 mt-1.5 uppercase">
            {formattedDate}
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#E2661D] border-t-transparent animate-spin" />
            <p className="text-xs text-gray-500">
              Carregando módulos em ordem alfabética...
            </p>
          </div>
        )}

        {/* ERRO */}
        {!loading && error && (
          <div className="max-w-md mx-auto bg-white border border-red-200 rounded-xl p-5 text-center shadow-xs my-6">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Falha na Comunicação</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{error}</p>
            <button
              onClick={fetchModules}
              className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && modules.length === 0 && (
          <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-xl p-6 text-center shadow-xs my-10">
            <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Nenhum Módulo Disponível</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Nenhum módulo operacional associado ao seu perfil no momento.
            </p>
          </div>
        )}

        {/* GRID DE MÓDULOS (ORDEM ALFABÉTICA) */}
        {!loading && !error && modules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {modules.map((module) => (
              <ModuleCard
                key={module.id || module.code}
                module={module}
                iconComponent={resolveIcon(module.icon)}
                isActive={module.code === "SETTINGS"}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
