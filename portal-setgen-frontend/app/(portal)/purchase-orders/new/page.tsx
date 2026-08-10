"use client"

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { quotesApi } from '@/lib/api/quotes';
import { QuoteStatus } from '@/types';
import { Save, X, FileText, DollarSign, Calendar, Info, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import { toDateInputValue, startOfBusinessDayISO, endOfBusinessDayISO } from '@/lib/date';

// Espelha OC_ELIGIBLE_QUOTE_STATUSES do backend (purchase-orders.service.ts).
const OC_ELIGIBLE_STATUSES: QuoteStatus[] = [QuoteStatus.APPROVED, QuoteStatus.SENT_TO_CLIENT, QuoteStatus.AWAITING_RESPONSE];

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultQuoteId = searchParams.get('quoteId') || '';
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    quoteId: defaultQuoteId,
    clientId: '',
    orderNumber: '',
    value: '',
    issueDate: toDateInputValue(new Date()),
    expiryDate: '',
  });

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    const data = await quotesApi.getAll();
    const eligible = data.filter((q) => OC_ELIGIBLE_STATUSES.includes(q.status) || q.id === defaultQuoteId);
    setQuotes(eligible);
    if (defaultQuoteId) {
      const q = eligible.find((x) => x.id === defaultQuoteId);
      if (q) {
        setFormData((prev) => ({ ...prev, clientId: q.clientId, orderNumber: generateOCNumber(q.quoteNumber) }));
      }
    }
  };

  const generateOCNumber = (quoteNumber: string) => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `OC-${year}-${quoteNumber}-${random}`;
  };

  const handleQuoteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const quoteId = e.target.value;
    const quote = quotes.find(q => q.id === quoteId);

    setFormData(prev => ({
      ...prev,
      quoteId,
      clientId: quote ? quote.clientId : '',
      orderNumber: quote ? generateOCNumber(quote.quoteNumber) : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Arquivo da Ordem de Compra/Pedido é obrigatório');
      return;
    }
    setLoading(true);

    try {
      const data = new FormData();
      data.append('quoteId', formData.quoteId);
      data.append('clientId', formData.clientId);
      data.append('orderNumber', formData.orderNumber);
      data.append('value', formData.value);
      // Emissão no início do dia, validade até o fim do dia — no fuso da
      // operação. O backend compara expiryDate com "agora" para decidir se a
      // OC nasce APPROVED ou EXPIRED.
      data.append('issueDate', startOfBusinessDayISO(formData.issueDate) || '');
      data.append('expiryDate', endOfBusinessDayISO(formData.expiryDate) || '');
      data.append('file', file);

      await purchaseOrdersApi.create(data);
      alert('OC/OP cadastrada com sucesso!');
      router.push('/purchase-orders');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao cadastrar OC/OP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Nova Ordem de Compra/Pedido" subtitle="Vincule uma OC/OP a um orçamento aprovado" />

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
                disabled={!!defaultQuoteId}
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

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Arquivo da OC/OP (PDF ou Imagem) <span className="text-red-500">*</span></Label>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer ${
                  file ? 'border-green-500 bg-green-50' : 'border-border hover:border-green-300 hover:bg-muted'
                }`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  required
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className={`p-4 rounded-full transition-colors ${file ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground group-hover:bg-green-100 group-hover:text-green-600'}`}>
                  <Upload className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className={`font-bold ${file ? 'text-green-700' : 'text-muted-foreground'}`}>
                    {file ? file.name : 'Clique para selecionar o arquivo'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG ou PNG (Máx. 10MB)</p>
                </div>
                {file && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
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
            disabled={loading}
            className="flex-1 h-12 bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white rounded-2xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Salvando...' : 'Salvar OC/OP'}
          </Button>
        </div>
      </form>
    </div>
  );
}
