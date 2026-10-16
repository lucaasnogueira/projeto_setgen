"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface CenteredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
  bodyClassName?: string;
}

const sizeClasses: Record<NonNullable<CenteredModalProps["size"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-xl",
  xl: "sm:max-w-2xl",
  "2xl": "sm:max-w-3xl",
  "3xl": "sm:max-w-4xl",
  "4xl": "sm:max-w-5xl",
};

export function CenteredModal({
  open,
  onOpenChange,
  title,
  description,
  badge,
  icon,
  children,
  footer,
  size = "xl",
  className,
  bodyClassName,
}: CenteredModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full p-0 overflow-hidden rounded-xl border border-gray-200/80 shadow-2xl bg-white focus:outline-none",
          sizeClasses[size],
          className
        )}
      >
        {/* Cabeçalho do Modal */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="w-7 h-7 rounded-lg bg-orange-100/80 border border-orange-200/60 text-[#E2661D] flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xs sm:text-sm font-bold text-gray-900">
                    {title}
                  </DialogTitle>
                  {badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-[#E2661D] uppercase tracking-wide border border-orange-200/60">
                      {badge}
                    </span>
                  )}
                </div>
                {description && (
                  <DialogDescription className="text-xs text-gray-500 mt-0.5">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Corpo do Modal com Scroll Interno Limpo */}
        <div
          className={cn(
            "p-4 sm:p-5 max-h-[calc(85vh-140px)] overflow-y-auto space-y-4 text-slate-800",
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Rodapé do Modal (opcional) */}
        {footer && (
          <div className="px-4 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

