"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FiscalTax, FiscalSplitPayment } from "@/types";
import { Calculator, Info, Landmark, Receipt } from "lucide-react";

interface FiscalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxData?: FiscalTax;
  splitPayment?: FiscalSplitPayment;
  valorBruto: number;
}

export function FiscalDetailsModal({
  isOpen,
  onClose,
  taxData,
  splitPayment,
  valorBruto
}: FiscalDetailsModalProps) {
  if (!taxData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-xl p-0 overflow-hidden border border-gray-200/80 shadow-lg">
        <DialogHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 text-white">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold">
            <Calculator className="h-4 w-4" />
            Detalhamento Tributário (Reforma 2026)
          </DialogTitle>
          <p className="text-emerald-100 text-xs opacity-90">
            Cálculo dual: Transição para o novo regime IBS/CBS
          </p>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4 bg-gray-50/50">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white p-3.5 rounded-xl shadow-2xs border border-gray-200/80">
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Valor Bruto</p>
              <p className="text-xl font-bold text-gray-900 font-mono">
                R$ {valorBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-xl shadow-2xs border border-emerald-100">
              <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider mb-1">Total Retido (Split)</p>
              <p className="text-xl font-bold text-emerald-700 font-mono">
                R$ {splitPayment?.valorRetido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Novo Regime 2026 */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-1.5 font-bold text-gray-900 text-xs uppercase tracking-wide">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                Reforma 2026 (IBS/CBS)
              </h3>
              
              <div className="space-y-2.5">
                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-200/80">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">CBS</Badge>
                    <span className="text-xs text-gray-500">Alíquota {taxData.aliquotaCbs}%</span>
                  </div>
                  <span className="font-semibold text-xs text-gray-900 font-mono">R$ {taxData.valorCbs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-200/80">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">IBS</Badge>
                    <span className="text-xs text-gray-500">Alíquota {taxData.aliquotaIbs}%</span>
                  </div>
                  <span className="font-semibold text-xs text-gray-900 font-mono">R$ {taxData.valorIbs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                {taxData.beneficioZfmAtivo && (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 text-[11px]">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Benefício ZFM Ativo: Crédito presumido de R$ {taxData.creditoPresumidoZfm?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} mantido.
                  </div>
                )}
              </div>
            </div>

            {/* Regime Legado */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-1.5 font-bold text-gray-900 text-xs uppercase tracking-wide">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                Impostos Legados
              </h3>

              <div className="space-y-2">
                {taxData.valorIss !== null && taxData.valorIss !== undefined && (
                  <div className="flex justify-between text-xs py-1 border-b border-gray-100">
                    <span className="text-gray-500">ISS</span>
                    <span className="font-medium font-mono text-gray-900">R$ {taxData.valorIss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {taxData.valorIcms !== null && taxData.valorIcms !== undefined && (
                  <div className="flex justify-between text-xs py-1 border-b border-gray-100">
                    <span className="text-gray-500">ICMS</span>
                    <span className="font-medium font-mono text-gray-900">R$ {taxData.valorIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs py-1 border-b border-gray-100">
                  <span className="text-gray-500">PIS/COFINS</span>
                  <span className="font-medium text-gray-400 italic text-[11px]">Isentos na Retenção</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Split Payment */}
          <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 flex gap-3">
            <Landmark className="h-6 w-6 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-900 mb-0.5">Mecanismo de Split Payment</p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Este valor de R$ {splitPayment?.valorRetido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} será retido automaticamente pela instituição financeira no momento da liquidação da nota, conforme diretrizes da Reforma Tributária.
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-white border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-4 bg-gray-900 text-white rounded-lg font-semibold text-xs hover:bg-black transition-all shadow-2xs"
          >
            Fechar Detalhes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
