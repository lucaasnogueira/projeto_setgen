"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Invoice, UserRole, FiscalStatus } from '@/types';
import { fiscalApi } from '@/lib/api/fiscal';
import { invoicesApi } from '@/lib/api/invoices';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth';
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  Edit, 
  Trash2, 
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { DetailHeader } from "@/components/layout/DetailHeader";
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
      // Fallback
      invoicesApi.getById(params.id as string).then(setInvoice);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta nota fiscal?')) return;

    try {
      await invoicesApi.delete(params.id as string);
      alert('Nota fiscal excluída com sucesso!');
      router.push('/invoices');
    } catch (error) {
      alert('Erro ao excluir nota fiscal');
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <DetailHeader
        icon={DollarSign}
        tone="green"
        title={`Nota Fiscal #${invoice.invoiceNumber}`}
        subtitle={<><Hash className="h-3.5 w-3.5" />Série: {invoice.series || '1'}</>}
        onBack={() => router.back()}
        backLabel="Voltar para lista"
        actions={
          <>
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button variant="outline" className="rounded-[9px] font-bold gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="rounded-[9px] font-bold gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Info className="h-5 w-5 text-emerald-600" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Total</h4>
                  <p className="text-3xl font-black text-emerald-600">
                    {(invoice.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status Sefaz</h4>
                  <Badge 
                    variant="outline"
                    className={`
                      ${invoice.status === 'AUTORIZADA' ? 'bg-green-50 text-green-700 border-green-200' : 
                        invoice.status === 'REJEITADA' ? 'bg-red-50 text-red-700 border-red-200' :
                        invoice.status === 'PROCESSANDO' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                        'bg-gray-50 text-gray-600'
                      } 
                      font-bold text-xs border-none px-4 py-1.5 rounded-full
                    `}
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Data de Emissão</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{new Date(invoice.issueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Data de Vencimento</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {invoice.chaveAcesso && (
                <div className="pt-8 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Chave de Acesso</h4>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 font-mono text-sm break-all flex justify-between items-center group">
                    <span className="text-gray-700">{invoice.chaveAcesso}</span>
                    <button className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção Fiscal (Reforma 2026) */}
          {invoice.impostos?.[0] && (
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-emerald-600 p-6 text-white">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <ShieldCheck className="h-5 w-5" />
                  Regime Fiscal Reforma 2026
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">CBS (0,9%)</p>
                    <p className="text-lg font-bold text-gray-900">R$ {(invoice.impostos[0].valorCbs || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">IBS (0,1%)</p>
                    <p className="text-lg font-bold text-gray-900">R$ {(invoice.impostos[0].valorIbs || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">ISS Outros</p>
                    <p className="text-lg font-bold text-gray-900">R$ {(invoice.impostos[0].valorIss || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase text-emerald-600">Total Retido</p>
                    <p className="text-xl font-black text-emerald-600">R$ {(invoice.splitPayment?.valorRetido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-4">
                  <Zap className="h-8 w-8 text-blue-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                       Split Payment Ativado
                       <Badge className="bg-blue-600 text-[10px] h-4 border-none">Automático</Badge>
                    </p>
                    <p className="text-xs text-blue-800 opacity-80 leading-tight">
                       Este faturamento utiliza o mecanismo de split automático da RFB/ADN e SEFAZ-AM.
                    </p>
                  </div>
                </div>

                {invoice.impostos[0].beneficioZfmAtivo && (
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-4">
                    <Landmark className="h-8 w-8 text-amber-600 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-amber-900">Benefício Manaus (ZFM)</p>
                      <p className="text-xs text-amber-800 opacity-80 leading-tight">
                        Crédito presumido mantido conforme Art. 430 da LC 214/2024. Valor: R$ {(invoice.impostos[0].creditoPresumidoZfm || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Seção de Rejeição / Motivo */}
          {invoice.status === 'REJEITADA' && invoice.eventos && invoice.eventos.length > 0 && (
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden border-2 border-red-100 animate-in fade-in slide-in-from-top-4 duration-500">
               <CardHeader className="bg-red-50 p-6">
                <CardTitle className="flex items-center gap-2 text-red-800 text-lg font-bold">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Motivo da Rejeição (SEFAZ)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {invoice.eventos.map((evento, idx) => (
                  <div key={evento.id || idx} className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-red-600 text-white border-none">{evento.codigo}</Badge>
                      <span className="text-[10px] font-bold text-red-400">{new Date(evento.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-sm font-bold text-red-900 leading-tight">
                      {evento.descricao}
                    </p>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href={`/invoices/emit-dual?osId=${invoice.serviceOrderId}`} className="flex-1">
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white border-none rounded-xl font-bold flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4" />
                      Corrigir e Reemitir
                    </Button>
                  </Link>
                  <div className="flex-1 p-3 bg-white border border-red-100 rounded-xl">
                    <p className="text-[10px] text-red-600 font-medium leading-tight">
                       Ao clicar em reemitir, você poderá ajustar os dados da OS antes de uma nova transmissão.
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <p className="text-xs text-gray-500 font-medium">
                     <span className="font-bold text-gray-700">O que fazer?</span> Verifique os dados do cliente, NCM dos produtos e a validade do seu certificado digital. Após corrigir na Ordem de Serviço, você pode tentar emitir novamente.
                   </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <FileText className="h-5 w-5 text-emerald-600" />
                Vínculos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {invoice.purchaseOrderId && (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Ordem de Compra</p>
                  <Link href={`/purchase-orders/${invoice.purchaseOrderId}`}>
                    <Button variant="outline" className="w-full justify-start gap-2 border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl">
                      <FileText className="h-4 w-4" />
                      Ver OC vinculada
                    </Button>
                  </Link>
                </div>
              )}
              {invoice.serviceOrderId && (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Ordem de Serviço</p>
                  <Link href={`/orders/${invoice.serviceOrderId}`}>
                    <Button variant="outline" className="w-full justify-start gap-2 border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl">
                      <FileText className="h-4 w-4" />
                      Ver OS vinculada
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

           <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
             <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <AlertCircle className="h-5 w-5 text-emerald-600" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none rounded-xl font-bold">
                Imprimir NFe (DANFE)
              </Button>
              <Button className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none rounded-xl font-bold">
                Enviar por E-mail
              </Button>
            </CardContent>
          </Card>

          {/* Histórico de Transmissão (Timeline) */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <History className="h-5 w-5 text-emerald-600" />
                Histórico de Transmissão
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {invoice.eventos && invoice.eventos.length > 0 ? (
                  invoice.eventos.map((evento, idx) => (
                    <div key={evento.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 bg-white">
                        {evento.tipo === 'AUTORIZACAO' ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        ) : evento.tipo === 'REJEICAO' ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Info className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="w-[calc(100%-4rem)] md:w-[45%] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-gray-900">{evento.tipo}</div>
                          <time className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {new Date(evento.createdAt).toLocaleString('pt-BR')}
                          </time>
                        </div>
                        <div className="text-gray-500 text-sm mb-3">
                          {evento.descricao}
                        </div>
                        {evento.xmlRetorno && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 gap-2 p-0"
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
                  <div className="text-center py-8 text-gray-400 italic">
                    Nenhum evento registrado para esta nota.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Visualizador de XML */}
      <Dialog open={isXmlModalOpen} onOpenChange={setIsXmlModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col rounded-[32px] border-none shadow-2xl p-0 bg-white">
          <div className="bg-gradient-to-r from-gray-900 to-emerald-950 p-6 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
                <Code className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Log Técnico SEFAZ (XML)</DialogTitle>
                <DialogDescription className="text-gray-400 text-xs mt-0.5">
                  Visualização bruta da resposta assinada pela autoridade fiscal.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-8 overflow-auto flex-1 bg-gray-50">
            <div className="relative group">
              <pre className="p-6 bg-white rounded-2xl border border-gray-200 text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-wrap break-all shadow-inner overflow-x-auto ring-1 ring-black/5">
                {selectedXml || 'Sem XML disponível'}
              </pre>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(selectedXml || '');
                  alert('XML copiado para a área de transferência');
                }}
                className="absolute top-4 right-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Copiar
              </Button>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-white flex justify-end shrink-0">
            <Button 
              onClick={() => setIsXmlModalOpen(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-none rounded-xl px-8 font-bold"
            >
              Fechar Visualizador
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
