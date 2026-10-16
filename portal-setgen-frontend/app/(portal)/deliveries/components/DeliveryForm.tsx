"use client"

import { useState, useEffect } from 'react';
import { ordersApi } from '@/lib/api/orders';
import { Truck } from 'lucide-react';
import { Delivery } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StepFooter, type WizardStep } from '@/components/ui/step-wizard';
import { toDateInputValue, startOfBusinessDayISO } from '@/lib/date';

const stepDefs: WizardStep[] = [{ key: 'dados', label: 'Dados da Baixa' }];

interface DeliveryFormProps {
  initialData?: Partial<Delivery>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function DeliveryForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  submitLabel
}: DeliveryFormProps) {
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    serviceOrderId: initialData?.serviceOrderId || '',
    deliveryDate: toDateInputValue(initialData?.deliveryDate),
    receivedBy: initialData?.receivedBy || '',
    notes: initialData?.notes || '',
  });

  useEffect(() => {
    loadServiceOrders();
  }, []);

  const loadServiceOrders = async () => {
    try {
      const data = await ordersApi.getAll();
      // Allow current service order if editing, otherwise only COMPLETED
      setServiceOrders(data.filter(o => o.status === 'COMPLETED' || o.id === initialData?.serviceOrderId));
    } catch (error) {
      console.error('Error loading service orders:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ...formData,
      // A entrega aconteceu NAQUELE dia no fuso da operação — sem isso a data
      // gravada cai no dia anterior e a garantia começa um dia antes.
      deliveryDate: startOfBusinessDayISO(formData.deliveryDate) || '',
      checklist: (initialData as any)?.checklist || [],
    };

    // A entrega é 1:1 com a OS e não muda de dono — a API recusa o campo aqui.
    if (initialData) {
      delete payload.serviceOrderId;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <Truck className="h-3.5 w-3.5 text-[#E2661D]" />
            Dados da Baixa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          <div className="space-y-1.5">
            <Label className="font-semibold text-xs text-gray-700">OS Concluída *</Label>
            <select
              required
              disabled={!!initialData}
              value={formData.serviceOrderId}
              onChange={(e) => setFormData({ ...formData, serviceOrderId: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:ring-1 focus:ring-[#E2661D] focus:border-[#E2661D] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Selecione uma OS</option>
              {serviceOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.client?.companyName || order.client?.name}
                </option>
              ))}
            </select>
            {initialData && (
              <p className="text-[11px] text-gray-500">
                A entrega pertence a esta OS e não pode ser transferida.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs text-gray-700">Data da Entrega *</Label>
              <Input
                type="date"
                required
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="h-9 rounded-lg text-xs border-gray-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-xs text-gray-700">Recebido por *</Label>
              <Input
                required
                value={formData.receivedBy}
                onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                placeholder="Nome de quem recebeu"
                className="h-9 rounded-lg text-xs border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-xs text-gray-700">Observações</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Observações sobre a entrega..."
              className="w-full rounded-lg border border-gray-200 bg-white p-3 text-xs outline-none focus:ring-1 focus:ring-[#E2661D] focus:border-[#E2661D] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <StepFooter
        steps={stepDefs}
        activeKey="dados"
        onNext={() => {}}
        onCancel={onCancel}
        loading={loading}
        submitLabel={submitLabel}
      />
    </form>
  );
}
