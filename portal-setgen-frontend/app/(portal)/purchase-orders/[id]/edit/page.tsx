"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { quotesApi } from '@/lib/api/quotes';
import { QuoteStatus } from '@/types';
import { ShoppingCart, Save, X, FileText, DollarSign, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailHeader } from "@/components/layout/DetailHeader";

const OC_ELIGIBLE_STATUSES: QuoteStatus[] = [QuoteStatus.APPROVED, QuoteStatus.SENT_TO_CLIENT, QuoteStatus.AWAITING_RESPONSE];

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    quoteId: '',
    clientId: '',
    orderNumber: '',
    value: '',
    issueDate: '',
    expiryDate: '',
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const [order, quoteData] = await Promise.all([
        purchaseOrdersApi.getById(params.id as string),
        quotesApi.getAll()
      ]);

      setQuotes(quoteData.filter(q => OC_ELIGIBLE_STATUSES.includes(q.status) || q.id === order.quoteId));

      setFormData({
        quoteId: order.quoteId,
        clientId: order.clientId,
        orderNumber: order.orderNumber,
        value: order.value.toString(),
        issueDate: order.issueDate ? new Date(order.issueDate).toISOString().split('T')[0] : '',
        expiryDate: order.expiryDate ? new Date(order.expiryDate).toISOString().split('T')[0] : '',
      });
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Erro ao carregar dados da OC/OP');
      router.push('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const quoteId = e.target.value;
    const quote = quotes.find(q => q.id === quoteId);

    setFormData(prev => ({
      ...prev,
      quoteId,
      clientId: quote ? quote.clientId : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        quoteId: formData.quoteId,
        clientId: formData.clientId,
        orderNumber: formData.orderNumber,
        value: parseFloat(formData.value),
        issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : '',
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : '',
      };
      await purchaseOrdersApi.update(params.id as string, payload);
      alert('OC/OP atualizada com sucesso!');
      router.push(`/purchase-orders/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar OC/OP');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <DetailHeader
        icon={ShoppingCart}
        tone="green"
        title="Editar Ordem de Compra"
        subtitle={`Atualize as informações da OC #${formData.orderNumber}`}
        onBack={() => router.back()}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-green-600" />
              Vínculo com Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Orçamento Aprovado <span className="text-red-500">*</span></Label>
              <select
                required
                value={formData.quoteId}
                onChange={handleQuoteSelect}
                className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                <option value="">Selecione um orçamento aprovado</option>
                {quotes.map(quote => (
                  <option key={quote.id} value={quote.id}>
                    {quote.quoteNumber} - {quote.client?.companyName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Info className="h-5 w-5 text-green-600" />
              Dados da Ordem de Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Número da OC/OP <span className="text-red-500">*</span></Label>
                <Input
                  required
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  placeholder="Ex: OC-2024-001"
                  className="h-11 rounded-xl focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Valor (R$) <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="h-11 pl-10 rounded-xl focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Data de Emissão <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    required
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="h-11 pl-10 rounded-xl focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Validade <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="h-11 pl-10 rounded-xl focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 h-12 rounded-2xl border-2 hover:bg-muted flex items-center justify-center gap-2 font-bold text-muted-foreground transition-all active:scale-95"
          >
            <X className="h-5 w-5" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 h-12 bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white rounded-2xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
