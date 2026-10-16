"use client";

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Printer,
  Download,
  ArrowRight,
  ArrowLeft,
  X,
  Building2,
  MapPin,
  Calendar,
  HardHat,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileSpreadsheet,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { TechnicalVisit } from '@/types';
import { exportChecklistToExcel } from '@/lib/checklist-sheet';
import { GeneratorChecklistItem } from '@/lib/checklist-generator-data';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface VisitReportPdfModalProps {
  open: boolean;
  onClose: () => void;
  visit: TechnicalVisit;
}

export function VisitReportPdfModal({
  open,
  onClose,
  visit,
}: VisitReportPdfModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handlePrint = () => {
    window.print();
  };

  const client = visit.client;
  const address = client?.address;
  const addressStr = address
    ? `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}, ${address.neighborhood}, ${address.city}/${address.state} - CEP: ${address.cep}`
    : visit.location || 'Não informado';

  const techData = visit.technicalData || {};
  const conclusion = visit.conclusionData || {};

  // Itens do checklist estruturado (114 itens)
  const checklistItems: GeneratorChecklistItem[] = Array.isArray(techData.checklistItems) ? techData.checklistItems : [];
  const hasGeneratorChecklist = checklistItems.length > 0;

  // Extração de métricas-chave do Grupo Gerador
  const demandaItem = checklistItems.find((i) => i.id === 23);
  const margemItem = checklistItems.find((i) => i.id === 96);
  const potenciaCalcItem = checklistItems.find((i) => i.id === 97);
  const geradorSugeridoItem = checklistItems.find((i) => i.id === 98);
  const regimeItem = checklistItems.find((i) => i.id === 20);
  const tensaoItem = checklistItems.find((i) => i.id === 34);
  const localItem = checklistItems.find((i) => i.id === 48);
  const combustivelItem = checklistItems.find((i) => i.id === 65);
  const capacidadeTanqueItem = checklistItems.find((i) => i.id === 66);

  const demandaVal = Number(demandaItem?.answer) || 0;
  const margemVal = Number(margemItem?.answer) || 20;
  const potenciaMinima = demandaVal > 0 ? (demandaVal * (1 + margemVal / 100)).toFixed(1) : (potenciaCalcItem?.answer || null);

  // Não-conformidades / Riscos
  const pendingIssues = checklistItems.filter((i) => {
    const ans = String(i.answer || '').trim().toUpperCase();
    return ans === 'NÃO' || ans === 'NAO';
  });

  // Formatação de data
  const formattedDate = visit.visitDate
    ? new Date(visit.visitDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('pt-BR');

  const visitCode = visit.visitNumber || visit.externalCode || `VT-${visit.id.slice(0, 8).toUpperCase()}`;

  // Categorias em português
  const categoryLabels: Record<string, string> = {
    ELECTRICAL: 'Serviços Elétricos',
    CIVIL: 'Obra Civil',
    MAINTENANCE: 'Manutenção / Geradores',
    OTHER: 'Outros Serviços',
  };
  const categoryLabel = hasGeneratorChecklist
    ? 'Vistoria e Dimensionamento de Grupo Gerador'
    : categoryLabels[visit.serviceCategory || 'ELECTRICAL'] || visit.serviceCategory || 'Serviços Elétricos';

  const viabilityBadge = () => {
    const result = conclusion.result || 'VIABLE';
    if (result === 'VIABLE' || result === 'Viável') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> VIÁVEL
        </span>
      );
    }
    if (result === 'VIABLE_WITH_ADAPTATIONS' || result === 'Viável com adequações') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> VIÁVEL COM ADEQUAÇÕES
        </span>
      );
    }
    if (result === 'UNVIABLE' || result === 'Inviável') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> INVIÁVEL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-300">
        <Clock className="w-3.5 h-3.5 text-slate-600" /> INCONCLUSIVA / RETORNO
      </span>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white w-screen h-screen overflow-hidden animate-in fade-in-0 duration-150">
      {/* Barra superior executiva de ações fixa no topo (não aparece na impressão) */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0C111D] border-b border-gray-800 shadow-md print:hidden z-20">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-300 hover:text-white hover:bg-white/10 h-8 px-2.5 rounded-lg text-xs gap-1.5"
            title="Voltar / Fechar (Esc)"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <div className="h-4 w-px bg-gray-800" />

          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2661D]" />
            <span className="text-xs font-semibold tracking-wide text-gray-200">
              Relatório de Visita Técnica — <span className="font-mono text-white">{visitCode}</span>
            </span>
            <span className="hidden md:inline text-xs text-gray-400">• {client?.companyName || 'Cliente'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasGeneratorChecklist && (
            <Button
              onClick={() => exportChecklistToExcel(checklistItems, `${visitCode}_${client?.companyName || 'CLIENTE'}`)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 px-3 rounded-lg shadow-2xs gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span> (.xlsx)
            </Button>
          )}

          <Link
            href={`/quotes/new?visitId=${visit.id}&clientId=${visit.clientId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-semibold transition-all shadow-2xs"
          >
            Gerar Orçamento
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-white text-gray-900 hover:bg-gray-100 font-semibold text-xs h-8 px-3.5 rounded-lg gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#E2661D]" />
            Imprimir / Salvar PDF
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-lg ml-1"
            title="Fechar (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Folha A4 timbrada de impressão centralizada no visualizador em tela cheia */}
      <main className="flex-1 overflow-y-auto bg-slate-900/95 p-4 sm:p-8 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div
            ref={printAreaRef}
            id="printable-report"
            className="w-full max-w-[210mm] bg-white text-gray-900 shadow-xl rounded-xl p-8 sm:p-12 print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none print:rounded-none font-sans"
            style={{ minHeight: '297mm' }}
          >
            {/* CABEÇALHO OFICIAL SETGEN */}
            <header className="border-b-2 border-gray-900 pb-5 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <Image
                    src="/images/setgen-logo.png"
                    alt="SETGEN - Serviços Técnicos em Geradores de Energia & Serviços"
                    width={220}
                    height={54}
                    className="h-12 w-auto object-contain"
                    priority
                  />
                  <p className="text-[11px] text-gray-500 font-medium pt-1">
                    SETGEN & SERVIÇOS (R G VIEIRA BENTES) • CNPJ: 10.744.400/0001-65 • Manaus / AM
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-block bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-lg mb-1 shadow-2xs">
                    <span className="text-[9px] font-bold text-[#E2661D] uppercase tracking-wider block">
                      Relatório de Visita Técnica
                    </span>
                    <span className="text-sm font-mono font-bold text-gray-900">
                      {visitCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Emissão: <strong className="text-gray-800">{formattedDate}</strong>
                  </p>
                </div>
              </div>
            </header>

            {/* SEÇÃO 1: DADOS CADASTRAIS DO CLIENTE & LOCAL */}
            <section className="mb-5 bg-gray-50/60 rounded-xl p-4 border border-gray-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5 mb-3 border-b border-gray-200/80 pb-2">
                <Building2 className="w-3.5 h-3.5 text-[#E2661D]" />
                1. Identificação do Cliente e Local de Atendimento
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 font-bold block text-[9px] uppercase tracking-wider">Razão Social / Nome</span>
                  <strong className="text-gray-900 text-sm">{client?.companyName || 'Cliente não informado'}</strong>
                  {client?.tradeName && (
                    <span className="text-gray-500 text-[11px] block mt-0.5">Nome Fantasia: {client.tradeName}</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-400 font-bold block text-[9px] uppercase tracking-wider">CNPJ / CPF</span>
                  <span className="font-semibold text-gray-900">{client?.cnpjCpf || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block text-[9px] uppercase tracking-wider">Contatos</span>
                  <span className="font-medium text-gray-700">{client?.phone || 'Telefone não informado'} • {client?.email || 'E-mail não informado'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block text-[9px] uppercase tracking-wider">Endereço do Atendimento</span>
                  <span className="font-medium text-gray-700">{addressStr}</span>
                </div>
              </div>
            </section>

            {/* SEÇÃO 2: DADOS DA VISITA */}
            <section className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs bg-gray-50/70 rounded-xl p-4 border border-gray-200">
              <div className="min-w-0">
                <span className="text-gray-400 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Categoria</span>
                <strong className="text-gray-900 block leading-tight">{categoryLabel}</strong>
              </div>
              <div className="min-w-0">
                <span className="text-gray-400 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Tipo de Visita</span>
                <strong className="text-gray-900 block leading-tight">{visit.visitType || 'TÉCNICA'}</strong>
              </div>
              <div className="min-w-0">
                <span className="text-gray-400 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Técnico Responsável</span>
                <strong className="text-gray-900 block leading-tight">{visit.technician?.name || 'Equipe Técnica Setgen'}</strong>
              </div>
              <div className="min-w-0">
                <span className="text-gray-400 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Prioridade</span>
                <strong className="text-gray-900 block leading-tight">{visit.priority || 'NORMAL'}</strong>
              </div>
            </section>

            {/* RELATO DO CLIENTE & ESCOPO */}
            {(visit.userReport || visit.description) && (
              <section className="mb-6 space-y-3">
                {visit.userReport && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Relato do Solicitante / Cliente
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{visit.userReport}"
                    </p>
                  </div>
                )}
                {visit.description && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Objetivo e Escopo do Levantamento
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {visit.description}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* SEÇÃO 3: LEVANTAMENTO TÉCNICO ESPECÍFICO */}
            <section className="mb-5 border border-gray-200 rounded-xl p-4 bg-white">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#E2661D]" />
                  2. {categoryLabel}
                </span>
                {hasGeneratorChecklist && (
                  <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                    Checklist Oficial • 114 Itens
                  </span>
                )}
              </h2>

              {/* SE TEM CHECKLIST DE GERADOR */}
              {hasGeneratorChecklist ? (
                <div className="space-y-4 text-xs">
                  {/* Painel de Pré-dimensionamento de Cargas */}
                  <div className="bg-[#0C111D] text-white rounded-xl p-4 shadow-sm border border-gray-800">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#E2661D] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#E2661D]" /> Pré-dimensionamento de Potência (Seção 9)
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Potência Mínima = Demanda × (1 + Margem%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Demanda Aferida</span>
                        <strong className="text-base font-bold text-white">
                          {demandaVal > 0 ? `${demandaVal} kVA` : 'Não aferida'}
                        </strong>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Margem Segurança</span>
                        <strong className="text-base font-bold text-[#E2661D]">
                          {margemVal}%
                        </strong>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Potência Mínima</span>
                        <strong className="text-lg font-bold text-emerald-400">
                          {potenciaMinima ? `${potenciaMinima} kVA` : 'A calcular'}
                        </strong>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Gerador Indicado</span>
                        <strong className="text-xs font-bold text-white truncate block">
                          {geradorSugeridoItem?.answer || 'Carenado / Silenciado'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Parâmetros Operacionais e Locais */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-50/70 p-3 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Regime Operação</span>
                      <strong className="text-gray-900">{regimeItem?.answer || 'Emergência (Standby)'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Tensão / Fases</span>
                      <strong className="text-gray-900">{tensaoItem?.answer || techData.nominalVoltage || '380V Trifásico'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Local do Gerador</span>
                      <strong className="text-gray-900">{localItem?.answer || 'Térreo externo'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Combustível / Tanque</span>
                      <strong className="text-gray-900">{combustivelItem?.answer || 'Diesel'} • {capacidadeTanqueItem?.answer || 'Base'}</strong>
                    </div>
                  </div>

                  {/* Quadro de Não-Conformidades e Riscos (Respostas NÃO) */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                        Quadro de Inconformidades e Riscos Identificados em Campo
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pendingIssues.length > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {pendingIssues.length} {pendingIssues.length === 1 ? 'item apontado' : 'itens apontados'}
                      </span>
                    </span>

                    {pendingIssues.length > 0 ? (
                      <div className="border border-red-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-red-50 text-red-900 font-semibold uppercase text-[9px] border-b border-red-200">
                            <tr>
                              <th className="p-2 w-10 text-center">ID</th>
                              <th className="p-2 w-36">Seção</th>
                              <th className="p-2">Item com Pendência / Risco</th>
                              <th className="p-2 w-44">Observações Técnicas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-red-100">
                            {pendingIssues.map((issue) => (
                              <tr key={issue.id} className="hover:bg-red-50/50">
                                <td className="p-2 text-center font-mono font-bold text-red-700">{issue.id}</td>
                                <td className="p-2 font-medium text-gray-700">{issue.section}</td>
                                <td className="p-2 font-semibold text-gray-900">{issue.field}</td>
                                <td className="p-2 italic text-gray-600">{issue.notes || 'Sem observações'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-medium text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Nenhuma não-conformidade crítica identificada nos 114 itens de vistoria. Instalação preliminarmente apta.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Fallback para visitas elétricas convencionais */
                (visit.serviceCategory === 'ELECTRICAL' || !visit.serviceCategory) && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/70 p-3 rounded-lg border border-gray-200">
                      <div>
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Tipo Instalação</span>
                        <strong className="text-gray-900">{techData.installationType || 'Comercial'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Tensão Nominal</span>
                        <strong className="text-gray-900">{techData.nominalVoltage || '380V'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Alimentação</span>
                        <strong className="text-gray-900">{techData.powerPhase || 'Trifásica'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Condição Quadro</span>
                        <strong className="text-gray-900">{techData.panelCondition || 'Regular'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Proteções/Disjuntores</span>
                        <strong className="text-gray-900">{techData.circuitBreakers || 'Conforme'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Aterramento</span>
                        <strong className="text-gray-900">{techData.grounding || 'Existente'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Cabos e Conexões</span>
                        <strong className="text-gray-900">{techData.cabling || 'Adequados visualmente'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Sistema Avaliado</span>
                        <strong className="text-gray-900">{techData.systemEvaluated || 'Quadro Geral / Entrada'}</strong>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Tabela de medições */}
              {Array.isArray(techData.measurements) && techData.measurements.length > 0 && (
                <div className="mt-3">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Medições e Parâmetros Elétricos
                  </span>
                  <table className="w-full text-left border border-gray-200 rounded-lg overflow-hidden text-xs">
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-[10px] border-b border-gray-200">
                      <tr>
                        <th className="p-2">Grandeza</th>
                        <th className="p-2">Ponto de Medição</th>
                        <th className="p-2 text-right">Valor Aferido</th>
                        <th className="p-2">Unidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {techData.measurements.map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 font-medium text-gray-900">{m.parameter || m.name}</td>
                          <td className="p-2 text-gray-600">{m.point || '-'}</td>
                          <td className="p-2 text-right font-mono font-bold text-gray-900">{m.value}</td>
                          <td className="p-2 text-gray-500">{m.unit || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Anomalias identificadas */}
              {techData.anomalies && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block mb-1">
                    Anomalias Identificadas / Risco
                  </span>
                  <p className="text-xs text-red-950 font-medium whitespace-pre-wrap">{techData.anomalies}</p>
                </div>
              )}

              {/* Se Obra Civil */}
              {visit.serviceCategory === 'CIVIL' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/70 p-3 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Intervenção</span>
                      <strong className="text-gray-900">{techData.civilType || 'Reparo / Adequação'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Ambiente/Local</span>
                      <strong className="text-gray-900">{techData.civilArea || 'Área Técnica'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Elemento Avaliado</span>
                      <strong className="text-gray-900">{techData.civilElement || 'Piso / Base'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Estado Encontrado</span>
                      <strong className="text-gray-900">{techData.civilCondition || 'Regular'}</strong>
                    </div>
                  </div>
                  {techData.civilDimensions && (
                    <p className="text-xs text-gray-700">
                      <strong>Dimensões estimadas:</strong> {techData.civilDimensions}
                    </p>
                  )}
                  {techData.civilPathologies && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                        Patologias e Danos Identificados
                      </span>
                      <p className="text-xs text-amber-950">{techData.civilPathologies}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Se Manutenção */}
              {visit.serviceCategory === 'MAINTENANCE' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/70 p-3 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Equipamento</span>
                      <strong className="text-gray-900">{techData.equipmentName || 'Grupo Gerador'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Tag / Patrimônio</span>
                      <strong className="text-gray-900">{techData.equipmentTag || 'Não informado'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Horímetro</span>
                      <strong className="text-gray-900">{techData.hourMeter ? `${techData.hourMeter} h` : 'Não aferido'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block">Estado</span>
                      <strong className="text-gray-900">{techData.maintCondition || 'Inoperante'}</strong>
                    </div>
                  </div>
                  {techData.maintDiagnosis && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Diagnóstico Preliminar
                      </span>
                      <p className="text-xs text-gray-800 font-medium">{techData.maintDiagnosis}</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* SEÇÃO 4: REGISTRO FOTOGRÁFICO E EVIDÊNCIAS */}
            {Array.isArray(visit.attachmentsData) && visit.attachmentsData.length > 0 && (
              <section className="mb-5 border border-gray-200 rounded-xl p-4 bg-white">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5 mb-3 border-b border-gray-200 pb-2">
                  3. Registro Fotográfico de Evidências ({visit.attachmentsData.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {visit.attachmentsData.map((att: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex flex-col">
                      <div className="aspect-video w-full bg-gray-200 relative overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={att.url}
                          alt={att.legend || `Evidência ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-[10px] bg-white flex-1 flex flex-col justify-between border-t border-gray-100">
                        <span className="font-semibold text-gray-900 line-clamp-2">
                          {att.legend || `Evidência #${idx + 1}`}
                        </span>
                        {att.classification && (
                          <span className="inline-block mt-1 text-[9px] uppercase font-bold text-[#E2661D]">
                            {att.classification}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SEÇÃO 5: CONCLUSÃO, DIAGNÓSTICO & ENCAMINHAMENTOS */}
            <section className="mb-5 border border-gray-200 rounded-xl p-4 bg-white space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center justify-between border-b border-gray-200 pb-2">
                <span>4. Parecer Técnico Conclusivo e Encaminhamentos</span>
                {viabilityBadge()}
              </h2>

              <div className="text-xs space-y-3">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Resumo do Diagnóstico Técnico
                  </span>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                    {conclusion.diagnosisSummary || visit.notes || 'Levantamento técnico realizado conforme padrões operacionais da Setgen.'}
                  </p>
                </div>

                {conclusion.nextSteps && (
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Próximos Passos Recomendados
                    </span>
                    <p className="text-xs text-gray-800 font-semibold">
                      {Array.isArray(conclusion.nextSteps) ? conclusion.nextSteps.join(' • ') : conclusion.nextSteps}
                    </p>
                  </div>
                )}

                {/* Materiais e Serviços Estimados Preliminares */}
                {Array.isArray(conclusion.estimatedItems) && conclusion.estimatedItems.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Materiais e Serviços Estimados Preliminarmente
                    </span>
                    <table className="w-full text-left border border-gray-200 rounded-lg overflow-hidden text-xs">
                      <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-[10px] border-b border-gray-200">
                        <tr>
                          <th className="p-2">Item / Descrição</th>
                          <th className="p-2 text-right">Qtd Estimada</th>
                          <th className="p-2">Unidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {conclusion.estimatedItems.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium text-gray-800">{item.name || item.description}</td>
                            <td className="p-2 text-right font-bold text-gray-900">{item.quantity || 1}</td>
                            <td className="p-2 text-gray-500">{item.unit || 'un'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* SEÇÃO 6: ASSINATURAS DIGITAIS COLETADAS */}
            <section className="mb-6 pt-4 border-t-2 border-gray-200">
              <div className="grid grid-cols-2 gap-8 text-center">
                {/* Assinatura Técnico */}
                <div className="flex flex-col items-center">
                  <div className="h-20 w-48 border-b border-gray-400 flex items-center justify-center mb-2 overflow-hidden">
                    {visit.technicianSignature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={visit.technicianSignature}
                        alt="Assinatura Técnico"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Assinatura digital registrada</span>
                    )}
                  </div>
                  <strong className="text-xs text-gray-900 block">
                    {visit.technician?.name || 'Responsável Técnico Setgen'}
                  </strong>
                  <span className="text-[10px] text-gray-500 font-medium">Técnico Responsável</span>
                </div>

                {/* Assinatura Cliente */}
                <div className="flex flex-col items-center">
                  <div className="h-20 w-48 border-b border-gray-400 flex items-center justify-center mb-2 overflow-hidden">
                    {visit.clientSignatureRefused ? (
                      <div className="text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded border border-red-200">
                        Ciência dispensada / recusada: {visit.clientRefusalReason || 'Ausência de preposto no local'}
                      </div>
                    ) : visit.clientSignature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={visit.clientSignature}
                        alt="Assinatura Cliente"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Assinatura do cliente</span>
                    )}
                  </div>
                  <strong className="text-xs text-gray-900 block">
                    {visit.clientSignerName || client?.companyName || 'Cliente / Responsável'}
                  </strong>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {visit.clientSignerDocument ? `Doc: ${visit.clientSignerDocument}` : 'Ciência do Atendimento'}
                  </span>
                </div>
              </div>
            </section>

            {/* RODAPÉ INSTITUCIONAL */}
            <footer className="text-center pt-4 border-t border-gray-200 text-[10px] text-gray-400 font-medium space-y-1">
              <p>
                SETGEN & SERVIÇOS (R G VIEIRA BENTES) • CNPJ 10.744.400/0001-65
              </p>
              <p>
                Documento emitido eletronicamente em {new Date().toLocaleDateString('pt-BR')} via Sistema de Gestão Setgen • {visitCode}
              </p>
            </footer>
          </div>
      </main>
    </div>
  );
}

