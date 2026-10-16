"use client";

import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, Wrench, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceItem, servicesApi } from "@/lib/api/services";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: ServiceItem) => void;
  serviceToEdit?: ServiceItem | null;
}

export const STANDARD_SERVICE_CATEGORIES = [
  "Carregador veicular (Wallbox)",
  "Instalações elétricas",
  "Padrão de entrada e ligação",
  "Quadros elétricos e painéis",
  "Grupo gerador",
  "Nobreak (UPS)",
  "Energia solar fotovoltaica",
  "Automação de equipamentos",
  "Automação predial e residencial",
  "Aterramento e SPDA",
  "Qualidade de energia e eficiência",
  "Média tensão e subestações",
  "Iluminação",
  "Manutenção elétrica e inspeções",
  "Projetos, laudos e documentação",
  "Construção civil e obras de apoio",
  "Serviços gerais e mobilização",
];

export const SERVICE_UNITS = [
  { value: "sv", label: "sv — Serviço / Execução completa" },
  { value: "un", label: "un — Unidade / Ponto individual" },
  { value: "vb", label: "vb — Verba global / Lote" },
  { value: "pt", label: "pt — Ponto elétrico" },
  { value: "m", label: "m — Metro linear" },
  { value: "m²", label: "m² — Metro quadrado" },
  { value: "h", label: "h — Hora técnica especializada" },
  { value: "dia", label: "dia — Diária operacional" },
  { value: "mês", label: "mês — Mensalidade / Contrato" },
  { value: "kWp", label: "kWp — Potência instalada (solar)" },
];

export function ServiceFormModal({
  isOpen,
  onClose,
  onSuccess,
  serviceToEdit,
}: ServiceFormModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Instalações elétricas");
  const [unit, setUnit] = useState("sv");
  const [price, setPrice] = useState<string>("0");
  const [externalCode, setExternalCode] = useState("");
  const [defaultObservation, setDefaultObservation] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceToEdit) {
      setTitle(serviceToEdit.title || "");
      setCategory(serviceToEdit.category || "Instalações elétricas");
      setUnit(serviceToEdit.unit || "sv");
      setPrice(String(serviceToEdit.price ?? 0));
      setExternalCode(serviceToEdit.externalCode || "");
      setDefaultObservation(serviceToEdit.defaultObservation || "");
      setActive(serviceToEdit.active !== false);
    } else {
      setTitle("");
      setCategory("Instalações elétricas");
      setUnit("sv");
      setPrice("0");
      setExternalCode("");
      setDefaultObservation("");
      setActive(true);
    }
    setError(null);
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("A descrição do serviço é obrigatória.");
      return;
    }

    const numPrice = parseFloat(price.replace(",", ".")) || 0;
    if (numPrice < 0) {
      setError("O valor de referência não pode ser negativo.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Partial<ServiceItem> = {
        title: title.trim(),
        category: category.trim(),
        unit: unit.trim(),
        price: numPrice,
        externalCode: externalCode.trim() || undefined,
        defaultObservation: defaultObservation.trim() || undefined,
        active,
      };

      let saved: ServiceItem;
      if (serviceToEdit?.id) {
        saved = await servicesApi.update(serviceToEdit.id, payload);
      } else {
        saved = await servicesApi.create(payload);
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Erro ao salvar o serviço no catálogo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-xl w-full shadow-xl border border-gray-200 overflow-hidden my-8">
        {/* Header do Modal */}
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-100 text-[#E2661D] flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {serviceToEdit ? "Editar Serviço do Catálogo" : "Novo Serviço Técnico"}
              </h3>
              <p className="text-xs text-slate-500">
                Tabela de preços e escopo para propostas e ordens de serviço
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Descrição do Serviço */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Descrição do Serviço <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              rows={3}
              placeholder="Ex: Fornecimento e montagem de Quadro de Distribuição de Circuitos (QDC)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs rounded-xl border-slate-200 focus:border-[#E2661D] focus:ring-[#E2661D]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Categoria */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Categoria Técnica <span className="text-rose-500">*</span>
              </Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D]"
              >
                {STANDARD_SERVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Unidade de Cobrança */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Unidade de Medida / Cobrança <span className="text-rose-500">*</span>
              </Label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D]"
              >
                {SERVICE_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Valor de Referência */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Valor de Referência (R$) <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl font-mono font-bold border-slate-200 focus:border-[#E2661D]"
                  required
                />
              </div>
            </div>

            {/* Código / Referência Interna */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Código / Referência (Opcional)
              </Label>
              <Input
                placeholder="Ex: SRV-042"
                value={externalCode}
                onChange={(e) => setExternalCode(e.target.value)}
                className="h-9 text-xs rounded-xl font-mono border-slate-200"
              />
            </div>
          </div>

          {/* Observações Técnicas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Observações Técnicas / Restrições de Escopo (Opcional)
            </Label>
            <Input
              placeholder="Ex: Informar potência (kVA), sob orçamento específico, etc."
              value={defaultObservation}
              onChange={(e) => setDefaultObservation(e.target.value)}
              className="h-9 text-xs rounded-xl border-slate-200"
            />
          </div>

          {/* Status Ativo */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-800">Serviço Ativo no Catálogo</p>
              <p className="text-[11px] text-slate-500">
                Serviços ativos ficam disponíveis para inclusão em propostas e orçamentos
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E2661D]"></div>
            </label>
          </div>

          {/* Footer Ações */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="text-xs font-semibold h-9 rounded-xl border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-bold h-9 px-5 rounded-xl shadow-2xs gap-1.5"
            >
              <Save className="w-4 h-4" />
              {loading ? "Salvando..." : serviceToEdit ? "Salvar Alterações" : "Cadastrar Serviço"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

