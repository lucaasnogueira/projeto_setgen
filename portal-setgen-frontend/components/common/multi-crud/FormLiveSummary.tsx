"use client";

import React from "react";
import {
  FileText,
  User,
  Factory,
  Clock,
  CheckCircle,
  Sparkles,
  Calculator,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

export interface CostBreakdownItem {
  label: string;
  amount: number;
  badge?: string;
}

export interface FormLiveSummaryProps {
  orderCode?: string;
  statusBadge?: string;
  clientName?: string;
  plantName?: string;
  priority?: "baixa" | "media" | "alta" | "urgente";
  techniciansCount?: number;
  deadline?: string;
  breakdown: CostBreakdownItem[];
  totalAmount: number;
  currentStep?: number;
  totalSteps?: number;
  isAutoSaved?: boolean;
  className?: string;
}

export function FormLiveSummary({
  orderCode = "OS-NOVA",
  statusBadge = "Em Elaboração",
  clientName,
  plantName,
  priority = "media",
  techniciansCount = 0,
  deadline,
  breakdown = [],
  totalAmount = 0,
  currentStep,
  totalSteps,
  isAutoSaved = true,
  className,
}: FormLiveSummaryProps) {
  const priorityColors = {
    baixa: "bg-blue-50 text-blue-700 border-blue-200",
    media: "bg-amber-50 text-amber-700 border-amber-200",
    alta: "bg-orange-50 text-orange-700 border-orange-200",
    urgente: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div
      className={cn(
        "bg-white border border-gray-200/80 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col gap-4 sticky top-24",
        className
      )}
    >
      {/* Cabeçalho do Resumo */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#E2661D] shadow-2xs">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
              Resumo Operacional
            </h4>
            <span className="text-[10px] font-mono font-bold text-slate-500">{orderCode}</span>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
          {statusBadge}
        </span>
      </div>

      {/* Metadados do Atendimento */}
      <div className="space-y-2.5 text-xs">
        {clientName && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Cliente:
            </span>
            <span className="font-bold text-slate-800 text-right truncate max-w-[170px]">
              {clientName}
            </span>
          </div>
        )}

        {plantName && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-slate-400" /> Usina / Local:
            </span>
            <span className="font-bold text-slate-800 text-right truncate max-w-[170px]">
              {plantName}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Prioridade:
          </span>
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border",
              priorityColors[priority] || priorityColors.media
            )}
          >
            {priority}
          </span>
        </div>

        {techniciansCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Equipe Técnica:
            </span>
            <span className="font-bold text-slate-800">
              {techniciansCount} {techniciansCount === 1 ? "técnico" : "técnicos"}
            </span>
          </div>
        )}

        {deadline && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Prazo Final:
            </span>
            <span className="font-bold text-slate-800">{deadline}</span>
          </div>
        )}
      </div>

      {/* Detalhamento Financeiro em Tempo Real */}
      <div className="bg-slate-50/90 rounded-lg p-3.5 border border-slate-200/80 space-y-2.5">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
          <span>Composição de Custos</span>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Ao vivo
          </span>
        </div>

        {breakdown.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">{item.label}</span>
            <span className="font-bold text-slate-800">{formatCurrency(item.amount)}</span>
          </div>
        ))}

        <div className="border-t border-slate-200/90 pt-3 mt-3 flex items-baseline justify-between">
          <span className="font-black text-slate-900 text-xs uppercase tracking-wide">Total Estimado:</span>
          <span className="font-black text-xl text-[#E2661D]">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Indicador de Progresso / Auto-save */}
      <div className="text-center pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        {currentStep && totalSteps ? (
          <span>
            Etapa <strong className="text-slate-700">{currentStep}</strong> de{" "}
            <strong>{totalSteps}</strong>
          </span>
        ) : (
          <span>Formulário Multi-Etapas</span>
        )}

        {isAutoSaved && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
            <CheckCircle className="w-3 h-3" /> Auto-salvo
          </span>
        )}
      </div>
    </div>
  );
}

