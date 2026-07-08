"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Invoice, UserRole } from '@/types';
import { fiscalApi } from '@/lib/api/fiscal';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth';
import {
  DollarSign,
  Calendar,
  FileText,
  Ban,
  Info,
  Hash,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Zap,
  Landmark,
  ExternalLink,
  History,
  Code,
  Eye
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import { FieldBlock } from "@/components/ui/field-block";
import Link from 'next/link';

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedXml, setSelectedXml] = useState<string | null>(null);
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadInvoice();
    }
  }, [params.id]);

  const loadInvoice = async () => {
    try {
      const data = await fiscalApi.getOne(params.id as string);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const justificativa = window.prompt(
      'Justificativa do cancelamento (mínimo 15 caracteres):',
    );
    if (!justificativa) return;
    if (justificativa.length < 15) {
      alert('Justificativa deve ter no mínimo 15 caracteres');
      return;
    }

    try {
      const result = await fiscalApi.cancelar(params.id as string, justificativa);
      if (!result.sucesso) {
        alert(result.mensagem);
        return;
      }
      alert('Nota fiscal cancelada com sucesso!');
      loadInvoice();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao cancelar nota fiscal');
    }
  };

  const canCancel =
    (user?.role === UserRole.ADMIN || user?.role === UserRole.ADMINISTRATIVE) &&
    invoice?.status === 'AUTORIZADA';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={DollarSign}
        tone="green"
        title={`Nota Fiscal #${invoice.invoiceNumber}`}
        meta={<><Hash className="h-3.5 w-3.5" />Série: {invoice.series || '1'}</>}
        backLabel="Voltar para lista"
        onBack={() => router.back()}
        actions={
          canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              className="rounded-[9px] font-bold gap-2"
            >
              <Ban className="h-4 w-4" />
              Cancelar Nota
            </Button>
          )
        }
      />

      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos & Ações</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="mt-4 space-y-4">
          <Card className="p-6">
            <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-status-green-fg" />
              Informações Financeiras
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FieldBlock
                label="Valor Total"
                value={<span className="text-[20px] font-black text-status-green-fg">{(invoice.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>}
              />
              <FieldBlock
                label="Status Sefaz"
                value={
                  <Badge
                    variant="outline"
                    className={`
                      ${invoice.status === 'AUTORIZADA' ? 'bg-status-green-bg text-status-green-fg border-transparent' :
                        invoice.status === 'REJEITADA' ? 'bg-status-red-bg text-status-red-fg border-transparent' :
                        invoice.status === 'PROCESSANDO' ? 'bg-status-blue-bg text-status-blue-fg border-transparent animate-pulse' :
                        'bg-muted text-text-secondary border-transparent'
                      }
                      font-bold text-[11.5px] px-3 py-1 rounded-full
                    `}
                  >
                    {invoice.status}
                  </Badge>
                }
              />
              <FieldBlock label="Data de Emissão" value={new Date(invoice.issueDate).toLocaleDateString('pt-BR')} />
              <FieldBlock label="Cliente" value={invoice.client?.tradeName || invoice.client?.companyName || '-'} />
            </div>

            {invoice.chaveAcesso && (
              <div className="mt-4">
                <div className="text-[10.5px] font-bold tracking-wider text-text-muted uppercase mb-2">Chave de Acesso</div>
                <div className="bg-muted/40 p-4 rounded-xl border border-border font-mono text-[12.5px] break-all flex justify-between items-center group">
                  <span className="text-foreground">{invoice.chaveAcesso}</span>
                  <button className="text-status-green-fg opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>

          {invoice.itens && invoice.itens.length > 0 && (
            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-status-green-fg" />
                Mercadorias
              </div>
              <div className="divide-y divide-border">
                {invoice.itens.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-bold text-foreground">{item.descricao}</p>
                      <p className="text-[11px] text-text-muted">NCM {item.ncm} · Qtd {item.quantidade} × {item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <p className="text-[14px] font-black text-foreground shrink-0">
                      {item.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {invoice.impostos?.[0] && (
            <Card className="overflow-hidden">
              <div className="bg-status-green-fg p-5 text-white flex items-center gap-2 text-[13.5px] font-bold">
                <ShieldCheck className="h-4 w-4" />
                Regime Fiscal Reforma 2026
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase">CBS (0,9%)</p>
                    <p className="text-[15px] font-bold text-foreground">R$ {(invoice.impostos[0].valorCbs || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase">IBS (0,1%)</p>
                    <p className="text-[15px] font-bold text-foreground">R$ {(invoice.impostos[0].valorIbs || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase">ICMS</p>
                    <p className="text-[15px] font-bold text-foreground">R$ {(invoice.impostos[0].valorIcms || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-status-green-fg uppercase">Total Retido</p>
                    <p className="text-[17px] font-black text-status-green-fg">R$ {(invoice.splitPayment?.valorRetido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <Separator />

                <div className="bg-status-blue-bg p-4 rounded-2xl border border-status-blue-fg/15 flex gap-4">
                  <Zap className="h-7 w-7 text-status-blue-fg shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[13px] font-bold text-status-blue-fg flex items-center gap-2">
                       Split Payment Ativado
                       <Badge className="bg-primary text-[10px] h-4 border-none">Automático</Badge>
                    </p>
                    <p className="text-[11.5px] text-status-blue-fg opacity-80 leading-tight">
                       Este faturamento utiliza o mecanismo de split automático da RFB/ADN e SEFAZ-AM.
                    </p>
                  </div>
                </div>

                {invoice.impostos[0].beneficioZfmAtivo && (
                  <div className="bg-status-amber-bg p-4 rounded-2xl border border-status-amber-fg/15 flex gap-4">
                    <Landmark className="h-7 w-7 text-status-amber-fg shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[13px] font-bold text-status-amber-fg">Benefício Manaus (ZFM)</p>
                      <p className="text-[11.5px] text-status-amber-fg opacity-80 leading-tight">
                        Crédito presumido mantido conforme Art. 430 da LC 214/2024. Valor: R$ {(invoice.impostos[0].creditoPresumidoZfm || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {invoice.status === 'REJEITADA' && invoice.eventos && invoice.eventos.length > 0 && (
            <Card className="overflow-hidden border-2 border-status-red-fg/20">
              <div className="bg-status-red-bg p-5 flex items-center gap-2 text-[13.5px] font-bold text-status-red-fg">
                <AlertCircle className="h-4 w-4" />
                Motivo da Rejeição (SEFAZ)
              </div>
              <div className="p-6 space-y-3">
                {invoice.eventos.map((evento, idx) => (
                  <div key={evento.id || idx} className="bg-status-red-bg/50 p-4 rounded-2xl border border-status-red-fg/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-status-red-fg text-white border-none">{evento.codigo}</Badge>
                      <span className="text-[10px] font-bold text-status-red-fg/70">{new Date(evento.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-[13px] font-bold text-status-red-fg leading-tight">
                      {evento.descricao}
                    </p>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <Link href="/invoices/new" className="flex-1">
                    <Button className="w-full bg-status-red-fg hover:bg-status-red-fg/90 text-white border-none rounded-xl font-bold flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4" />
                      Corrigir e Reemitir
                    </Button>
                  </Link>
                  <div className="flex-1 p-3 bg-card border border-status-red-fg/15 rounded-xl">
                    <p className="text-[10px] text-status-red-fg font-medium leading-tight">
                       Ao clicar em reemitir, você monta uma nova nota com os dados corrigidos.
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-muted/40 rounded-2xl border border-border">
                   <p className="text-[11.5px] text-text-muted font-medium">
                     <span className="font-bold text-foreground">O que fazer?</span> Verifique os dados do cliente, NCM dos produtos e a validade do seu certificado digital antes de emitir novamente.
                   </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vinculos" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-status-green-fg" />
                Vínculos
              </div>
              <div className="space-y-4">
                {invoice.serviceOrderId ? (
                  <div>
                    <p className="text-[10.5px] text-text-muted font-bold uppercase tracking-wider mb-2">Ordem de Serviço</p>
                    <Link href={`/orders/${invoice.serviceOrderId}`}>
                      <Button variant="outline" className="w-full justify-start gap-2 rounded-xl">
                        <FileText className="h-4 w-4" />
                        Ver OS vinculada
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-[12px] text-text-muted italic">Venda avulsa, sem OS vinculada.</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-status-green-fg" />
                Ações Rápidas
              </div>
              <div className="space-y-3">
                <Button className="w-full bg-status-green-bg text-status-green-fg hover:bg-status-green-bg/80 border-none rounded-xl font-bold">
                  Imprimir NFe (DANFE)
                </Button>
                <Button className="w-full bg-status-green-bg text-status-green-fg hover:bg-status-green-bg/80 border-none rounded-xl font-bold">
                  Enviar por E-mail
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card className="p-6">
            <div className="text-[13.5px] font-bold text-foreground mb-5 flex items-center gap-2">
              <History className="h-4 w-4 text-status-green-fg" />
              Histórico de Transmissão
            </div>
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {invoice.eventos && invoice.eventos.length > 0 ? (
                invoice.eventos.map((evento, idx) => (
                  <div key={evento.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full border border-border shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 bg-card">
                      {evento.tipo === 'AUTORIZACAO' ? (
                        <CheckCircle className="h-4 w-4 text-status-green-fg" />
                      ) : evento.tipo === 'REJEICAO' ? (
                        <AlertCircle className="h-4 w-4 text-status-red-fg" />
                      ) : (
                        <Info className="h-4 w-4 text-status-blue-fg" />
                      )}
                    </div>
                    <div className="w-[calc(100%-3.5rem)] md:w-[45%] bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-foreground text-[13px]">{evento.tipo}</div>
                        <time className="font-mono text-[10px] text-status-green-fg bg-status-green-bg px-2 py-0.5 rounded-full">
                          {new Date(evento.createdAt).toLocaleString('pt-BR')}
                        </time>
                      </div>
                      <div className="text-text-secondary text-[12.5px] mb-2">
                        {evento.descricao}
                      </div>
                      {evento.xmlRetorno && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[11px] font-bold text-status-green-fg hover:bg-status-green-bg gap-2 p-0"
                          onClick={() => {
                            setSelectedXml(evento.xmlRetorno || '');
                            setIsXmlModalOpen(true);
                          }}
                        >
                          <Code className="h-3 w-3" />
                          Ver XML Técnico
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-muted italic text-[13px]">
                  Nenhum evento registrado para esta nota.
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Visualizador de XML */}
      <Dialog open={isXmlModalOpen} onOpenChange={setIsXmlModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col rounded-[24px] border-none shadow-2xl p-0 bg-card">
          <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-6 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
                <Code className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Log Técnico SEFAZ (XML)</DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-0.5">
                  Visualização bruta da resposta assinada pela autoridade fiscal.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-8 overflow-auto flex-1 bg-muted/30">
            <div className="relative group">
              <pre className="p-6 bg-card rounded-2xl border border-border text-xs font-mono text-text-secondary leading-relaxed whitespace-pre-wrap break-all shadow-inner overflow-x-auto">
                {selectedXml || 'Sem XML disponível'}
              </pre>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(selectedXml || '');
                  alert('XML copiado para a área de transferência');
                }}
                className="absolute top-4 right-4 bg-status-green-fg hover:bg-status-green-fg/90 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Copiar
              </Button>
            </div>
          </div>

          <div className="p-5 border-t border-border bg-card flex justify-end shrink-0">
            <Button
              onClick={() => setIsXmlModalOpen(false)}
              className="bg-muted hover:bg-muted/70 text-foreground border-none rounded-xl px-8 font-bold"
            >
              Fechar Visualizador
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
