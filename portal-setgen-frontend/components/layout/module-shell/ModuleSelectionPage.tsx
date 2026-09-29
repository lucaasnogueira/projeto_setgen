"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowRight, Compass } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export interface SelectionShortcut {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  requiredPermissions?: string[];
  badge?: string;
}

interface ModuleSelectionPageProps {
  moduleTitle: string;
  moduleDescription: string;
  icon: LucideIcon;
  instructions?: string;
  shortcuts?: SelectionShortcut[];
}

export function ModuleSelectionPage({
  moduleTitle,
  moduleDescription,
  icon: ModuleIcon,
  instructions,
  shortcuts = [],
}: ModuleSelectionPageProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const userPerms = new Set(user?.permissions || []);

  // Filtra apenas atalhos aos quais o usuário tem permissão
  const visibleShortcuts = shortcuts.filter((item) => {
    if (isAdmin) return true;
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
    return item.requiredPermissions.some((perm) => userPerms.has(perm));
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Card Principal de Apresentação */}
      <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-8 shadow-xs">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <ModuleIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-orange-950">
              {moduleTitle}
            </h1>
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
              Painel de Apresentação
            </span>
          </div>
        </div>

        <p className="text-sm text-orange-900/80 leading-relaxed max-w-3xl mb-4">
          {moduleDescription}
        </p>

        <div className="pt-4 border-t border-orange-200/60 text-xs text-orange-800/90 flex items-center gap-2">
          <Compass className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            {instructions ||
              "Navegue pelas funcionalidades deste módulo através do menu lateral à esquerda ou utilize os atalhos rápidos abaixo."}
          </span>
        </div>
      </div>

      {/* Grid de Atalhos Rápidos para Sub-páginas Autorizadas */}
      {visibleShortcuts.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
            Ações e Funcionalidades Disponíveis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleShortcuts.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group bg-white rounded-2xl border border-gray-200 hover:border-orange-500 p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors flex items-center justify-center">
                        <ItemIcon className="w-5 h-5" />
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-orange-600">
                    <span>Acessar</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

