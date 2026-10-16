"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileCheck, CheckCircle2 } from "lucide-react";
import { ClientContractOption, extractClientContracts } from "./defaults";

export interface ContractFormProps {
  data: Record<string, any>;
  onChange: (newData: Record<string, any>) => void;
  availableContracts?: ClientContractOption[];
  currentClient?: any;
  currentOrder?: any;
}

export function ContractForm({
  data,
  onChange,
  availableContracts,
  currentClient,
  currentOrder,
}: ContractFormProps) {
  const [activeTab, setActiveTab] = useState<"partes" | "valores" | "clausulas">("partes");

  const contracts = availableContracts || (currentClient ? extractClientContracts(currentClient) : []);

  const handleSelectContract = (contractNumber: string) => {
    if (!contractNumber) {
      onChange({ ...data, contratoVinculado: "" });
      return;
    }
    const found = contracts.find((c) => c.number === contractNumber || c.id === contractNumber);
    const nextData: Record<string, any> = {
      ...data,
      contratoVinculado: contractNumber,
    };
    if (found?.data?.objeto && (!data.objeto || data.objeto.includes("Prestação de serviços técnicos"))) {
      nextData.objeto = found.data.objeto;
    }
    if (found?.data?.valorTotal && (!data.valorTotal || data.valorTotal === "A combinar")) {
      nextData.valorTotal = found.data.valorTotal;
    }
    if (found?.data?.condicoesPagamento && !data.condicoesPagamento) {
      nextData.condicoesPagamento = found.data.condicoesPagamento;
    }
    if (found?.data?.prazoExecucaoDias && !data.prazoExecucaoDias) {
      nextData.prazoExecucaoDias = found.data.prazoExecucaoDias;
    }
    onChange(nextData);
  };

  return (
    <div className="space-y-4">
      {/* Tabs Internas */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("partes")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "partes"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          1. Partes & Objeto
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("valores")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "valores"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          2. Valores & Prazos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("clausulas")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "clausulas"
              ? "bg-[#E2661D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          3. Testemunhas & Foro
        </button>
      </div>

      {/* ABA 1: PARTES & OBJETO */}
      {activeTab === "partes" && (
        <div className="space-y-4">
          {/* Campo: Contrato Vinculado (Select puxando contratos do cliente) */}
          <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-[#E2661D]" />
                Contrato Vinculado
              </Label>
              <span className="text-[11px] text-gray-500 font-medium">
                {contracts.length > 0 ? `${contracts.length} contrato(s) do cliente` : "Sem contratos cadastrados"}
              </span>
            </div>

            <select
              value={data.contratoVinculado || ""}
              onChange={(e) => handleSelectContract(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-300 text-xs bg-white font-medium text-gray-800 focus:ring-2 focus:ring-[#E2661D] outline-none"
            >
              <option value="">
                {contracts.length === 0
                  ? "— (Em branco / Nenhum contrato cadastrado para este cliente) —"
                  : "— (Em branco / Nenhum contrato vinculado) —"}
              </option>
              {contracts.map((c) => (
                <option key={c.id} value={c.number}>
                  {c.label}
                </option>
              ))}
            </select>

            {data.contratoVinculado ? (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Vinculado ao contrato: <strong>{data.contratoVinculado}</strong></span>
              </p>
            ) : (
              <p className="text-[10.5px] text-gray-500">
                Selecione um dos contratos vigentes do cliente. Caso o cliente não possua contratos ou nenhum seja selecionado, o campo permanecerá em branco.
              </p>
            )}
          </div>

          {/* Dados do Contratante (Cliente) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Contratante (Cliente)</Label>
              <Input
                value={data.contratanteNome || currentClient?.companyName || currentClient?.tradeName || ""}
                onChange={(e) => onChange({ ...data, contratanteNome: e.target.value })}
                placeholder="Razão Social ou Nome do Cliente"
                className="h-9 text-xs rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">CNPJ / CPF Contratante</Label>
              <Input
                value={data.contratanteCnpj || currentClient?.cnpjCpf || ""}
                onChange={(e) => onChange({ ...data, contratanteCnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="h-9 text-xs rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Contratada (Empresa)</Label>
              <Input
                value={data.contratadaRazao || ""}
                onChange={(e) => onChange({ ...data, contratadaRazao: e.target.value })}
                placeholder="Setgen & Serviços (R G Vieira Bentes)"
                className="h-9 text-xs rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">CNPJ Contratada</Label>
              <Input
                value={data.contratadaCnpj || ""}
                onChange={(e) => onChange({ ...data, contratadaCnpj: e.target.value })}
                placeholder="10.744.400/0001-65"
                className="h-9 text-xs rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-700">CLÁUSULA 1ª — Objeto e Escopo Contratual</Label>
            <textarea
              value={data.objeto || ""}
              onChange={(e) => onChange({ ...data, objeto: e.target.value })}
              rows={3}
              placeholder="Ex: Prestação de serviços de manutenção preventiva e corretiva em subestação..."
              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#E2661D] outline-none"
            />
          </div>
        </div>
      )}

      {/* ABA 2: VALORES & PRAZOS */}
      {activeTab === "valores" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">CLÁUSULA 2ª — Valor Total dos Serviços (R$)</Label>
              <Input
                value={data.valorTotal || ""}
                onChange={(e) => onChange({ ...data, valorTotal: e.target.value })}
                placeholder="0,00"
                className="h-9 text-xs rounded-lg font-bold text-emerald-800"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">CLÁUSULA 3ª — Prazo de Execução</Label>
              <Input
                value={data.prazoExecucaoDias || ""}
                onChange={(e) => onChange({ ...data, prazoExecucaoDias: e.target.value })}
                placeholder="Ex: 15 dias úteis"
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-700">Condições e Parcelas de Pagamento</Label>
            <textarea
              value={data.condicoesPagamento || ""}
              onChange={(e) => onChange({ ...data, condicoesPagamento: e.target.value })}
              rows={2}
              placeholder="Ex: 50% de entrada e 50% na conclusão técnica dos serviços."
              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#E2661D] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Prazo de Garantia (Meses)</Label>
              <Input
                value={data.garantiaMeses ? `${data.garantiaMeses} meses` : "12 meses"}
                onChange={(e) => onChange({ ...data, garantiaMeses: e.target.value.replace(/\D/g, "") })}
                className="h-9 text-xs rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Comarca do Foro Eleito</Label>
              <Input
                value={data.foro || ""}
                onChange={(e) => onChange({ ...data, foro: e.target.value })}
                placeholder="Ex: Manaus/AM"
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: TESTEMUNHAS */}
      {activeTab === "clausulas" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <Label className="text-xs font-bold text-gray-800">Testemunha 1</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={data.testemunha1Nome || ""}
                onChange={(e) => onChange({ ...data, testemunha1Nome: e.target.value })}
                placeholder="Nome da Testemunha 1"
                className="h-8 text-xs rounded-lg bg-white"
              />
              <Input
                value={data.testemunha1Cpf || ""}
                onChange={(e) => onChange({ ...data, testemunha1Cpf: e.target.value })}
                placeholder="CPF Testemunha 1"
                className="h-8 text-xs rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <Label className="text-xs font-bold text-gray-800">Testemunha 2</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={data.testemunha2Nome || ""}
                onChange={(e) => onChange({ ...data, testemunha2Nome: e.target.value })}
                placeholder="Nome da Testemunha 2"
                className="h-8 text-xs rounded-lg bg-white"
              />
              <Input
                value={data.testemunha2Cpf || ""}
                onChange={(e) => onChange({ ...data, testemunha2Cpf: e.target.value })}
                placeholder="CPF Testemunha 2"
                className="h-8 text-xs rounded-lg bg-white font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

