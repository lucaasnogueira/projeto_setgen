"use client"

import { Check, ArrowRight, X, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface WizardStep {
  key: string;
  label: string;
}

interface StepRailProps {
  steps: WizardStep[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function StepRail({ steps, activeKey, onSelect }: StepRailProps) {
  const activeIndex = Math.max(0, steps.findIndex((s) => s.key === activeKey));

  return (
    <div className="flex items-center flex-wrap gap-1 bg-card border rounded-xl px-3.5 py-2.5 shadow-2xs sticky top-0 z-10">
      {steps.map((s, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <div key={s.key} className="flex items-center">
            <button
              type="button"
              onClick={() => onSelect(s.key)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors',
                  isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-muted text-text-muted'
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-xs font-semibold whitespace-nowrap',
                  isActive ? 'text-foreground font-bold' : isDone ? 'text-text-secondary' : 'text-text-muted'
                )}
              >
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && <span className="w-6 sm:w-10 h-px bg-border mx-1 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

interface StepFooterProps {
  steps: WizardStep[];
  activeKey: string;
  onNext: (nextKey: string) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel: string;
}

/** Rodapé padrão do wizard: "Cancelar" + "Avançar" nas etapas intermediárias, "Salvar" (submit) na última. */
export function StepFooter({ steps, activeKey, onNext, onCancel, loading, submitLabel }: StepFooterProps) {
  const activeIndex = Math.max(0, steps.findIndex((s) => s.key === activeKey));
  const isLast = activeIndex === steps.length - 1;

  return (
    <div className="flex gap-3 pt-4 pb-6">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="flex-1 h-9 rounded-lg border hover:bg-muted flex items-center justify-center gap-1.5 font-semibold text-xs text-text-secondary transition-all shadow-2xs"
      >
        <X className="h-4 w-4" />
        Cancelar
      </Button>
      {!isLast ? (
        <Button
          key="next"
          type="button"
          onClick={() => onNext(steps[activeIndex + 1].key)}
          className="flex-1 h-9 bg-[#E2661D] hover:bg-[#c95716] text-white rounded-lg shadow-2xs flex items-center justify-center gap-1.5 font-bold text-xs transition-all"
        >
          Avançar para {steps[activeIndex + 1].label}
          <ArrowRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          key="submit"
          type="submit"
          disabled={loading}
          className="flex-1 h-9 bg-[#E2661D] hover:bg-[#c95716] text-white rounded-lg shadow-2xs flex items-center justify-center gap-1.5 font-bold text-xs transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      )}
    </div>
  );
}
