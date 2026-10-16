"use client";

import React, { useState, useMemo } from 'react';
import { 
  GeneratorChecklistItem, 
  DEFAULT_GENERATOR_CHECKLIST 
} from '@/lib/checklist-generator-data';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  AlertTriangle, 
  Building2, 
  FileSpreadsheet, 
  Filter, 
  Check, 
  ChevronRight, 
  HelpCircle,
  Calculator,
  MessageSquare,
  Lock,
  Unlock,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// IDs dos campos da Seção 1 que são dados cadastrais e de sistema protegidos
export const PROTECTED_SYSTEM_FIELDS = [1, 2, 3, 5, 6, 8, 9, 10, 11, 13];

// Faixas comerciais de grupos geradores (kVA)
const COMMERCIAL_GENERATOR_KVAS = [
  25, 30, 40, 50, 55, 75, 80, 100, 115, 125, 150, 180, 200, 230, 260, 300, 330, 400, 450, 500, 550, 625, 750, 1000,
];

interface GeneratorChecklistEditorProps {
  items: GeneratorChecklistItem[];
  onChange: (items: GeneratorChecklistItem[]) => void;
  visitCode?: string;
  onSyncClientData?: (data: { clientName?: string; cnpjCpf?: string; phone?: string; email?: string; location?: string }) => void;
}

export function GeneratorChecklistEditor({
  items = DEFAULT_GENERATOR_CHECKLIST,
  onChange,
  visitCode = 'GERADOR',
  onSyncClientData,
}: GeneratorChecklistEditorProps) {
  const [activeSection, setActiveSection] = useState<string>('1. Cliente e visita');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyIssues, setFilterOnlyIssues] = useState(false);
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('Todos');
  const [unlockedFields, setUnlockedFields] = useState<Record<number, boolean>>({});

  // Lista única de seções
  const sections = useMemo(() => {
    const list: string[] = [];
    items.forEach((item) => {
      if (!list.includes(item.section)) {
        list.push(item.section);
      }
    });
    return list;
  }, [items]);

  // Contagem de pendências (itens com resposta NÃO)
  const issuesCount = useMemo(() => {
    return items.filter((i) => i.answer === 'NÃO').length;
  }, [items]);

  // Contagem de preenchidos
  const filledCount = useMemo(() => {
    return items.filter((i) => i.answer && i.answer.trim() !== '').length;
  }, [items]);

  const progressPercent = Math.round((filledCount / items.length) * 100);

  // Manipular atualização de resposta de um item
  const handleItemChange = (id: number, newAnswer: string, newNotes?: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          answer: newAnswer,
          notes: newNotes !== undefined ? newNotes : item.notes,
        };
      }
      return item;
    });

    // Se mudar a Demanda máxima (id 23) ou Margem (id 96), recalcula Potência mínima estimada (id 97) e Gerador sugerido (id 98)
    if (id === 23 || id === 96) {
      const demanda = Number(updated.find((i) => i.id === 23)?.answer) || 0;
      const margem = Number(updated.find((i) => i.id === 96)?.answer) || 20;
      const minKva = demanda > 0 ? demanda * (1 + margem / 100) : 0;
      const item97 = updated.find((i) => i.id === 97);
      if (item97) {
        item97.answer = minKva > 0 ? minKva.toFixed(1) : '';
      }
      const item98 = updated.find((i) => i.id === 98);
      if (item98 && minKva > 0) {
        const commercialSuggested = COMMERCIAL_GENERATOR_KVAS.find((k) => k >= minKva) || Math.ceil(minKva / 50) * 50;
        item98.answer = String(commercialSuggested);
      }
    }

    // Se mudar tipo de cliente (id 4), atualiza o filtro de tipo de cliente da seção 8
    if (id === 4) {
      setClientTypeFilter(newAnswer);
    }

    // Notificar pai sobre dados cadastrais caso preenchidos
    if (onSyncClientData && (id === 3 || id === 5 || id === 8 || id === 9 || id === 10)) {
      onSyncClientData({
        clientName: updated.find((i) => i.id === 3)?.answer,
        cnpjCpf: updated.find((i) => i.id === 5)?.answer,
        phone: updated.find((i) => i.id === 8)?.answer,
        email: updated.find((i) => i.id === 9)?.answer,
        location: updated.find((i) => i.id === 10)?.answer,
      });
    }

    onChange(updated);
  };

  // Toggle de seleção múltipla (separada por ponto e vírgula)
  const handleMultiSelectToggle = (id: number, option: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const currentSelected = item.answer
      ? item.answer.split(';').map((s) => s.trim()).filter(Boolean)
      : [];

    let newSelected: string[];
    if (currentSelected.includes(option)) {
      newSelected = currentSelected.filter((s) => s !== option);
    } else {
      newSelected = [...currentSelected, option];
    }

    handleItemChange(id, newSelected.join('; '));
  };

  // Filtragem dos itens exibidos
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      // Filtro de busca de texto
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchField = item.field.toLowerCase().includes(q);
        const matchSection = item.section.toLowerCase().includes(q);
        const matchAnswer = item.answer?.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        if (!matchField && !matchSection && !matchAnswer && !matchNotes) {
          return false;
        }
      }

      // Filtro exclusivo de pendências (apenas itens NÃO)
      if (filterOnlyIssues) {
        return item.answer === 'NÃO';
      }

      // Se não estiver buscando por texto global nem filtrando só pendências, filtra pela seção ativa
      if (!searchQuery && !filterOnlyIssues) {
        return item.section === activeSection;
      }

      return true;
    });
  }, [items, activeSection, searchQuery, filterOnlyIssues]);

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden flex flex-col">
      {/* BARRA DE STATUS, PROGRESO E FILTROS RÁPIDOS */}
      <div className="p-3 sm:px-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          {/* Progresso Geral */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Preenchimento:</span>
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <strong className="text-slate-800 font-mono text-[11px]">
              {filledCount}/114 ({progressPercent}%)
            </strong>
          </div>

          {/* Botão de Filtro de Pendências (NÃO) */}
          <button
            type="button"
            onClick={() => setFilterOnlyIssues(!filterOnlyIssues)}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors",
              filterOnlyIssues
                ? "bg-rose-600 text-white shadow-sm"
                : issuesCount > 0
                ? "bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            <AlertTriangle className="w-3 h-3 text-current" />
            Pendências (NÃO): <strong>{issuesCount}</strong>
          </button>
        </div>

        {/* Busca por campo ou termo */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar nos 114 itens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-white border-slate-200"
          />
        </div>
      </div>

      {/* LAYOUT PRINCIPAL: NAVEGAÇÃO DE SEÇÕES + ITENS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* NAVEGAÇÃO LATERAL DAS 11 SEÇÕES (Escondida se busca ativa) */}
        {!searchQuery && !filterOnlyIssues && (
          <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/50 p-2 space-y-1 self-start sticky top-20 max-h-[calc(100vh-140px)] overflow-y-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5 block">
              Seções da Visita
            </span>

            {sections.map((sec) => {
              const secItems = items.filter((i) => i.section === sec);
              const secFilled = secItems.filter((i) => i.answer && i.answer.trim() !== '').length;
              const secIssues = secItems.filter((i) => i.answer === 'NÃO').length;
              const isActive = activeSection === sec;

              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setActiveSection(sec)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-xs",
                    isActive
                      ? "bg-white text-slate-900 font-bold shadow-sm border border-slate-200"
                      : "text-slate-600 hover:bg-slate-100/80 font-medium"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        secFilled === secItems.length
                          ? "bg-emerald-500"
                          : secIssues > 0
                          ? "bg-rose-500"
                          : "bg-slate-300"
                      )}
                    />
                    <span className="truncate">{sec}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {secIssues > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-black text-[9px]">
                        {secIssues} NÃO
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {secFilled}/{secItems.length}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ÁREA DE ITENS DA SEÇÃO ATIVA OU RESULTADOS DA BUSCA */}
        <div className={cn(
          "p-4 sm:p-6 space-y-4",
          !searchQuery && !filterOnlyIssues ? "lg:col-span-8" : "lg:col-span-12"
        )}>
          {/* Título da Seção */}
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 tracking-tight">
                {searchQuery
                  ? `Resultados da busca: "${searchQuery}" (${displayedItems.length})`
                  : filterOnlyIssues
                  ? `Itens Marcados com Pendência (NÃO) (${displayedItems.length})`
                  : activeSection}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Preencha as respostas diretamente ou utilize a importação via Excel
              </p>
            </div>

            {/* Se for a seção 9, exibe o destaque da Potência Calculada */}
            {activeSection.includes('Pré-dimensionamento') && (
              <div className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                <Calculator className="w-4 h-4 text-orange-600" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-orange-700 block">Potência Estimada</span>
                  <strong className="text-orange-900 font-mono">
                    {items.find((i) => i.id === 97)?.answer || '—'} kVA
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* LISTA DE CAMPOS */}
          {displayedItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="font-semibold text-sm text-slate-700">Nenhum item pendente nesta visualização</p>
              <p className="text-xs text-slate-400 mt-1">Todos os itens estão conformes ou respondidos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedItems.map((item) => {
                const isCalculated = item.type === 'Calculado';
                const isSystemProtected = PROTECTED_SYSTEM_FIELDS.includes(item.id);
                const isUnlocked = Boolean(unlockedFields[item.id]);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all space-y-2.5",
                      item.answer === 'NÃO'
                        ? "border-rose-300 bg-rose-50/40"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    {/* Linha Superior: ID + Nome do Campo + Tipo/Unidade */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{item.id}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-xs text-slate-800 font-bold block leading-tight">
                              {item.field}
                            </strong>
                            {isSystemProtected && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
                                {isUnlocked ? (
                                  <>
                                    <Unlock className="w-2.5 h-2.5 text-amber-600" />
                                    Edição Liberada
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-2.5 h-2.5 text-amber-600" />
                                    Automático do Sistema
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                          {item.appliesTo && item.appliesTo !== 'Todos' && (
                            <span className="inline-block mt-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                              Aplica a: {item.appliesTo}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSystemProtected && (
                          <button
                            type="button"
                            onClick={() =>
                              setUnlockedFields((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }))
                            }
                            className="text-[10px] text-slate-400 hover:text-slate-700 underline font-medium"
                            title={isUnlocked ? "Bloquear campo" : "Clique para alterar se necessário"}
                          >
                            {isUnlocked ? "Bloquear" : "Alterar"}
                          </button>
                        )}
                        {item.unit && (
                          <Badge variant="outline" className="font-mono text-[10px] font-bold text-slate-600">
                            {item.unit}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* COMPONENTES DE ENTRADA CONFORME O TIPO */}
                    <div className="pt-1">
                      {/* 1. TIPO CHECKLIST (OK / NÃO / N/A) */}
                      {item.type === 'Checklist (OK/NÃO/N/A)' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleItemChange(item.id, 'OK')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all",
                              item.answer === 'OK'
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> OK
                          </button>

                          <button
                            type="button"
                            onClick={() => handleItemChange(item.id, 'NÃO')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all",
                              item.answer === 'NÃO'
                                ? "bg-rose-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            <XCircle className="w-3.5 h-3.5" /> NÃO
                          </button>

                          <button
                            type="button"
                            onClick={() => handleItemChange(item.id, 'N/A')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all",
                              item.answer === 'N/A'
                                ? "bg-slate-700 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            <MinusCircle className="w-3.5 h-3.5" /> N/A
                          </button>
                        </div>
                      )}

                      {/* 2. TIPO SELEÇÃO ÚNICA */}
                      {item.type === 'Seleção única' && item.options && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleItemChange(item.id, opt)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border",
                                item.answer === opt
                                  ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 3. TIPO SELEÇÃO MÚLTIPLA */}
                      {item.type === 'Seleção múltipla' && item.options && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.options.map((opt) => {
                            const isChecked = item.answer
                              ?.split(';')
                              .map((s) => s.trim())
                              .includes(opt);

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleMultiSelectToggle(item.id, opt)}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1",
                                  isChecked
                                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                )}
                              >
                                {isChecked && <Check className="w-3 h-3 text-emerald-400" />}
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 4. TIPO NÚMERO OU TEXTO OU DATA */}
                      {(item.type === 'Número' || item.type === 'Texto' || item.type === 'Data') && (
                        <div className="relative max-w-md">
                          <Input
                            type={item.type === 'Data' ? 'date' : item.type === 'Número' ? 'number' : 'text'}
                            value={item.answer}
                            readOnly={isSystemProtected && !isUnlocked}
                            onChange={(e) => handleItemChange(item.id, e.target.value)}
                            placeholder={item.type === 'Número' ? '0' : 'Preencha aqui...'}
                            className={cn(
                              "h-8 text-xs font-semibold",
                              isSystemProtected && !isUnlocked
                                ? "bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed select-none"
                                : "bg-slate-50 border-slate-200"
                            )}
                          />
                          {item.unit && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                              {item.unit}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 5. TIPO CALCULADO */}
                      {isCalculated && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200 text-xs">
                          <Calculator className="w-4 h-4 text-orange-600" />
                          <span className="font-semibold text-slate-700">Calculado automaticamente:</span>
                          <strong className="text-orange-900 font-mono text-sm">
                            {item.answer ? `${item.answer} ${item.unit || ''}` : 'Aguardando demanda máxima e margem'}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Observações da linha - sempre editável */}
                    <div className="pt-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Adicionar ou editar observação deste item..."
                        value={item.notes || ''}
                        onChange={(e) => handleItemChange(item.id, item.answer, e.target.value)}
                        className="w-full text-xs text-slate-700 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#E2661D] rounded-lg px-2.5 py-1 outline-none transition-all placeholder:text-slate-400 font-medium"
                      />
                      {item.notes && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(item.id, item.answer, '')}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-slate-100 transition-colors"
                          title="Limpar observação"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

