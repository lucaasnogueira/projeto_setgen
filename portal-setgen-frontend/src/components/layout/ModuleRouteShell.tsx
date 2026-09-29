"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Users, Key, ListChecks, Layers, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleRouteShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const TABS = [
  { label: "Dashboard", href: "/permissoes", icon: Shield },
  { label: "Usuários", href: "/permissoes/usuario", icon: Users },
  { label: "Matriz de Acessos", href: "/permissoes/gestao", icon: Key },
  { label: "Atividades", href: "/permissoes/atividades", icon: ListChecks },
  { label: "Catálogo Técnico", href: "/permissoes/catalogo", icon: Layers },
];

export function ModuleRouteShell({
  title,
  subtitle,
  badge,
  actions,
  children,
}: ModuleRouteShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/modules" className="hover:text-foreground transition-colors font-medium">
          Módulos
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-foreground">Configurador & Acessos</span>
        {pathname !== "/permissoes" && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="capitalize font-medium text-muted-foreground">
              {TABS.find((t) => t.href === pathname)?.label || "Detalhes"}
            </span>
          </>
        )}
      </nav>

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
            {badge && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Tabs de Navegação */}
      <div className="flex items-center gap-1 border-b overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Conteúdo Dinâmico */}
      <div className="min-h-[500px]">{children}</div>
    </div>
  );
}

export default ModuleRouteShell;

