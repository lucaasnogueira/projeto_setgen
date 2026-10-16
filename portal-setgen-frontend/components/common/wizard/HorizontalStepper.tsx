"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: number;
  title: string;
  subtitle?: string;
  badge?: string;
  isCompleted?: boolean;
}

interface HorizontalStepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  maxStepAllowed?: number;
  className?: string;
}

export function HorizontalStepper({
  steps,
  currentStep,
  onStepClick,
  maxStepAllowed = steps.length,
  className,
}: HorizontalStepperProps) {
  return (
    <nav
      aria-label="Progresso do Formulário"
      className={cn(
        "bg-white border-b border-slate-200 px-6 sm:px-10 py-3 shadow-xs",
        className
      )}
    >
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isDone = step.isCompleted ?? step.id < currentStep;
          const isClickable = step.id <= maxStepAllowed || isDone;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex-1 min-w-[200px] flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left",
                  isActive
                    ? "bg-orange-50/80 border-2 border-[#E2661D] ring-2 ring-orange-500/10 text-[#E2661D] font-bold shadow-2xs"
                    : isDone
                    ? "bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold cursor-pointer shadow-2xs"
                    : "bg-slate-50/60 border border-slate-200/60 text-slate-400 cursor-not-allowed"
                )}
              >
                {/* Ícone ou Número da Etapa */}
                <span
                  className={cn(
                    "w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-all",
                    isActive
                      ? "bg-gradient-to-tr from-[#E2661D] to-[#FF8533] text-white shadow-2xs"
                      : isDone
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  {isDone && !isActive ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    step.id
                  )}
                </span>

                {/* Título e Subtítulo */}
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "text-xs font-bold leading-tight truncate",
                      isActive ? "text-[#E2661D]" : isDone ? "text-slate-900" : "text-slate-500"
                    )}
                  >
                    {step.title}
                  </div>
                  {step.subtitle && (
                    <div className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                      {step.subtitle}
                    </div>
                  )}
                </div>

                {/* Badge Opcional ou Ícone de Conclusão */}
                {step.badge ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold ml-auto shrink-0">
                    {step.badge}
                  </span>
                ) : isDone && !isActive ? (
                  <Check className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                ) : null}
              </button>

              {/* Separador entre etapas */}
              {index < steps.length - 1 && (
                <div className="w-4 sm:w-6 h-px bg-slate-200 shrink-0 hidden md:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}

