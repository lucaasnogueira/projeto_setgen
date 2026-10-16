"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Printer,
  ArrowRight,
  ArrowLeft,
  Building2,
  HardHat,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  ShieldAlert,
  Wrench,
  Fuel,
  FileCheck,
  CheckSquare,
  Activity,
  Layers,
} from 'lucide-react';
import { exportChecklistToExcel } from '@/lib/checklist-sheet';
import { GeneratorChecklistItem, DEFAULT_GENERATOR_CHECKLIST } from '@/lib/checklist-generator-data';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function VisitReportPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params.id as string;
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [visit, setVisit] = useState<TechnicalVisit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visitId) {
      visitsApi.getOne(visitId)
        .then(setVisit)
        .catch(() => {
          alert('Erro ao carregar relatório da visita técnica');
          router.push(`/visits/${visitId}`);
        })
        .finally(() => setLoading(false));
    }
  }, [visitId, router]);

  const handlePrint = () => {
    window.print();
  };

  // Extração e consolidação dos dados do checklist estruturado (114 itens)
  const checklistItems = useMemo(() => {
    if (!visit) return DEFAULT_GENERATOR_CHECKLIST;

    const techItems = visit.technicalData?.checklistItems;
    if (Array.isArray(techItems) && techItems.length > 0) {
      return techItems as GeneratorChecklistItem[];
    }

    const legacyItems = visit.checklist;
    if (Array.isArray(legacyItems) && legacyItems.length > 0 && (legacyItems[0] as any).section) {
      return legacyItems as unknown as GeneratorChecklistItem[];
    }

    // Auto-preenche os dados cadastrais básicos a partir da visita
    const client = visit.client;
    const address = client?.address;
    const addressStr = address
      ? `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}, ${address.neighborhood}`
      : visit.location || '';
    const cityUf = address?.city ? `${address.city}/${address.state || 'AM'}` : 'Manaus/AM';
    const visitCode = visit.visitNumber || visit.externalCode || `VT-${visit.id.slice(0, 8).toUpperCase()}`;
    const visitDateFormatted = visit.visitDate ? visit.visitDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const techName = visit.technician?.name || (visit as any).assignedTo?.name || 'Equipe Setgen';

    return DEFAULT_GENERATOR_CHECKLIST.map((item) => {
      if (item.id === 1) return { ...item, answer: visitCode };
      if (item.id === 2) return { ...item, answer: visitDateFormatted };
      if (item.id === 3) return { ...item, answer: client?.companyName || item.answer };
      if (item.id === 5) return { ...item, answer: client?.cnpjCpf || item.answer };
      if (item.id === 6 && !item.answer) return { ...item, answer: client?.tradeName || client?.companyName || '' };
      if (item.id === 8 && !item.answer) return { ...item, answer: client?.phone || '' };
      if (item.id === 9 && !item.answer) return { ...item, answer: client?.email || '' };
      if (item.id === 10 && !item.answer) return { ...item, answer: addressStr || '' };
      if (item.id === 11 && !item.answer) return { ...item, answer: cityUf };
      if (item.id === 13) return { ...item, answer: techName };
      return item;
    });
  }, [visit]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E2661D]" />
        <p className="text-xs text-gray-500 font-medium">Carregando relatório técnico...</p>
      </div>
    );
  }

  if (!visit) return null;

  const client = visit.client;
  const address = client?.address;
  const addressStr = address
    ? `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}, ${address.neighborhood}, ${address.city}/${address.state || 'AM'} - CEP: ${address.cep || ''}`
    : visit.location || 'Manaus/AM';

  const conclusion = visit.conclusionData || {};

  // Funções de busca direta no checklist estruturado
  const getItem = (id: number): GeneratorChecklistItem | undefined => {
    return checklistItems.find((i) => i.id === id);
  };

  const getAns = (id: number, fallback = '—'): string => {
    const item = getItem(id);
    if (!item || !item.answer || String(item.answer).trim() === '') return fallback;
    return String(item.answer).trim();
  };

  const getStatus = (id: number): 'OK' | 'NÃO' | 'N/A' | null => {
    const ans = getAns(id, '').toUpperCase();
    if (ans === 'OK' || ans === 'SIM' || ans === 'CONFORME') return 'OK';
    if (ans === 'NÃO' || ans === 'NAO' || ans === 'INCONFORME') return 'NÃO';
    if (ans === 'N/A' || ans === 'NA') return 'N/A';
    return null;
  };

  const isSelected = (id: number, optionName: string): boolean => {
    const ans = getAns(id, '').toLowerCase();
    return ans.includes(optionName.toLowerCase());
  };

  // Métricas de dimensionamento
  const demandaVal = Number(getItem(23)?.answer) || 0;
  const margemVal = Number(getItem(96)?.answer) || 20;
  const potenciaCalc = demandaVal > 0 ? (demandaVal * (1 + margemVal / 100)).toFixed(1) : (getAns(97, '') || null);
  const geradorSugerido = getAns(98, '') || (potenciaCalc ? `${Math.ceil(Number(potenciaCalc) / 25) * 25} kVA` : 'A definir');

  // Todas as não-conformidades encontradas em campo
  const issuesFound = checklistItems.filter((i) => {
    const ans = String(i.answer || '').trim().toUpperCase();
    return ans === 'NÃO' || ans === 'NAO';
  });

  const visitCode = visit.visitNumber || visit.externalCode || `VT-${visit.id.slice(0, 8).toUpperCase()}`;

  const formattedDate = visit.visitDate
    ? new Date(visit.visitDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('pt-BR');

  const fullDateExtensive = new Date(visit.visitDate || new Date()).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const techName = visit.technician?.name || (visit as any).assignedTo?.name || getAns(13, 'Administrador Setgen');

  // Componente de Verificação Tri-State [ OK ] [ NÃO ] [ N/A ] (Padrão SGQ Executivo Sóbreo)
  const TriStateItem = ({ id, label }: { id: number; label: string }) => {
    const st = getStatus(id);
    return (
      <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50/50 text-[11px] gap-2 border-b border-slate-100 last:border-b-0 min-h-[26px]">
        <span className="text-slate-800 font-medium leading-tight truncate" title={label}>
          {label}
        </span>
        <div className="flex items-center gap-0.5 shrink-0 font-mono text-[9px] font-bold">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded border text-center transition-colors min-w-[26px]",
              st === 'OK'
                ? "bg-slate-800 text-white border-slate-800 font-bold"
                : "text-slate-300 border-slate-200 bg-white"
            )}
          >
            OK
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded border text-center transition-colors min-w-[30px]",
              st === 'NÃO'
                ? "bg-rose-700 text-white border-rose-700 font-bold"
                : "text-slate-300 border-slate-200 bg-white"
            )}
          >
            NÃO
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded border text-center transition-colors min-w-[26px]",
              st === 'N/A'
                ? "bg-slate-200 text-slate-700 border-slate-300 font-semibold"
                : "text-slate-300 border-slate-200 bg-white"
            )}
          >
            N/A
          </span>
        </div>
      </div>
    );
  };

  // Componente de Opção (Padrão Formulário Técnico Executivo)
  const OptionItem = ({ label, selected }: { label: string; selected: boolean }) => (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded border transition-colors",
        selected
          ? "bg-slate-800 text-white border-slate-800 font-semibold"
          : "bg-slate-50/60 text-slate-600 border-slate-200"
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full border flex items-center justify-center shrink-0",
          selected ? "border-white bg-[#E2661D]" : "border-slate-300 bg-white"
        )}
      />
      {label}
    </span>
  );

  return (
    <div className="space-y-6 pb-16">
      {/* BARRA DE AÇÕES SUPERIOR (Excluída na impressão pelo print:hidden) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs print:hidden">
        <div className="flex items-center gap-3">
          <Link href={`/visits/${visit.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-700 hover:text-gray-900 border-gray-200 h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Visita
            </Button>
          </Link>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2661D]" />
              Relatório Oficial de Visita Técnica · Grupo Gerador
            </h2>
            <p className="text-xs text-gray-500 font-mono">
              {visitCode} • {client?.companyName || 'Cliente'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Link href={`/visits/${visit.id}/execution`}>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-3.5 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <Wrench className="w-3.5 h-3.5 text-[#E2661D]" />
              Editar Dados de Campo
            </Button>
          </Link>

          <Button
            onClick={() => exportChecklistToExcel(checklistItems, `${visitCode}_${client?.companyName || 'CLIENTE'}`)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 px-3.5 rounded-lg shadow-2xs gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exportar (.xlsx)
          </Button>

          <Link href={`/quotes/new?visitId=${visit.id}&clientId=${visit.clientId}`}>
            <Button
              size="sm"
              className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-semibold h-9 px-3.5 rounded-lg shadow-2xs gap-1.5"
            >
              Gerar Orçamento
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>

          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-gray-900 hover:bg-black text-white font-semibold text-xs h-9 px-4 rounded-lg gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#E2661D]" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* =========================================================================
          DOCUMENTO OFICIAL TIMBRADO SETGEN (PADRÃO SGQ EXECUTIVO - FOLHAS A4)
          ========================================================================= */}
      <div className="flex justify-center print:p-0 print:m-0">
        <div
          ref={printAreaRef}
          id="printable-report"
          className="w-full max-w-[210mm] bg-white text-slate-900 shadow-sm border border-slate-200 sm:rounded-xl p-6 sm:p-10 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:rounded-none font-sans space-y-3.5 print:space-y-2"
        >
          {/* =====================================================================
              PÁGINA 1: CABEÇALHO, CLIENTE, IMÓVEL, CARGAS, INFRA E ELÉTRICA
              ===================================================================== */}

          {/* CABEÇALHO INSTITUCIONAL OFICIAL COM LOGO SETGEN */}
          <header className="border-b-2 border-slate-900 pb-3 mb-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/setgen-logo.png"
                  alt="SETGEN - Serviços Técnicos em Geradores de Energia & Serviços"
                  className="h-12 w-auto object-contain"
                />
              </div>

              <div className="text-right shrink-0">
                <h1 className="text-sm font-black uppercase tracking-tight text-slate-900">
                  VISITA TÉCNICA · GRUPO GERADOR
                </h1>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                    Visita Nº {visitCode}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Data: <strong className="text-slate-900">{formattedDate}</strong>
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                  SGQ-SET-01 · Rev.00
                </span>
              </div>
            </div>
          </header>

          {/* 1. CLIENTE E VISITA */}
          <section className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100 text-slate-900 border-b border-slate-200 px-3 py-1.5 flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-slate-700 shrink-0" />
              1. Cliente e Visita
            </div>

            <div className="p-3 text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pb-1.5 border-b border-slate-100">
                <div className="sm:col-span-6">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Cliente:</span>
                  <strong className="text-slate-900 text-[13px]">{client?.companyName || getAns(3, 'Cliente não informado')}</strong>
                  {client?.tradeName && (
                    <span className="text-slate-500 text-[11px] block">Nome Fantasia: {client.tradeName}</span>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">CNPJ / CPF:</span>
                  <span className="font-semibold text-slate-800">{client?.cnpjCpf || getAns(5, '—')}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Telefone / Contato:</span>
                  <span className="font-medium text-slate-800">{client?.phone || getAns(8, '—')} • {getAns(6, '')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pb-1.5 border-b border-slate-100">
                <div className="sm:col-span-7">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Endereço da Instalação:</span>
                  <span className="font-medium text-slate-800">{addressStr}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Cidade/UF:</span>
                  <span className="font-semibold text-slate-800">{address?.city || 'Manaus'} / {address?.state || 'AM'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Técnico:</span>
                  <span className="font-semibold text-slate-800">{techName}</span>
                </div>
              </div>

              {/* Objetivo da Visita com Seletores Visuais */}
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Objetivo da Visita:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <OptionItem label="Novo gerador" selected={isSelected(14, 'Novo gerador') || !getItem(14)?.answer} />
                  <OptionItem label="Ampliação / paralelismo" selected={isSelected(14, 'Ampliação')} />
                  <OptionItem label="Substituição" selected={isSelected(14, 'Substituição')} />
                  <OptionItem label="Manutenção / revisão" selected={isSelected(14, 'Manutenção')} />
                  <OptionItem label="Avaliação de problema" selected={isSelected(14, 'Avaliação')} />
                  <OptionItem label="Laudo técnico" selected={isSelected(14, 'Laudo')} />
                </div>
              </div>
            </div>
          </section>

          {/* 2. EDIFICAÇÃO E OPERAÇÃO DO IMÓVEL */}
          <section className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100 text-slate-900 border-b border-slate-200 px-3 py-1.5 flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              2. Edificação e Operação do Imóvel
            </div>

            <div className="p-3 text-xs space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">Tipo de Edificação:</span>
                <div className="flex flex-wrap gap-1">
                  <OptionItem label="Fábrica / Industrial" selected={isSelected(15, 'Fábrica') || isSelected(15, 'Industrial')} />
                  <OptionItem label="Shopping Center" selected={isSelected(15, 'Shopping')} />
                  <OptionItem label="Condomínio de Luxo" selected={isSelected(15, 'Condomínio')} />
                  <OptionItem label="Edifício Comercial" selected={isSelected(15, 'Comercial')} />
                  <OptionItem label="Hospital / Clínica" selected={isSelected(15, 'Hospital')} />
                  <OptionItem label="Outro" selected={isSelected(15, 'Outro')} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">Regime de Operação Previsto:</span>
                <div className="flex flex-wrap gap-1">
                  <OptionItem label="Emergência (Stand-by)" selected={isSelected(16, 'Emergência') || isSelected(16, 'stand-by') || !getItem(16)?.answer} />
                  <OptionItem label="Contínuo (Prime)" selected={isSelected(16, 'Contínuo') || isSelected(16, 'prime')} />
                  <OptionItem label="Horário de Ponta" selected={isSelected(16, 'Ponta')} />
                  <OptionItem label="Cogeração / Paralelismo" selected={isSelected(16, 'Cogeração')} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Pavimentos / Blocos:</span>
                  <strong className="text-slate-800">{getAns(17, 'Térreo / 1')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Área Construída:</span>
                  <strong className="text-slate-800">{getAns(18, '—')} m²</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Já existe gerador?</span>
                  <strong className="text-slate-800">{getAns(19, 'Não')}</strong>
                  {getAns(20, '') && <span className="text-slate-500 text-[10px] block">({getAns(20)})</span>}
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Quedas de Energia:</span>
                  <strong className="text-slate-800">{getAns(21, '—')} quedas/mês</strong> ({getAns(22, '—')} min)
                </div>
              </div>
            </div>
          </section>

          {/* 3. CONSUMO, CARGAS E DEMANDA */}
          <section className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100 text-slate-900 border-b border-slate-200 px-3 py-1.5 flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-slate-600" />
              3. Consumo, Cargas e Demanda Elétrica
            </div>

            <div className="p-3 text-xs space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-1.5 border-b border-slate-100">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] uppercase font-bold block">Demanda Máxima Medida</span>
                  <strong className="text-sm font-extrabold text-slate-900 font-mono">
                    {demandaVal > 0 ? `${demandaVal} kVA` : getAns(23, 'A aferir')}
                  </strong>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] uppercase font-bold block">Potência Instalada</span>
                  <strong className="text-sm font-extrabold text-slate-900 font-mono">
                    {getAns(24, '—')} kVA
                  </strong>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] uppercase font-bold block">Fator de Potência Médio</span>
                  <strong className="text-sm font-extrabold text-slate-900 font-mono">
                    {getAns(29, '0.92')}
                  </strong>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] uppercase font-bold block">Autonomia Desejada</span>
                  <strong className="text-sm font-extrabold text-slate-900 font-mono">
                    {getAns(31, '12')} horas
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Cargas a Atender:</span>
                  <div className="flex gap-1.5">
                    <OptionItem label="Toda a instalação" selected={isSelected(25, 'Toda')} />
                    <OptionItem label="Somente cargas essenciais" selected={isSelected(25, 'essenciais') || !getItem(25)?.answer} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Maior Motor / Partida:</span>
                  <span className="font-semibold text-slate-800">
                    {getAns(27, '—')} CV • Partida: {getAns(28, 'Direta / Soft-starter')}
                  </span>
                </div>
              </div>

              {getAns(26, '') && (
                <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px]">
                  <strong className="text-slate-700">Cargas Críticas Especiais:</strong> {getAns(26)}
                </div>
              )}
            </div>
          </section>

          {/* 4. LOCAL PREVISTO DO GERADOR E INFRAESTRUTURA */}
          <section className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100 text-slate-900 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <HardHat className="w-3.5 h-3.5 text-slate-600" />
                4. Local Previsto do Gerador e Infraestrutura
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">
                Padrão SGQ Setgen
              </span>
            </div>

            <div className="p-3 text-xs space-y-2.5">
              {/* Características Físicas do Local */}
              <div className="flex flex-wrap items-center gap-3 pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Local:</span>
                  <div className="flex flex-wrap gap-1">
                    <OptionItem label="Externo Descoberto" selected={isSelected(48, 'descoberto') || !getItem(48)?.answer} />
                    <OptionItem label="Externo Coberto" selected={isSelected(48, 'coberto')} />
                    <OptionItem label="Sala Técnica" selected={isSelected(48, 'sala')} />
                    <OptionItem label="Subsolo" selected={isSelected(48, 'subsolo')} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Dimensões Disponíveis:</span>
                  <strong className="text-slate-800 font-mono text-[11px]">{getAns(49, 'A definir')} (C × L × A m)</strong>
                </div>
              </div>

              {/* Grid Compacto de Verificações Técnicas com [ OK ] [ NÃO ] [ N/A ] */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                <TriStateItem id={54} label="Acesso para entrega e içamento (munck / guindaste)" />
                <TriStateItem id={55} label="Largura mínima da rota de acesso desobstruída" />
                <TriStateItem id={56} label="Base / laje nivelada e dimensionada para o peso" />
                <TriStateItem id={57} label="Ventilação e entrada/saída de ar adequadas" />
                <TriStateItem id={58} label="Exaustão de gases fora de áreas ocupadas / janelas" />
                <TriStateItem id={60} label="Espaço para manutenção ao redor (mínimo 1,0 metro)" />
                <TriStateItem id={61} label="Drenagem e bacia de contenção de óleo / diesel" />
                <TriStateItem id={52} label="Atenuação acústica / limite de ruído no local" />
              </div>
            </div>
          </section>

          {/* 5. INSTALAÇÃO ELÉTRICA EXISTENTE E CONEXÃO QGBT / ATS */}
          <section className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100 text-slate-900 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-slate-600" />
                5. Instalação Elétrica Existente e Conexão (QGBT / ATS)
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">
                Ponto de Conexão
              </span>
            </div>

            <div className="p-3 text-xs space-y-2.5">
              {/* Parâmetros Elétricos do Padrão */}
              <div className="flex flex-wrap items-center gap-3 pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Ligação:</span>
                  <div className="flex gap-1">
                    <OptionItem label="Monofásica" selected={isSelected(33, 'Monofásica')} />
                    <OptionItem label="Bifásica" selected={isSelected(33, 'Bifásica')} />
                    <OptionItem label="Trifásica" selected={isSelected(33, 'Trifásica') || !getItem(33)?.answer} />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Tensão:</span>
                  <div className="flex gap-1">
                    <OptionItem label="127/220 V" selected={isSelected(32, '127/220')} />
                    <OptionItem label="220/380 V" selected={isSelected(32, '220/380') || !getItem(32)?.answer} />
                    <OptionItem label="440 V" selected={isSelected(32, '440')} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-1.5 border-b border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Disjuntor Geral:</span>
                  <strong className="text-slate-800 font-mono">{getAns(36, '—')} A</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Seção dos Cabos:</span>
                  <strong className="text-slate-800 font-mono">{getAns(37, '—')} mm²</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Distância Gerador → QGBT:</span>
                  <strong className="text-slate-800 font-mono">{getAns(39, '—')} metros</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Quadro de Transferência (ATS):</span>
                  <strong className="text-slate-800">{getAns(38, 'ATS Automático')}</strong>
                </div>
              </div>

              {/* Verificações Técnicas Elétricas [ OK ] [ NÃO ] [ N/A ] */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                <TriStateItem id={41} label="Padrão de entrada e QGBT em bom estado de conservação" />
                <TriStateItem id={42} label="Espaço disponível no QGBT para chave de transferência" />
                <TriStateItem id={43} label="Aterramento existente e medido (< 10 ohms)" />
                <TriStateItem id={45} label="Dispositivos de Proteção contra Surtos (DPS) existentes" />
                <TriStateItem id={46} label="Intertravamento mecânico/elétrico rede-gerador previsto" />
                <TriStateItem id={44} label="Circuitos de emergência identificados e separados" />
              </div>
            </div>
          </section>

          {/* 6. COMBUSTÍVEL E AUTONOMIA */}
          <section className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100 text-slate-900 border-b border-slate-200 px-3 py-1.5 flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <Fuel className="w-3.5 h-3.5 text-slate-600" />
              6. Combustível e Autonomia
            </div>

            <div className="p-3 text-xs space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Tipo:</span>
                  <div className="flex gap-1">
                    <OptionItem label="Diesel S10" selected={isSelected(65, 'S10') || !getItem(65)?.answer} />
                    <OptionItem label="Diesel S500" selected={isSelected(65, 'S500')} />
                    <OptionItem label="Gás Natural" selected={isSelected(65, 'Gás')} />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Tanque:</span>
                  <div className="flex gap-1">
                    <OptionItem label="Embutido na Base" selected={isSelected(66, 'Base') || !getItem(66)?.answer} />
                    <OptionItem label="Tanque Externo" selected={isSelected(66, 'Externo')} />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Capacidade:</span>
                  <strong className="text-slate-800 font-mono">{getAns(67, '250')} Litros</strong>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Autonomia Estimada:</span>
                  <strong className="text-slate-800 font-mono">{getAns(104, '10')} h</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 pt-1 border-t border-slate-100">
                <TriStateItem id={68} label="Acesso seguro para caminhão de abastecimento de diesel" />
                <TriStateItem id={70} label="Bacia de contenção estanque prevista para vazamentos" />
              </div>
            </div>
          </section>

          {/* 7. PRÉ-DIMENSIONAMENTO DO GRUPO GERADOR (Engenharia Setgen) */}
          <section className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100 text-slate-900 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#E2661D]" />
                7. Pré-Dimensionamento do Grupo Gerador (Engenharia Setgen)
              </span>
              <span className="text-[10px] font-mono text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded font-semibold">
                Cálculo Normativo ABNT
              </span>
            </div>

            <div className="p-3 text-xs space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[9px] uppercase font-bold block">Demanda Medida</span>
                  <strong className="text-base font-extrabold text-slate-900 font-mono">
                    {demandaVal > 0 ? `${demandaVal} kVA` : getAns(23, 'A definir')}
                  </strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[9px] uppercase font-bold block">Margem de Reserva</span>
                  <strong className="text-base font-extrabold text-slate-900 font-mono">
                    +{margemVal}%
                  </strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[9px] uppercase font-bold block">Potência Mínima</span>
                  <strong className="text-base font-extrabold text-slate-900 font-mono">
                    {potenciaCalc ? `${potenciaCalc} kVA` : 'A definir'}
                  </strong>
                </div>

                <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-900 shadow-2xs">
                  <span className="text-slate-300 text-[9px] uppercase font-bold block">Gerador Sugerido</span>
                  <strong className="text-base font-black text-white font-mono">
                    {geradorSugerido}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px] font-bold uppercase">Tipo de Cabine:</span>
                  <OptionItem label="Silenciado (75 dB)" selected={isSelected(100, 'Silenciado') || !getItem(100)?.answer} />
                  <OptionItem label="Super Silenciado" selected={isSelected(100, 'Super')} />
                  <OptionItem label="Aberto" selected={isSelected(100, 'Aberto')} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px] font-bold uppercase">Regime de Potência:</span>
                  <OptionItem label="Standby (Emergência)" selected={isSelected(99, 'Standby') || !getItem(99)?.answer} />
                  <OptionItem label="Prime Power (Contínuo)" selected={isSelected(99, 'Prime')} />
                </div>
              </div>
            </div>
          </section>

          {/* 8. DOCUMENTOS COLETADOS DO CLIENTE */}
          <section className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100 text-slate-900 border-b border-slate-200 px-3 py-1.5 flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <FileCheck className="w-3.5 h-3.5 text-slate-600" />
              8. Documentos Coletados do Cliente
            </div>

            <div className="p-2.5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 text-[9px] font-bold uppercase block mb-1">Recebidos em Campo:</span>
                <div className="flex flex-wrap gap-1">
                  <OptionItem label="Conta de Energia" selected={true} />
                  <OptionItem label="Fotos do Padrão" selected={true} />
                  <OptionItem label="Diagrama Unifilar" selected={Boolean(getAns(106, '').includes('Unifilar'))} />
                  <OptionItem label="Layout da Área" selected={Boolean(getAns(106, '').includes('Layout'))} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] font-bold uppercase block mb-1">Pendentes de Envio:</span>
                <span className="text-slate-600 italic text-[11px] font-medium">
                  {getAns(107, 'Nenhum documento pendente')}
                </span>
              </div>
            </div>
          </section>

          {/* 9. CONCLUSÃO DA VISITA E PARECER TÉCNICO */}
          <section className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100 text-slate-900 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-slate-700" />
                9. Conclusão da Visita e Parecer da Engenharia Setgen
              </span>
            </div>

            <div className="p-3 text-xs space-y-3">
              {/* Parecer de Viabilidade */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Resultado da Vistoria:</span>
                <div className="flex gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold border transition-all",
                      conclusion.result === 'VIABLE' || conclusion.result === 'Viável' || !conclusion.result
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-400 border-slate-200"
                    )}
                  >
                    <CheckCircle2 className={cn("w-3.5 h-3.5", (conclusion.result === 'VIABLE' || conclusion.result === 'Viável' || !conclusion.result) ? "text-emerald-400" : "text-slate-300")} />
                    VIÁVEL
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold border transition-all",
                      conclusion.result === 'VIABLE_WITH_ADAPTATIONS' || conclusion.result === 'Viável com adequações'
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-400 border-slate-200"
                    )}
                  >
                    <AlertTriangle className={cn("w-3.5 h-3.5", (conclusion.result === 'VIABLE_WITH_ADAPTATIONS' || conclusion.result === 'Viável com adequações') ? "text-amber-400" : "text-slate-300")} />
                    VIÁVEL COM ADEQUAÇÕES
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold border transition-all",
                      conclusion.result === 'UNVIABLE' || conclusion.result === 'Inviável'
                        ? "bg-rose-900 text-white border-rose-900 shadow-2xs"
                        : "bg-white text-slate-400 border-slate-200"
                    )}
                  >
                    <XCircle className={cn("w-3.5 h-3.5", (conclusion.result === 'UNVIABLE' || conclusion.result === 'Inviável') ? "text-rose-400" : "text-slate-300")} />
                    INVIÁVEL
                  </span>
                </div>
              </div>

              {/* Pendências / Inconformidades Identificadas */}
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">
                  Pendências e Adequações Antes da Instalação:
                </span>
                {issuesFound.length > 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-1.5 text-slate-800">
                    {issuesFound.map((issue) => (
                      <div key={issue.id} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                        <span>
                          <strong className="text-slate-900">{issue.field} ({issue.section}):</strong>{' '}
                          <span className="text-slate-700">{issue.notes || 'Necessária intervenção técnica prévia'}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Nenhuma não-conformidade crítica impeditiva identificada. Local apto para recebimento do grupo gerador.</span>
                  </div>
                )}
              </div>

              {/* Próximos Passos */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">Próximos Passos:</span>
                <OptionItem label="Elaborar proposta comercial / orçamento" selected={true} />
                <OptionItem label="Elaborar projeto executivo de instalação" selected={Boolean(conclusion.nextSteps?.includes('projeto'))} />
                <OptionItem label="Agendar vistoria complementar" selected={false} />
              </div>

              {/* Observações Gerais */}
              {conclusion.diagnosisSummary && (
                <div className="pt-1 border-t border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Observações Gerais:</span>
                  <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                    {conclusion.diagnosisSummary}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* =====================================================================
              RODAPÉ E ASSINATURAS (TÉCNICO RESPONSÁVEL E CLIENTE)
              ===================================================================== */}
          <footer className="pt-4 mt-6 border-t border-slate-200">
            <div className="text-right text-[11px] text-slate-600 font-medium mb-4">
              Manaus/AM, {fullDateExtensive}.
            </div>

            <div className="grid grid-cols-2 gap-8 text-center">
              {/* Box Assinatura Técnico */}
              <div className="flex flex-col items-center">
                <div className="h-16 w-56 border-b-2 border-slate-800 flex items-center justify-center mb-1 overflow-hidden">
                  {visit.technicianSignature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={visit.technicianSignature}
                      alt="Assinatura Técnico"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono italic">Assinado Eletronicamente</span>
                  )}
                </div>
                <strong className="text-xs text-slate-900 block font-bold leading-tight">
                  {techName}
                </strong>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Responsável Técnico · Setgen Engenharia
                </span>
              </div>

              {/* Box Assinatura Cliente */}
              <div className="flex flex-col items-center">
                <div className="h-16 w-56 border-b-2 border-slate-800 flex items-center justify-center mb-1 overflow-hidden">
                  {visit.clientSignature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={visit.clientSignature}
                      alt="Assinatura Cliente"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono italic">Ciência do Atendimento</span>
                  )}
                </div>
                <strong className="text-xs text-slate-900 block font-bold leading-tight">
                  {visit.clientSignerName || client?.companyName || 'Cliente / Acompanhante'}
                </strong>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Representante Autorizado do Cliente
                </span>
              </div>
            </div>

            {/* Linha Final de Rastreabilidade Institucional */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-medium">
              <span>SETGEN & SERVIÇOS (R G VIEIRA BENTES) • CNPJ: 10.744.400/0001-65</span>
              <span>Documento emitido eletronicamente via Sistema Setgen • {visitCode}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
