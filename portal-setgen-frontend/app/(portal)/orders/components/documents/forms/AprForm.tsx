"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Shield, AlertTriangle, CheckSquare, Sparkles } from "lucide-react";

interface AprFormProps {
  data: Record<string, any>;
  onChange: (newData: Record<string, any>) => void;
}

const TODAS_ATIVIDADES = [
  "Eletricidade (baixa tensão)",
  "Média tensão / subestação",
  "Trabalho em altura",
  "Gerador / combustível",
  "Içamento / movimentação de cargas",
  "Ferramentas manuais e elétricas",
  "Exposição ao sol e calor",
  "Animais peçonhentos e insetos",
  "Trabalho perto de vias / trânsito",
];

const TODOS_EPIS = [
  "Capacete com jugular",
  "Óculos de proteção",
  "Protetor facial",
  "Luvas de vaqueta",
  "Luvas isolantes (BT)",
  "Luvas isolantes (MT)",
  "Botina de segurança (sem metal)",
  "Vestimenta antichama NR-10",
  "Cinto paraquedista e talabarte duplo",
  "Protetor auricular",
  "Protetor solar",
  "Máscara / respirador",
];

const TODOS_EPCS = [
  "Cones e fita zebrada",
  "Placas de sinalização",
  "Cadeados e etiquetas de bloqueio",
  "Detector de tensão",
  "Aterramento temporário",
  "Vara de manobra",
  "Tapete isolante",
  "Linha de vida",
  "Extintor",
  "Kit de primeiros socorros",
];

export function AprForm({ data, onChange }: AprFormProps) {
  const [activeTab, setActiveTab] = useState<"servico" | "riscos" | "epis" | "liberacao">("servico");

  const atividades: string[] = data.atividades || [];
  const riscos: Array<any> = data.riscos || [];
  const epis: string[] = data.epis || [];
  const epcs: string[] = data.epcs || [];

  const toggleAtividade = (item: string) => {
    const next = atividades.includes(item)
      ? atividades.filter((a) => a !== item)
      : [...atividades, item];
    onChange({ ...data, atividades: next });
  };

  const toggleEpi = (item: string) => {
    const next = epis.includes(item)
      ? epis.filter((e) => e !== item)
      : [...epis, item];
    onChange({ ...data, epis: next });
  };

  const toggleEpc = (item: string) => {
    const next = epcs.includes(item)
      ? epcs.filter((e) => e !== item)
      : [...epcs, item];
    onChange({ ...data, epcs: next });
  };

  const addRisco = () => {
    onChange({
      ...data,
      riscos: [
        ...riscos,
        { perigo: "", conseq: "", controle: "", responsavel: "Equipe Técnica" },
      ],
    });
  };

  const updateRisco = (index: number, field: string, val: string) => {
    const next = [...riscos];
    next[index] = { ...next[index], [field]: val };
    onChange({ ...data, riscos: next });
  };

  const removeRisco = (index: number) => {
    onChange({
      ...data,
      riscos: riscos.filter((_, idx) => idx !== index),
    });
  };

  const applyPresetSubestacao = () => {
    onChange({
      ...data,
      atividades: ["Eletricidade (baixa tensão)", "Média tensão / subestação", "Ferramentas manuais e elétricas"],
      epis: [
        "Capacete com jugular",
        "Óculos de proteção",
        "Protetor facial",
        "Luvas de vaqueta",
        "Luvas isolantes (MT)",
        "Botina de segurança (sem metal)",
        "Vestimenta antichama NR-10",
        "Protetor auricular",
      ],
      epcs: [
        "Cones e fita zebrada",
        "Placas de sinalização",
        "Cadeados e etiquetas de bloqueio",
        "Detector de tensão",
        "Aterramento temporário",
        "Vara de manobra",
        "Tapete isolante",
        "Extintor",
        "Kit de primeiros socorros",
      ],
      normas: ["NR-06 (EPI)", "NR-10 (Segurança em Eletricidade)", "NR-10 SEP (Média/Alta Tensão)"],
    });
  };

  const applyPresetAltura = () => {
    onChange({
      ...data,
      atividades: ["Trabalho em altura", "Eletricidade (baixa tensão)", "Ferramentas manuais e elétricas", "Exposição ao sol e calor"],
      epis: [
        "Capacete com jugular",
        "Óculos de proteção",
        "Luvas de vaqueta",
        "Botina de segurança (sem metal)",
        "Cinto paraquedista e talabarte duplo",
        "Protetor solar",
      ],
      epcs: [
        "Cones e fita zebrada",
        "Placas de sinalização",
        "Linha de vida",
        "Kit de primeiros socorros",
      ],
      normas: ["NR-06 (EPI)", "NR-10 (Eletricidade)", "NR-35 (Trabalho em Altura)"],
    });
  };

  const applyPresetGerador = () => {
    onChange({
      ...data,
      atividades: ["Gerador / combustível", "Eletricidade (baixa tensão)", "Ferramentas manuais e elétricas"],
      epis: [
        "Capacete com jugular",
        "Óculos de proteção",
        "Luvas de vaqueta",
        "Luvas isolantes (BT)",
        "Botina de segurança (sem metal)",
        "Vestimenta antichama NR-10",
        "Protetor auricular",
      ],
      epcs: [
        "Cones e fita zebrada",
        "Placas de sinalização",
        "Cadeados e etiquetas de bloqueio",
        "Detector de tensão",
        "Extintor",
        "Kit de primeiros socorros",
      ],
      normas: ["NR-06 (EPI)", "NR-10 (Eletricidade)", "NR-20 (Inflamáveis/Combustíveis)"],
    });
  };

  return (
    <div className="space-y-4">
      {/* BARRA DE PRESETS RÁPIDOS DE PRODUTIVIDADE */}
      <div className="p-3 rounded-xl border border-orange-200 bg-linear-to-r from-orange-50 via-amber-50 to-white shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#E2661D]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets Rápidos de Segurança (Preenchimento 1-Click)</span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium hidden sm:inline">
            Configura atividades, EPIs e EPCs automaticamente
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={applyPresetSubestacao}
            className="rounded-lg text-xs font-bold gap-1.5 h-8 bg-[#E2661D] hover:bg-[#d05a18] text-white shadow-xs"
          >
            <Shield className="w-3.5 h-3.5" />
            ⚡ Subestação & MT (NR-10 SEP)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={applyPresetAltura}
            className="rounded-lg text-xs font-bold gap-1.5 h-8 border-gray-300 bg-white hover:bg-gray-50 text-gray-800"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ⚡ Altura & SPDA (NR-35)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={applyPresetGerador}
            className="rounded-lg text-xs font-bold gap-1.5 h-8 border-gray-300 bg-white hover:bg-gray-50 text-gray-800"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            ⚡ Gerador & Combustível (NR-20)
          </Button>
        </div>
      </div>

      {/* Mini-Tabs Internas do Formulário da APR */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("servico")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "servico"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          1. Tarefa & Atividades
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("riscos")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "riscos"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          2. Riscos & Controles ({riscos.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("epis")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "epis"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          3. EPIs, EPCs & NRs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("liberacao")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "liberacao"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          4. Liberação & Equipe
        </button>
      </div>

      {/* ABA 1: TAREFA & ATIVIDADES */}
      {activeTab === "servico" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Local da Execução</Label>
              <Input
                value={data.local || ""}
                onChange={(e) => onChange({ ...data, local: e.target.value })}
                placeholder="Ex: Endereço / Local da execução"
                className="h-9 text-xs rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Data do Serviço</Label>
              <Input
                type="date"
                value={data.dataServico || ""}
                onChange={(e) => onChange({ ...data, dataServico: e.target.value })}
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-700">Descrição Detalhada da Tarefa</Label>
            <textarea
              value={data.descricaoTarefa || ""}
              onChange={(e) => onChange({ ...data, descricaoTarefa: e.target.value })}
              rows={2}
              placeholder="Ex: Manutenção preventiva e ensaios de continuidade em subestação abrigada..."
              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#E2661D] focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-800">
                2. Atividades Envolvidas (Marque as que se aplicam)
              </Label>
              <span className="text-[11px] text-gray-500">
                {atividades.length} de {TODAS_ATIVIDADES.length} selecionadas
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TODAS_ATIVIDADES.map((item) => {
                const checked = atividades.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAtividade(item)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                      checked
                        ? "bg-orange-50/80 border-[#E2661D] text-gray-900 font-bold"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 ${
                        checked ? "bg-[#E2661D] text-white" : "border border-gray-300"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className="truncate">{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: RISCOS E MEDIDAS DE CONTROLE */}
      {activeTab === "riscos" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-800">
              3. Matriz de Riscos e Medidas de Controle (SGQ-SEG-01)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRisco}
              className="h-8 text-xs font-bold text-[#E2661D] border-[#E2661D]/40 hover:bg-orange-50 gap-1 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Risco
            </Button>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {riscos.map((r, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-2 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    Risco #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRisco(idx)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                    title="Remover linha"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Perigo / Risco:</span>
                    <Input
                      value={r.perigo || ""}
                      onChange={(e) => updateRisco(idx, "perigo", e.target.value)}
                      placeholder="Ex: Choque elétrico em MT"
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Possíveis Consequências:</span>
                    <Input
                      value={r.conseq || ""}
                      onChange={(e) => updateRisco(idx, "conseq", e.target.value)}
                      placeholder="Ex: Morte, queimaduras graves"
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Medidas de Controle:</span>
                    <Input
                      value={r.controle || ""}
                      onChange={(e) => updateRisco(idx, "controle", e.target.value)}
                      placeholder="Ex: Desligamento com vara, bloqueio LOTO, detector MT"
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-600">Responsável:</span>
                    <Input
                      value={r.responsavel || ""}
                      onChange={(e) => updateRisco(idx, "responsavel", e.target.value)}
                      placeholder="Ex: Responsável técnico"
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: EPIS, EPCS & NORMAS */}
      {activeTab === "epis" && (
        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
          {/* EPIs */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-800">EPIs Aplicáveis (Equipamentos de Proteção Individual)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {TODOS_EPIS.map((epi) => {
                const checked = epis.includes(epi);
                return (
                  <button
                    key={epi}
                    type="button"
                    onClick={() => toggleEpi(epi)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border text-left text-xs transition-all ${
                      checked
                        ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] shrink-0 ${
                        checked ? "bg-emerald-600 text-white" : "border border-gray-300"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className="truncate">{epi}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* EPCs */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <Label className="text-xs font-bold text-gray-800">EPCs Aplicáveis (Equipamentos de Proteção Coletiva)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {TODOS_EPCS.map((epc) => {
                const checked = epcs.includes(epc);
                return (
                  <button
                    key={epc}
                    type="button"
                    onClick={() => toggleEpc(epc)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border text-left text-xs transition-all ${
                      checked
                        ? "bg-blue-50 border-blue-400 text-blue-950 font-bold"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] shrink-0 ${
                        checked ? "bg-blue-600 text-white" : "border border-gray-300"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className="truncate">{epc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hospital e Emergência */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <Label className="text-xs font-bold text-gray-800">Hospital / Pronto Socorro de Referência</Label>
            <Input
              value={data.emergenciaHospital || ""}
              onChange={(e) => onChange({ ...data, emergenciaHospital: e.target.value })}
              placeholder="Ex: Pronto Socorro 28 de Agosto · SAMU 192 · Bombeiros 193"
              className="h-9 text-xs rounded-lg"
            />
          </div>
        </div>
      )}

      {/* ABA 4: LIBERAÇÃO & EQUIPE */}
      {activeTab === "liberacao" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-800">Resultado da Liberação Técnica</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { status: "Liberado", color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
                { status: "Liberado com restrições", color: "bg-amber-50 text-amber-800 border-amber-300" },
                { status: "Não liberado", color: "bg-red-50 text-red-800 border-red-300" },
              ].map((item) => (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => onChange({ ...data, liberacaoStatus: item.status })}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    data.liberacaoStatus === item.status
                      ? `${item.color} ring-2 ring-[#E2661D]/40 shadow-xs`
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {item.status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-700">Restrições / Observações de Liberação</Label>
            <textarea
              value={data.restricoes || ""}
              onChange={(e) => onChange({ ...data, restricoes: e.target.value })}
              rows={2}
              placeholder="Ex: Manter distanciamento seguro e aterramento conectado até liberação final."
              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#E2661D] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Supervisor / Responsável do Cliente</Label>
              <Input
                value={data.supervisorCliente || ""}
                onChange={(e) => onChange({ ...data, supervisorCliente: e.target.value })}
                placeholder="Ex: Fiscal / Representante do Cliente"
                className="h-9 text-xs rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Responsável Técnico (Nome e CREA/CFT)</Label>
              <Input
                value={data.responsavelTecnico || ""}
                onChange={(e) => onChange({ ...data, responsavelTecnico: e.target.value })}
                placeholder="Ex: Eng. Eletricista · CREA/CFT"
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

