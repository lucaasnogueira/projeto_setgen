"use client"

import { useState, useEffect } from 'react';
import { serviceOrdersApi } from '@/lib/api/service-orders';
import { fiscalApi, EmitirNotaDualDto } from '@/lib/api/fiscal';
import { 
  FileText, 
  Package, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Truck,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface EmitDualFormProps {
  osId: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export function EmitDualForm({ osId, onSuccess, onCancel }: EmitDualFormProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [osData, setOsData] = useState<any>(null);
  const [ambiente, setAmbiente] = useState<'PRODUCAO' | 'HOMOLOGACAO'>('HOMOLOGACAO');

  useEffect(() => {
    loadOs();
  }, [osId]);

  const loadOs = async () => {
    try {
      setLoading(true);
      const data = await serviceOrdersApi.getOne(osId);
      setOsData(data);
    } catch (error) {
      console.error('Error loading OS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!osData) return;

    setSubmitting(true);
    try {
      const payload: EmitirNotaDualDto = {
        serviceOrderId: osData.id,
        clientCnpj: osData.client?.cnpjCpf || '',
        emitenteCnpj: '10.744.400/0001-65', // CNPJ autorizado pelo certificado
        ambiente,
        itensServico: (osData.items || [])
          .filter((item: any) => item.product?.unit === 'UN' || item.product?.unit === 'H' || !item.product)
          .map((item: any) => ({
            descricao: item.product?.name || 'Serviço Prestado',
            quantidade: Number(item.quantity),
            valorUnitario: Number(item.unitPrice),
          })),
        itensPecas: (osData.items || [])
          .filter((item: any) => item.product?.unit === 'PC' || item.product?.unit === 'KG')
          .map((item: any) => ({
            ncm: item.product?.code || '00000000',
            descricao: item.product?.name || 'Peça/Mercadoria',
            quantidade: Number(item.quantity),
            valorUnitario: Number(item.unitPrice),
            fabricadoNaZfm: true,
          })),
      };

      const result = await fiscalApi.emitirDual(payload);
      onSuccess(result);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao emitir nota fiscal dual');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      <p className="text-gray-500 font-medium">Carregando dados da OS...</p>
    </div>
  );

  const temServicos = (osData?.items || []).some((i: any) => !i.product || i.product.unit !== 'PC');
  const temPecas = (osData?.items || []).some((i: any) => i.product && i.product.unit === 'PC');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Itens da Nota */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Package className="h-5 w-5 text-emerald-600" />
                  Itens para Faturamento
                </CardTitle>
                <div className="flex gap-2">
                  {temServicos && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">NFSe (Serviços)</Badge>}
                  {temPecas && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">NFe (Mercadorias)</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {osData?.items?.map((item: any) => (
                  <div key={item.id} className="p-6 flex items-start justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      <div className={`mt-1 p-2 rounded-xl ${item.product?.unit === 'PC' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {item.product?.unit === 'PC' ? <Package className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{item.product?.name || 'Serviço de Manutenção'}</p>
                        <p className="text-sm text-gray-500">Qtd: {item.quantity} × R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        {item.product?.unit === 'PC' && (
                          <div className="mt-2 flex items-center gap-2">
                             <Badge variant="outline" className="text-[10px] uppercase border-emerald-200 text-emerald-700 bg-emerald-50/50">
                               ZFM - Crédito Presumido Ativo
                             </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Emissão */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Configurações de Emissão
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    Ambiente Sefaz
                    <span title="Homologação não tem valor fiscal. Produção emite notas reais.">
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </span>
                  </label>
                  <div className="flex p-1 bg-gray-100 rounded-2xl w-full">
                    <button
                      onClick={() => setAmbiente('HOMOLOGACAO')}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${ambiente === 'HOMOLOGACAO' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Homologação
                    </button>
                    <button
                      onClick={() => setAmbiente('PRODUCAO')}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${ambiente === 'PRODUCAO' ? 'bg-red-600 shadow-lg text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Produção
                    </button>
                  </div>
                  {ambiente === 'PRODUCAO' && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-red-800 font-medium">Atenção: A emissão em produção gera obrigações tributárias e necessita de certificado digital A1 válido.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700">Fluxo de Transmissão</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200">
                        <Truck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">Transmissão Direta (SEFAZ-AM)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200">
                        <Zap className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">Split Payment Automático (1,0%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Financeiro */}
        <div className="space-y-6">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden sticky top-6">
            <CardHeader className="bg-gray-900 p-8 text-white">
              <CardTitle className="text-lg font-bold">Resumo do Faturamento</CardTitle>
              <p className="text-gray-400 text-xs">Cálculo baseado na OS #{osData.orderNumber}</p>
            </CardHeader>
            <CardContent className="p-8 space-y-6 bg-white">
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal Itens</span>
                  <span className="font-medium text-gray-900">R$ {osData.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                  <span className="flex items-center gap-1 font-semibold">IBS/CBS (Reforma)</span>
                  <span className="font-bold">+ 1.0%</span>
                </div>
                {temPecas && (
                   <div className="flex justify-between text-xs text-amber-600 bg-amber-50/50 px-3 py-2 rounded-xl border border-amber-100">
                    <span className="font-medium">Benefício ZFM aplicado</span>
                    <span className="font-bold">- ICMS (12%)</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total à Faturar</p>
                <div className="flex items-baseline gap-1">
                   <p className="text-gray-500 text-sm font-medium">R$</p>
                   <p className="text-4xl font-extrabold text-gray-900">
                    {(osData.value * 1.01).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </p>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 leading-tight italics">
                   * Inclui o cálculo por fora dos novos impostos 2026.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Emitindo Notas...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Emitir Notas Fiscais
                    </>
                  )}
                </Button>
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  className="w-full h-12 text-gray-500 hover:text-gray-800 font-bold rounded-2xl"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
