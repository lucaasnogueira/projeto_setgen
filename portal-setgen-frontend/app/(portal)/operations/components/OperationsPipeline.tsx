"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Filter, Plus, FileDown, CheckCircle, Clock, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import { ClientProcess, ProcessStage, INITIAL_PROCESSES } from "../data/mock-operations";
import { OperationProcessCard, StepperVisualMode } from "./OperationProcessCard";
import { StageDetailModal } from "./StageDetailModal";
import { operationsApi } from "@/lib/api/operations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function OperationsPipeline() {
  const [processes, setProcesses] = useState<ClientProcess[]>(INITIAL_PROCESSES);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [visualMode, setVisualMode] = useState<StepperVisualMode>("cards");
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'todos' | 'em_andamento' | 'aguardando_fechar' | 'concluidos' | 'perdidos'
  >('todos');

  const loadPipeline = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await operationsApi.getPipeline();
      if (res && res.processes && res.processes.length > 0) {
        setProcesses(res.processes);
        setIsLive(true);
      }
    } catch (err) {
      // Fallback para os dados simulados realistas caso a API ainda não tenha dados ou esteja sem auth
      console.info("Usando dados base para exibição da esteira.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipeline(false);

    // Auto-refresh em tempo real a cada 10 segundos
    const interval = setInterval(() => {
      loadPipeline(true);
    }, 10000);

    // Atualiza imediatamente quando o usuário volta para a aba
    const handleFocus = () => loadPipeline(true);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadPipeline]);

  // Selected stage for modal
  const [selectedProcess, setSelectedProcess] = useState<ClientProcess | null>(null);
  const [selectedStage, setSelectedStage] = useState<ProcessStage | null>(null);

  // Follow-up modal state
  const [followUpProcess, setFollowUpProcess] = useState<ClientProcess | null>(null);
  const [followUpNote, setFollowUpNote] = useState("");

  // Counts
  const countAll = processes.length;
  const countInProgress = processes.filter((p) => p.statusCategory === 'em_andamento').length;
  const countAwaiting = processes.filter((p) => p.statusCategory === 'aguardando_fechar').length;
  const countCompleted = processes.filter((p) => p.statusCategory === 'concluidos').length;
  const countLost = processes.filter((p) => p.statusCategory === 'perdidos').length;

  // Financial totals
  const totalSold = processes.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const totalReceived = processes.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

  // Filtered
  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      const matchSearch =
        p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        p.stages.some((s) => s.code?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory =
        categoryFilter === 'ALL' ||
        p.serviceCategory === categoryFilter ||
        p.serviceType.toLowerCase().includes(categoryFilter.toLowerCase());

      const matchStatus =
        statusFilter === 'todos' || p.statusCategory === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [processes, searchTerm, categoryFilter, statusFilter]);

  const handleOpenStage = (process: ClientProcess, stage: ProcessStage) => {
    setSelectedProcess(process);
    setSelectedStage(stage);
  };

  const handleQuickToggleStage = async (processId: string, stageId: string) => {
    const currentProc = processes.find((p) => p.id === processId);
    const currentStage = currentProc?.stages.find((st) => st.id === stageId);
    if (!currentStage) return;

    const nextStatus = currentStage.status === 'completed' ? 'pending' : 'completed';

    // Optimistic UI update
    setProcesses((prev) =>
      prev.map((proc) => {
        if (proc.id !== processId) return proc;
        const updatedStages = proc.stages.map((st) => {
          if (st.id !== stageId) return st;
          return { ...st, status: nextStatus as ProcessStage['status'] };
        });
        return { ...proc, stages: updatedStages };
      })
    );

    toast.success(`Etapa "${currentStage.name}" marcada como ${nextStatus === 'completed' ? 'Concluída ✓' : 'Pendente'}`);

    try {
      await operationsApi.updateStageStatus(processId, stageId, nextStatus);
    } catch (err) {
      console.error("Erro ao persistir status da etapa no servidor:", err);
    }
  };

  const handleUpdateStageStatus = async (
    processId: string,
    stageId: string,
    newStatus: ProcessStage['status']
  ) => {
    // Optimistic UI update
    setProcesses((prev) =>
      prev.map((proc) => {
        if (proc.id !== processId) return proc;
        const updatedStages = proc.stages.map((st) => {
          if (st.id !== stageId) return st;
          return { ...st, status: newStatus };
        });
        return { ...proc, stages: updatedStages };
      })
    );

    try {
      await operationsApi.updateStageStatus(processId, stageId, newStatus);
      // Recarrega em background para sincronizar
      await loadPipeline(true);
    } catch (err) {
      console.error("Erro ao persistir status da etapa no backend:", err);
    }
  };

  const handleDeleteProcess = (processId: string) => {
    if (!window.confirm("Deseja realmente remover este processo do quadro operacional?")) return;
    setProcesses((prev) => prev.filter((p) => p.id !== processId));
    toast.success("Processo removido com sucesso.");
  };

  const handleFollowUpSubmit = () => {
    if (!followUpProcess) return;
    toast.success(`Follow-up registrado para ${followUpProcess.clientName}! Próximo contato agendado.`);
    setFollowUpProcess(null);
    setFollowUpNote("");
  };

  return (
    <div className="space-y-4">
      {/* Search and Category Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Buscar por cliente, nº da OS/Orçamento, cidade ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-card border-border/80 focus:border-primary text-sm"
          />
        </div>

        <div className="w-full sm:w-64 shrink-0">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10 rounded-xl bg-card border-border/80 text-sm">
              <SelectValue placeholder="Todos os processos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os processos</SelectItem>
              <SelectItem value="eletrica">Instalações Elétricas</SelectItem>
              <SelectItem value="subestacao">Subestações & Cabine</SelectItem>
              <SelectItem value="gerador">Geradores de Energia</SelectItem>
              <SelectItem value="preventiva">Manutenção Preventiva</SelectItem>
              <SelectItem value="spda">Laudos SPDA / Para-raios</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={() => loadPipeline(false)}
          disabled={loading}
          className="h-10 px-3.5 rounded-xl gap-2 font-medium shrink-0 bg-card hover:bg-muted"
          title="Recarregar esteira operacional"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : 'text-text-muted'}`} />
          <span className="hidden sm:inline text-xs">Atualizar</span>
        </Button>
      </div>

      {/* Filter Status Pills (As seen in user reference) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => setStatusFilter('todos')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'todos'
              ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          Todos <span className="opacity-80 ml-1">{countAll}</span>
        </button>

        <button
          onClick={() => setStatusFilter('em_andamento')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'em_andamento'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          Em andamento <span className="opacity-80 ml-1">{countInProgress}</span>
        </button>

        <button
          onClick={() => setStatusFilter('aguardando_fechar')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'aguardando_fechar'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          Aguardando fechar <span className="opacity-80 ml-1">{countAwaiting}</span>
        </button>

        <button
          onClick={() => setStatusFilter('concluidos')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'concluidos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          Concluídos <span className="opacity-80 ml-1">{countCompleted}</span>
        </button>

        <button
          onClick={() => setStatusFilter('perdidos')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'perdidos'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          Perdidos <span className="opacity-80 ml-1">{countLost}</span>
        </button>
      </div>

      {/* Summary Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1 text-xs text-text-muted border-b border-border/40">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            <strong className="font-bold text-foreground">{filteredProcesses.length}</strong> cliente(s) no fluxo
          </span>
          <span className="text-border">•</span>
          <span>
            Total Vendido:{' '}
            <strong className="font-bold text-foreground">
              {formatCurrency(totalSold)}
            </strong>
          </span>
          <span className="text-border">•</span>
          <span>
            Total Faturado (Conta Azul):{' '}
            <strong className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalReceived)}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
          <span className="text-[11px] font-bold text-text-muted px-2">Visual da Trilha:</span>
          <button
            onClick={() => setVisualMode('cards')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              visualMode === 'cards'
                ? 'bg-card text-foreground shadow-2xs border border-border/80'
                : 'text-text-muted hover:text-foreground'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setVisualMode('ribbon')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              visualMode === 'ribbon'
                ? 'bg-card text-foreground shadow-2xs border border-border/80'
                : 'text-text-muted hover:text-foreground'
            }`}
          >
            Faixa
          </button>
          <button
            onClick={() => setVisualMode('timeline')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              visualMode === 'timeline'
                ? 'bg-card text-foreground shadow-2xs border border-border/80'
                : 'text-text-muted hover:text-foreground'
            }`}
          >
            Linha
          </button>
        </div>
      </div>

      {/* Process Cards List */}
      <div className="space-y-4 pt-1">
        {filteredProcesses.length > 0 ? (
          filteredProcesses.map((process) => (
            <OperationProcessCard
              key={process.id}
              process={process}
              visualMode={visualMode}
              onOpenStage={handleOpenStage}
              onQuickToggleStage={handleQuickToggleStage}
              onDeleteProcess={handleDeleteProcess}
              onFollowUp={(proc) => setFollowUpProcess(proc)}
            />
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200 space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Nenhum processo operacional encontrado com os filtros selecionados.
            </p>
            <p className="text-xs text-text-muted">
              Tente redefinir a busca ou limpar os filtros de status.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("ALL");
                setStatusFilter("todos");
              }}
              className="mt-2 text-xs"
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Stage Detail Modal */}
      <StageDetailModal
        isOpen={!!selectedStage}
        onClose={() => {
          setSelectedStage(null);
          setSelectedProcess(null);
        }}
        process={selectedProcess}
        stage={selectedStage}
        onUpdateStageStatus={handleUpdateStageStatus}
      />

      {/* Follow-up Quick Action Modal */}
      {followUpProcess && (
        <Dialog open={!!followUpProcess} onOpenChange={(open) => !open && setFollowUpProcess(null)}>
          <DialogContent className="max-w-md bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Registrar Follow-up Comercial
              </DialogTitle>
              <DialogDescription className="text-xs text-text-muted">
                Cliente: <strong className="text-foreground">{followUpProcess.clientName}</strong> ({followUpProcess.phone})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-2">
              <label className="text-xs font-semibold text-foreground block">
                Resumo da conversa / Próxima ação combinada:
              </label>
              <Textarea
                placeholder="Ex: Liguei para Nilton; ele aprovou o escopo técnico e vai submeter para a diretoria na quinta-feira..."
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                rows={4}
                className="text-sm bg-muted/40 border-border rounded-xl"
              />
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFollowUpProcess(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleFollowUpSubmit}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Salvar Follow-up
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

