"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Calendar,
  Star,
  Shield,
  Trash2,
  Paperclip,
  Check,
  Plus,
  Clock,
  Phone,
  Building,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Calculator,
  FileSignature,
  ShieldCheck,
  Wrench,
  ClipboardCheck,
  PenTool,
  Receipt,
  HeartHandshake,
} from "lucide-react";
import { ClientProcess, ProcessStage } from "../data/mock-operations";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type StepperVisualMode = "cards" | "ribbon" | "timeline";

interface OperationProcessCardProps {
  process: ClientProcess;
  visualMode?: StepperVisualMode;
  onOpenStage: (process: ClientProcess, stage: ProcessStage) => void;
  onQuickToggleStage: (processId: string, stageId: string) => void;
  onDeleteProcess: (processId: string) => void;
  onFollowUp: (process: ClientProcess) => void;
}

const STAGE_ICONS: Record<string, any> = {
  visita: ClipboardList,
  orcamento: Calculator,
  contrato: FileSignature,
  art: ShieldCheck,
  ordem_servico: Wrench,
  vistoria_final: ClipboardCheck,
  termo_aceite: PenTool,
  recibo_nf: Receipt,
  pos_venda: HeartHandshake,
};

/**
 * Componente Carousel Track com botões de seta suave para avançar e voltar
 * sem necessidade de arrastar barra de rolagem horizontal.
 */
function ScrollableTrack({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScroll]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = Math.max(scrollRef.current.clientWidth * 0.65, 260);
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group/track">
      {/* Botão Seta Esquerda (<) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-card/95 hover:bg-primary hover:text-white border border-border shadow-2xs flex items-center justify-center text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
          title="Ver etapas anteriores"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Sombra Esquerda com gradiente suave */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-20 pointer-events-none" />
      )}

      {/* Container de Rolagem Horizontal */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="overflow-x-auto scroll-smooth pb-1 pt-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {/* Sombra Direita com gradiente suave */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-20 pointer-events-none" />
      )}

      {/* Botão Seta Direita (>) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-card/95 hover:bg-primary hover:text-white border border-border shadow-2xs flex items-center justify-center text-foreground transition-all duration-200 hover:scale-105 active:scale-95 animate-pulse group-hover/track:animate-none"
          title="Ver próximas etapas"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function OperationProcessCard({
  process,
  visualMode = "cards",
  onOpenStage,
  onQuickToggleStage,
  onDeleteProcess,
  onFollowUp,
}: OperationProcessCardProps) {
  const router = useRouter();

  const getAlertBg = (variant?: string) => {
    switch (variant) {
      case "amber":
        return "bg-amber-50/90 border-amber-200/80 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200";
      case "blue":
        return "bg-blue-50/90 border-blue-200/80 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200";
      case "purple":
        return "bg-purple-50/90 border-purple-200/80 text-purple-900 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-200";
      case "emerald":
        return "bg-emerald-50/90 border-emerald-200/80 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200";
      default:
        return "bg-amber-50 border-amber-200 text-amber-900";
    }
  };

  return (
    <div className="bg-card rounded-xl border border-gray-200/80 shadow-2xs p-3.5 sm:p-4 transition-all hover:shadow-xs hover:border-primary/40 space-y-3.5">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-border/40 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
              {process.clientName}
              {process.contactPerson && (
                <span className="font-normal text-text-muted"> — {process.contactPerson}</span>
              )}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-0.5">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Phone className="h-3 w-3 text-text-muted" />
              {process.phone}
            </span>
            <span>•</span>
            <span>{process.recordsCount} registro(s)</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-text-muted" />
              atualizado {process.lastUpdate}
            </span>
            <span>•</span>
            <span className="font-medium text-foreground">{process.city}</span>
          </div>
        </div>

        {/* Action Tags / Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Service Tag */}
          <div className="flex items-center gap-1.5">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-xs max-w-[260px] truncate"
              title={process.serviceType}
            >
              {process.serviceType.length > 30 ? process.serviceType.substring(0, 28) + '...' : process.serviceType}
            </span>
            {process.isSuggested && (
              <span className="text-[11px] text-text-muted italic">sugerido</span>
            )}
          </div>

          {/* Status Almoxarifado / Separação de Material */}
          {process.materialStatus && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 border transition-all ${
                process.materialStatus.status === 'SEPARADO'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}
              title="Status do Almoxarifado / Separação de Peças"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${process.materialStatus.status === 'SEPARADO' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {process.materialStatus.label}
            </span>
          )}

          {/* Status Equipe / Em Campo */}
          {process.executionStatus && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 border transition-all ${
                process.executionStatus.status === 'NO_LOCAL'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 animate-pulse'
                  : process.executionStatus.status === 'CONCLUIDO'
                  ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
              }`}
              title="Status em Tempo Real da Equipe de Campo"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                process.executionStatus.status === 'NO_LOCAL' ? 'bg-blue-500' :
                process.executionStatus.status === 'CONCLUIDO' ? 'bg-slate-400' : 'bg-indigo-500'
              }`} />
              {process.executionStatus.label}
              {process.executionStatus.time && (
                <span className="opacity-75 text-[10px] font-mono">({process.executionStatus.time})</span>
              )}
            </span>
          )}

          {/* Quick Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info(`Pesquisa de satisfação para ${process.clientName}`)}
            className="h-7 text-xs rounded-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 gap-1 font-medium"
          >
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            Pesquisa
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = (process as any).clientId
                ? `/visits/new?clientId=${(process as any).clientId}`
                : `/visits/new`;
              toast.success(`Abrindo agendamento para ${process.clientName}`);
              router.push(url);
            }}
            className="h-7 text-xs rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 gap-1 font-medium"
          >
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            Agendar serviço
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = (process as any).clientId
                ? `/quotes/new?clientId=${(process as any).clientId}&type=PREVENTIVE`
                : `/quotes/new`;
              toast.info(`Novo contrato de preventiva para ${process.clientName}`);
              router.push(url);
            }}
            className="h-7 text-xs rounded-full border-border text-foreground hover:bg-muted gap-1 font-medium"
          >
            <Shield className="h-3.5 w-3.5 text-primary" />
            Preventiva
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteProcess(process.id)}
            className="h-7 px-2 text-xs rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Smart Alert Banner */}
      {process.alert && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium ${getAlertBg(
            process.alert.variant
          )}`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span>{process.alert.message}</span>
          </div>

          <Button
            size="sm"
            onClick={() => onFollowUp(process)}
            className="h-7 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1 self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Sparkles className="h-3 w-3" />
            {process.alert.actionText}
          </Button>
        </div>
      )}

      {/* ============================================================== */}
      {/* VARIAÇÃO 1: CÁPSULAS MODULARES DE ETAPA (PADRÃO RECOMENDADO)  */}
      {/* ============================================================== */}
      {visualMode === "cards" && (
        <ScrollableTrack>
          <div className="min-w-[1040px] flex items-stretch gap-2 px-1">
            {process.stages.map((stage, idx) => {
              const Icon = STAGE_ICONS[stage.id] || ClipboardList;
              const isCompleted = stage.status === "completed";
              const isInProgress = stage.status === "in_progress";
              const isLast = idx === process.stages.length - 1;

              return (
                <React.Fragment key={stage.id}>
                  {/* Module Card */}
                  <div
                    onClick={() => onOpenStage(process, stage)}
                    className={`flex-1 min-w-[108px] max-w-[130px] rounded-xl p-2.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                      isCompleted
                        ? "bg-emerald-50/50 border-emerald-300/80 text-foreground dark:bg-emerald-950/20 dark:border-emerald-800 shadow-2xs hover:border-emerald-500"
                        : isInProgress
                        ? "bg-orange-50/60 border-primary text-foreground ring-2 ring-primary/20 dark:bg-orange-950/30 shadow-xs hover:border-primary"
                        : "bg-card border-border/70 text-text-muted hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    {/* Card Top: Number + Icon + Status Indicator */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isCompleted
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : isInProgress
                              ? "bg-primary text-white shadow-xs animate-pulse"
                              : "bg-muted text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-text-muted">
                          0{idx + 1}
                        </span>
                      </div>

                      {/* Small Status Pill */}
                      {isCompleted ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center dark:bg-emerald-900/60 dark:text-emerald-300">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[9px] font-extrabold uppercase px-1 py-0.5 rounded bg-primary text-white">
                          Ativo
                        </span>
                      ) : stage.isOptional ? (
                        <span className="text-[8.5px] text-text-muted/80">opcional</span>
                      ) : null}
                    </div>

                    {/* Stage Name */}
                    <div className="space-y-0.5 my-1">
                      <div
                        className={`text-xs font-bold leading-tight truncate ${
                          isCompleted
                            ? "text-foreground"
                            : isInProgress
                            ? "text-primary"
                            : "text-foreground/80 group-hover:text-foreground"
                        }`}
                        title={stage.name}
                      >
                        {stage.shortName}
                      </div>

                      {stage.code && (
                        <div className="text-[9.5px] font-mono font-semibold text-primary truncate">
                          {stage.code}
                        </div>
                      )}

                      {stage.detail && (
                        <div className="text-[9px] text-text-muted truncate leading-tight">
                          {stage.detail}
                        </div>
                      )}
                    </div>

                    {/* Bottom Micro Actions */}
                    <div
                      className="flex items-center justify-between pt-1.5 mt-auto border-t border-border/40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onQuickToggleStage(process.id, stage.id)}
                        className={`p-1 rounded text-[10px] font-medium transition-colors flex items-center gap-0.5 ${
                          isCompleted
                            ? "text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                            : "text-text-muted hover:text-foreground hover:bg-muted"
                        }`}
                        title={isCompleted ? "Reabrir etapa" : "Marcar como concluída"}
                      >
                        <Check className="h-3 w-3 stroke-[2.5]" />
                      </button>

                      {stage.hasAttachment ? (
                        <button
                          onClick={() => onOpenStage(process, stage)}
                          className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                          title={`Ver anexo: ${stage.attachmentName || "Arquivo"}`}
                        >
                          <Paperclip className="h-3 w-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenStage(process, stage)}
                          className="text-[9.5px] font-semibold text-text-muted hover:text-primary transition-colors flex items-center gap-0.5"
                          title="Anexar documento ou ver detalhes"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          anexo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Flow Arrow Divider */}
                  {!isLast && (
                    <div className="flex items-center justify-center text-border shrink-0 px-0.5">
                      <ChevronRight
                        className={`h-4 w-4 ${
                          isCompleted && process.stages[idx + 1]?.status === "completed"
                            ? "text-emerald-500"
                            : isCompleted && process.stages[idx + 1]?.status === "in_progress"
                            ? "text-primary"
                            : "text-border"
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </ScrollableTrack>
      )}

      {/* ============================================================== */}
      {/* VARIAÇÃO 2: TRILHA RIBBON / FAIXA INDUSTRIAL CONECTADA        */}
      {/* ============================================================== */}
      {visualMode === "ribbon" && (
        <ScrollableTrack>
          <div className="min-w-[940px] flex items-center rounded-xl overflow-hidden border border-border/80 shadow-2xs bg-muted/40 p-1 gap-1">
            {process.stages.map((stage, idx) => {
              const Icon = STAGE_ICONS[stage.id] || ClipboardList;
              const isCompleted = stage.status === "completed";
              const isInProgress = stage.status === "in_progress";

              return (
                <div
                  key={stage.id}
                  onClick={() => onOpenStage(process, stage)}
                  className={`flex-1 min-w-[98px] py-2 px-2 rounded-lg text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : isInProgress
                      ? "bg-primary text-white shadow-md font-bold ring-2 ring-orange-300 dark:ring-orange-800 animate-pulse"
                      : "bg-card text-text-muted hover:text-foreground hover:bg-muted/80 border border-border/50"
                  }`}
                  title={`${stage.name} - Clique para ações`}
                >
                  <div className="flex items-center gap-1 text-[11px]">
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{stage.shortName}</span>
                  </div>
                  {stage.code && (
                    <span
                      className={`text-[9px] font-mono truncate max-w-[85px] mt-0.5 ${
                        isCompleted || isInProgress ? "text-white/90" : "text-primary"
                      }`}
                    >
                      {stage.code}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollableTrack>
      )}

      {/* ============================================================== */}
      {/* VARIAÇÃO 3: LINHA DE ENGENHARIA ELEVADA COM ÍCONES             */}
      {/* ============================================================== */}
      {visualMode === "timeline" && (
        <ScrollableTrack>
          <div className="min-w-[920px] flex items-start justify-between relative px-3">
            {process.stages.map((stage, idx) => {
              const Icon = STAGE_ICONS[stage.id] || ClipboardList;
              const isCompleted = stage.status === "completed";
              const isInProgress = stage.status === "in_progress";
              const isPending = stage.status === "pending" || stage.status === "optional";
              const isLast = idx === process.stages.length - 1;

              return (
                <React.Fragment key={stage.id}>
                  {/* Single Node */}
                  <div className="flex flex-col items-center text-center relative z-10 w-24 shrink-0 group">
                    <div
                      onClick={() => onOpenStage(process, stage)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        isCompleted
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60 shadow-xs hover:scale-110"
                          : isInProgress
                          ? "bg-primary text-white ring-4 ring-orange-200 dark:ring-orange-950 shadow-md hover:scale-110 animate-pulse"
                          : stage.isOptional
                          ? "border-2 border-dashed border-border bg-card text-muted-foreground hover:border-primary/60"
                          : "border-2 border-border bg-card text-muted-foreground hover:border-primary/60"
                      }`}
                      title={stage.name}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>

                    <span
                      onClick={() => onOpenStage(process, stage)}
                      className={`text-xs font-bold mt-2 cursor-pointer leading-tight truncate max-w-[90px] ${
                        isCompleted
                          ? "text-foreground"
                          : isInProgress
                          ? "text-primary"
                          : "text-text-muted"
                      }`}
                    >
                      {stage.shortName}
                    </span>

                    {stage.code && (
                      <span className="text-[10px] font-mono font-semibold text-primary mt-0.5 truncate max-w-[90px]">
                        {stage.code}
                      </span>
                    )}

                    {/* Micro buttons */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickToggleStage(process.id, stage.id);
                        }}
                        className={`p-1 rounded text-xs transition-colors ${
                          isCompleted
                            ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
                            : "text-text-muted hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </button>

                      {stage.hasAttachment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStage(process, stage);
                          }}
                          className="p-1 rounded text-primary bg-primary/10"
                        >
                          <Paperclip className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {!isLast && (
                    <div className="flex-1 flex items-center h-9 px-1">
                      <div
                        className={`h-[4px] w-full rounded-full transition-colors ${
                          isCompleted && process.stages[idx + 1]?.status === "completed"
                            ? "bg-emerald-500"
                            : isCompleted && process.stages[idx + 1]?.status === "in_progress"
                            ? "bg-gradient-to-r from-emerald-500 to-primary"
                            : "bg-border/70"
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </ScrollableTrack>
      )}
    </div>
  );
}
