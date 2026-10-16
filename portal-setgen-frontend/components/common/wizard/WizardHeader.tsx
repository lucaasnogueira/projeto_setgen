"use client";

import React from "react";
import { ArrowLeft, Cloud, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusBadgeConfig {
  label: string;
  variant?: "warning" | "success" | "info" | "default";
}

export interface WizardHeaderProps {
  code?: string;
  title: string;
  subtitle?: string;
  statusBadge?: string | StatusBadgeConfig;
  currentStep: number;
  totalSteps: number;
  isAutoSaved?: boolean;
  onBack?: () => void;
  backLabel?: string;
  onSaveDraft?: () => void;
  onDiscardDraft?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  extraActions?: React.ReactNode;
  className?: string;
}

export function WizardHeader({
  code,
  title,
  subtitle,
  statusBadge,
  currentStep,
  totalSteps,
  isAutoSaved = true,
  onBack,
  backLabel = "Voltar",
  onSaveDraft,
  onDiscardDraft,
  onSubmit,
  submitLabel = "Finalizar",
  isSubmitting = false,
  extraActions,
  className,
}: WizardHeaderProps) {
  const progressPct = Math.round((currentStep / totalSteps) * 100);

  const badgeObj: StatusBadgeConfig | undefined =
    typeof statusBadge === "string"
      ? { label: statusBadge, variant: "warning" }
      : statusBadge;

  const getStatusBadgeClass = (variant?: string) => {
    switch (variant) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "info":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "warning":
      default:
        return "bg-amber-50 text-amber-700 border-amber-200/80";
    }
  };

  return (
    <header
      className={cn(
        "h-[70px] bg-white border-b border-slate-200 px-6 sm:px-10 flex items-center justify-between shrink-0",
        className
      )}
    >
      {/* Lado Esquerdo: Voltar + Código + Título + Status */}
      <div className="flex items-center gap-4 sm:gap-5 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#E2661D]" />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        )}

        {onBack && <div className="h-5 w-px bg-slate-200 hidden sm:block" />}

        <div className="flex items-center gap-3 min-w-0">
          {code && (
            <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-[#E2661D] text-[11px] font-black tracking-wide font-mono shrink-0">
              {code}
            </span>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {title}
              </h2>

              {badgeObj && (
                <span
                  className={cn(
                    "hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                    getStatusBadgeClass(badgeObj.variant)
                  )}
                >
                  {badgeObj.label}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-500 truncate hidden md:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lado Direito: Barra de Progresso + Auto-Save + Botões de Ação */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {extraActions}

        {/* Indicador de Progresso Geral */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <span className="font-bold text-slate-700 text-[11px]">Progresso:</span>
          <span className="font-black text-[#E2661D]">
            {currentStep} de {totalSteps}
          </span>
          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#E2661D] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-bold">{progressPct}%</span>
        </div>

        {/* Auto-Save Tag */}
        {isAutoSaved && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-medium">
            <Cloud className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Auto-Save</span>
          </div>
        )}

        {/* Botão Salvar Rascunho */}
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Salvar Rascunho
          </button>
        )}

        {/* Botão Primário Finalizar */}
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-4 sm:px-5 py-2 rounded-xl bg-[#E2661D] hover:bg-[#C85514] text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{submitLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
}

