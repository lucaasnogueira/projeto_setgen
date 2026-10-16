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

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
              <FileText className="h-3.5 w-3.5 text-[#E2661D]" />
              Seleção de Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-1">
              <Label className="text-gray-700 font-semibold text-xs">Orçamento para Avaliação <span className="text-red-500">*</span></Label>
              <select
                required
                value={formData.quoteId}
                onChange={(e) => setFormData({ ...formData, quoteId: e.target.value })}
                className="w-full flex h-9 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none"
              >
                <option value="">Selecione um orçamento pendente</option>
                {pendingQuotes.map(quote => (
                  <option key={quote.id} value={quote.id}>
                    {quote.quoteNumber} - {quote.client?.companyName} ({quote.type})
                  </option>
                ))}
              </select>
              {pendingQuotes.length === 0 && (
                <p className="text-xs text-gray-400 mt-1 italic flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Nenhum orçamento aguardando aprovação no momento.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
              <CheckCircle className="h-3.5 w-3.5 text-[#E2661D]" />
              Decisão e Comentários
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold text-xs">Decisão <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'APPROVED' })}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border transition-all text-xs font-semibold ${
                    formData.status === 'APPROVED'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/30'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'REJECTED' })}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border transition-all text-xs font-semibold ${
                    formData.status === 'REJECTED'
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-2xs'
                    : 'border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50/30'
                  }`}
                >
                  <X className="h-4 w-4" />
                  Rejeitar
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-gray-700 font-semibold text-xs">
                {formData.status === 'REJECTED' ? 'Motivo da Rejeição' : 'Observações'}
                {formData.status === 'REJECTED' && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <textarea
                  required={formData.status === 'REJECTED'}
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={3}
                  placeholder={formData.status === 'REJECTED' ? "Informe o motivo da rejeição..." : "Observações adicionais sobre a aprovação..."}
                  className="w-full flex min-h-[85px] rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 h-9 rounded-lg border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.quoteId}
            className="flex-1 h-9 bg-gray-900 hover:bg-black text-white rounded-lg shadow-2xs flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {loading ? 'Salvando...' : 'Registrar Aprovação'}
          </Button>
        </div>
      </form>
    </div>
  );
}
