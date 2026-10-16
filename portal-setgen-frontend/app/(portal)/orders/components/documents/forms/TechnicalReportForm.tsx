"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  ShieldCheck,
  Activity,
  Sparkles,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Upload,
  FileCheck2,
  Wrench,
  Zap,
  MapPin,
  Layers,
  FileText,
  UserCheck,
  Award,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface TechnicalReportFormProps {
  data: Record<string, any>;
  onChange: (newData: Record<string, any>) => void;
}

export function TechnicalReportForm({ data, onChange }: TechnicalReportFormProps) {
  const [activeTab, setActiveTab] = useState<
    "identificacao" | "subsistemas" | "ensaios" | "riscos" | "conclusao" | "anexos"
  >("identificacao");

  const medicoes: Array<any> = data.medicoes || [];
  const evidencias: Array<any> = data.evidencias || [];
  const naoConformidadesList: Array<any> = data.naoConformidadesList || [];
  const recomendacoesGerais: Array<string> = data.recomendacoesGerais || [];
  const caracteristicas: Array<string> = data.caracteristicas || [];
  const captacaoItens: Array<string> = data.captacaoItens || [];
  const descidasItens: Array<string> = data.descidasItens || [];
  const aterramentoItens: Array<string> = data.aterramentoItens || [];

  // =========================================================================
  // CÁLCULO ESTATÍSTICO AUTOMÁTICO DOS RESULTADOS (SEÇÃO 12)
  // =========================================================================
  const totalOk = medicoes.filter((m) => m.status === "OK" || m.status === "Conforme").length;
  const totalNc = medicoes.filter((m) => m.status === "NC" || m.status === "Não Conforme").length;
  const totalAvaliar = medicoes.filter(
    (m) => m.status === "RESSALVA" || m.status === "AVALIAR"
  ).length;

  // =========================================================================
  // GERENCIAMENTO DE MEDIÇÕES (SEÇÃO 10)
  // =========================================================================
  const addMedicao = () => {
    const nextNum = medicoes.length + 1;
    const p1 = nextNum < 10 ? `P0${nextNum}` : `P${nextNum}`;
    const p2 = nextNum + 1 < 10 ? `P0${nextNum + 1}` : `P${nextNum + 1}`;
    onChange({
      ...data,
      medicoes: [
        ...medicoes,
        {
          ponto: `${p1} → ${p2}`,
          resistencia: "",
          condicao: "Continuidade elétrica confirmada.",
          status: "OK",
        },
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

  // =========================================================================
  // GERENCIAMENTO DE NÃO CONFORMIDADES (SEÇÃO 15)
  // =========================================================================
  const addNaoConformidade = () => {
    const nextNum = naoConformidadesList.length + 1;
    onChange({
      ...data,
      naoConformidadesList: [
        ...naoConformidadesList,
        {
          codigo: `NC-${nextNum < 10 ? "0" + nextNum : nextNum}`,
          titulo: "TÍTULO DA NÃO CONFORMIDADE",
          criticidade: "ALTA",
          local: "Ponto ou elemento avaliado",
          evidencia: "Descrição da evidência observada em campo",
          risco: "Impacto no sistema de proteção",
          recomendacao: "Ação técnica corretiva recomendada",
        },
      ],
    });
  };

  const updateNaoConformidade = (index: number, field: string, val: string) => {
    const next = [...naoConformidadesList];
    next[index] = { ...next[index], [field]: val };
    onChange({ ...data, naoConformidadesList: next });
  };

  const removeNaoConformidade = (index: number) => {
    onChange({
      ...data,
      naoConformidadesList: naoConformidadesList.filter((_, idx) => idx !== index),
    });
  };

  // =========================================================================
  // GERENCIAMENTO DE EVIDÊNCIAS FOTOGRÁFICAS (SEÇÃO 18)
  // =========================================================================
  const addEvidencia = () => {
    const nextNum = evidencias.length + 1;
    onChange({
      ...data,
      evidencias: [
        ...evidencias,
        {
          id: `foto-${Date.now()}`,
          ponto: `PONTO P${nextNum < 10 ? "0" + nextNum : nextNum}`,
          titulo: `PONTO P${nextNum < 10 ? "0" + nextNum : nextNum}`,
          descricao: "Medição de continuidade realizada no ponto.",
          fotoUrl: "",
          status: "CONFORME",
        },
      ],
    });
  };

  const updateEvidencia = (index: number, field: string, val: any) => {
    const next = [...evidencias];
    next[index] = { ...next[index], [field]: val };
    onChange({ ...data, evidencias: next });
  };

  const removeEvidencia = (index: number) => {
    onChange({
      ...data,
      evidencias: evidencias.filter((_, idx) => idx !== index),
    });
  };

  const handleImageUpload = (
    fieldTarget: "evidencia" | "croqui" | "certificado",
    indexOrEvent: any,
    eventOptional?: any
  ) => {
    const e = fieldTarget === "evidencia" ? eventOptional : indexOrEvent;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito pesada! Escolha uma imagem de até 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (fieldTarget === "evidencia") {
        updateEvidencia(indexOrEvent, "fotoUrl", result);
        toast.success("Foto da evidência anexada!");
      } else if (fieldTarget === "croqui") {
        onChange({ ...data, croquiUrl: result });
        toast.success("Croqui de localização anexado com sucesso!");
      } else if (fieldTarget === "certificado") {
        onChange({ ...data, certificadoCalibracaoUrl: result });
        toast.success("Certificado de Calibração anexado com sucesso!");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {/* NAVEGAÇÃO POR ABAS DAS 21 SEÇÕES DO MODELO OFICIAL */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-thin">
        {[
          { id: "identificacao", label: "1. Capa & Identificação (Seções 1 a 3)" },
          { id: "subsistemas", label: "2. Subsistemas SPDA (Seções 4 a 8 & 11)" },
          { id: "ensaios", label: `3. Ensaios Ôhmicos & Metodologia (${medicoes.length})` },
          { id: "riscos", label: `4. Riscos & Não Conformidades (${naoConformidadesList.length})` },
          { id: "conclusao", label: "5. Recomendações & Conclusão (Seções 16, 17 & 21)" },
          { id: "anexos", label: `6. Fotos, Croqui & Certificado (${evidencias.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-[#E2661D] text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===================================================================== */}
      {/* ABA 1: CAPA, IDENTIFICAÇÃO DO DOCUMENTO, OBJETIVO E NORMAS            */}
      {/* ===================================================================== */}
      {activeTab === "identificacao" && (
        <div className="space-y-4">
          {/* Capa */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-[#E2661D] text-white flex items-center justify-center text-[10px]">
                C
              </span>
              Dados da Capa Executiva do Relatório
            </h4>

            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Título Principal do Laudo</Label>
                <Input
                  value={data.tituloRelatorio || ""}
                  onChange={(e) => onChange({ ...data, tituloRelatorio: e.target.value })}
                  placeholder="RELATÓRIO TÉCNICO DE INSPEÇÃO DO SISTEMA DE PROTEÇÃO CONTRA DESCARGAS ATMOSFÉRICAS (SPDA)"
                  className="h-9 text-xs rounded-lg font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Subtítulo Técnico</Label>
                <Input
                  value={data.subtituloRelatorio || ""}
                  onChange={(e) => onChange({ ...data, subtituloRelatorio: e.target.value })}
                  placeholder="AVALIAÇÃO VISUAL, ENSAIOS DE CONTINUIDADE ELÉTRICA E DIAGNÓSTICO TÉCNICO"
                  className="h-9 text-xs rounded-lg text-gray-600"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Descrição Sumária da Capa</Label>
                <Textarea
                  rows={2}
                  value={data.descricaoSumaria || ""}
                  onChange={(e) => onChange({ ...data, descricaoSumaria: e.target.value })}
                  placeholder="Inspeção técnica do Sistema de Proteção contra Descargas Atmosféricas (SPDA)..."
                  className="text-xs rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Seção 1: Identificação do Documento */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              1. Identificação do Documento
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Cliente</Label>
                <Input
                  value={data.cliente || ""}
                  onChange={(e) => onChange({ ...data, cliente: e.target.value })}
                  placeholder="Nome do cliente"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Sistema Avaliado</Label>
                <Input
                  value={data.sistemaAvaliado || ""}
                  onChange={(e) => onChange({ ...data, sistemaAvaliado: e.target.value })}
                  placeholder="Sistema de Proteção contra Descargas Atmosféricas"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Local / Instalação</Label>
                <Input
                  value={data.local || ""}
                  onChange={(e) => onChange({ ...data, local: e.target.value })}
                  placeholder="Ex: Galpão industrial / Manaus-AM"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Tipo de Inspeção</Label>
                <Input
                  value={data.tipoInspecao || ""}
                  onChange={(e) => onChange({ ...data, tipoInspecao: e.target.value })}
                  placeholder="Inspeção técnica do SPDA existente"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Data da Inspeção</Label>
                <Input
                  type="date"
                  value={data.dataInspecao || ""}
                  onChange={(e) => onChange({ ...data, dataInspecao: e.target.value })}
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Data de Emissão do Laudo</Label>
                <Input
                  type="date"
                  value={data.dataEmissao || ""}
                  onChange={(e) => onChange({ ...data, dataEmissao: e.target.value })}
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Objetivo da Inspeção */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              2. Objetivo da Inspeção
            </h4>
            <Textarea
              rows={3}
              value={data.objetivoInspecao || ""}
              onChange={(e) => onChange({ ...data, objetivoInspecao: e.target.value })}
              placeholder="Descreva o objetivo técnico detalhado da inspeção..."
              className="text-xs rounded-lg"
            />
          </div>

          {/* Seção 3: Referências Normativas */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-amber-600 text-white flex items-center justify-center text-[10px]">
                3
              </span>
              3. Referências Normativas (ABNT & NRs)
            </h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white font-bold text-[11px]">
                  <tr>
                    <th className="p-2 w-1/4">Norma</th>
                    <th className="p-2">Aplicação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.referenciasNormativas || []).map((ref: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 font-bold font-mono text-gray-900">{ref.norma}</td>
                      <td className="p-2 text-gray-700">{ref.aplicacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: SUBSISTEMAS DO SPDA (SEÇÕES 4 A 8 & 11)                         */}
      {/* ===================================================================== */}
      {activeTab === "subsistemas" && (
        <div className="space-y-4">
          {/* Seção 4: Caracterização do Sistema */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                4
              </span>
              4. Caracterização do Sistema SPDA Existente
            </h4>
            <Textarea
              rows={2}
              value={data.caracterizacaoTexto || ""}
              onChange={(e) => onChange({ ...data, caracterizacaoTexto: e.target.value })}
              className="text-xs rounded-lg"
            />
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-600">
                Características Construtivas (uma por linha):
              </Label>
              <Textarea
                rows={4}
                value={caracteristicas.join("\n")}
                onChange={(e) =>
                  onChange({
                    ...data,
                    caracteristicas: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                  })
                }
                className="text-xs rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Seção 5: Avaliação do Sistema de Captação Superior */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                5
              </span>
              5. Avaliação do Sistema de Captação Superior
            </h4>
            <Textarea
              rows={2}
              value={data.captacaoSuperiorTexto || ""}
              onChange={(e) => onChange({ ...data, captacaoSuperiorTexto: e.target.value })}
              className="text-xs rounded-lg"
            />
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-600">
                Condições Observadas na Captação (uma por linha):
              </Label>
              <Textarea
                rows={3}
                value={captacaoItens.join("\n")}
                onChange={(e) =>
                  onChange({
                    ...data,
                    captacaoItens: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                  })
                }
                className="text-xs rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Seção 6: Cobertura Metálica como Captor Natural */}
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/20 space-y-2.5">
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-amber-600 text-white flex items-center justify-center text-[10px]">
                6
              </span>
              6. Cobertura Metálica como Elemento Natural de Captação
            </h4>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-amber-900">Alerta Técnico Normativo:</Label>
              <Textarea
                rows={2}
                value={data.coberturaNaturalAlerta || ""}
                onChange={(e) => onChange({ ...data, coberturaNaturalAlerta: e.target.value })}
                className="text-xs rounded-lg bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-amber-900">Itens Obrigatórios para Confirmação:</Label>
              <Textarea
                rows={3}
                value={(data.coberturaNaturalItens || []).join("\n")}
                onChange={(e) =>
                  onChange({
                    ...data,
                    coberturaNaturalItens: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                  })
                }
                className="text-xs rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          {/* Seção 7: Sistema de Descidas */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                7
              </span>
              7. Sistema de Descidas
            </h4>
            <Textarea
              rows={2}
              value={data.descidasTexto || ""}
              onChange={(e) => onChange({ ...data, descidasTexto: e.target.value })}
              className="text-xs rounded-lg"
            />
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-600">Condições das Descidas (uma por linha):</Label>
              <Textarea
                rows={3}
                value={descidasItens.join("\n")}
                onChange={(e) =>
                  onChange({
                    ...data,
                    descidasItens: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                  })
                }
                className="text-xs rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Seção 8: Sistema de Aterramento e Malha Inferior */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                8
              </span>
              8. Sistema de Aterramento e Malha Inferior
            </h4>
            <Textarea
              rows={2}
              value={data.aterramentoTexto || ""}
              onChange={(e) => onChange({ ...data, aterramentoTexto: e.target.value })}
              className="text-xs rounded-lg"
            />
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-600">
                Condições Construtivas Encontradas (uma por linha):
              </Label>
              <Textarea
                rows={3}
                value={aterramentoItens.join("\n")}
                onChange={(e) =>
                  onChange({
                    ...data,
                    aterramentoItens: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                  })
                }
                className="text-xs rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Seção 11: Avaliação das Estruturas Auxiliares */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-purple-600 text-white flex items-center justify-center text-[10px]">
                11
              </span>
              11. Avaliação das Estruturas Auxiliares (Reservatórios, Caixas D'Água)
            </h4>
            {((data.estruturasAuxiliares as Array<any>) || []).map((est, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-gray-600">Elemento:</Label>
                    <Input
                      value={est.elemento || ""}
                      onChange={(e) => {
                        const next = [...(data.estruturasAuxiliares || [])];
                        next[idx].elemento = e.target.value;
                        onChange({ ...data, estruturasAuxiliares: next });
                      }}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-gray-600">Ensaio:</Label>
                    <Input
                      value={est.ensaio || ""}
                      onChange={(e) => {
                        const next = [...(data.estruturasAuxiliares || [])];
                        next[idx].ensaio = e.target.value;
                        onChange({ ...data, estruturasAuxiliares: next });
                      }}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-gray-600">Resultado Medido:</Label>
                    <Input
                      value={est.resultado || ""}
                      onChange={(e) => {
                        const next = [...(data.estruturasAuxiliares || [])];
                        next[idx].resultado = e.target.value;
                        onChange({ ...data, estruturasAuxiliares: next });
                      }}
                      className="h-8 text-xs bg-white font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-gray-600">Parecer Técnico:</Label>
                  <Textarea
                    rows={2}
                    value={est.parecer || ""}
                    onChange={(e) => {
                      const next = [...(data.estruturasAuxiliares || [])];
                      next[idx].parecer = e.target.value;
                      onChange({ ...data, estruturasAuxiliares: next });
                    }}
                    className="text-xs bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 3: METODOLOGIA & ENSAIOS ÔHMICOS (SEÇÕES 9, 10 & 12)               */}
      {/* ===================================================================== */}
      {activeTab === "ensaios" && (
        <div className="space-y-4">
          {/* Seção 9: Metodologia dos Ensaios */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">
                9
              </span>
              9. Metodologia dos Ensaios & Instrumento
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Equipamento Utilizado</Label>
                <Input
                  value={data.instrumentoNome || ""}
                  onChange={(e) => onChange({ ...data, instrumentoNome: e.target.value })}
                  placeholder="Ex: Miliohmímetro"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Escala Utilizada</Label>
                <Input
                  value={data.escalaUtilizada || ""}
                  onChange={(e) => onChange({ ...data, escalaUtilizada: e.target.value })}
                  placeholder="Ex: 200 mΩ"
                  className="h-9 text-xs rounded-lg font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Validade da Calibração</Label>
                <Input
                  value={data.calibracaoValidade || ""}
                  onChange={(e) => onChange({ ...data, calibracaoValidade: e.target.value })}
                  placeholder="Ex: Válida (Certificado RBC)"
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Método de Ensaio</Label>
                <Textarea
                  rows={2}
                  value={data.metodoEnsaio || ""}
                  onChange={(e) => onChange({ ...data, metodoEnsaio: e.target.value })}
                  className="text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Objetivo do Ensaio</Label>
                <Textarea
                  rows={2}
                  value={data.objetivoEnsaio || ""}
                  onChange={(e) => onChange({ ...data, objetivoEnsaio: e.target.value })}
                  className="text-xs rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Seção 12: Resumo Estatístico em Tempo Real */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-center space-y-0.5">
              <span className="text-2xl font-black text-emerald-800 font-mono">
                {totalOk < 10 ? "0" + totalOk : totalOk}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 block">
                Continuidade Confirmada
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-red-300 bg-red-50 text-center space-y-0.5">
              <span className="text-2xl font-black text-red-800 font-mono">
                {totalNc < 10 ? "0" + totalNc : totalNc}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-red-950 block">
                Circuito Aberto (NC)
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-center space-y-0.5">
              <span className="text-2xl font-black text-amber-800 font-mono">
                {totalAvaliar < 10 ? "0" + totalAvaliar : totalAvaliar}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block">
                A Investigar / Ressalva
              </span>
            </div>
          </div>

          {/* Seção 10: Tabela Oficial de Medições */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                    10
                  </span>
                  10. Resultados dos Ensaios de Continuidade Elétrica ({medicoes.length} Pontos)
                </h4>
                <span className="text-[11px] text-gray-500">
                  Preencha os pontos, resultado ôhmico, condição física encontrada e status
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedicao}
                className="h-8 text-xs font-bold text-[#E2661D] border-[#E2661D]/40 hover:bg-orange-50 gap-1 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Ponto
              </Button>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {medicoes.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      ITEM #{idx + 1 < 10 ? "0" + (idx + 1) : idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMedicao(idx)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded"
                      title="Excluir medição"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-600">Pontos Avaliados:</Label>
                      <Input
                        value={m.ponto || ""}
                        onChange={(e) => updateMedicao(idx, "ponto", e.target.value)}
                        placeholder="Ex: P01 → P02"
                        className="h-8 text-xs rounded-lg font-bold bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-600">Resultado Obtido:</Label>
                      <Input
                        value={m.resistencia || ""}
                        onChange={(e) => updateMedicao(idx, "resistencia", e.target.value)}
                        placeholder="Ex: 17,0 mΩ ou ∞ (aberto)"
                        className="h-8 text-xs rounded-lg font-mono font-bold bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[10px] font-bold text-gray-600">Status do Ponto:</Label>
                      <div className="flex items-center gap-1">
                        {(["OK", "NC", "RESSALVA", "AVALIAR"] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => updateMedicao(idx, "status", st)}
                            className={`flex-1 py-1.5 text-[10px] font-black rounded-lg border transition-all ${
                              m.status === st
                                ? st === "OK"
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : st === "NC"
                                  ? "bg-red-600 text-white border-red-600 shadow-2xs"
                                  : st === "RESSALVA"
                                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                  : "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-gray-600">
                      Condição Encontrada (Descrição Física do Ponto):
                    </Label>
                    <Input
                      value={m.condicao || ""}
                      onChange={(e) => updateMedicao(idx, "condicao", e.target.value)}
                      placeholder="Ex: Continuidade confirmada. Caixa de inspeção sem tampa e com presença de água."
                      className="h-8 text-xs rounded-lg bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 4: RISCOS & NÃO CONFORMIDADES (SEÇÕES 13, 14 & 15)                 */}
      {/* ===================================================================== */}
      {activeTab === "riscos" && (
        <div className="space-y-4">
          {/* Seção 15: Registro das Não Conformidades */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-red-600 text-white flex items-center justify-center text-[10px]">
                    15
                  </span>
                  15. Registro das Não Conformidades ({naoConformidadesList.length} Itens)
                </h4>
                <span className="text-[11px] text-gray-500">
                  Cadastre cada não conformidade com código, criticidade, local, evidência e recomendação
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNaoConformidade}
                className="h-8 text-xs font-bold text-red-600 border-red-300 hover:bg-red-50 gap-1 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar NC
              </Button>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {naoConformidadesList.map((nc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={nc.codigo || `NC-0${idx + 1}`}
                        onChange={(e) => updateNaoConformidade(idx, "codigo", e.target.value)}
                        className="h-7 w-20 text-xs font-mono font-bold bg-white text-red-600"
                      />
                      <Input
                        value={nc.titulo || ""}
                        onChange={(e) => updateNaoConformidade(idx, "titulo", e.target.value)}
                        placeholder="TÍTULO DA NÃO CONFORMIDADE"
                        className="h-7 text-xs font-bold bg-white flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {(["ALTA", "MÉDIA", "BAIXA"] as const).map((crit) => (
                        <button
                          key={crit}
                          type="button"
                          onClick={() => updateNaoConformidade(idx, "criticidade", crit)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                            nc.criticidade === crit
                              ? crit === "ALTA"
                                ? "bg-red-600 text-white border-red-600 shadow-2xs"
                                : crit === "MÉDIA"
                                ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                : "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {crit}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => removeNaoConformidade(idx)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-600">Local:</Label>
                      <Input
                        value={nc.local || ""}
                        onChange={(e) => updateNaoConformidade(idx, "local", e.target.value)}
                        placeholder="Ex: Pontos P01-P02 / Cobertura metálica"
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-600">Evidência:</Label>
                      <Input
                        value={nc.evidencia || ""}
                        onChange={(e) => updateNaoConformidade(idx, "evidencia", e.target.value)}
                        placeholder="Ex: Ensaios apresentaram circuito aberto."
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-600">Risco Associado:</Label>
                      <Input
                        value={nc.risco || ""}
                        onChange={(e) => updateNaoConformidade(idx, "risco", e.target.value)}
                        placeholder="Ex: Possível interrupção da corrente de descarga."
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-600">Recomendação:</Label>
                      <Input
                        value={nc.recomendacao || ""}
                        onChange={(e) => updateNaoConformidade(idx, "recomendacao", e.target.value)}
                        placeholder="Ex: Realizar recomposição dos condutores e novo ensaio."
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 5: RECOMENDAÇÕES & CONCLUSÃO (SEÇÕES 16, 17 & 21)                 */}
      {/* ===================================================================== */}
      {activeTab === "conclusao" && (
        <div className="space-y-4">
          {/* Seção 16: Recomendações Gerais */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                16
              </span>
              16. Recomendações Gerais de Engenharia (Uma por linha)
            </h4>
            <Textarea
              rows={5}
              value={recomendacoesGerais.join("\n")}
              onChange={(e) =>
                onChange({
                  ...data,
                  recomendacoesGerais: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                })
              }
              placeholder="1. Realizar correção dos trechos sem continuidade..."
              className="text-xs rounded-lg font-mono"
            />
          </div>

          {/* Seção 17: Conclusão Técnica */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">
                17
              </span>
              17. Conclusão Técnica e Parecer Pericial
            </h4>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Classificação Final do Sistema:</Label>
              <select
                value={data.classificacaoFinal || "NECESSITA ADEQUAÇÃO"}
                onChange={(e) => onChange({ ...data, classificacaoFinal: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-xs font-black bg-white"
              >
                <option value="CONFORME">CONFORME (Aprovado Plenamente)</option>
                <option value="NECESSITA ADEQUAÇÃO">NECESSITA ADEQUAÇÃO (Aprovado com Ressalvas / Ações)</option>
                <option value="NÃO CONFORME">NÃO CONFORME (Reprovado - Risco Crítico)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Parecer Técnico Detalhado:</Label>
              <Textarea
                rows={4}
                value={data.conclusaoTexto || ""}
                onChange={(e) => onChange({ ...data, conclusaoTexto: e.target.value })}
                placeholder="Parecer formal do engenheiro responsável..."
                className="text-xs rounded-lg"
              />
            </div>
          </div>

          {/* Seção 21: Responsabilidade Técnica & Assinaturas */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-[#E2661D] text-white flex items-center justify-center text-[10px]">
                21
              </span>
              21. Responsabilidade Técnica & Signatários Oficiais
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Comarca / Local</Label>
                <Input
                  value={data.comarcaLocal || "Manaus/AM"}
                  onChange={(e) => onChange({ ...data, comarcaLocal: e.target.value })}
                  placeholder="Manaus/AM"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Data da Assinatura</Label>
                <Input
                  type="date"
                  value={data.comarcaData || ""}
                  onChange={(e) => onChange({ ...data, comarcaData: e.target.value })}
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              {/* Responsável 1 */}
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                <span className="text-[11px] font-bold text-[#E2661D] uppercase block">
                  Responsável Técnico 1 (Engenheiro)
                </span>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-600 font-bold">Nome Completo:</Label>
                  <Input
                    value={data.responsavelTecnico || ""}
                    onChange={(e) => onChange({ ...data, responsavelTecnico: e.target.value })}
                    placeholder="Nome do Engenheiro"
                    className="h-8 text-xs bg-white font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-600 font-bold">Especialidade / Cargo:</Label>
                  <Input
                    value={data.responsavelTitulo || ""}
                    onChange={(e) => onChange({ ...data, responsavelTitulo: e.target.value })}
                    placeholder="Esp.Eng. Elétrica | Automação"
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-600 font-bold">Registro (CREA / CFT):</Label>
                  <Input
                    value={data.responsavelRegistro || ""}
                    onChange={(e) => onChange({ ...data, responsavelRegistro: e.target.value })}
                    placeholder="CREA-RNP: 042008581-5"
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
              </div>

              {/* Responsável 2 */}
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                <span className="text-[11px] font-bold text-[#E2661D] uppercase block">
                  Responsável Técnico 2 (Executor)
                </span>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-600 font-bold">Nome Completo:</Label>
                  <Input
                    value={data.responsavel2Nome || ""}
                    onChange={(e) => onChange({ ...data, responsavel2Nome: e.target.value })}
                    placeholder="Nome do Técnico Executor"
                    className="h-8 text-xs bg-white font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-600 font-bold">Especialidade / Cargo:</Label>
                  <Input
                    value={data.responsavel2Titulo || ""}
                    onChange={(e) => onChange({ ...data, responsavel2Titulo: e.target.value })}
                    placeholder="Técnico Eletrotécnico | Automação"
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-600 font-bold">Registro (CREA / CFT):</Label>
                  <Input
                    value={data.responsavel2Registro || ""}
                    onChange={(e) => onChange({ ...data, responsavel2Registro: e.target.value })}
                    placeholder="CREA: 25168 | Reg. 042003321"
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 6: EVIDÊNCIAS FOTOGRÁFICAS, CROQUI & CERTIFICADO (SEÇÕES 18, 19, 20) */}
      {/* ===================================================================== */}
      {activeTab === "anexos" && (
        <div className="space-y-4">
          {/* Seção 18: Registro Fotográfico das Medições */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                    18
                  </span>
                  18. Registro Fotográfico das Medições ({evidencias.length} Fotos)
                </h4>
                <span className="text-[11px] text-gray-500">
                  Fotos com correlação direta aos pontos de ensaio da Seção 10
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEvidencia}
                className="h-8 text-xs font-bold text-[#E2661D] border-[#E2661D]/40 hover:bg-orange-50 gap-1 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Foto
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
              {evidencias.map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <Input
                      value={ev.ponto || `PONTO P${idx + 1 < 10 ? "0" + (idx + 1) : idx + 1}`}
                      onChange={(e) => updateEvidencia(idx, "ponto", e.target.value)}
                      className="h-7 w-32 text-xs font-mono font-bold bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeEvidencia(idx)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Foto Upload & Preview */}
                  <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center relative group">
                    {ev.fotoUrl ? (
                      <>
                        <img
                          src={ev.fotoUrl}
                          alt={ev.ponto}
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-xs font-bold gap-1">
                          <Upload className="w-4 h-4" />
                          Trocar Foto
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload("evidencia", idx, e)}
                            className="hidden"
                          />
                        </label>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs font-bold text-gray-700">Anexar Foto do Ponto</span>
                        <span className="text-[10px] text-gray-400">Display do instrumento ou ponto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload("evidencia", idx, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-gray-600">Legenda da Foto:</Label>
                    <Input
                      value={ev.descricao || ""}
                      onChange={(e) => updateEvidencia(idx, "descricao", e.target.value)}
                      placeholder="Ex: Medição no ponto P02. Resultado: 17,0 mΩ."
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 19 & 20: Croqui de Localização e Certificado de Calibração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Croqui */}
            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-purple-600 text-white flex items-center justify-center text-[10px]">
                  19
                </span>
                19. Croqui de Localização dos Pontos
              </h4>

              <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center relative group">
                {data.croquiUrl ? (
                  <>
                    <img
                      src={data.croquiUrl}
                      alt="Croqui de Localização"
                      className="w-full h-full object-contain"
                    />
                    <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-xs font-bold gap-1">
                      <Upload className="w-4 h-4" />
                      Trocar Croqui
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload("croqui", e)}
                        className="hidden"
                      />
                    </label>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                    <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs font-bold text-gray-700">Anexar Imagem do Croqui</span>
                    <span className="text-[10px] text-gray-400">Planta baixa com pontos P01 a Pn</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload("croqui", e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-600">Observações do Croqui:</Label>
                <Input
                  value={data.croquiObservacoes || ""}
                  onChange={(e) => onChange({ ...data, croquiObservacoes: e.target.value })}
                  placeholder="Pontos identificados conforme relatório técnico..."
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* Certificado de Calibração */}
            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  20
                </span>
                20. Certificado de Calibração do Instrumento
              </h4>

              <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center relative group">
                {data.certificadoCalibracaoUrl ? (
                  <>
                    <img
                      src={data.certificadoCalibracaoUrl}
                      alt="Certificado de Calibração"
                      className="w-full h-full object-contain"
                    />
                    <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-xs font-bold gap-1">
                      <Upload className="w-4 h-4" />
                      Trocar Certificado
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload("certificado", e)}
                        className="hidden"
                      />
                    </label>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                    <FileCheck2 className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs font-bold text-gray-700">Anexar Certificado RBC</span>
                    <span className="text-[10px] text-gray-400">Digitalização do certificado do instrumento</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload("certificado", e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
