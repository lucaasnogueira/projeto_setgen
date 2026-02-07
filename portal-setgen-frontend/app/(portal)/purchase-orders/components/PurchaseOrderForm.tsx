"use client"

import { useState, useEffect } from 'react';
import { ordersApi } from '@/lib/api/orders';
import { ShoppingCart, Save, X, FileText, DollarSign, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PurchaseOrder } from '@/types';

interface PurchaseOrderFormProps {
  initialData?: Partial<PurchaseOrder>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function PurchaseOrderForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  submitLabel
}: PurchaseOrderFormProps) {
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    serviceOrderId: initialData?.serviceOrderId || '',
    clientId: initialData?.clientId || '',
    orderNumber: initialData?.orderNumber || '',
    value: initialData?.value?.toString() || '',
    issueDate: initialData?.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : '',
    expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '',
  });

  useEffect(() => {
    loadServiceOrders();
  }, []);

  const loadServiceOrders = async () => {
    try {
      const data = await ordersApi.getAll();
      // Allow current SO if editing, otherwise APPROVED
      setServiceOrders(data.filter(o => o.status === 'APPROVED' || o.id === initialData?.serviceOrderId));
    } catch (error) {
      console.error('Error loading service orders:', error);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      serviceOrderId: formData.serviceOrderId,
      clientId: formData.clientId,
      orderNumber: formData.orderNumber,
      value: parseFloat(formData.value),
      issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : '',
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : '',
    };
    onSubmit(payload);
  };

  return (
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
                  {order.orderNumber} - {order.client?.companyName || order.client?.name}
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
          onClick={onCancel}
          className="flex-1 h-12 rounded-2xl border-2 hover:bg-gray-50 flex items-center justify-center gap-2 font-bold text-gray-600 transition-all active:scale-95"
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
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
