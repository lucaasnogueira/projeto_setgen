"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { useCanViewValues } from '@/lib/permissions';
import {
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  HardHat,
  Navigation,
  LogOut,
  AlertTriangle,
  Tag,
  Hash,
  DollarSign,
  Zap,
  FileText,
  Printer,
  ArrowRight,
  ArrowLeft,
  Wrench,
  FileSpreadsheet,
  Camera,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Info,
  RotateCcw,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GeneratorChecklistView } from "@/components/visits/GeneratorChecklistView";
import { GeneratorChecklistItem, DEFAULT_GENERATOR_CHECKLIST } from '@/lib/checklist-generator-data';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Mapeamento e tradução de Status para Português
const VISIT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  SCHEDULED: { label: 'Agendada', bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', border: 'border-amber-200' },
  CONFIRMED: { label: 'Confirmada', bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-500', border: 'border-blue-200' },
  EN_ROUTE: { label: 'A Caminho', bg: 'bg-indigo-50', text: 'text-indigo-800', dot: 'bg-indigo-500', border: 'border-indigo-200' },
  IN_PROGRESS: { label: 'Em Andamento', bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-500', border: 'border-sky-200' },
  COMPLETED: { label: 'Concluída', bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  CANCELLED: { label: 'Cancelada', bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', border: 'border-rose-200' },
  RESCHEDULED: { label: 'Reagendada', bg: 'bg-purple-50', text: 'text-purple-800', dot: 'bg-purple-500', border: 'border-purple-200' },
};

// Mapeamento e tradução de Tipo de Visita para Português
const VISIT_TYPE_LABELS: Record<string, string> = {
  TECHNICAL: 'Visita Técnica',
  COMMERCIAL: 'Visita Comercial',
  MAINTENANCE: 'Manutenção Preventiva / Corretiva',
  INSPECTION: 'Inspeção / Vistoria',
  EMERGENCY: 'Atendimento de Emergência',
};

// Mapeamento e tradução de Parecer Técnico / Conclusão para Português
const CONCLUSION_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  VIABLE: { label: 'Viável para Manutenção', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  VIABLE_WITH_ADAPTATIONS: { label: 'Viável com Adequações', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  INVIABLE: { label: 'Inviável / Reforma Crítica', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  UNVIABLE: { label: 'Inviável / Reforma Crítica', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  PENDING: { label: 'Parecer Pendente', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  APPROVED: { label: 'Aprovado Tecnicamente', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  REJECTED: { label: 'Reprovado Tecnicamente', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
};

// Mapeamento e tradução de Prioridade para Português
const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  LOW: { label: 'Baixa', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  MEDIUM: { label: 'Média', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  HIGH: { label: 'Alta', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  URGENT: { label: 'Urgente', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
};

// Formatação amigável de data/hora (sem 00:00:00 quando não aplicável)
function formatVisitDateTime(dateStr?: string | null) {
  if (!dateStr) return 'Data não informada';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const isMidnight =
    dateStr.includes('T00:00:00') ||
    dateStr.endsWith('00:00:00') ||
    (d.getUTCHours() === 0 && d.getUTCMinutes() === 0);

  if (isMidnight) {
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Manaus' });
  }

  const datePart = d.toLocaleDateString('pt-BR', { timeZone: 'America/Manaus' });
  const timePart = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Manaus' });
  return `${datePart} às ${timePart}`;
}

function ExecutiveInfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-2 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <div className="text-slate-900 font-medium text-xs sm:text-[13px] mt-0.5">{children}</div>
      </div>
    </div>
  );
}

export default function VisitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const canViewValues = useCanViewValues();
  const [visit, setVisit] = useState<TechnicalVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadVisit();
    }
  }, [params.id]);

  const loadVisit = async () => {
    try {
      const data = await visitsApi.getOne(params.id as string);
      setVisit(data);
    } catch (error) {
      console.error('Error loading visit:', error);
      alert('Erro ao carregar detalhes da visita técnica');
      router.push('/visits');
    } finally {
      setLoading(false);
    }
  };

  const [completingVisit, setCompletingVisit] = useState(false);
  const [reopeningVisit, setReopeningVisit] = useState(false);

  const handleCompleteVisit = async () => {
    if (!visit) return;
    const confirmed = window.confirm(
      'Deseja finalizar esta visita técnica?\n\n' +
      'O status será atualizado para "Concluída" e a emissão do orçamento comercial será liberada.'
    );
    if (!confirmed) return;

    setCompletingVisit(true);
    try {
      const updated = await visitsApi.update(visit.id, {
        status: 'COMPLETED' as any,
      });
      setVisit((prev) => (prev ? { ...prev, ...updated, status: 'COMPLETED' as any } : null));
      toast.success('Visita técnica finalizada com sucesso! A geração de orçamento comercial está liberada.');
    } catch (err: any) {
      console.error('Error completing visit:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao finalizar visita técnica');
    } finally {
      setCompletingVisit(false);
    }
  };

  const handleReopenVisit = async () => {
    if (!visit) return;
    const confirmed = window.confirm(
      'Deseja reabrir esta visita técnica para edição e novos apontamentos de campo?'
    );
    if (!confirmed) return;

    setReopeningVisit(true);
    try {
      const updated = await visitsApi.update(visit.id, {
        status: 'IN_PROGRESS' as any,
      });
      setVisit((prev) => (prev ? { ...prev, ...updated, status: 'IN_PROGRESS' as any } : null));
      toast.success('Visita técnica reaberta com sucesso.');
    } catch (err: any) {
      console.error('Error reopening visit:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao reabrir visita técnica');
    } finally {
      setReopeningVisit(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta visita técnica?')) return;

    try {
      await visitsApi.delete(params.id as string);
      alert('Visita excluída com sucesso!');
      router.push('/visits');
    } catch (error) {
      alert('Erro ao excluir visita');
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada neste navegador'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
      });
    });
  };

  const geoErrorMessage = (error: GeolocationPositionError) => {
    if (error.code === error.PERMISSION_DENIED) {
      return 'Permissão de localização negada. Habilite o acesso ao GPS no navegador.';
    }
    if (error.code === error.TIMEOUT) {
      return 'Tempo limite esgotado ao obter sinal de GPS. Tente novamente.';
    }
    return 'Não foi possível obter as coordenadas de localização.';
  };

  const handleCheckin = async () => {
    setGeoError(null);
    setCheckinLoading(true);
    try {
      const position = await getCurrentPosition();
      const updated = await visitsApi.checkin(params.id as string, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setVisit(updated);
    } catch (error: any) {
      setGeoError(
        error instanceof GeolocationPositionError
          ? geoErrorMessage(error)
          : error?.response?.data?.message || error?.message || 'Erro ao registrar entrada (check-in)',
      );
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleCheckout = async () => {
    setGeoError(null);
    setCheckoutLoading(true);
    try {
      const position = await getCurrentPosition();
      const updated = await visitsApi.checkout(params.id as string, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setVisit(updated);
    } catch (error: any) {
      setGeoError(
        error instanceof GeolocationPositionError
          ? geoErrorMessage(error)
          : error?.response?.data?.message || error?.message || 'Erro ao registrar saída (check-out)',
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Consolidação padronizada do Checklist (114 itens)
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

    // Auto-preenchimento padronizado dos dados cadastrais e do sistema
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

  // Extração rápida de dados do gerador preenchidos no checklist
  const generatorDataFromChecklist = useMemo(() => {
    const getAnswer = (id: number) => checklistItems.find((i) => i.id === id)?.answer || '';
    return {
      engineBrand: getAnswer(14),
      engineModel: getAnswer(15),
      generatorBrand: getAnswer(16),
      generatorModel: getAnswer(17),
      powerKva: getAnswer(20) || getAnswer(18),
      hoursMeter: getAnswer(24) || getAnswer(25),
      voltage: getAnswer(21),
    };
  }, [checklistItems]);

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E2661D]" />
        <p className="text-xs text-slate-500 font-medium">Carregando visita técnica...</p>
      </div>
    );
  }

  if (!visit) return null;

  const visitCode = visit.visitNumber || visit.externalCode || `VT-${visit.id.slice(0, 8).toUpperCase()}`;
  const isCompleted = visit.status === 'COMPLETED';

  // Configuração semântica de status traduzido
  const statusCfg = (visit.status && VISIT_STATUS_CONFIG[visit.status]) || {
    label: visit.status || 'Agendada',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    dot: 'bg-slate-500',
    border: 'border-slate-200',
  };

  // Parecer Técnico / Conclusão
  const conclusionResult = visit.conclusionData?.result;
  const conclusionCfg = conclusionResult ? CONCLUSION_CONFIG[conclusionResult] || {
    label: conclusionResult,
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
  } : null;

  // Prioridade
  const priorityCfg = visit.priority ? PRIORITY_CONFIG[visit.priority] || {
    label: visit.priority,
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
  } : null;

  // Tipo de Visita
  const visitTypeLabel = VISIT_TYPE_LABELS[visit.visitType] || visit.visitType || 'Visita Técnica';

  // Endereço completo formatado
  const addressObj = visit.client?.address;
  const fullAddress = addressObj
    ? `${addressObj.street || ''}, ${addressObj.number || 'S/N'}${addressObj.complement ? ` - ${addressObj.complement}` : ''}, ${addressObj.neighborhood || ''} - ${addressObj.city || 'Manaus'}/${addressObj.state || 'AM'}`
    : visit.location || 'Localização não informada';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-16">
      {/* 1. CABEÇALHO EXECUTIVO PADRÃO SETGEN */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        {/* Barra superior de navegação, status e ações primárias */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/visits')}
              className="p-1.5 -ml-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Voltar para Gestão de Visitas"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Visitas</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Protocolo da Visita */}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-50 text-[#E2661D] border border-orange-200">
                {visitCode}
              </span>

              {/* Status Traduzido com Indicador Circular */}
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                statusCfg.bg,
                statusCfg.text,
                statusCfg.border
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                {statusCfg.label}
              </span>

              {/* Parecer / Conclusão Técnica Traduzida */}
              {conclusionCfg && (
                <span className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs",
                  conclusionCfg.bg,
                  conclusionCfg.text,
                  conclusionCfg.border
                )}>
                  <ShieldCheck className="w-3.5 h-3.5 text-current" />
                  {conclusionCfg.label}
                </span>
              )}
            </div>
          </div>

          {/* BARRA DE AÇÕES PRINCIPAIS */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/visits/${visit.id}/report`}>
              <Button
                className="bg-slate-900 hover:bg-black text-white text-xs font-semibold h-9 px-3.5 rounded-lg shadow-2xs gap-1.5"
              >
                <Printer className="h-3.5 w-3.5 text-[#E2661D]" />
                Emitir Relatório PDF
              </Button>
            </Link>

            <Link href={`/visits/${visit.id}/execution`}>
              <Button
                variant="outline"
                className="bg-white hover:bg-slate-50 text-slate-800 border-slate-200 text-xs font-semibold h-9 px-3.5 rounded-lg shadow-2xs gap-1.5"
              >
                <Wrench className="h-3.5 w-3.5 text-[#E2661D]" />
                Preencher / Editar Formulário
              </Button>
            </Link>

            {/* BOTÃO FINALIZAR VISITA OU GERAR ORÇAMENTO CONDICIONADO */}
            {!isCompleted ? (
              <>
                <Button
                  onClick={handleCompleteVisit}
                  disabled={completingVisit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-3.5 rounded-lg shadow-2xs gap-1.5 transition-all"
                  title="Concluir a visita técnica para liberar a emissão do orçamento comercial"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completingVisit ? 'Finalizando...' : 'Finalizar Visita'}
                </Button>

                <Button
                  disabled
                  variant="outline"
                  className="bg-slate-50 text-slate-400 border-slate-200 text-xs font-semibold h-9 px-3 rounded-lg gap-1.5 cursor-not-allowed opacity-75"
                  title="Finalize a visita técnica primeiro para liberar a geração do orçamento"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Gerar Orçamento
                  <span className="text-[10px] font-normal text-slate-400 ml-0.5">(Aguardando Conclusão)</span>
                </Button>
              </>
            ) : (
              <>
                <Link href={`/quotes/new?visitId=${visit.id}&clientId=${visit.clientId}`}>
                  <Button className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-bold h-9 px-4 rounded-lg shadow-2xs gap-1.5 animate-in fade-in">
                    <ArrowRight className="h-3.5 w-3.5" />
                    Gerar Orçamento
                  </Button>
                </Link>

                {(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) && (
                  <Button
                    variant="ghost"
                    onClick={handleReopenVisit}
                    disabled={reopeningVisit}
                    className="text-slate-500 hover:text-slate-800 text-xs font-medium h-9 px-2.5 rounded-lg gap-1"
                    title="Reabrir visita para edição e novos apontamentos"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 text-slate-400 ${reopeningVisit ? 'animate-spin' : ''}`} />
                    {reopeningVisit ? 'Reabrindo...' : 'Reabrir Visita'}
                  </Button>
                )}
              </>
            )}

            <Link href={`/visits/${visit.id}/edit`}>
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium h-9 px-2.5 rounded-lg gap-1"
                title="Editar data, horário ou técnico responsável"
              >
                <Edit className="h-3.5 w-3.5 text-slate-400" />
                Editar Agendamento
              </Button>
            </Link>

            {canDelete && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-medium h-9 px-2.5 rounded-lg"
                title="Excluir visita técnica"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Identificação do Cliente e Metadados Técnicos */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {visit.client?.companyName || 'Cliente não identificado'}
              </h1>
              {visit.client?.cnpjCpf && (
                <span className="text-[11px] font-mono text-slate-400 font-medium">
                  ({visit.client.cnpjCpf})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              {visit.client?.tradeName && <span className="font-semibold text-slate-700">{visit.client.tradeName}</span>}
              {visit.client?.tradeName && <span>•</span>}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                {fullAddress}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="h-3.5 w-3.5 text-[#E2661D]" />
              <strong>Data:</strong> {formatVisitDateTime(visit.visitDate)}
            </span>
            <span className="flex items-center gap-1.5 font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <HardHat className="h-3.5 w-3.5 text-[#E2661D]" />
              <strong>Técnico:</strong> {visit.technician?.name || (visit as any).assignedTo?.name || 'Equipe Técnica Setgen'}
            </span>
          </div>
        </div>
      </div>

      {/* BANNER DE FLUXO OPERACIONAL (CONCLUÍDA VS EM ANDAMENTO) */}
      {isCompleted ? (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs sm:text-sm">
                Visita Técnica Concluída — Orçamento Liberado
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                O levantamento técnico em campo foi finalizado. Você já pode emitir a proposta comercial vinculada aos dados desta visita.
              </p>
            </div>
          </div>
          <Link href={`/quotes/new?visitId=${visit.id}&clientId=${visit.clientId}`} className="shrink-0">
            <Button className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-bold h-9 px-4 rounded-xl shadow-2xs gap-1.5 w-full sm:w-auto">
              <ArrowRight className="h-4 w-4" />
              Gerar Orçamento Comercial
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-amber-900 font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Esta visita técnica está em andamento (status: <strong>{statusCfg.label}</strong>). Para emitir a proposta comercial vinculada, conclua a inspeção e clique em <strong>"Finalizar Visita"</strong>.
            </span>
          </div>
          <Button
            onClick={handleCompleteVisit}
            disabled={completingVisit}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3.5 rounded-lg shrink-0 gap-1.5 shadow-2xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {completingVisit ? 'Finalizando...' : 'Finalizar Visita Agora'}
          </Button>
        </div>
      )}

      {/* 2. ABAS PRINCIPAIS */}
      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
          <TabsTrigger
            value="checklist"
            className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#E2661D]" />
            Formulário Técnico & Checklist (114)
          </TabsTrigger>
          <TabsTrigger
            value="agendamento"
            className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Dados do Agendamento & Escopo
          </TabsTrigger>
          <TabsTrigger
            value="fotos"
            className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-slate-500" />
            Fotos e Evidências ({visit.attachmentsData?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="checkin"
            className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-slate-500" />
            Registro de Ponto & GPS (Check-in)
          </TabsTrigger>
        </TabsList>

        {/* ABA 1 (PADRÃO): FORMULÁRIO TÉCNICO ESTRUTURADO (FORMS) */}
        <TabsContent value="checklist" className="mt-0">
          <GeneratorChecklistView
            items={checklistItems}
            visitCode={visitCode}
            clientName={visit.client?.companyName}
            visitId={visit.id}
          />
        </TabsContent>

        {/* ABA 2: DADOS DO AGENDAMENTO & ESCOPO (TOTALMENTE MODERNIZADA) */}
        <TabsContent value="agendamento" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CARD 1: DADOS DO CLIENTE E LOCAL */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#E2661D]" />
                  Cliente & Localização
                </span>
                {visit.client && (
                  <Link
                    href={`/clients/${visit.client.id}`}
                    className="text-[11px] font-semibold text-[#E2661D] hover:underline flex items-center gap-1"
                  >
                    Ver Cadastro <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <div className="space-y-3">
                <ExecutiveInfoRow icon={Building2} label="Razão Social / Fantasia">
                  <span className="font-bold text-slate-900">{visit.client?.companyName || 'Não informado'}</span>
                  {visit.client?.tradeName && (
                    <span className="block text-[11px] text-slate-500 mt-0.5">{visit.client.tradeName}</span>
                  )}
                </ExecutiveInfoRow>

                <ExecutiveInfoRow icon={Hash} label="CNPJ / CPF">
                  <span className="font-mono text-slate-800">{visit.client?.cnpjCpf || 'Não informado'}</span>
                </ExecutiveInfoRow>

                <ExecutiveInfoRow icon={MapPin} label="Endereço de Atendimento">
                  <span className="text-slate-800">{fullAddress}</span>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-[11px] font-bold text-[#E2661D] hover:underline flex items-center gap-1"
                  >
                    Abrir no Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </ExecutiveInfoRow>

                {visit.client?.phone && (
                  <ExecutiveInfoRow icon={Phone} label="Telefone / Contato">
                    <a href={`tel:${visit.client.phone}`} className="text-slate-800 hover:text-[#E2661D]">
                      {visit.client.phone}
                    </a>
                  </ExecutiveInfoRow>
                )}

                {visit.client?.email && (
                  <ExecutiveInfoRow icon={Mail} label="E-mail de Contato">
                    <a href={`mailto:${visit.client.email}`} className="text-slate-800 hover:text-[#E2661D] truncate block">
                      {visit.client.email}
                    </a>
                  </ExecutiveInfoRow>
                )}
              </div>
            </div>

            {/* CARD 2: ESCOPO E SOLICITAÇÃO TÉCNICA */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <FileText className="h-4 w-4 text-[#E2661D]" />
                Escopo e Solicitação Técnica
              </div>

              <div className="space-y-3.5">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Objetivo / Descrição da Visita
                  </h4>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {visit.description || 'Visita técnica de inspeção e levantamento em grupo gerador.'}
                  </p>
                </div>

                {visit.userReport && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Relato do Cliente / Problemas Relatados
                    </h4>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                      {visit.userReport}
                    </p>
                  </div>
                )}

                {visit.notes && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Orientações de Segurança / Portaria
                    </h4>
                    <p className="text-xs text-slate-700 italic leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-200">
                      "{visit.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 3: PARÂMETROS OPERACIONAIS E SLA */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Parâmetros Operacionais & SLA
              </div>

              <div className="space-y-3">
                <ExecutiveInfoRow icon={HardHat} label="Técnico Responsável">
                  <span className="font-bold text-slate-900">
                    {visit.technician?.name || (visit as any).assignedTo?.name || 'Não atribuído'}
                  </span>
                </ExecutiveInfoRow>

                <ExecutiveInfoRow icon={Clock} label="Tipo de Atendimento">
                  <span className="font-semibold text-slate-800">{visitTypeLabel}</span>
                </ExecutiveInfoRow>

                <ExecutiveInfoRow icon={Calendar} label="Data e Horário do Agendamento">
                  <span className="font-semibold text-slate-800">{formatVisitDateTime(visit.visitDate)}</span>
                </ExecutiveInfoRow>

                <ExecutiveInfoRow icon={AlertTriangle} label="Nível de Prioridade">
                  {priorityCfg ? (
                    <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border", priorityCfg.bg, priorityCfg.text, priorityCfg.border)}>
                      {priorityCfg.label}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-xs">Média</span>
                  )}
                </ExecutiveInfoRow>

                {conclusionCfg && (
                  <ExecutiveInfoRow icon={ShieldCheck} label="Parecer de Viabilidade Técnica">
                    <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border", conclusionCfg.bg, conclusionCfg.text, conclusionCfg.border)}>
                      {conclusionCfg.label}
                    </span>
                  </ExecutiveInfoRow>
                )}

                {visit.taskType && (
                  <ExecutiveInfoRow icon={Tag} label="Classificação de Tarefa">
                    <span className="text-slate-800">{visit.taskType.name}</span>
                  </ExecutiveInfoRow>
                )}

                {canViewValues && visit.actualValue != null && Number(visit.actualValue) > 0 && (
                  <ExecutiveInfoRow icon={DollarSign} label="Valor Cobrado do Atendimento">
                    <span className="font-bold text-emerald-700">
                      {Number(visit.actualValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </ExecutiveInfoRow>
                )}
              </div>
            </div>
          </div>

          {/* CARD 4: GRUPO GERADOR & ESPECIFICAÇÕES TÉCNICAS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#E2661D]" />
                  Grupo Gerador Inspecionado
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dados do motor, alternador e especificações identificadas na visita técnica
                </p>
              </div>

              <Link href={`/visits/${visit.id}/execution`}>
                <Button size="sm" variant="outline" className="text-xs font-semibold h-8 rounded-lg gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#E2661D]" />
                  Editar Dados no Checklist
                </Button>
              </Link>
            </div>

            {Array.isArray(visit.equipments) && visit.equipments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {visit.equipments.map((link) => (
                  <div key={link.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <p className="text-xs font-bold text-slate-900">
                      {link.equipment?.brand || 'Marca não informada'} {link.equipment?.model}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Série: {link.equipment?.serialNumber || 'S/N'}
                    </p>
                    {(link.equipment?.powerRating || (link.equipment as any)?.capacityKva) && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-[#E2661D]">
                        {link.equipment?.powerRating || `${(link.equipment as any)?.capacityKva} kVA`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Potência</span>
                  <strong className="text-xs text-slate-900 font-mono">
                    {generatorDataFromChecklist.powerKva ? `${generatorDataFromChecklist.powerKva} kVA` : 'A definir'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Motor</span>
                  <strong className="text-xs text-slate-900 truncate block">
                    {generatorDataFromChecklist.engineBrand || 'Não preenchido'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Modelo Motor</span>
                  <strong className="text-xs text-slate-900 truncate block">
                    {generatorDataFromChecklist.engineModel || 'Não preenchido'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alternador</span>
                  <strong className="text-xs text-slate-900 truncate block">
                    {generatorDataFromChecklist.generatorBrand || 'Não preenchido'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tensão</span>
                  <strong className="text-xs text-slate-900">
                    {generatorDataFromChecklist.voltage || 'Trifásico'}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horímetro</span>
                  <strong className="text-xs text-slate-900 font-mono">
                    {generatorDataFromChecklist.hoursMeter ? `${generatorDataFromChecklist.hoursMeter} h` : 'Pendente'}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ABA 3: FOTOS E EVIDÊNCIAS */}
        <TabsContent value="fotos" className="mt-0">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#E2661D]" />
                  Fotos e Evidências Fotográficas do Local
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registros capturados durante a inspeção técnica em campo
                </p>
              </div>
              <Link href={`/visits/${visit.id}/execution`}>
                <Button size="sm" variant="outline" className="text-xs font-semibold h-8 rounded-lg gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  Gerenciar Fotos
                </Button>
              </Link>
            </div>

            {Array.isArray(visit.attachmentsData) && visit.attachmentsData.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {visit.attachmentsData.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl border border-slate-200 overflow-hidden hover:border-[#E2661D] transition-colors shadow-2xs"
                  >
                    <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                      {/^https?:\/\/.+\.(jpe?g|png|gif|webp)(\?|$)/i.test(att.url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={att.url} alt={att.legend || 'Anexo'} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <FileText className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    {att.legend && (
                      <p className="text-[11px] text-slate-700 font-medium px-2.5 py-1.5 truncate bg-white border-t border-slate-100">
                        {att.legend}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Camera className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">Nenhuma evidência fotográfica registrada até o momento.</p>
                <Link href={`/visits/${visit.id}/execution`}>
                  <Button size="sm" variant="outline" className="text-xs font-semibold h-8 mt-2 rounded-lg gap-1.5">
                    Adicionar Fotos na Execução
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ABA 4: REGISTRO DE PONTO & GPS */}
        <TabsContent value="checkin" className="mt-0">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 max-w-xl shadow-2xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Navigation className="h-4 w-4 text-[#E2661D]" />
              Registro de Ponto & Geolocalização GPS
            </div>

            {geoError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                {geoError}
              </p>
            )}

            {visit.checkinAt ? (
              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Navigation className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Entrada no Local (Check-in)</p>
                  <p className="text-slate-900 font-bold text-xs mt-0.5">{new Date(visit.checkinAt).toLocaleString('pt-BR')}</p>
                  {visit.checkinDistanceMeters != null && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{visit.checkinDistanceMeters}m de distância do local cadastrado do cliente</p>
                  )}
                  {visit.checkinImprecise && (
                    <p className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Atenção: Margem de imprecisão de GPS elevada na entrada
                    </p>
                  )}
                  {visit.checkinLat != null && visit.checkinLng != null && (
                    <a
                      href={`https://www.google.com/maps?q=${visit.checkinLat},${visit.checkinLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#E2661D] hover:underline inline-block mt-1"
                    >
                      Visualizar localização no Google Maps →
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <Button
                onClick={handleCheckin}
                disabled={checkinLoading}
                className="w-full h-10 rounded-xl font-bold text-xs bg-[#E2661D] hover:bg-[#c95716] text-white shadow-2xs gap-2"
              >
                <Navigation className="h-4 w-4" />
                {checkinLoading ? 'Obtendo coordenadas GPS...' : 'Registrar Entrada no Local (Check-in)'}
              </Button>
            )}

            {visit.checkinAt && (
              visit.checkoutAt ? (
                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saída do Local (Check-out)</p>
                    <p className="text-slate-900 font-bold text-xs mt-0.5">{new Date(visit.checkoutAt).toLocaleString('pt-BR')}</p>
                    {visit.checkoutDistanceMeters != null && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{visit.checkoutDistanceMeters}m de distância do local cadastrado do cliente</p>
                    )}
                    {visit.checkoutImprecise && (
                      <p className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Atenção: Margem de imprecisão de GPS elevada na saída
                      </p>
                    )}
                    {visit.checkoutLat != null && visit.checkoutLng != null && (
                      <a
                        href={`https://www.google.com/maps?q=${visit.checkoutLat},${visit.checkoutLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#E2661D] hover:underline inline-block mt-1"
                      >
                        Visualizar localização no Google Maps →
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  variant="outline"
                  className="w-full h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-800 hover:bg-slate-50 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {checkoutLoading ? 'Obtendo coordenadas GPS...' : 'Registrar Saída do Local (Check-out)'}
                </Button>
              )
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
