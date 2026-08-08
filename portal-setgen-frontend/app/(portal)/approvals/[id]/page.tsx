"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { quotesApi } from '@/lib/api/quotes';
import { approvalsApi } from '@/lib/api/approvals';
import { Quote } from '@/types';
import {
  FileText,
  Calendar,
  User,
  Briefcase,
  CheckCircle,
  XCircle,
  Info,
  Building2,
  Clock,
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";

export default function ApprovalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadQuote();
    }
  }, [params.id]);

  const loadQuote = async () => {
    try {
      const data = await quotesApi.getById(params.id as string);
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
      alert('Erro ao carregar detalhes do orçamento');
      router.push('/approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!quote) return;
    setActing(true);
    try {
      await approvalsApi.approve(quote.id);
      alert('Orçamento aprovado com sucesso!');
      router.push('/approvals');
    } catch (error) {
      alert('Erro ao aprovar orçamento');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!quote) return;
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;

    setActing(true);
    try {
      await approvalsApi.reject(quote.id, reason);
      alert('Orçamento rejeitado');
      router.push('/approvals');
    } catch (error) {
      alert('Erro ao rejeitar orçamento');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={FileText}
        tone="amber"
        title={`Orçamento #${quote.quoteNumber}`}
        meta={<><Building2 className="h-3.5 w-3.5" />{quote.client?.companyName}</>}
        backLabel="Voltar para lista"
        onBack={() => router.back()}
        actions={
          <>
            <Button
              onClick={handleApprove}
              disabled={acting}
              className="rounded-[9px] font-bold gap-2 bg-status-green-fg hover:bg-status-green-fg/90"
            >
              <CheckCircle className="h-4 w-4" />
              Aprovar
            </Button>
            <Button
              onClick={handleReject}
              disabled={acting}
              variant="destructive"
              className="rounded-[9px] font-bold gap-2"
            >
              <XCircle className="h-4 w-4" />
              Rejeitar
            </Button>
          </>
        }
      />

      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="informacoes">Informações Gerais</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="mt-4 space-y-4">
          <Card className="p-6">
            <div className="text-[13.5px] font-bold text-foreground mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Escopo Proposto
            </div>
            <p className="text-[13.5px] text-text-secondary leading-relaxed whitespace-pre-wrap">{quote.scope}</p>
          </Card>

          {quote.quoteLines && quote.quoteLines.length > 0 && (
            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4">Linhas do Orçamento</div>
              <div className="space-y-2">
                {quote.quoteLines.map((line) => (
                  <div key={line.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-[13px]">
                    <span className="text-foreground font-medium">{line.description}</span>
                    <span className="font-bold text-primary">
                      {Number(line.totalValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="informacoes" className="mt-4">
          <Card className="p-6 max-w-lg">
            <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Informações Gerais
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-status-amber-bg rounded-lg">
                  <Clock className="h-4 w-4 text-status-amber-fg" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Tipo</p>
                  <p className="text-foreground font-medium text-[13.5px]">{quote.type === 'VISIT_REPORT' ? 'Relatório de Visita' : 'Execução'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-status-amber-bg rounded-lg">
                  <User className="h-4 w-4 text-status-amber-fg" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Criado por</p>
                  <p className="text-foreground font-medium text-[13.5px]">{quote.createdBy?.name || 'Sistema'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-status-amber-bg rounded-lg">
                  <Calendar className="h-4 w-4 text-status-amber-fg" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Data de Criação</p>
                  <p className="text-foreground font-medium text-[13.5px]">{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
