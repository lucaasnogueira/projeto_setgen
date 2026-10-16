"use client"

import { useState, useEffect } from 'react';
import { clientsApi } from '@/lib/api/clients';
import { inventoryApi } from '@/lib/api/inventory';
import { ordersApi } from '@/lib/api/orders';
import { fiscalApi, EmitirNotaMercadoriaDto } from '@/lib/api/fiscal';
import { ServiceOrderStatus } from '@/types';
import {
  Package,
  Building2,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from "@/components/ui/separator";

interface NotaItem {
  productId: string;
  code: string;
  name: string;
  ncm: string;
  quantidade: number;
  valorUnitario: number;
  fabricadoNaZfm: boolean;
}

interface NotaMercadoriaFormProps {
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export function NotaMercadoriaForm({ onSuccess, onCancel }: NotaMercadoriaFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [clientId, setClientId] = useState('');
  const [serviceOrderId, setServiceOrderId] = useState('');
  const [ambiente, setAmbiente] = useState<'PRODUCAO' | 'HOMOLOGACAO'>('HOMOLOGACAO');
  const [items, setItems] = useState<NotaItem[]>([]);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantidade, setQuantidade] = useState('1');

  useEffect(() => {
    clientsApi.getAll().then(setClients).catch(() => setClients([]));
    inventoryApi.getAll().then(setProducts).catch(() => setProducts([]));
    Promise.all([
      ordersApi.getAll({ status: ServiceOrderStatus.AWAITING_MATERIALS }),
      ordersApi.getAll({ status: ServiceOrderStatus.IN_PROGRESS }),
      ordersApi.getAll({ status: ServiceOrderStatus.COMPLETED }),
    ]).then((results) => setServiceOrders(results.flat())).catch(() => setServiceOrders([]));
  }, []);

  const clientServiceOrders = serviceOrders.filter((os) => os.clientId === clientId);

  const addItem = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    if (items.some((i) => i.productId === selectedProductId)) return;

    setItems([
      ...items,
      {
        productId: product.id,
        code: product.code,
        name: product.name,
        ncm: product.ncm || '',
        quantidade: parseFloat(quantidade) || 1,
        valorUnitario: Number(product.unitCost || 0),
        fabricadoNaZfm: false,
      },
    ]);
    setSelectedProductId('');
    setQuantidade('1');
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const updateItem = (productId: string, patch: Partial<NotaItem>) => {
    setItems(items.map((i) => (i.productId === productId ? { ...i, ...patch } : i)));
  };

  const total = items.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);

  const handleSubmit = async () => {
    if (!clientId) {
      alert('Selecione um cliente');
      return;
    }
    if (items.length === 0) {
      alert('Adicione ao menos uma mercadoria');
      return;
    }

    setSubmitting(true);
    try {
      const payload: EmitirNotaMercadoriaDto = {
        clientId,
        serviceOrderId: serviceOrderId || undefined,
        ambiente,
        itens: items.map((i) => ({
          productId: i.productId,
          quantidade: i.quantidade,
          valorUnitario: i.valorUnitario,
          fabricadoNaZfm: i.fabricadoNaZfm,
        })),
      };
      const result = await fiscalApi.emitirMercadoria(payload);
      onSuccess(result);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao emitir nota fiscal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Protocol Header Card */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200/80 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 text-[#E2661D] border border-orange-200">
                NFE-MERCADORIA-NOVA
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                Minuta Fiscal SEFAZ-AM
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">
              Emissão de Nota Fiscal de Mercadorias (NF-e)
            </h3>
            <p className="text-[11px] text-gray-500">
              Faturamento de peças, insumos ou venda direta integrada à SEFAZ
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
            <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-[#E2661D]" />
              Identificação do Destinatário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Cliente <span className="text-red-500">*</span></Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setServiceOrderId(''); }}>
                <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-gray-200">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.tradeName || c.companyName} — {c.cnpjCpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Ordem de Serviço vinculada (opcional)</Label>
              <Select value={serviceOrderId} onValueChange={setServiceOrderId} disabled={!clientId}>
                <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-gray-200">
                  <SelectValue placeholder={clientId ? 'Nenhuma (venda avulsa)' : 'Selecione um cliente primeiro'} />
                </SelectTrigger>
                <SelectContent>
                  {clientServiceOrders.map((os) => (
                    <SelectItem key={os.id} value={os.id} className="text-xs">
                      {os.orderNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
            <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-[#E2661D]" />
              Mercadorias e Peças
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-end bg-gray-50/50 p-3.5 rounded-xl border border-gray-200/80">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Produto / Peça</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-gray-200">
                    <SelectValue placeholder="Selecione um produto do estoque" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.code} - {p.name} (Estoque: {p.currentStock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-28 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Qtd</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="h-9 rounded-lg text-xs bg-white border-gray-200"
                />
              </div>
              <Button
                type="button"
                onClick={addItem}
                className="h-9 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 px-4 shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            <div className="border border-gray-200/80 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full border-collapse bg-card">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Produto</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">NCM</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground uppercase">Qtd</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground uppercase">V. Unit</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase">ZFM</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground italic text-sm">
                        Nenhuma mercadoria adicionada ainda.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.productId} className="hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm font-bold">{item.name}</td>
                        <td className="py-3 px-4">
                          <Input
                            value={item.ncm}
                            onChange={(e) => updateItem(item.productId, { ncm: e.target.value })}
                            placeholder="00000000"
                            className="h-9 w-28 rounded-lg text-xs"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={item.quantidade}
                            onChange={(e) => updateItem(item.productId, { quantidade: parseFloat(e.target.value) || 0 })}
                            className="h-9 w-20 rounded-lg text-right ml-auto"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.valorUnitario}
                            onChange={(e) => updateItem(item.productId, { valorUnitario: parseFloat(e.target.value) || 0 })}
                            className="h-9 w-24 rounded-lg text-right ml-auto"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={item.fabricadoNaZfm}
                            onChange={(e) => updateItem(item.productId, { fabricadoNaZfm: e.target.checked })}
                            className="h-4 w-4 accent-emerald-600"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
            <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[#E2661D]" />
              Ambiente de Transmissão SEFAZ
              <span title="Homologação não tem valor fiscal. Produção emite notas reais com valor jurídico.">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="flex p-1 bg-gray-100 rounded-lg w-full max-w-md">
              <button
                type="button"
                onClick={() => setAmbiente('HOMOLOGACAO')}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${ambiente === 'HOMOLOGACAO' ? 'bg-white shadow-2xs text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Homologação (Testes)
              </button>
              <button
                type="button"
                onClick={() => setAmbiente('PRODUCAO')}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${ambiente === 'PRODUCAO' ? 'bg-rose-600 shadow-2xs text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Produção Oficial
              </button>
            </div>
            {ambiente === 'PRODUCAO' && (
              <div className="mt-3 p-3 bg-rose-50 rounded-lg border border-rose-200 flex items-start gap-2 max-w-md">
                <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-rose-800 font-medium">Atenção: a emissão em produção gera obrigações tributárias e necessita de certificado digital A1 válido.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden sticky top-6 bg-white">
          <CardHeader className="bg-gray-900 px-4 py-3 text-white">
            <CardTitle className="text-xs sm:text-sm font-bold">Resumo Fiscal</CardTitle>
            <p className="text-gray-400 text-[11px] font-mono">{items.length} mercadoria(s) adicionada(s)</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
              <span className="font-semibold">IBS/CBS (Reforma)</span>
              <span className="font-mono font-bold">+ 1.0%</span>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total a Faturar</p>
              <div className="flex items-baseline gap-1">
                <p className="text-gray-400 text-xs font-medium">R$</p>
                <p className="text-xl font-black text-gray-900 font-mono">
                  {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                * Inclui cálculo regulatório e regras de incentivo ZFM quando aplicável.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-9 bg-[#E2661D] hover:bg-[#c95716] text-white rounded-lg shadow-2xs flex items-center justify-center gap-1.5 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Emitindo Nota...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Emitir Nota Fiscal (NF-e)
                  </>
                )}
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="w-full h-9 text-gray-600 hover:text-gray-900 font-semibold rounded-lg text-xs border-gray-200 hover:bg-gray-50"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
