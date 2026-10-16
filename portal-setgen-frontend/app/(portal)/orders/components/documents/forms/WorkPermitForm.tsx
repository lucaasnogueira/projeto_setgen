"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Plus,
  Trash2,
  Users,
  ShieldAlert,
  Clock,
  FileText,
  UserCheck,
  Sparkles,
  RefreshCw,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

interface WorkPermitFormProps {
  data: Record<string, any>;
  onChange: (newData: Record<string, any>) => void;
  availableAprs?: any[];
  currentOrder?: any;
  currentClient?: any;
}

const TIPOS_TRABALHO = [
  "Elétrico — baixa tensão",
  "Elétrico — média tensão (SEP)",
  "Em altura",
  "A quente / inflamáveis",
  "Espaço confinado",
  "Içamento de cargas",
];

const ITENS_LIBERACAO = [
  "APR elaborada e lida com toda a equipe",
  "Equipe treinada e autorizada para a atividade",
  "EPIs inspecionados e em uso",
  "Área isolada e sinalizada",
  "Condições climáticas adequadas (sem chuva forte ou raios)",
  "Responsável do local ciente do serviço",
  "Desligamento confirmado com a concessionária (protocolo)",
  "Seccionamento visível (chaves / disjuntor abertos)",
  "Bloqueio e etiquetagem aplicados",
  "Ausência de tensão testada com detector de MT",
  "Aterramento temporário instalado",
  "Gerador / outras fontes impedidos de energizar (modo manual)",
  "Circuito desenergizado e seccionado",
  "Bloqueio e etiquetagem aplicados (cadeado e etiqueta)",
  "Ausência de tensão testada com instrumento aferido",
];

const ITENS_ENCERRAMENTO = [
  "Serviço concluído",
  "Ferramentas e materiais retirados",
  "Bloqueios e aterramentos temporários retirados",
  "Equipe fora da área de risco",
  "Instalação liberada / reenergizada",
  "Responsável do local comunicado",
];

export function WorkPermitForm({
  data,
  onChange,
  availableAprs = [],
  currentOrder,
  currentClient,
}: WorkPermitFormProps) {
  const [activeTab, setActiveTab] = useState<"dados" | "condicoes" | "equipe" | "encerramento">("dados");
  const [manualAprInput, setManualAprInput] = useState(false);

  const tipos: string[] = data.tipoTrabalho || [];
  const condicoes: Record<string, string> = data.condicoesLiberacao || {};
  const encerramento = data.encerramento || {};
  const condicoesEncerramento: Record<string, string> = encerramento.condicoes || {};
  const equipe: Array<{ nome: string; funcao: string }> = data.equipeAutorizada || [
    { nome: "", funcao: "" },
  ];

  // Sincronização inteligente dos dados do Cliente e da OS
  const handleSyncClientOrder = () => {
    const clientName = currentClient?.companyName || currentClient?.tradeName || data.cliente || "";
    const clientPhone = currentClient?.phone || currentOrder?.client?.phone || data.telefone || "";
    const addr = currentClient?.address || currentOrder?.client?.address;
    const clientLocal =
      addr?.neighborhood ||
      addr?.street ||
      (addr ? [addr.street, addr.number].filter(Boolean).join(", ") : data.local || "");
    const clientCityState =
      addr?.city && addr?.state ? `${addr.city}/${addr.state}` : addr?.city || addr?.state || data.cidadeUf || "";
    const scope = currentOrder?.scope || data.servico || "";
    const orderNumStr = currentOrder?.orderNumber
      ? currentOrder.orderNumber.startsWith("OS")
        ? currentOrder.orderNumber
        : `OS${currentOrder.orderNumber}`
      : data.ordemServico || "";

    onChange({
      ...data,
      cliente: clientName,
      telefone: clientPhone,
      local: clientLocal,
      cidadeUf: clientCityState,
      servico: scope,
      ordemServico: orderNumStr,
      atividadeAutorizada: data.atividadeAutorizada || scope,
      emitente1Nome: data.emitente1Nome || currentOrder?.assignedTo?.name || "",
      responsavelExecucaoNome: data.responsavelExecucaoNome || clientName,
    });
    toast.success("Dados do Cliente e da OS sincronizados com sucesso!");
  };

  // Seleção e extração inteligente da APR
  const handleSelectApr = (aprCode: string) => {
    if (aprCode === "__manual__") {
      setManualAprInput(true);
      return;
    }

    const selectedApr = (availableAprs || []).find((a) => a.code === aprCode);
    if (!selectedApr) {
      onChange({ ...data, aprVinculada: aprCode });
      return;
    }

    const aprData = selectedApr.data || {};
    const nextData: Record<string, any> = {
      ...data,
      aprVinculada: selectedApr.code,
    };

    // Aproveitamento inteligente de campos da APR
    if (aprData.descricaoTarefa && (!data.atividadeAutorizada || data.atividadeAutorizada === data.servico)) {
      nextData.atividadeAutorizada = aprData.descricaoTarefa;
    }
    if (aprData.equipamento && !data.equipamento) {
      nextData.equipamento = aprData.equipamento;
    }
    if (aprData.local && !data.local) {
      nextData.local = aprData.local;
    }
    if (aprData.riscos && Array.isArray(aprData.riscos) && aprData.riscos.length > 0 && !data.riscosAdicionais) {
      nextData.riscosAdicionais = aprData.riscos.map((r: any) => r.perigo).slice(0, 2).join("; ");
    }
    if (aprData.equipe && Array.isArray(aprData.equipe) && aprData.equipe.length > 0) {
      nextData.equipeAutorizada = aprData.equipe;
    }
    if (aprData.responsavelTecnico && !data.emitente1Nome) {
      nextData.emitente1Nome = aprData.responsavelTecnico;
    }
    if (aprData.registroProfissional && !data.emitente1Registro) {
      nextData.emitente1Registro = aprData.registroProfissional;
    }

    onChange(nextData);
    toast.success(`APR #${selectedApr.code} vinculada! Dados importados com sucesso.`);
  };

  const toggleTipo = (item: string) => {
    const next = tipos.includes(item)
      ? tipos.filter((t) => t !== item)
      : [...tipos, item];
    onChange({ ...data, tipoTrabalho: next });
  };

  const setCondicao = (item: string, status: "OK" | "NÃO" | "N/A") => {
    onChange({
      ...data,
      condicoesLiberacao: {
        ...condicoes,
        [item]: status,
      },
    });
  };

  const markAllOkLiberacao = () => {
    const all: Record<string, string> = {};
    ITENS_LIBERACAO.forEach((item) => {
      all[item] = "OK";
    });
    onChange({
      ...data,
      condicoesLiberacao: all,
    });
  };

  const setCondicaoEncerramento = (item: string, status: "OK" | "NÃO" | "N/A") => {
    onChange({
      ...data,
      encerramento: {
        ...encerramento,
        condicoes: {
          ...condicoesEncerramento,
          [item]: status,
        },
      },
    });
  };

  const markAllOkEncerramento = () => {
    const all: Record<string, string> = {};
    ITENS_ENCERRAMENTO.forEach((item) => {
      all[item] = "OK";
    });
    onChange({
      ...data,
      encerramento: {
        ...encerramento,
        condicoes: all,
      },
    });
  };

  const handleEquipeChange = (index: number, field: "nome" | "funcao", val: string) => {
    const updated = [...equipe];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ ...data, equipeAutorizada: updated });
  };

  const addEquipeRow = () => {
    onChange({
      ...data,
      equipeAutorizada: [...equipe, { nome: "", funcao: "" }],
    });
  };

  const removeEquipeRow = (index: number) => {
    const updated = equipe.filter((_, i) => i !== index);
    onChange({ ...data, equipeAutorizada: updated });
  };

  return (
    <div className="space-y-4">
      {/* Abas de Navegação Interna */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("dados")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "dados"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          1. Dados, Validade & Tipo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("condicoes")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "condicoes"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          2. Condições para Liberação ({ITENS_LIBERACAO.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("equipe")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "equipe"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          3. Equipe Autorizada ({equipe.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("encerramento")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "encerramento"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          4. Encerramento & Signatários
        </button>
      </div>

      {/* =================================================================== */}
      {/* ABA 1: DADOS DO TRABALHO, VALIDADE & TIPO DE TRABALHO              */}
      {/* =================================================================== */}
      {activeTab === "dados" && (
        <div className="space-y-4">
          {/* 1. DADOS DO TRABALHO */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                Dados do Trabalho
              </h4>

              {/* Botão de Aproveitamento / Sincronização dos Dados Cadastrais */}
              {(currentOrder || currentClient) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncClientOrder}
                  className="h-7 text-[11px] font-bold text-[#E2661D] border-orange-200 bg-orange-50 hover:bg-orange-100 gap-1 rounded-lg self-start sm:self-auto"
                  title="Atualizar campos automaticamente com dados cadastrais do cliente e da OS vinculada"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sincronizar Dados do Cliente & OS
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Cliente</Label>
                <Input
                  value={data.cliente || ""}
                  onChange={(e) => onChange({ ...data, cliente: e.target.value })}
                  placeholder="Nome do cliente"
                  className="h-9 text-xs rounded-lg bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Telefone</Label>
                <Input
                  value={data.telefone || ""}
                  onChange={(e) => onChange({ ...data, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-9 text-xs rounded-lg bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Local da Obra / Unidade</Label>
                <Input
                  value={data.local || ""}
                  onChange={(e) => onChange({ ...data, local: e.target.value })}
                  placeholder="Ex: Subestação 13.8kV / Galpão 02"
                  className="h-9 text-xs rounded-lg bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Cidade / UF</Label>
                <Input
                  value={data.cidadeUf || ""}
                  onChange={(e) => onChange({ ...data, cidadeUf: e.target.value })}
                  placeholder="Ex: Manaus/AM"
                  className="h-9 text-xs rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Serviço</Label>
                <Input
                  value={data.servico || ""}
                  onChange={(e) => onChange({ ...data, servico: e.target.value })}
                  placeholder="Ex: Manutenção Preventiva em Cabine Primária"
                  className="h-9 text-xs rounded-lg bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">OS nº</Label>
                <Input
                  value={data.ordemServico || ""}
                  onChange={(e) => onChange({ ...data, ordemServico: e.target.value })}
                  placeholder="Ex: OS2026-001"
                  className="h-9 text-xs font-mono font-bold rounded-lg bg-white"
                />
              </div>

              {/* CAMPO DE SELEÇÃO / EXTRAÇÃO INTELIGENTE DA APR VINCULADA */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-[#E2661D]" />
                    APR nº Vinculada
                  </Label>
                  {availableAprs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setManualAprInput(!manualAprInput)}
                      className="text-[10px] text-gray-500 hover:text-[#E2661D] underline"
                    >
                      {manualAprInput ? "Selecionar da lista" : "Digitar código manual"}
                    </button>
                  )}
                </div>

                {availableAprs.length > 0 && !manualAprInput ? (
                  <select
                    value={data.aprVinculada || ""}
                    onChange={(e) => handleSelectApr(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-300 text-xs bg-white font-mono font-bold text-[#E2661D] focus:ring-2 focus:ring-[#E2661D] outline-none"
                  >
                    <option value="">— Selecione uma APR vinculada —</option>
                    {availableAprs.map((apr) => (
                      <option key={apr.id} value={apr.code}>
                        #{apr.code} — {apr.title || "APR"} {apr.serviceOrder?.orderNumber ? `(OS #${apr.serviceOrder.orderNumber})` : ""}
                      </option>
                    ))}
                    <option value="__manual__">✏️ Digitar outro código...</option>
                  </select>
                ) : (
                  <Input
                    value={data.aprVinculada || ""}
                    onChange={(e) => onChange({ ...data, aprVinculada: e.target.value })}
                    placeholder="Ex: AP2026-001"
                    className="h-9 text-xs font-mono font-bold rounded-lg bg-white text-[#E2661D]"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Equipamento / Instalação Alvo</Label>
              <Input
                value={data.equipamento || ""}
                onChange={(e) => onChange({ ...data, equipamento: e.target.value })}
                placeholder="Ex: Transformador a óleo 750kVA, Chave Seccionadora Tripolar, Painel QGBT"
                className="h-9 text-xs rounded-lg bg-white"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-gray-700">
                  Atividade Autorizada (Escopo Detalhado da Intervenção)
                </Label>
                {data.aprVinculada && (
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Vinculada à APR #{data.aprVinculada}
                  </span>
                )}
              </div>
              <Textarea
                rows={2}
                value={data.atividadeAutorizada || ""}
                onChange={(e) => onChange({ ...data, atividadeAutorizada: e.target.value })}
                placeholder="Descreva as tarefas e procedimentos permitidos nesta permissão..."
                className="text-xs rounded-lg bg-white"
              />
            </div>
          </div>

          {/* 2. VALIDADE & 3. TIPO DE TRABALHO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Box 2: Validade */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                Validade da Permissão
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-gray-700">Data</Label>
                  <Input
                    type="date"
                    value={data.dataValidade || ""}
                    onChange={(e) => onChange({ ...data, dataValidade: e.target.value })}
                    className="h-9 text-xs rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-gray-700">Das (Início)</Label>
                  <Input
                    type="time"
                    value={data.horaInicio || "08:00"}
                    onChange={(e) => onChange({ ...data, horaInicio: e.target.value })}
                    className="h-9 text-xs rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-gray-700">Até (Término)</Label>
                  <Input
                    type="time"
                    value={data.horaFim || "18:00"}
                    onChange={(e) => onChange({ ...data, horaFim: e.target.value })}
                    className="h-9 text-xs rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Box 3: Tipo de Trabalho */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
                Tipo de Trabalho
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {TIPOS_TRABALHO.map((t) => {
                  const checked = tipos.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTipo(t)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                        checked
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 ${
                          checked ? "bg-emerald-600 text-white" : "border border-gray-300"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="truncate">{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 2: CONDIÇÕES PARA LIBERAÇÃO (15 ITENS)                         */}
      {/* =================================================================== */}
      {activeTab === "condicoes" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
                Condições Obrigatórias para Liberação (15 Itens Oficiais)
              </h4>
              <span className="text-[11px] text-gray-500">
                Selecione OK, NÃO ou N/A para cada requisito antes de autorizar a intervenção
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markAllOkLiberacao}
              className="h-8 text-xs font-bold text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 gap-1.5 rounded-lg"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Marcar Todos como OK
            </Button>
          </div>

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto bg-white">
            {ITENS_LIBERACAO.map((item, idx) => {
              const currentVal = condicoes[item] || "OK";
              return (
                <div
                  key={idx}
                  className="p-2.5 sm:px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/70"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-gray-400 w-5">
                      #{idx + 1 < 10 ? "0" + (idx + 1) : idx + 1}
                    </span>
                    <span className="text-xs text-gray-800 font-medium">{item}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                    {(["OK", "NÃO", "N/A"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setCondicao(item, status)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          currentVal === status
                            ? status === "OK"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                              : status === "NÃO"
                              ? "bg-red-600 text-white border-red-600 shadow-2xs"
                              : "bg-gray-600 text-white border-gray-600 shadow-2xs"
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-1 pt-2">
            <Label className="text-xs font-bold text-gray-700">
              Riscos Adicionais / Medidas Preventivas Específicas
            </Label>
            <Input
              value={data.riscosAdicionais || ""}
              onChange={(e) => onChange({ ...data, riscosAdicionais: e.target.value })}
              placeholder="Ex: Trânsito de veículos no pátio, proximidade de barramento de MT energizado, etc."
              className="h-9 text-xs rounded-lg bg-white"
            />
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 3: EQUIPE AUTORIZADA                                            */}
      {/* =================================================================== */}
      {activeTab === "equipe" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-purple-600 text-white flex items-center justify-center text-[10px]">5</span>
                Equipe Autorizada
              </h4>
              <span className="text-[11px] text-gray-500">
                Colaboradores credenciados e habilitados a intervir na área de risco
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEquipeRow}
              className="h-8 text-xs font-bold text-[#E2661D] border-[#E2661D]/40 bg-orange-50 hover:bg-orange-100 gap-1.5 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Membro
            </Button>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-2.5 w-12 text-center">#</th>
                  <th className="p-2.5">Nome do Colaborador</th>
                  <th className="p-2.5">Função / Cargo</th>
                  <th className="p-2.5 w-16 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {equipe.map((membro, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-2.5 text-center font-mono font-bold text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="p-2">
                      <Input
                        value={membro.nome || ""}
                        onChange={(e) => handleEquipeChange(idx, "nome", e.target.value)}
                        placeholder="Nome completo do colaborador"
                        className="h-8 text-xs rounded-lg"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={membro.funcao || ""}
                        onChange={(e) => handleEquipeChange(idx, "funcao", e.target.value)}
                        placeholder="Ex: Eletrotécnico / Eletricista Montador"
                        className="h-8 text-xs rounded-lg"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeEquipeRow(idx)}
                        disabled={equipe.length <= 1}
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                        title="Remover linha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 4: ENCERRAMENTO & SIGNATÁRIOS                                  */}
      {/* =================================================================== */}
      {activeTab === "encerramento" && (
        <div className="space-y-4">
          {/* 6. ENCERRAMENTO DA PERMISSÃO */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-amber-600 text-white flex items-center justify-center text-[10px]">6</span>
                Encerramento da Permissão
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={markAllOkEncerramento}
                className="h-7 text-[11px] font-bold text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 gap-1 rounded-lg"
              >
                <CheckCircle2 className="w-3 h-3" />
                Marcar Todos como OK
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-gray-200">
              {ITENS_ENCERRAMENTO.map((item, idx) => {
                const currentVal = condicoesEncerramento[item] || "OK";
                return (
                  <div
                    key={idx}
                    className="p-2 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-gray-800 font-medium">{item}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {(["OK", "NÃO", "N/A"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setCondicaoEncerramento(item, status)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                            currentVal === status
                              ? status === "OK"
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : status === "NÃO"
                                ? "bg-red-600 text-white border-red-600"
                                : "bg-gray-600 text-white border-gray-600"
                              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Encerrada em</Label>
                <Input
                  type="date"
                  value={encerramento.encerradaEm || ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      encerramento: { ...encerramento, encerradaEm: e.target.value },
                    })
                  }
                  className="h-9 text-xs rounded-lg bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Hora</Label>
                <Input
                  type="time"
                  value={encerramento.hora || ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      encerramento: { ...encerramento, hora: e.target.value },
                    })
                  }
                  className="h-9 text-xs rounded-lg bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700">Encerrada por</Label>
                <Input
                  value={encerramento.encerradoPor || ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      encerramento: { ...encerramento, encerradoPor: e.target.value },
                    })
                  }
                  placeholder="Nome do responsável técnico"
                  className="h-9 text-xs rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Observações Finais de Encerramento</Label>
              <Textarea
                rows={2}
                value={encerramento.observacoes || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    encerramento: { ...encerramento, observacoes: e.target.value },
                  })
                }
                placeholder="Observações pertinentes à desmobilização ou pendências operacionais..."
                className="text-xs rounded-lg bg-white"
              />
            </div>
          </div>

          {/* SIGNATÁRIOS DA PERMISSÃO (PÁGINA 2) */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center text-[10px]">7</span>
              Signatários Oficiais da Permissão
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Emitente 1 */}
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                <span className="text-[11px] font-bold text-[#E2661D] uppercase block">
                  Emitente da Permissão 1
                </span>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500 font-bold">Nome</Label>
                  <Input
                    value={data.emitente1Nome || ""}
                    onChange={(e) => onChange({ ...data, emitente1Nome: e.target.value })}
                    placeholder="Nome do Emitente 1"
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500 font-bold">Função / Cargo</Label>
                  <Input
                    value={data.emitente1Funcao || "Responsável Técnico"}
                    onChange={(e) => onChange({ ...data, emitente1Funcao: e.target.value })}
                    placeholder="Ex: Responsável Técnico"
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500 font-bold">Registro (CREA/CFT)</Label>
                  <Input
                    value={data.emitente1Registro || ""}
                    onChange={(e) => onChange({ ...data, emitente1Registro: e.target.value })}
                    placeholder="Ex: CREA-AM 12345 / RNP 0420..."
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
              </div>

              {/* Emitente 2 */}
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                <span className="text-[11px] font-bold text-[#E2661D] uppercase block">
                  Emitente da Permissão 2 (Opcional)
                </span>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500 font-bold">Nome</Label>
                  <Input
                    value={data.emitente2Nome || ""}
                    onChange={(e) => onChange({ ...data, emitente2Nome: e.target.value })}
                    placeholder="Nome do Segundo Emitente / Executor"
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500 font-bold">Função / Cargo</Label>
                  <Input
                    value={data.emitente2Funcao || "Técnico Eletrotécnico"}
                    onChange={(e) => onChange({ ...data, emitente2Funcao: e.target.value })}
                    placeholder="Ex: Técnico Eletrotécnico"
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500 font-bold">Registro (CREA/CFT)</Label>
                  <Input
                    value={data.emitente2Registro || ""}
                    onChange={(e) => onChange({ ...data, emitente2Registro: e.target.value })}
                    placeholder="Ex: CREA 25168 / CFT 0420..."
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
              </div>

              {/* Responsável pela Execução (Cliente) */}
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 uppercase block">
                  Responsável pela Execução (Cliente)
                </span>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500 font-bold">Empresa / Supervisor</Label>
                  <Input
                    value={data.responsavelExecucaoNome || data.cliente || ""}
                    onChange={(e) => onChange({ ...data, responsavelExecucaoNome: e.target.value })}
                    placeholder="Nome do cliente ou supervisor"
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500 font-bold">Declaração</Label>
                  <Input
                    value={data.responsavelExecucaoSubtitulo || "Recebeu a permissão e cumpre as condições"}
                    onChange={(e) => onChange({ ...data, responsavelExecucaoSubtitulo: e.target.value })}
                    placeholder="Ex: Recebeu a permissão e cumpre as condições"
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
