"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Wrench,
  Activity,
  Layers,
  Users,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";

interface FinalInspectionFormProps {
  data: Record<string, any>;
  onChange: (newData: Record<string, any>) => void;
}

const CHECKLIST_ITEMS = [
  "Serviço executado conforme a proposta / OS",
  "Materiais conforme o especificado",
  "Quadro organizado e circuitos identificados",
  "Conexões apertadas e sem sinais de aquecimento",
  "Eletrodutos, caixas e tampas fixados",
  "Aterramento conectado e verificado",
  "DR / IDR testado pelo botão de teste",
  "DPS instalado e conectado",
  "Equipamentos funcionando em carga",
  "Local limpo, sem sobras de material",
  "Cliente orientado sobre o uso e os cuidados",
];

const INSTRUMENTOS_PADRAO = [
  { key: "multimetro", label: "Multímetro" },
  { key: "alicateAmperimetro", label: "Alicate amperímetro" },
  { key: "megohmetro", label: "Megôhmetro" },
  { key: "terrometro", label: "Terrômetro" },
  { key: "testadorDr", label: "Testador de DR" },
  { key: "cameraTermografica", label: "Câmera termográfica" },
];

export function FinalInspectionForm({ data, onChange }: FinalInspectionFormProps) {
  const [activeTab, setActiveTab] = useState<"dados" | "checklist" | "medicoes" | "resultado" | "responsaveis">("dados");

  const checklist: Record<string, "OK" | "NÃO" | "N/A"> = data.checklist || {};
  const etapas: string[] = Array.isArray(data.etapasExecutadas) ? data.etapasExecutadas : [];
  const materiais: any[] = Array.isArray(data.materiais) ? data.materiais : [];
  const medicoes: any[] = Array.isArray(data.medicoes) ? data.medicoes : [];
  const instrumentos: Record<string, boolean> = data.instrumentosUsados || {};

  // Handlers para Etapas
  const addEtapa = () => {
    onChange({
      ...data,
      etapasExecutadas: [...etapas, ""],
    });
  };

  const updateEtapa = (index: number, val: string) => {
    const next = [...etapas];
    next[index] = val;
    onChange({ ...data, etapasExecutadas: next });
  };

  const removeEtapa = (index: number) => {
    onChange({
      ...data,
      etapasExecutadas: etapas.filter((_, idx) => idx !== index),
    });
  };

  // Handlers para Materiais
  const addMaterial = () => {
    onChange({
      ...data,
      materiais: [
        ...materiais,
        { material: "", previsto: "1 un", usado: "1 un", conferidoObs: "Conforme" },
      ],
    });
  };

  const updateMaterial = (index: number, field: string, val: string) => {
    const next = [...materiais];
    next[index] = { ...next[index], [field]: val };
    onChange({ ...data, materiais: next });
  };

  const removeMaterial = (index: number) => {
    onChange({
      ...data,
      materiais: materiais.filter((_, idx) => idx !== index),
    });
  };

  // Handlers para Checklist Tri-State
  const setChecklistItem = (item: string, val: "OK" | "NÃO" | "N/A") => {
    onChange({
      ...data,
      checklist: {
        ...checklist,
        [item]: val,
      },
    });
  };

  // Handlers para Medições
  const addMedicao = () => {
    onChange({
      ...data,
      medicoes: [
        ...medicoes,
        { circuitoPonto: "", medicao: "", valor: "", resultado: "Conforme" },
      ],
    });
  };

  const updateMedicao = (index: number, field: string, val: string) => {
    const next = [...medicoes];
    next[index] = { ...next[index], [field]: val };
    onChange({ ...data, medicoes: next });
  };

  const removeMedicao = (index: number) => {
    onChange({
      ...data,
      medicoes: medicoes.filter((_, idx) => idx !== index),
    });
  };

  // Handlers para Instrumentos Usados
  const toggleInstrumento = (key: string) => {
    onChange({
      ...data,
      instrumentosUsados: {
        ...instrumentos,
        [key]: !instrumentos[key],
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Abas do Formulário */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("dados")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "dados"
              ? "bg-[#E2661D] text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          1. Dados, OS & Materiais
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "checklist"
              ? "bg-[#E2661D] text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          2. Conferência do Serviço (Checklist)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("medicoes")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "medicoes"
              ? "bg-[#E2661D] text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          3. Medições & Instrumentos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("resultado")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "resultado"
              ? "bg-[#E2661D] text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          4. Pendências & Resultado
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("responsaveis")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "responsaveis"
              ? "bg-[#E2661D] text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          5. Responsabilidade Técnica (Pág. 2)
        </button>
      </div>

      {/* ABA 1: DADOS, OS & MATERIAIS */}
      {activeTab === "dados" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-4">
            <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
              1. Dados Cadastrais da Vistoria
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] font-bold text-gray-600">Identificador (VF Nº)</Label>
                <Input
                  value={data.codigoDoc || ""}
                  onChange={(e) => onChange({ ...data, codigoDoc: e.target.value })}
                  placeholder="VF2026-001"
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-gray-600">Data da Vistoria</Label>
                <Input
                  type="date"
                  value={data.dataVistoria || ""}
                  onChange={(e) => onChange({ ...data, dataVistoria: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-gray-600">Proposta / OS Vinculada</Label>
                <Input
                  value={data.propostaOs || ""}
                  onChange={(e) => onChange({ ...data, propostaOs: e.target.value })}
                  placeholder="POT-2610-005 ou OS-001"
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-gray-600">Cliente</Label>
                <Input
                  value={data.cliente || ""}
                  onChange={(e) => onChange({ ...data, cliente: e.target.value })}
                  placeholder="Nome do cliente"
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-gray-600">Telefone</Label>
                <Input
                  value={data.telefone || ""}
                  onChange={(e) => onChange({ ...data, telefone: e.target.value })}
                  placeholder="(92) 9..."
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-gray-600">Cidade/UF</Label>
                <Input
                  value={data.cidadeUf || ""}
                  onChange={(e) => onChange({ ...data, cidadeUf: e.target.value })}
                  placeholder="Manaus/AM"
                  className="text-xs mt-1"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <Label className="text-[11px] font-bold text-gray-600">Endereço do Local Vistoriado</Label>
                <Input
                  value={data.endereco || ""}
                  onChange={(e) => onChange({ ...data, endereco: e.target.value })}
                  placeholder="Rua, número, bairro..."
                  className="text-xs mt-1"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <Label className="text-[11px] font-bold text-gray-600">Serviço Realizado (Escopo)</Label>
                <Input
                  value={data.servico || ""}
                  onChange={(e) => onChange({ ...data, servico: e.target.value })}
                  placeholder="Instalações elétricas, reforma de quadro, cabeamento..."
                  className="text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* 2. Conferência da Ordem de Serviço */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
            <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
              2. Conferência da Ordem de Serviço
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-bold text-gray-600">OS Conferida Nº</Label>
                <Input
                  value={data.osConferidaNumero || ""}
                  onChange={(e) => onChange({ ...data, osConferidaNumero: e.target.value })}
                  placeholder="OS-001"
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-gray-600">Situação na OS</Label>
                <Input
                  value={data.situacaoNaOs || ""}
                  onChange={(e) => onChange({ ...data, situacaoNaOs: e.target.value })}
                  placeholder="Concluída em campo / Executada"
                  className="text-xs mt-1"
                />
              </div>
            </div>

            {/* Etapas da OS Executadas */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold text-gray-700 uppercase">
                  Etapas da OS Executadas ({etapas.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEtapa}
                  className="text-xs h-7 gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar Etapa
                </Button>
              </div>

              <div className="space-y-2">
                {etapas.map((etapa, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-gray-400 w-6 text-right">
                      {idx + 1}.
                    </span>
                    <Input
                      value={etapa}
                      onChange={(e) => updateEtapa(idx, e.target.value)}
                      placeholder="Descreva a etapa executada..."
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEtapa(idx)}
                      className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Materiais da OS */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold text-gray-700 uppercase">
                  Materiais da OS ({materiais.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMaterial}
                  className="text-xs h-7 gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar Material
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                    <tr>
                      <th className="p-2 text-left">Material</th>
                      <th className="p-2 text-left w-24">Previsto</th>
                      <th className="p-2 text-left w-24">Usado</th>
                      <th className="p-2 text-left w-44">Conferido / Obs.</th>
                      <th className="p-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {materiais.map((mat, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-1.5">
                          <Input
                            value={mat.material || ""}
                            onChange={(e) => updateMaterial(idx, "material", e.target.value)}
                            placeholder="Nome do material / componente..."
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <Input
                            value={mat.previsto || ""}
                            onChange={(e) => updateMaterial(idx, "previsto", e.target.value)}
                            placeholder="Ex: 1 un"
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <Input
                            value={mat.usado || ""}
                            onChange={(e) => updateMaterial(idx, "usado", e.target.value)}
                            placeholder="Ex: 1 un"
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <Input
                            value={mat.conferidoObs || ""}
                            onChange={(e) => updateMaterial(idx, "conferidoObs", e.target.value)}
                            placeholder="Conforme instalado"
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterial(idx)}
                            className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: CHECKLIST DE SERVIÇO (11 ITENS TRI-STATE) */}
      {activeTab === "checklist" && (
        <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider">
                3. Conferência do Serviço (11 Itens Normativos)
              </h4>
              <p className="text-[11px] text-gray-500">
                Selecione OK para aprovado, NÃO para inconformidade ou N/A para não aplicável.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CHECKLIST_ITEMS.map((item, idx) => {
              const currentVal = checklist[item] || "OK";
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between gap-2.5"
                >
                  <span className="text-xs font-semibold text-gray-800 leading-snug">
                    {idx + 1}. {item}
                  </span>

                  <div className="flex items-center gap-1.5 self-start">
                    <button
                      type="button"
                      onClick={() => setChecklistItem(item, "OK")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        currentVal === "OK"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      OK
                    </button>

                    <button
                      type="button"
                      onClick={() => setChecklistItem(item, "NÃO")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        currentVal === "NÃO"
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-700"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      NÃO
                    </button>

                    <button
                      type="button"
                      onClick={() => setChecklistItem(item, "N/A")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        currentVal === "N/A"
                          ? "bg-gray-600 text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      N/A
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 3: MEDIÇÕES & INSTRUMENTOS */}
      {activeTab === "medicoes" && (
        <div className="space-y-6">
          {/* Tabela de Medições */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider">
                  4. Medições e Testes Técnicos
                </h4>
                <p className="text-[11px] text-gray-500">
                  Tabela de grandezas elétricas aferidas com valores e resultados.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedicao}
                className="text-xs h-7 gap-1"
              >
                <Plus className="w-3 h-3" /> Adicionar Medição
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                  <tr>
                    <th className="p-2 text-left">Circuito / Ponto</th>
                    <th className="p-2 text-left">Medição</th>
                    <th className="p-2 text-left w-36">Valor</th>
                    <th className="p-2 text-left w-36">Resultado</th>
                    <th className="p-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {medicoes.map((med, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="p-1.5">
                        <Input
                          value={med.circuitoPonto || ""}
                          onChange={(e) => updateMedicao(idx, "circuitoPonto", e.target.value)}
                          placeholder="Ex: QGBT, Malha, Ponto..."
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          value={med.medicao || ""}
                          onChange={(e) => updateMedicao(idx, "medicao", e.target.value)}
                          placeholder="Ex: Tensão fase-neutro"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          value={med.valor || ""}
                          onChange={(e) => updateMedicao(idx, "valor", e.target.value)}
                          placeholder="Ex: 127 V, 4.8 Ω"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <Input
                          value={med.resultado || ""}
                          onChange={(e) => updateMedicao(idx, "resultado", e.target.value)}
                          placeholder="Conforme / Aprovado"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedicao(idx)}
                          className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instrumentos Usados */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider">
                Instrumentos Usados
              </h4>
              <p className="text-[11px] text-gray-500">
                Selecione os equipamentos de medição e teste empregados na vistoria.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {INSTRUMENTOS_PADRAO.map((inst) => {
                const isChecked = !!instrumentos[inst.key];
                return (
                  <button
                    key={inst.key}
                    type="button"
                    onClick={() => toggleInstrumento(inst.key)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      isChecked
                        ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                        isChecked
                          ? "bg-[#E2661D] border-[#E2661D] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isChecked && "✓"}
                    </div>
                    {inst.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: PENDÊNCIAS & RESULTADO */}
      {activeTab === "resultado" && (
        <div className="space-y-6">
          {/* 5. Pendências */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
            <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider">
              5. Pendências
            </h4>
            <div className="space-y-3">
              <div>
                <Label className="text-[11px] font-bold text-gray-600">O Que Falta Corrigir</Label>
                <Textarea
                  value={data.oQueFaltaCorrigir || ""}
                  onChange={(e) => onChange({ ...data, oQueFaltaCorrigir: e.target.value })}
                  placeholder="Descreva pendências caso existam, ou informe que não há pendências..."
                  rows={3}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-gray-600">Prazo para Corrigir</Label>
                <Input
                  value={data.prazoParaCorrigir || ""}
                  onChange={(e) => onChange({ ...data, prazoParaCorrigir: e.target.value })}
                  placeholder="Sem pendências / Imediato / 5 dias..."
                  className="text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* 6. Resultado da Vistoria */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
            <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider">
              6. Resultado da Vistoria
            </h4>

            <div>
              <Label className="text-[11px] font-bold text-gray-600 block mb-1.5">
                Parecer Final
              </Label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { value: "Aprovado", color: "bg-emerald-600 hover:bg-emerald-700" },
                  { value: "Aprovado com ressalvas", color: "bg-amber-500 hover:bg-amber-600" },
                  { value: "Reprovado", color: "bg-red-600 hover:bg-red-700" },
                ].map((res) => {
                  const isSelected = data.resultado === res.value;
                  return (
                    <button
                      key={res.value}
                      type="button"
                      onClick={() => onChange({ ...data, resultado: res.value })}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        isSelected
                          ? `${res.color} text-white shadow-xs`
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {res.value}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-[11px] font-bold text-gray-600">Observações Gerais</Label>
              <Textarea
                value={data.observacoes || ""}
                onChange={(e) => onChange({ ...data, observacoes: e.target.value })}
                placeholder="Observações adicionais sobre as condições da instalação, normas aplicadas..."
                rows={3}
                className="text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-[11px] font-bold text-gray-600">Localidade e Data por Extenso</Label>
              <Input
                value={data.cidadeData || ""}
                onChange={(e) => onChange({ ...data, cidadeData: e.target.value })}
                placeholder="Manaus/AM, 14 de outubro de 2026."
                className="text-xs mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* ABA 5: RESPONSABILIDADE TÉCNICA (PÁGINA 2) */}
      {activeTab === "responsaveis" && (
        <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-5">
          <div>
            <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider">
              Responsabilidade Técnica e Assinaturas (Página 2)
            </h4>
            <p className="text-[11px] text-gray-500">
              Configure os 3 signatários oficiais do documento conforme modelo do PDF.
            </p>
          </div>

          {/* Signatário 1: Peterson Froes */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
            <span className="text-[11px] font-black uppercase text-gray-700 tracking-wider block">
              1. Responsável Técnico
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-bold text-gray-600">Nome Completo</Label>
                <Input
                  value={data.responsavel1?.nome || ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      responsavel1: { ...data.responsavel1, nome: e.target.value },
                    })
                  }
                  placeholder="Peterson Froes da Silva"
                  className="text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-gray-600">Cargo / Registro Profissional</Label>
                <Input
                  value={data.responsavel1?.registro || ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      responsavel1: { ...data.responsavel1, registro: e.target.value },
                    })
                  }
                  placeholder="Responsável técnico · CREA-RNP 042008581-5"
                  className="text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Signatário 2: Rogério Guilherme */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
            <span className="text-[11px] font-black uppercase text-gray-700 tracking-wider block">
              2. Responsável Técnico / Executor
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-bold text-gray-600">Nome Completo</Label>
                <Input
                  value={data.responsavel2?.nome || ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      responsavel2: { ...data.responsavel2, nome: e.target.value },
                    })
                  }
                  placeholder="Rogério Guilherme Vieira Bentes"
                  className="text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-gray-600">Cargo / Registros Profissionais</Label>
                <Input
                  value={data.responsavel2?.registro || ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      responsavel2: { ...data.responsavel2, registro: e.target.value },
                    })
                  }
                  placeholder="Técnico Eletrotécnico | Tecnólogo em Automação Industrial · CREA: 25168 | CREA AM: 35534-AM | Reg. Nacional: 042003321"
                  className="text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Signatário 3: Cliente */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
            <span className="text-[11px] font-black uppercase text-gray-700 tracking-wider block">
              3. Cliente (Acompanhou a Vistoria)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-bold text-gray-600">Nome da Empresa / Representante</Label>
                <Input
                  value={data.clienteSignatario?.nome || ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      clienteSignatario: { ...data.clienteSignatario, nome: e.target.value },
                    })
                  }
                  placeholder="Nome do cliente / empresa"
                  className="text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-gray-600">Função / Subtítulo</Label>
                <Input
                  value={data.clienteSignatario?.subtitulo || ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      clienteSignatario: { ...data.clienteSignatario, subtitulo: e.target.value },
                    })
                  }
                  placeholder="Acompanhou a vistoria"
                  className="text-xs mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

