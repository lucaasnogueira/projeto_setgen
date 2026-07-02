"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { ShoppingCart, Plus, Eye, Calendar, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    purchaseOrdersApi.getAll()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ordens de Compra"
        subtitle="Gerencie as OC dos clientes"
        actions={
          <Button onClick={() => router.push('/purchase-orders/new')} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Nova Ordem de Compra
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {orders.length === 0 ? (
          <Card className="col-span-2 p-16 text-center">
            <ShoppingCart className="h-12 w-12 text-border mx-auto mb-3" />
            <p className="text-text-secondary font-medium text-sm">Nenhuma OC cadastrada</p>
          </Card>
        ) : (
          orders.map(order => (
            <Card key={order.id} className="p-5">
              <div className="flex items-start justify-between mb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[10px] bg-status-green-bg flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-5 w-5 text-status-green-fg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-foreground">OC {order.orderNumber}</h3>
                    <p className="text-[12.5px] text-text-muted">{order.serviceOrder?.client?.name}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 mb-3.5">
                <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <DollarSign className="h-3.5 w-3.5 text-text-muted" />
                  R$ {order.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                  {new Date(order.issueDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-[9px] font-bold gap-2"
                onClick={() => router.push(`/purchase-orders/${order.id}`)}
              >
                <Eye className="h-4 w-4" />
                Visualizar
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
