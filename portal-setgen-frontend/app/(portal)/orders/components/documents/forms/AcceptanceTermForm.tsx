"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react";

interface AcceptanceTermFormProps {
  data: Record<string, any>;
  onChange: (newData: Record<string, any>) => void;
}

const ITENS_VERIFICACAO = [
  "Serviço executado conforme proposta comercial e memorial",
  "Circuitos e equipamentos devidamente testados e energizados",
  "Quadro de distribuição identificado e anilhado",
  "Dispositivos de proteção (disjuntores, DR, DPS) testados",
  "Cliente e operadores orientados sobre a operação",
  "Local limpo e sobras de materiais recolhidas",
];

export function AcceptanceTermForm({ data, onChange }: AcceptanceTermFormProps) {
  const [activeTab, setActiveTab] = useState<"aceite" | "equipamentos" | "garantia" | "revisoes">("aceite");

  const equipamentos: Array<any> = data.equipamentos || [];
  const verificacoes: Record<string, boolean> = data.verificacoes || {};
  const revisoes: Array<any> = data.revisoes || [];

  const toggleVerificacao = (item: string) => {
    const current = verificacoes[item] !== false;
    onChange({
      ...data,
      verificacoes: {
        ...verificacoes,
        [item]: !current,
      },
    });
  };

  const addEquipamento = () => {
    onChange({
      ...data,
      equipamentos: [
        ...equipamentos,
        { equipamento: "", marca: "", serie: "", qtd: "1", garantia: "12 meses" },
      ],
    });
  };

  const updateEquipamento = (index: number, field: string, val: string) => {
    const next = [...equipamentos];
    next[index] = { ...next[index], [field]: val };
    onChange({ ...data, equipamentos: next });
  };

  const removeEquipamento = (index: number) => {
    onChange({
      ...data,
      equipamentos: equipamentos.filter((_, idx) => idx !== index),
    });
  };

  return (
    <div className="space-y-4">
      {/* Tabs Internas */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("aceite")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "aceite"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          1. Verificações de Entrega
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("equipamentos")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "equipamentos"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          2. Equipamentos ({equipamentos.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("garantia")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "garantia"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          3. Certificado de Garantia
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("revisoes")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "revisoes"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          4. Agenda de Revisões
        </button>
      </div>

      {/* ABA 1: VERIFICAÇÕES DE ENTREGA & PENDÊNCIAS */}
      {activeTab === "aceite" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Data de Conclusão Técnica</Label>
              <Input
                type="date"
                value={data.dataConclusao || ""}
                onChange={(e) => onChange({ ...data, dataConclusao: e.target.value })}
                className="h-9 text-xs rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Tipo de Instalação</Label>
              <Input
                value={data.tipoServico || ""}
                onChange={(e) => onChange({ ...data, tipoServico: e.target.value })}
                placeholder="Ex: Instalação e Reforma de Subestação"
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Label className="text-xs font-bold text-gray-800">Verificações na Entrega Técnica</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {ITENS_VERIFICACAO.map((item) => {
                const checked = verificacoes[item] !== false;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleVerificacao(item)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      checked
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 ${
                        checked ? "bg-emerald-600 text-white" : "border border-gray-300"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <Label className="text-xs font-bold text-gray-700">Registro de Pendências</Label>
            <textarea
              value={data.pendencias || ""}
              onChange={(e) => onChange({ ...data, pendencias: e.target.value })}
              rows={2}
              placeholder="Ex: Não há pendências: o serviço foi concluído e entregue em perfeito funcionamento."
              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#E2661D] outline-none"
            />
          </div>
        </div>
      )}

      {/* ABA 2: EQUIPAMENTOS INSTALADOS */}
      {activeTab === "equipamentos" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-800">
              Equipamentos Instalados e Relação de Garantia
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEquipamento}
              className="h-8 text-xs font-bold text-[#E2661D] border-[#E2661D]/40 hover:bg-orange-50 gap-1 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Equipamento
            </Button>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {equipamentos.map((eq, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-2 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    Item #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEquipamento(idx)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Equipamento:</span>
                    <Input
                      value={eq.equipamento || ""}
                      onChange={(e) => updateEquipamento(idx, "equipamento", e.target.value)}
                      placeholder="Ex: Quadro QDG"
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Marca / Modelo:</span>
                    <Input
                      value={eq.marca || ""}
                      onChange={(e) => updateEquipamento(idx, "marca", e.target.value)}
                      placeholder="Ex: Siemens / Schneider"
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Nº de Série:</span>
                    <Input
                      value={eq.serie || ""}
                      onChange={(e) => updateEquipamento(idx, "serie", e.target.value)}
                      placeholder="SN-2026-001"
                      className="h-8 text-xs rounded-lg font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Qtd:</span>
                    <Input
                      value={eq.qtd || "1"}
                      onChange={(e) => updateEquipamento(idx, "qtd", e.target.value)}
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Garantia Fábrica:</span>
                    <Input
                      value={eq.garantia || "12 meses"}
                      onChange={(e) => updateEquipamento(idx, "garantia", e.target.value)}
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: CERTIFICADO DE GARANTIA */}
      {activeTab === "garantia" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Prazo de Garantia dos Serviços</Label>
              <Input
                value={data.garantiaMeses ? `${data.garantiaMeses} meses` : "12 meses"}
                onChange={(e) => onChange({ ...data, garantiaMeses: e.target.value.replace(/\D/g, "") })}
                placeholder="12 meses"
                className="h-9 text-xs rounded-lg font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Validade da Garantia Até</Label>
              <Input
                type="date"
                value={data.garantiaAte || ""}
                onChange={(e) => onChange({ ...data, garantiaAte: e.target.value })}
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Taxa de Visita Pós-Garantia</Label>
              <Input
                value={data.taxaVisitaPosGarantia || "R$ 250,00"}
                onChange={(e) => onChange({ ...data, taxaVisitaPosGarantia: e.target.value })}
                className="h-9 text-xs rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Canais de Acionamento</Label>
              <Input
                value={data.canaisGarantia || "(92) 98592-6760 / comercial@setgen.com.br"}
                onChange={(e) => onChange({ ...data, canaisGarantia: e.target.value })}
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: AGENDA DE REVISÕES */}
      {activeTab === "revisoes" && (
        <div className="space-y-3">
          <Label className="text-xs font-bold text-gray-800">
            Cronograma de Revisões Preventivas Recomendadas
          </Label>
          <div className="space-y-2">
            {revisoes.map((rev, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-gray-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#E2661D]">
                  <span>Revisão #{rev.numero} ({rev.prazo})</span>
                  <span className="text-gray-500 font-normal">Prevista para: {rev.dataPrevista}</span>
                </div>
                <Input
                  value={rev.descricao || ""}
                  onChange={(e) => {
                    const next = [...revisoes];
                    next[idx] = { ...next[idx], descricao: e.target.value };
                    onChange({ ...data, revisoes: next });
                  }}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

