"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { approvalsApi } from '@/lib/api/approvals';
import { quotesApi } from '@/lib/api/quotes';
import { QuoteStatus } from '@/types';
import { CheckCircle, Save, X, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewApprovalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pendingQuotes, setPendingQuotes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    quoteId: '',
    status: 'APPROVED',
    comments: '',
  });

  useEffect(() => {
    loadPendingQuotes();
  }, []);

  const loadPendingQuotes = async () => {
    const data = await quotesApi.getAll({ status: QuoteStatus.PENDING_APPROVAL });
    setPendingQuotes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.status === 'APPROVED') {
        await approvalsApi.approve(formData.quoteId);
      } else {
        await approvalsApi.reject(formData.quoteId, formData.comments);
      }
      alert('Aprovação registrada com sucesso!');
      router.push('/approvals');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao registrar aprovação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Registrar Aprovação" subtitle="Aprovar ou rejeitar orçamentos pendentes" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-orange-600" />
              Seleção de Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Orçamento para Avaliação <span className="text-red-500">*</span></Label>
              <select
                required
                value={formData.quoteId}
                onChange={(e) => setFormData({ ...formData, quoteId: e.target.value })}
                className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                <option value="">Selecione um orçamento pendente</option>
                {pendingQuotes.map(quote => (
                  <option key={quote.id} value={quote.id}>
                    {quote.quoteNumber} - {quote.client?.companyName} ({quote.type})
                  </option>
                ))}
              </select>
              {pendingQuotes.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2 italic flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Nenhum orçamento aguardando aprovação no momento.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              Decisão e Comentários
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <Label className="text-foreground font-semibold">Decisão <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'APPROVED' })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    formData.status === 'APPROVED'
                    ? 'border-green-500 bg-green-50 text-green-700 font-bold shadow-md'
                    : 'border-border text-muted-foreground hover:border-green-200'
                  }`}
                >
                  <CheckCircle className="h-5 w-5" />
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'REJECTED' })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    formData.status === 'REJECTED'
                    ? 'border-red-500 bg-red-50 text-red-700 font-bold shadow-md'
                    : 'border-border text-muted-foreground hover:border-red-200'
                  }`}
                >
                  <X className="h-5 w-5" />
                  Rejeitar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">
                {formData.status === 'REJECTED' ? 'Motivo da Rejeição' : 'Observações'}
                {formData.status === 'REJECTED' && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <textarea
                  required={formData.status === 'REJECTED'}
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={4}
                  placeholder={formData.status === 'REJECTED' ? "Informe o motivo da rejeição..." : "Observações adicionais sobre a aprovação..."}
                  className="w-full flex min-h-[100px] rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                />
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
            disabled={loading || !formData.quoteId}
            className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Salvando...' : 'Registrar Aprovação'}
          </Button>
        </div>
      </form>
    </div>
  );
}
