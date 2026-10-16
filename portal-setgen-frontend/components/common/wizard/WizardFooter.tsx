"use client";

import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  stepName?: string;
  onPrev: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  onSaveDraft?: () => void;
  isSubmitting?: boolean;
  isDraftSaving?: boolean;
  canProceed?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  className?: string;
  extraActions?: React.ReactNode;
}

export function WizardFooter({
  currentStep,
  totalSteps,
  stepName,
  onPrev,
  onNext,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  isDraftSaving = false,
  canProceed = true,
  prevLabel,
  nextLabel,
  submitLabel = "Finalizar e Emitir",
  className,
  extraActions,
}: WizardFooterProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const defaultPrevText = isFirstStep ? "Início" : `Voltar p/ Etapa ${currentStep - 1}`;
  const defaultNextText = `Avançar p/ Etapa ${currentStep + 1}`;

  return (
    <footer
      className={cn(
        "sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 sm:px-10 py-3.5 shadow-lg",
        className
      )}
    >
      <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Lado Esquerdo: Voltar & Rascunho */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={isFirstStep || isSubmitting}
            className={cn(
              "border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold gap-2 transition-all",
              isFirstStep && "opacity-40 cursor-not-allowed hover:bg-transparent"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{prevLabel || defaultPrevText}</span>
          </Button>

          {onSaveDraft && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSaveDraft}
              disabled={isDraftSaving || isSubmitting}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 text-xs sm:text-sm font-medium"
            >
              {isDraftSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E2661D]" />
              ) : (
                <Save className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Salvar Rascunho</span>
            </Button>
          )}

          {extraActions}
        </div>

        {/* Centro: Indicador de Paginação */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            Etapa {currentStep} de {totalSteps}
          </span>
          {stepName && (
            <>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-600">{stepName}</span>
            </>
          )}
        </div>

        {/* Lado Direito: Avançar ou Finalizar */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isLastStep ? (
            <Button
              type="button"
              onClick={onSubmit || onNext}
              disabled={!canProceed || isSubmitting}
              className="w-full sm:w-auto bg-[#E2661D] hover:bg-[#c95514] text-white font-bold px-6 py-2.5 shadow-sm transition-all gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitLabel}</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={!canProceed || isSubmitting}
              className="w-full sm:w-auto bg-[#E2661D] hover:bg-[#c95514] text-white font-bold px-6 py-2.5 shadow-sm transition-all gap-2"
            >
              <span>{nextLabel || defaultNextText}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}

