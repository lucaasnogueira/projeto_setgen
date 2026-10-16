"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProcessStage, ClientProcess } from "../data/mock-operations";
import {
  FileText,
  Paperclip,
  CheckCircle2,
  Clock,
  ExternalLink,
  Upload,
  Calendar,
  Building2,
  Phone,
  Users,
  FileCheck,
  ArrowRight,
  Printer,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  process: ClientProcess | null;
  stage: ProcessStage | null;
  onUpdateStageStatus?: (processId: string, stageId: string, newStatus: ProcessStage["status"]) => void;
}

const STAGE_TITLES: Record<string, { title: string; subtitle: string; actionLabel: string }> = {
  visita: {
    title: "Visita Técnica & Levantamento",
    subtitle: "Inspeção em campo, registro fotográfico e checklist inicial",
    actionLabel: "Abrir Ficha da Visita",
  },
  orcamento: {
    title: "Proposta Comercial & Orçamento",
    subtitle: "Precificação de peças, mão de obra, margem e envio da proposta",
    actionLabel: "Abrir Proposta Comercial",
  },
  contrato: {
    title: "Contrato de Prestação de Serviços",
    subtitle: "Minuta contratual, cláusulas de garantia e assinatura digital",
    actionLabel: "Abrir Contrato",
  },
  art: {
    title: "ART · CREA / CFT",
    subtitle: "Anotação de Responsabilidade Técnica de engenharia",
    actionLabel: "Abrir Registro da ART",
  },
  ordem_servico: {
    title: "Ordem de Serviço (O.S.)",
    subtitle: "Execução operacional, apontamento de horas e requisição de peças",
    actionLabel: "Abrir Ordem de Serviço",
  },
  vistoria_final: {
    title: "Vistoria Final & Comissionamento",
    subtitle: "Inspeção de entrega da obra, teste de carga e checklist final",
    actionLabel: "Abrir Vistoria de Entrega",
  },
  termo_aceite: {
    title: "Termo de Aceite do Cliente",
    subtitle: "Assinatura do cliente confirmando a entrega e início da garantia",
    actionLabel: "Abrir Termo de Aceite",
  },
  recibo_nf: {
    title: "Faturamento & Nota Fiscal",
    subtitle: "Emissão de nota fiscal de serviços/produtos e recibo financeiro",
    actionLabel: "Abrir Faturamento Fiscal",
  },
  pos_venda: {
    title: "Pós-Venda & Garantia",
    subtitle: "Acompanhamento da satisfação do cliente e revisões periódicas",
    actionLabel: "Abrir Ficha do Cliente",
  },
};

export function StageDetailModal({
  isOpen,
  onClose,
  process,
  stage,
  onUpdateStageStatus,
}: StageDetailModalProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  if (!process || !stage) return null;

  const stageMeta = STAGE_TITLES[stage.id] || {
    title: stage.name,
    subtitle: "Gerenciamento e controle da etapa operacional",
    actionLabel: "Abrir Etapa",
  };

  const handleToggleStatus = () => {
    const nextStatus = stage.status === "completed" ? "in_progress" : "completed";
    onUpdateStageStatus?.(process.id, stage.id, nextStatus);
    toast.success(
      `Etapa "${stage.name}" marcada como ${nextStatus === "completed" ? "Concluída ✓" : "Em Andamento"}!`
    );
    onClose();
  };

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success("Documento anexado com sucesso!");
    }, 800);
  };

  // Roteamento inteligente que leva para o local exato do registro
  const getDestinationUrl = () => {
    const clientId = (process as any).clientId || process.id;
    const soId = (process as any).serviceOrderId;
    const quoteId = (process as any).quoteId;
    const docId = (stage as any).documentId;
    const visitId = (stage as any).visitId;

    switch (stage.id) {
      case "visita":
        if (visitId) return `/visits/${visitId}`;
        return clientId ? `/visits/new?clientId=${clientId}` : `/visits`;

      case "orcamento":
        if (quoteId) return `/quotes/${quoteId}`;
        return clientId ? `/quotes/new?clientId=${clientId}` : `/quotes`;

      case "contrato":
        if (docId && clientId) return `/documents/${clientId}/${docId}/view`;
        if (soId) return `/orders/${soId}`;
        return clientId ? `/documents/${clientId}/new?type=CONTRACT` : `/orders`;

      case "art":
        if (docId && clientId) return `/documents/${clientId}/${docId}/view`;
        if (soId) return `/orders/${soId}`;
        return clientId ? `/documents/${clientId}/new?type=ART` : `/art`;

      case "ordem_servico":
        if (soId) return `/orders/${soId}`;
        return clientId ? `/orders/new?clientId=${clientId}` : `/orders/new`;

      case "vistoria_final":
        if (docId && clientId) return `/documents/${clientId}/${docId}/view`;
        if (clientId && soId) return `/documents/${clientId}/new?type=OTHER&orderId=${soId}`;
        if (visitId) return `/visits/${visitId}`;
        if (soId) return `/orders/${soId}`;
        return clientId ? `/documents/${clientId}/new?type=OTHER` : `/visits`;

      case "termo_aceite":
        if (docId && clientId) return `/documents/${clientId}/${docId}/view`;
        if (soId) return `/orders/${soId}`;
        return clientId ? `/documents/${clientId}/new?type=ACCEPTANCE_TERM` : `/orders`;

      case "recibo_nf":
        return `/invoices`;

      case "pos_venda":
        return clientId ? `/clients/${clientId}` : `/clients`;

      default:
        return soId ? `/orders/${soId}` : `/orders`;
    }
  };

  const destinationUrl = getDestinationUrl();
  const isCreated = stage.status === "completed" || Boolean(stage.code);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-white text-foreground border border-gray-200 rounded-xl p-4 sm:p-5 shadow-xl">
        <DialogHeader className="space-y-1.5 border-b border-border/50 pb-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
            <span className="flex items-center gap-1 text-foreground">
              <Building2 className="h-3.5 w-3.5 text-text-muted" />
              {process.clientName}
            </span>
            <span>•</span>
            <span className="text-text-muted">{process.city}</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              {process.serviceType}
            </span>
          </div>

          <DialogTitle className="text-sm sm:text-base font-bold flex items-center justify-between gap-3 pt-1">
            <span>{stageMeta.title}</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border shrink-0 ${
                stage.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : stage.status === "in_progress"
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {stage.status === "completed"
                ? "Concluído ✓"
                : stage.status === "in_progress"
                ? "Em Andamento ⏳"
                : "Pendente"}
            </span>
          </DialogTitle>

          <DialogDescription className="text-xs text-text-muted">
            {stageMeta.subtitle}
          </DialogDescription>
        </DialogHeader>

        {/* Informações Centrais da Etapa */}
        <div className="space-y-3.5 my-2 text-sm">
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/60">
            <div>
              <span className="text-[11px] font-bold text-text-muted uppercase block mb-0.5">
                Identificador / Código
              </span>
              <span className="font-mono font-bold text-foreground text-sm">
                {stage.code || "Ainda não emitido"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-text-muted uppercase block mb-0.5">
                Data do Registro
              </span>
              <span className="font-medium text-foreground text-sm">
                {stage.date || process.lastUpdate}
              </span>
            </div>
          </div>

          {/* Card de Contatos & Identificação do Cliente */}
          <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> Dados de Contato do Cliente
              </span>
              {process.phone && (
                <a
                  href={`https://wa.me/55${process.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                >
                  <Phone className="h-3 w-3" /> WhatsApp
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/40 text-foreground">
              <div>
                <span className="text-[10px] text-text-muted block">Pessoa de Contato:</span>
                <strong className="font-semibold">{process.contactPerson || "Não informado"}</strong>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Telefone:</span>
                <strong className="font-mono">{process.phone || "Não informado"}</strong>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Cidade / UF:</span>
                <strong className="font-semibold">{process.city || "Manaus / AM"}</strong>
              </div>
            </div>
          </div>

          {/* Escopo do Serviço (se houver texto detalhado da OS/Orçamento) */}
          {(process as any).fullScope && (
            <div className="p-3 bg-card rounded-xl border border-border/70 text-xs space-y-1">
              <span className="font-bold text-[11px] text-text-muted uppercase block">
                Escopo Técnico da Obra:
              </span>
              <p className="text-xs text-foreground/90 leading-relaxed max-h-20 overflow-y-auto">
                {(process as any).fullScope}
              </p>
            </div>
          )}

          {/* Anexos e Arquivos */}
          <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-primary" /> Arquivo / Documento Anexo
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateUpload}
                disabled={isUploading}
                className="h-7 text-xs gap-1 border-dashed font-semibold"
              >
                <Upload className="h-3 w-3" />
                {isUploading ? "Enviando..." : "Anexar Arquivo"}
              </Button>
            </div>

            {stage.hasAttachment ? (
              <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border border-border/50 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium truncate text-foreground">
                    {stage.attachmentName || `${stage.shortName}_${process.clientName.replace(/\s+/g, "_")}.pdf`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toast.info(`Visualizando ${stage.attachmentName || "documento"}`);
                    router.push(destinationUrl);
                  }}
                  className="h-6 text-xs text-primary font-bold hover:bg-primary/10"
                >
                  Visualizar
                </Button>
              </div>
            ) : (
              <p className="text-xs text-text-muted italic py-1">
                Nenhum arquivo anexado a esta etapa no momento.
              </p>
            )}
          </div>
        </div>

        {/* Rodapé com Ações Claras e Objetivas */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between items-center pt-3 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto text-xs"
          >
            Fechar
          </Button>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              className={`text-xs font-semibold gap-1.5 ${
                stage.status === "completed"
                  ? "text-amber-700 hover:bg-amber-50 border-amber-200 dark:text-amber-300"
                  : "text-emerald-700 hover:bg-emerald-50 border-emerald-200 dark:text-emerald-300"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {stage.status === "completed" ? "Reabrir Etapa" : "Concluir Etapa"}
            </Button>

            <Button
              size="sm"
              onClick={() => {
                onClose();
                router.push(destinationUrl);
              }}
              className="text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-xs"
            >
              <span>{isCreated ? stageMeta.actionLabel : `Criar ${stage.shortName} Agora`}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
