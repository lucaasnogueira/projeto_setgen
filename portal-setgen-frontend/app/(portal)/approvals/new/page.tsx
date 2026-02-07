"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { approvalsApi } from '@/lib/api/approvals';
import { ordersApi } from '@/lib/api/orders';
import { CheckCircle, Save, X, FileText, User, MessageSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function NewApprovalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    serviceOrderId: '',
    status: 'APPROVED',
    comments: '',
  });

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    const data = await ordersApi.getAll();
    // Filter only those that need approval (PENDING_APPROVAL)
    setPendingOrders(data.filter(o => o.status === 'PENDING_APPROVAL' || o.status === 'DRAFT'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.status === 'APPROVED') {
        await approvalsApi.approve(formData.serviceOrderId);
      } else {
        await approvalsApi.reject(formData.serviceOrderId, formData.comments);
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Amarelo/Laranja */}
      <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Registrar Aprovação</h1>
              <p className="text-yellow-100 mt-1 opacity-90">Aprovar ou rejeitar ordens de serviço pendentes</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção da OS */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <FileText className="h-5 w-5 text-orange-600" />
              Seleção de Ordem de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">OS para Avaliação <span className="text-red-500">*</span></Label>
              <select
                required
                value={formData.serviceOrderId}
                onChange={(e) => setFormData({ ...formData, serviceOrderId: e.target.value })}
                className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                <option value="">Selecione uma OS pendente</option>
                {pendingOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} - {order.client?.companyName} ({order.type})
                  </option>
                ))}
              </select>
              {pendingOrders.length === 0 && (
                <p className="text-sm text-gray-500 mt-2 italic flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Nenhuma OS aguardando aprovação no momento.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Avaliação */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              Decisão e Comentários
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <Label className="text-gray-700 font-semibold">Decisão <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'APPROVED' })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    formData.status === 'APPROVED' 
                    ? 'border-green-500 bg-green-50 text-green-700 font-bold shadow-md' 
                    : 'border-gray-200 text-gray-500 hover:border-green-200'
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
                    : 'border-gray-200 text-gray-500 hover:border-red-200'
                  }`}
                >
                  <X className="h-5 w-5" />
                  Rejeitar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">
                {formData.status === 'REJECTED' ? 'Motivo da Rejeição' : 'Observações'} 
                {formData.status === 'REJECTED' && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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

        {/* Ações */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 h-12 rounded-2xl border-2 hover:bg-gray-50 flex items-center justify-center gap-2 font-bold text-gray-600 transition-all active:scale-95"
          >
            <X className="h-5 w-5" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.serviceOrderId}
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
