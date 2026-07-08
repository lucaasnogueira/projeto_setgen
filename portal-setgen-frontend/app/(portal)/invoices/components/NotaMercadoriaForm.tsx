"use client"

import { useState, useEffect } from 'react';
import { clientsApi } from '@/lib/api/clients';
import { inventoryApi } from '@/lib/api/inventory';
import { serviceOrdersApi } from '@/lib/api/service-orders';
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
      serviceOrdersApi.getAll(ServiceOrderStatus.APPROVED),
      serviceOrdersApi.getAll(ServiceOrderStatus.IN_PROGRESS),
      serviceOrdersApi.getAll(ServiceOrderStatus.COMPLETED),
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border p-6">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Cliente <span className="text-red-500">*</span></Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setServiceOrderId(''); }}>
                <SelectTrigger className="h-12 rounded-2xl bg-card">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.tradeName || c.companyName} — {c.cnpjCpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Ordem de Serviço vinculada (opcional)</Label>
              <Select value={serviceOrderId} onValueChange={setServiceOrderId} disabled={!clientId}>
                <SelectTrigger className="h-12 rounded-2xl bg-card">
                  <SelectValue placeholder={clientId ? 'Nenhuma (venda avulsa)' : 'Selecione um cliente primeiro'} />
                </SelectTrigger>
                <SelectContent>
                  {clientServiceOrders.map((os) => (
                    <SelectItem key={os.id} value={os.id}>
                      {os.orderNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border p-6">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="h-5 w-5 text-emerald-600" />
              Mercadorias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end bg-muted/50 p-6 rounded-2xl border border-dashed">
              <div className="flex-1 space-y-2">
                <Label className="font-bold text-sm">Produto</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-12 rounded-2xl bg-card">
                    <SelectValue placeholder="Selecione um produto do estoque" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code} - {p.name} (Estoque: {p.currentStock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-28 space-y-2">
                <Label className="font-bold text-sm">Qtd</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="h-12 rounded-2xl bg-card"
                />
              </div>
              <Button
                type="button"
                onClick={addItem}
                className="h-12 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold flex items-center gap-2 px-8 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="border rounded-2xl overflow-hidden shadow-sm">
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

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border p-6">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Ambiente Sefaz
              <span title="Homologação não tem valor fiscal. Produção emite notas reais.">
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex p-1 bg-muted rounded-2xl w-full max-w-md">
              <button
                type="button"
                onClick={() => setAmbiente('HOMOLOGACAO')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${ambiente === 'HOMOLOGACAO' ? 'bg-card shadow-sm text-emerald-700' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Homologação
              </button>
              <button
                type="button"
                onClick={() => setAmbiente('PRODUCAO')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${ambiente === 'PRODUCAO' ? 'bg-red-600 shadow-lg text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Produção
              </button>
            </div>
            {ambiente === 'PRODUCAO' && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2 max-w-md">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-red-800 font-medium">Atenção: a emissão em produção gera obrigações tributárias e necessita de certificado digital A1 válido.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden sticky top-6">
          <CardHeader className="bg-gray-900 p-8 text-white">
            <CardTitle className="text-lg font-bold">Resumo</CardTitle>
            <p className="text-muted-foreground text-xs">{items.length} mercadoria(s)</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6 bg-card">
            <div className="flex justify-between text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
              <span className="flex items-center gap-1 font-semibold">IBS/CBS (Reforma)</span>
              <span className="font-bold">+ 1.0%</span>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total a Faturar</p>
              <div className="flex items-baseline gap-1">
                <p className="text-muted-foreground text-sm font-medium">R$</p>
                <p className="text-4xl font-extrabold text-foreground">
                  {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 leading-tight italic">
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
                    Emitindo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Emitir Nota Fiscal
                  </>
                )}
              </Button>
              <Button
                onClick={onCancel}
                variant="ghost"
                className="w-full h-12 text-muted-foreground hover:text-foreground font-bold rounded-2xl"
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
