"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ArtFormProps {
  data: Record<string, any>;
  onChange: (newData: Record<string, any>) => void;
}

export function ArtForm({ data, onChange }: ArtFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-700">Conselho Regional</Label>
          <select
            value={data.conselho || "CREA-AM"}
            onChange={(e) => onChange({ ...data, conselho: e.target.value })}
            className="w-full h-9 px-3 rounded-lg border border-gray-300 text-xs bg-white font-bold"
          >
            <option value="CREA-AM">CREA-AM (Conselho Regional de Engenharia)</option>
            <option value="CFT / CRT-01">CFT / CRT-01 (Técnicos Industriais)</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-700">Número da ART / TRT</Label>
          <Input
            value={data.numeroArt || ""}
            onChange={(e) => onChange({ ...data, numeroArt: e.target.value })}
            placeholder="Ex: AM20260492812"
            className="h-9 text-xs rounded-lg font-mono font-bold text-[#E2661D]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-700">Tipo de ART</Label>
          <select
            value={data.tipoArt || "Obra ou Serviço Técnico"}
            onChange={(e) => onChange({ ...data, tipoArt: e.target.value })}
            className="w-full h-9 px-3 rounded-lg border border-gray-300 text-xs bg-white"
          >
            <option value="Obra ou Serviço Técnico">Obra ou Serviço Técnico</option>
            <option value="Múltipla Mensal">Múltipla Mensal</option>
            <option value="Cargo ou Função">Desempenho de Cargo / Função</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-700">Responsável Técnico</Label>
          <Input
            value={data.responsavelTecnico || ""}
            onChange={(e) => onChange({ ...data, responsavelTecnico: e.target.value })}
            placeholder="Nome do profissional habilitado"
            className="h-9 text-xs rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-700">Registro Profissional / RNP</Label>
          <Input
            value={data.registroNacional || ""}
            onChange={(e) => onChange({ ...data, registroNacional: e.target.value })}
            placeholder="Registro CREA / CFT"
            className="h-9 text-xs rounded-lg font-mono"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-bold text-gray-700">Atividade Técnica Contratada</Label>
        <textarea
          value={data.atividadeTecnica || ""}
          onChange={(e) => onChange({ ...data, atividadeTecnica: e.target.value })}
          rows={2}
          placeholder="Ex: Execução de serviços elétricos de subestação, ensaios de SPDA e comissionamento..."
          className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#E2661D] outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-700">Valor do Contrato (R$)</Label>
          <Input
            value={data.valorContrato || ""}
            onChange={(e) => onChange({ ...data, valorContrato: e.target.value })}
            placeholder="0,00"
            className="h-9 text-xs rounded-lg font-bold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-bold text-gray-700">Empresa Vinculada</Label>
          <Input
            value={data.empresaContratada || "Setgen & Serviços (R G Vieira Bentes)"}
            onChange={(e) => onChange({ ...data, empresaContratada: e.target.value })}
            placeholder="Setgen & Serviços (R G Vieira Bentes)"
            className="h-9 text-xs rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

