"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { deliveriesApi } from '@/lib/api/deliveries';
import { Delivery, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import {
  Truck,
  Calendar,
  User,
  FileText,
  Edit,
  Trash2,
  Info,
  CheckCircle,
  Package,
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import { FieldBlock } from "@/components/ui/field-block";
import Link from 'next/link';

export default function DeliveryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadDelivery();
    }
  }, [params.id]);

  const loadDelivery = async () => {
    try {
      const data = await deliveriesApi.getById(params.id as string);
      setDelivery(data);
    } catch (error) {
      console.error('Error loading delivery:', error);
      alert('Erro ao carregar detalhes da baixa de serviço');
      router.push('/deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de baixa?')) return;

    try {
      await deliveriesApi.delete(params.id as string);
      alert('Baixa excluída com sucesso!');
      router.push('/deliveries');
    } catch (error) {
      alert('Erro ao excluir baixa');
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!delivery) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={Truck}
        tone="blue"
        title={`Baixa da OS #${delivery.serviceOrder?.orderNumber}`}
        meta={<><User className="h-3.5 w-3.5" />{delivery.serviceOrder?.client?.companyName}</>}
        backLabel="Voltar para lista"
        onBack={() => router.back()}
        actions={
          <>
            <Link href={`/deliveries/${delivery.id}/edit`}>
              <Button variant="outline" className="rounded-[9px] font-bold gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="rounded-[9px] font-bold gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
          </>
        }
      />

      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="vinculo">Vínculo & Status</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="mt-4">
          <Card className="p-6">
            <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-status-blue-fg" />
              Informações da Conclusão
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
              <FieldBlock label="Recebido por" value={delivery.receivedBy} />
              <FieldBlock label="Data de Conclusão" value={new Date(delivery.deliveryDate).toLocaleDateString('pt-BR')} />
            </div>
            <div>
              <div className="text-[10.5px] font-bold tracking-wider text-text-muted uppercase mb-2">Comentários / Observações</div>
              <div className="bg-muted/40 p-4 rounded-xl border border-border">
                <p className="text-[13px] text-text-secondary leading-relaxed italic">
                  {delivery.notes ? `"${delivery.notes}"` : 'Nenhuma observação registrada.'}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vinculo" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-status-blue-fg" />
                Vínculo com OS
              </div>
              <div className="text-[10.5px] font-bold tracking-wider text-text-muted uppercase mb-1">Ordem de Serviço</div>
              <div className="text-[16px] font-bold text-foreground mb-3">#{delivery.serviceOrder?.orderNumber}</div>
              <Link href={`/orders/${delivery.serviceOrderId}`}>
                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl">
                  <Package className="h-4 w-4" />
                  Ver Detalhes da OS
                </Button>
              </Link>
            </Card>

            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-status-blue-fg" />
                Status do Sistema
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-status-green-bg text-status-green-fg border border-status-green-fg/20">
                <CheckCircle className="h-5 w-5" />
                <span className="text-[13px] font-bold">Serviço Concluído</span>
              </div>
              <p className="text-[11.5px] text-text-muted mt-4 text-center">
                Registrado em {new Date(delivery.createdAt).toLocaleString('pt-BR')}
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
