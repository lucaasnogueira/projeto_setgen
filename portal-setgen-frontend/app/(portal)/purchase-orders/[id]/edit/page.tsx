"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { ordersApi } from '@/lib/api/orders';
import { ShoppingCart, Save, X, FileText, DollarSign, Calendar, Info, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    serviceOrderId: '',
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
      const [order, soData] = await Promise.all([
        purchaseOrdersApi.getById(params.id as string),
        ordersApi.getAll()
      ]);

      setServiceOrders(soData.filter(o => o.status === 'APPROVED' || o.id === order.serviceOrderId));
      
      setFormData({
        serviceOrderId: order.serviceOrderId,
        clientId: order.clientId,
        orderNumber: order.orderNumber,
        value: order.value.toString(),
        issueDate: order.issueDate ? new Date(order.issueDate).toISOString().split('T')[0] : '',
        expiryDate: order.expiryDate ? new Date(order.expiryDate).toISOString().split('T')[0] : '',
      });
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Erro ao carregar dados da OC');
      router.push('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSOSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const soId = e.target.value;
    const so = serviceOrders.find(o => o.id === soId);
    
    setFormData(prev => ({ 
      ...prev, 
      serviceOrderId: soId,
      clientId: so ? so.clientId : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        serviceOrderId: formData.serviceOrderId,
        clientId: formData.clientId,
        orderNumber: formData.orderNumber,
        value: parseFloat(formData.value),
        issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : '',
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : '',
      };
      await purchaseOrdersApi.update(params.id as string, payload);
      alert('OC atualizada com sucesso!');
      router.push(`/purchase-orders/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar OC');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Verde */}
      <div className="bg-gradient-to-br from-green-500 via-green-600 to-teal-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-green-100 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>
          
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
              <ShoppingCart className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Ordem de Compra</h1>
              <p className="text-green-100 mt-1 opacity-90">Atualize as informações da OC #{formData.orderNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vínculo com OS */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <FileText className="h-5 w-5 text-green-600" />
              Vínculo com Ordem de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">OS Aprovada <span className="text-red-500">*</span></Label>
              <select
                required
                value={formData.serviceOrderId}
                onChange={handleSOSelect}
                className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                <option value="">Selecione uma OS aprovada</option>
                {serviceOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} - {order.client?.companyName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes da OC */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Info className="h-5 w-5 text-green-600" />
              Dados da Ordem de Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Número da OC <span className="text-red-500">*</span></Label>
                <Input
                  required
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  placeholder="Ex: OC-2024-001"
                  className="h-11 rounded-xl focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Valor (R$) <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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
                <Label className="text-gray-700 font-semibold">Data de Emissão <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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
                <Label className="text-gray-700 font-semibold">Validade <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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
