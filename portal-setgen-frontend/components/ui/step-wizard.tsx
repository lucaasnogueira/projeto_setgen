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
    <div className="flex items-center flex-wrap gap-1 bg-card border rounded-2xl px-4 py-3.5 shadow-sm sticky top-0 z-10">
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
                  'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-colors',
                  isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-muted text-text-muted'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-[13px] font-bold whitespace-nowrap',
                  isActive ? 'text-foreground' : isDone ? 'text-text-secondary' : 'text-text-muted'
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
    <div className="flex gap-4 pt-6 pb-12">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="flex-1 h-14 rounded-2xl border-2 hover:bg-muted flex items-center justify-center gap-2 font-bold text-text-secondary transition-all active:scale-95"
      >
        <X className="h-5 w-5" />
        Cancelar
      </Button>
      {!isLast ? (
        <Button
          type="button"
          onClick={() => onNext(steps[activeIndex + 1].key)}
          className="flex-1 h-14 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
        >
          Avançar para {steps[activeIndex + 1].label}
          <ArrowRight className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-14 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      )}
    </div>
  );
}
