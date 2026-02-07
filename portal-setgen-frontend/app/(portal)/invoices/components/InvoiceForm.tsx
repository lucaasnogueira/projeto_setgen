"use client"

import { useState, useEffect } from 'react';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { DollarSign, Save, X, FileText, Calendar, Info, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Invoice } from '@/types';

interface InvoiceFormProps {
  initialData?: Partial<Invoice>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function InvoiceForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  submitLabel
}: InvoiceFormProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    purchaseOrderId: initialData?.purchaseOrderId || '',
    serviceOrderId: initialData?.serviceOrderId || '',
    invoiceNumber: initialData?.invoiceNumber || '',
    series: initialData?.series || '',
    value: initialData?.value?.toString() || '',
    issueDate: initialData?.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : '',
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
  });

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      const data = await purchaseOrdersApi.getAll();
      setPurchaseOrders(data);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  const handlePOSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const poId = e.target.value;
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setFormData(prev => ({ 
        ...prev, 
        purchaseOrderId: poId,
        serviceOrderId: po.serviceOrderId || '',
        value: po.value?.toString() || '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, purchaseOrderId: poId, serviceOrderId: '', value: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      purchaseOrderId: formData.purchaseOrderId,
      serviceOrderId: formData.serviceOrderId,
      invoiceNumber: formData.invoiceNumber,
      series: formData.series,
      value: parseFloat(formData.value),
      issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : '',
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : '',
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vínculo com OC */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <FileText className="h-5 w-5 text-emerald-600" />
            Vínculo com Ordem de Compra
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Ordem de Compra <span className="text-red-500">*</span></Label>
            <select
              required
              value={formData.purchaseOrderId}
              onChange={handlePOSelect}
              className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <option value="">Selecione uma OC</option>
              {purchaseOrders.map(po => (
                <option key={po.id} value={po.id}>
                  {po.orderNumber} - R$ {po.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da NFe */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Hash className="h-5 w-5 text-emerald-600" />
            Dados da Nota Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label className="text-gray-700 font-semibold">Número da NFe <span className="text-red-500">*</span></Label>
              <Input
                required
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="000.000.001"
                className="h-11 rounded-xl focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Série</Label>
              <Input
                value={formData.series}
                onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                placeholder="1"
                className="h-11 rounded-xl focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="h-11 pl-10 rounded-xl focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Data de Emissão <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="h-11 pl-10 rounded-xl focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Data de Vencimento <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="h-11 pl-10 rounded-xl focus:ring-emerald-500"
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
          className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
