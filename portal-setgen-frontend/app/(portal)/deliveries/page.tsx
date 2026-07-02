"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deliveriesApi } from '@/lib/api/deliveries';
import { Truck, Plus, CheckCircle, Calendar, FileText } from 'lucide-react';
import { Delivery } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    deliveriesApi.getAll()
      .then(setDeliveries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Baixa de Serviços"
        subtitle="Registre a conclusão e aceite de serviços"
        actions={
          <Button onClick={() => router.push('/deliveries/new')} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Registrar Baixa
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {deliveries.length === 0 ? (
          <Card className="col-span-2 p-16 text-center">
            <Truck className="h-12 w-12 text-border mx-auto mb-3" />
            <p className="text-text-secondary font-medium text-sm">Nenhuma baixa de serviço registrada</p>
          </Card>
        ) : (
          deliveries.map(delivery => (
            <Card
              key={delivery.id}
              className="p-5 hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => router.push(`/deliveries/${delivery.id}`)}
            >
              <div className="flex items-start justify-between mb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[10px] bg-status-blue-bg flex items-center justify-center shrink-0">
                    <Truck className="h-5 w-5 text-status-blue-fg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-foreground">Baixa #{delivery.id.slice(0, 8)}</h3>
                    <p className="text-[12.5px] text-text-muted">OS: {delivery.serviceOrder?.orderNumber}</p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-status-green-fg" />
              </div>
              <div className="space-y-1.5 mb-3.5">
                <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <FileText className="h-3.5 w-3.5 text-text-muted" />
                  {delivery.serviceOrder?.client?.companyName}
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                  {new Date(delivery.deliveryDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {delivery.notes && (
                <p className="text-[12.5px] text-text-secondary bg-muted/30 p-3 rounded-[10px]">
                  {delivery.notes}
                </p>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
