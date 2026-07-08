"use client"

import { useState, useEffect } from 'react';
import { ordersApi } from '@/lib/api/orders';
import { Truck } from 'lucide-react';
import { Delivery } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StepFooter, type WizardStep } from '@/components/ui/step-wizard';

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
    deliveryDate: initialData?.deliveryDate ? new Date(initialData.deliveryDate).toISOString().split('T')[0] : '',
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
    const payload = {
      ...formData,
      deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate).toISOString() : '',
      checklist: (initialData as any)?.checklist || [],
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Truck className="h-5 w-5 text-blue-600" />
            Dados da Baixa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="font-bold text-sm">OS Concluída *</Label>
            <select
              required
              value={formData.serviceOrderId}
              onChange={(e) => setFormData({ ...formData, serviceOrderId: e.target.value })}
              className="w-full h-12 px-4 rounded-2xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Selecione uma OS</option>
              {serviceOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.client?.companyName || order.client?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Data da Entrega *</Label>
              <Input
                type="date"
                required
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Recebido por *</Label>
              <Input
                required
                value={formData.receivedBy}
                onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                placeholder="Nome de quem recebeu"
                className="h-12 rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-sm">Observações</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Observações sobre a entrega..."
              className="w-full rounded-2xl border border-input bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
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
