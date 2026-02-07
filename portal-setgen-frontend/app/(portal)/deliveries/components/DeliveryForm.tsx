"use client"

import { useState, useEffect } from 'react';
import { ordersApi } from '@/lib/api/orders';
import { Truck, Save, X } from 'lucide-react';
import { Delivery } from '@/types';

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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OS Concluída <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.serviceOrderId}
            onChange={(e) => setFormData({ ...formData, serviceOrderId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Selecione uma OS</option>
            {serviceOrders.map(order => (
              <option key={order.id} value={order.id}>
                {order.orderNumber} - {order.client?.companyName || order.client?.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data da Entrega <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.deliveryDate}
            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recebido por <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.receivedBy}
            onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
            placeholder="Nome de quem recebeu"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            placeholder="Observações sobre a entrega..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
        >
          <X className="h-5 w-5" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {loading ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
