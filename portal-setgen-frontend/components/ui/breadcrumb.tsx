"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumb({ items, className, showHome = false }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-xs text-gray-500", className)}
    >
      <ol className="flex items-center space-x-1.5 sm:space-x-2">
        {showHome && (
          <li className="flex items-center">
            <Link
              href="/modules"
              className="text-gray-400 hover:text-gray-900 transition-colors flex items-center"
              title="Ir para Módulos"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-300 ml-1.5 sm:ml-2 shrink-0" />
          </li>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const ItemIcon = item.icon;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-gray-300 mx-1.5 sm:mx-2 shrink-0" />
              )}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium text-gray-500 hover:text-gray-900 hover:underline transition-colors flex items-center gap-1.5 truncate max-w-[140px] sm:max-w-[200px]"
                >
                  {ItemIcon && <ItemIcon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1.5 truncate max-w-[160px] sm:max-w-[240px]",
                    isLast ? "font-semibold text-gray-900" : "font-medium text-gray-600"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {ItemIcon && <ItemIcon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

