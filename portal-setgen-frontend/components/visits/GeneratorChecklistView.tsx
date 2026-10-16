"use client";

import React, { useState, useMemo } from 'react';
import { GeneratorChecklistItem, GENERATOR_SECTIONS } from '@/lib/checklist-generator-data';
import { exportChecklistToExcel } from '@/lib/checklist-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
  Zap,
  Building,
  Gauge,
  ShieldAlert,
  Printer,
  Wrench,
  FileText,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  Check,
  Fuel,
  Activity,
  HardHat,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface GeneratorChecklistViewProps {
  items: GeneratorChecklistItem[];
  visitCode?: string;
  clientName?: string;
  visitId?: string;
}

export function GeneratorChecklistView({
  items,
  visitCode = 'GERADOR',
  clientName,
  visitId,
}: GeneratorChecklistViewProps) {
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [viewMode, setViewMode] = useState<'forms' | 'table'>('forms');

  // Métricas de engenharia e conformidade
  const stats = useMemo(() => {
    let answered = 0;
    let issues = 0;
    let ok = 0;
    let na = 0;

    items.forEach((it) => {
      const ans = String(it.answer || '').trim();
      if (ans) {
        answered++;
        const upper = ans.toUpperCase();
        if (upper === 'NÃO' || upper === 'NAO') issues++;
        else if (upper === 'SIM' || upper === 'OK') ok++;
        else if (upper === 'N/A' || upper === 'NÃO SE APLICA') na++;
      }
    });

    // Pré-dimensionamento
    const demandaItem = items.find((i) => i.id === 23);
    const margemItem = items.find((i) => i.id === 96);
    const potenciaCalcItem = items.find((i) => i.id === 97);
    const geradorSugeridoItem = items.find((i) => i.id === 98);

    const demandaVal = Number(demandaItem?.answer) || 0;
    const margemVal = Number(margemItem?.answer) || 20;
    const potenciaCalc = demandaVal > 0 ? (demandaVal * (1 + margemVal / 100)).toFixed(1) : (potenciaCalcItem?.answer || '-');

    return {
      total: items.length,
      answered,
      issues,
      ok,
      na,
      percentage: Math.round((answered / (items.length || 1)) * 100),
      demandaVal,
      margemVal,
      potenciaCalc,
      geradorSugerido: geradorSugeridoItem?.answer || 'A definir',
    };
  }, [items]);

  // Lista única de seções
  const sectionsList = useMemo(() => {
    const list: string[] = [];
    items.forEach((it) => {
      if (!list.includes(it.section)) list.push(it.section);
    });
    return list.length > 0 ? list : Array.from(GENERATOR_SECTIONS);
  }, [items]);

  // Itens filtrados
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedSection !== 'ALL' && item.section !== selectedSection) {
        return false;
      }
      if (onlyIssues) {
        const ans = String(item.answer || '').trim().toUpperCase();
        if (ans !== 'NÃO' && ans !== 'NAO') return false;
      }
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchField = item.field.toLowerCase().includes(term);
        const matchAnswer = String(item.answer || '').toLowerCase().includes(term);
        const matchNotes = (item.notes || '').toLowerCase().includes(term);
        const matchId = String(item.id).includes(term);
        const matchSection = item.section.toLowerCase().includes(term);
        if (!matchField && !matchAnswer && !matchNotes && !matchId && !matchSection) return false;
      }
      return true;
    });
  }, [items, selectedSection, onlyIssues, search]);

  const handleExport = () => {
    exportChecklistToExcel(items, `${visitCode}_${clientName || 'CLIENTE'}`);
  };

  // Badge resumido de resposta
  const getAnswerBadge = (answer?: string | number) => {
    if (!answer && answer !== 0) {
      return <span className="text-slate-400 italic text-xs">Pendente</span>;
    }
    const upper = String(answer).trim().toUpperCase();
    if (upper === 'SIM' || upper === 'OK') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {String(answer)}
        </span>
      );
    }
    if (upper === 'NÃO' || upper === 'NAO') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-700 text-white">
          <AlertCircle className="w-3 h-3 text-rose-200" /> {String(answer)}
        </span>
      );
    }
    if (upper === 'N/A' || upper === 'NÃO SE APLICA') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <HelpCircle className="w-3 h-3 text-slate-500" /> {String(answer)}
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-900 border border-slate-200">
        {String(answer)}
      </span>
    );
  };

  // Renderizador de Item em Formato "Forms" Padronizado
  const renderFormField = (item: GeneratorChecklistItem) => {
    const isTriState = item.type === 'Checklist (OK/NÃO/N/A)';
    const isSelect = item.type === 'Seleção única' || item.type === 'Seleção múltipla';
    const isCalculated = item.type === 'Calculado';
    const rawAnswer = String(item.answer || '').trim();
    const upperAnswer = rawAnswer.toUpperCase();
    const hasAnswer = rawAnswer !== '';

    return (
      <div
        key={item.id}
        className={cn(
          "bg-white border rounded-xl p-4 transition-all space-y-3",
          upperAnswer === 'NÃO' || upperAnswer === 'NAO'
            ? "border-rose-300 bg-rose-50/20 shadow-xs"
            : "border-slate-200 hover:border-slate-300 shadow-2xs"
        )}
      >
        {/* Cabeçalho da Pergunta */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                #{item.id}
              </span>
              <h5 className="font-bold text-xs text-slate-900 leading-snug">
                {item.field}
              </h5>
              {item.appliesTo && item.appliesTo !== 'Todos' && (
                <span className="text-[9px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                  {item.appliesTo}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {isCalculated && (
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                Calculado
              </span>
            )}
            {!hasAnswer && (
              <span className="text-[10px] text-slate-400 font-medium italic">
                Não respondido
              </span>
            )}
          </div>
        </div>

        {/* Corpo da Resposta no Estilo Forms Padronizado */}
        <div className="pt-1">
          {isTriState ? (
            /* Opções Tri-State tipo Botões de Rádio / Padrão Forms */
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors",
                  upperAnswer === 'OK' || upperAnswer === 'SIM'
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-400 border-slate-200 opacity-60"
                )}
              >
                <Check className="w-3.5 h-3.5" />
                OK / Conforme
              </span>

              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors",
                  upperAnswer === 'NÃO' || upperAnswer === 'NAO'
                    ? "bg-rose-700 text-white border-rose-700 shadow-xs"
                    : "bg-white text-slate-400 border-slate-200 opacity-60"
                )}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                NÃO / Não Conforme
              </span>

              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors",
                  upperAnswer === 'N/A' || upperAnswer === 'NÃO SE APLICA'
                    ? "bg-slate-200 text-slate-800 border-slate-300 shadow-xs"
                    : "bg-white text-slate-400 border-slate-200 opacity-60"
                )}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                N/A (Não se aplica)
              </span>
            </div>
          ) : isSelect && Array.isArray(item.options) && item.options.length > 0 ? (
            /* Opções de Seleção Única / Múltipla com Pills Ativas */
            <div className="flex flex-wrap gap-1.5">
              {item.options.map((opt) => {
                const isSelected = rawAnswer.toLowerCase().includes(opt.toLowerCase());
                return (
                  <span
                    key={opt}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all",
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 font-bold shadow-2xs"
                        : "bg-slate-50/80 text-slate-500 border-slate-200 opacity-70"
                    )}
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full border",
                        isSelected ? "bg-[#E2661D] border-white" : "border-slate-300 bg-white"
                      )}
                    />
                    {opt}
                  </span>
                );
              })}
            </div>
          ) : (
            /* Campo de Texto / Número / Medição / Data */
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between">
              <span className="font-semibold text-slate-900 font-mono text-[13px]">
                {hasAnswer ? rawAnswer : <span className="text-slate-400 font-normal italic">Pendente</span>}
              </span>
              {item.unit && (
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.unit}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Observações de Campo do Técnico */}
        {item.notes && item.notes.trim() !== '' && (
          <div className="bg-slate-100/80 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-700 flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Observação registrada em campo:
              </span>
              <p className="font-medium mt-0.5 leading-relaxed">{item.notes}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. PAINEL DE CONTROLE EXECUTIVO & PRÉ-DIMENSIONAMENTO */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2661D]" />
              Formulário Técnico · Levantamento de Campo
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {visitCode} • {clientName || 'Cliente'} • Padrão ABNT / SGQ Setgen
            </p>
          </div>

          {/* AÇÕES DIRETAS (FIM DA REDUNDÂNCIA) */}
          <div className="flex flex-wrap items-center gap-2">
            {visitId && (
              <Link href={`/visits/${visitId}/report`}>
                <Button
                  size="sm"
                  className="bg-slate-900 hover:bg-black text-white text-xs font-semibold h-9 px-3.5 rounded-lg shadow-2xs gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5 text-[#E2661D]" />
                  Emitir Relatório PDF
                </Button>
              </Link>
            )}

            {visitId && (
              <Link href={`/visits/${visitId}/execution`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold h-9 px-3.5 rounded-lg shadow-2xs gap-1.5"
                >
                  <Wrench className="h-3.5 w-3.5 text-[#E2661D]" />
                  Preencher / Editar Formulário
                </Button>
              </Link>
            )}

            <Button
              onClick={handleExport}
              size="sm"
              variant="outline"
              className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold h-9 px-3 rounded-lg shadow-2xs gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Exportar (.xlsx)
            </Button>
          </div>
        </div>

        {/* Cards de Métricas Técnicas */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Demanda Aferida</span>
            <strong className="text-base font-extrabold text-slate-900 font-mono">
              {stats.demandaVal > 0 ? `${stats.demandaVal} kVA` : 'Aferir'}
            </strong>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Margem Segurança</span>
            <strong className="text-base font-extrabold text-slate-900 font-mono">
              +{stats.margemVal}%
            </strong>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Potência Mínima</span>
            <strong className="text-base font-extrabold text-[#E2661D] font-mono">
              {stats.potenciaCalc !== '-' ? `${stats.potenciaCalc} kVA` : 'Calculando'}
            </strong>
          </div>

          <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-900 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Gerador Sugerido</span>
            <strong className="text-base font-black text-white font-mono truncate block">
              {stats.geradorSugerido}
            </strong>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Conformidade</span>
              <span className="font-mono font-bold text-slate-800 text-xs">
                {stats.percentage}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px]">
              <span className="text-slate-800 font-bold">{stats.ok} OK</span>
              <span className="text-slate-300">|</span>
              <span className={cn(stats.issues > 0 ? "text-rose-600 font-bold" : "text-slate-500")}>
                {stats.issues} NÃO
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">{stats.na} N/A</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS, BUSCA E MODOS DE VISUALIZAÇÃO */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Campo de Busca */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por pergunta, ID ou termo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8.5 h-9 text-xs rounded-lg bg-slate-50/50 border-slate-200"
            />
          </div>

          {/* Filtro Rápido de Não-Conformidades */}
          <Button
            type="button"
            variant={onlyIssues ? "destructive" : "outline"}
            size="sm"
            onClick={() => setOnlyIssues(!onlyIssues)}
            className="h-9 text-xs font-semibold gap-1.5 rounded-lg border-slate-200"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-current" />
            {onlyIssues ? 'Exibir Todos os Itens' : `Apenas Inconformidades (${stats.issues})`}
          </Button>
        </div>

        {/* Alternador de Modo de Exibição */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-end md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('forms')}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all",
              viewMode === 'forms'
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Formulário (Forms)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all",
              viewMode === 'table'
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Tabela
          </button>
        </div>
      </div>

      {/* 3. NAVEGAÇÃO DE SEÇÕES (ESTILO FORMS POR ABAS/PILLS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedSection('ALL')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border",
            selectedSection === 'ALL'
              ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          Todas as Seções ({items.length})
        </button>

        {sectionsList.map((sec) => {
          const secItems = items.filter((i) => i.section === sec);
          const secAnswered = secItems.filter((i) => i.answer && i.answer.trim() !== '').length;
          const secIssues = secItems.filter((i) => i.answer === 'NÃO' || i.answer === 'NAO').length;
          const isSelected = selectedSection === sec;

          return (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSection(sec)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5",
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <span>{sec}</span>
              {secIssues > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                  {secIssues}
                </span>
              ) : (
                <span className={cn(
                  "text-[10px] font-mono",
                  isSelected ? "text-slate-300" : "text-slate-400"
                )}>
                  {secAnswered}/{secItems.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. CONTEÚDO PRINCIPAL (MODO FORMS VS MODO TABELA) */}
      {viewMode === 'forms' ? (
        /* MODO FORMULÁRIO (PADRÃO GOOGLE FORMS ESTRUTURADO) */
        <div className="space-y-6">
          {sectionsList
            .filter((sec) => selectedSection === 'ALL' || selectedSection === sec)
            .map((sec) => {
              const secItems = filteredItems.filter((i) => i.section === sec);
              if (secItems.length === 0) return null;

              const totalSec = items.filter((i) => i.section === sec).length;
              const answeredSec = items.filter((i) => i.section === sec && i.answer && i.answer.trim() !== '').length;

              return (
                <div key={sec} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  {/* Cabeçalho da Seção */}
                  <div className="bg-slate-100/90 text-slate-900 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <h4 className="font-bold text-xs uppercase tracking-wider">
                        {sec}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {answeredSec}/{totalSec} preenchidos
                    </span>
                  </div>

                  {/* Grid de Perguntas / Campos do Forms */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {secItems.map((item) => renderFormField(item))}
                  </div>
                </div>
              );
            })}

          {filteredItems.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold">Nenhum item encontrado com os filtros selecionados.</p>
            </div>
          )}
        </div>
      ) : (
        /* MODO TABELA SINTÉTICA */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 w-12 text-center">ID</th>
                  <th className="p-3 w-48">Seção</th>
                  <th className="p-3">Item / Pergunta</th>
                  <th className="p-3 w-40 text-center">Resposta</th>
                  <th className="p-3 w-48">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Nenhum item corresponde aos filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors",
                        String(item.answer).toUpperCase() === 'NÃO' || String(item.answer).toUpperCase() === 'NAO'
                          ? "bg-rose-50/40"
                          : ""
                      )}
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        #{item.id}
                      </td>
                      <td className="p-3 font-semibold text-slate-600">
                        <span className="line-clamp-1">{item.section}</span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.field}</div>
                        {item.unit && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Unidade: {item.unit}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {getAnswerBadge(item.answer)}
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.notes ? (
                          <span className="italic text-slate-700">{item.notes}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
