"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  ClipboardList,
  PackageSearch,
  Menu,
} from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useUIStore();

  if (!user) return null;

  // Itens principais da barra inferior móvel
  const navItems = [
    {
      label: "Início",
      href: "/modules",
      icon: Home,
      isActive: pathname === "/modules" || pathname === "/dashboard",
    },
    {
      label: "O.S.",
      href: "/orders",
      icon: FileText,
      isActive: pathname?.startsWith("/orders"),
    },
    {
      label: "Visitas",
      href: "/visits",
      icon: ClipboardList,
      isActive: pathname?.startsWith("/visits"),
    },
    {
      label: "Estoque",
      href: "/warehouse",
      icon: PackageSearch,
      isActive: pathname?.startsWith("/warehouse") || pathname?.startsWith("/inventory"),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border pb-safe transition-transform duration-200 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      aria-label="Navegação mobile"
    >
      <div className="flex items-center justify-around h-15 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors text-[11px] font-semibold gap-1",
                item.isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-lg transition-transform",
                  item.isActive && "bg-primary/10 scale-105"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}

        {/* Botão de Menu para abrir Drawer completo */}
        <button
          onClick={toggleMobileMenu}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors text-[11px] font-semibold gap-1 text-muted-foreground hover:text-foreground"
          title="Abrir Menu Completo"
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5" />
          </div>
          <span className="truncate max-w-[64px]">Mais</span>
        </button>
      </div>
    </nav>
  );
}

