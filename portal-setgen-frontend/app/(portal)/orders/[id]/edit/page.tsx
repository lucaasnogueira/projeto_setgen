"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { ServiceOrder } from '@/types';
import { OrderMultiCrudEditor } from '@/components/orders/OrderMultiCrudEditor';

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      ordersApi.getById(params.id as string)
        .then(setOrder)
        .catch(() => {
          alert('Erro ao carregar OS para edição');
          router.push('/orders');
        })
        .finally(() => setLoading(false));
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <OrderMultiCrudEditor
        orderId={order.id}
        initialData={order}
        onClose={() => router.push(`/orders/${order.id}`)}
        onSuccess={() => router.push(`/orders/${order.id}`)}
      />
    </div>
  );
}
