"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { PurchaseOrder, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import {
  ShoppingCart,
  User,
  FileText,
  Edit,
  Trash2,
  Info,
  CheckCircle,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import { FieldBlock } from "@/components/ui/field-block";
import Link from 'next/link';

export default function PurchaseOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const data = await purchaseOrdersApi.getById(params.id as string);
      setOrder(data);
    } catch (error) {
      console.error('Error loading purchase order:', error);
      alert('Erro ao carregar detalhes da ordem de compra');
      router.push('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta ordem de compra?')) return;

    try {
      await purchaseOrdersApi.delete(params.id as string);
      alert('Ordem de compra excluída com sucesso!');
      router.push('/purchase-orders');
    } catch (error) {
      alert('Erro ao excluir ordem de compra');
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

  if (!order) return null;

  const isExpired = order.expiryDate && new Date(order.expiryDate) < new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={ShoppingCart}
        tone="green"
        title={`Ordem de Compra #${order.orderNumber}`}
        badge={{
          label: isExpired ? 'Expirada' : (order.status || 'Ativa'),
          className: isExpired ? 'bg-status-red-bg text-status-red-fg' : 'bg-status-green-bg text-status-green-fg',
        }}
        meta={<><Briefcase className="h-3.5 w-3.5" />{order.client?.companyName}</>}
        backLabel="Voltar para lista"
        onBack={() => router.back()}
        actions={
          <>
            <Link href={`/purchase-orders/${order.id}/edit`}>
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
          <TabsTrigger value="vinculos">Vínculos & Arquivos</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="mt-4">
          <Card className="p-6">
            <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-status-green-fg" />
              Informações da OC
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FieldBlock
                label="Valor"
                value={<span className="text-[20px] font-black text-status-green-fg">{order.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>}
              />
              <FieldBlock
                label="Status"
                value={
                  <span className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full text-[11.5px] ${isExpired ? 'bg-status-red-bg text-status-red-fg' : 'bg-status-green-bg text-status-green-fg'}`}>
                    {isExpired ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    {isExpired ? 'Expirada' : (order.status || 'Ativa')}
                  </span>
                }
              />
              <FieldBlock label="Data de Emissão" value={new Date(order.issueDate).toLocaleDateString('pt-BR')} />
              <FieldBlock label="Data de Validade" value={new Date(order.expiryDate).toLocaleDateString('pt-BR')} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vinculos" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-status-green-fg" />
                Vínculos
              </div>
              <div className="space-y-4">
                {order.serviceOrderId && (
                  <div>
                    <p className="text-[10.5px] text-text-muted font-bold uppercase tracking-wider mb-2">Ordem de Serviço</p>
                    <Link href={`/orders/${order.serviceOrderId}`}>
                      <Button variant="outline" className="w-full justify-start gap-2 rounded-xl">
                        <FileText className="h-4 w-4" />
                        Ver OS #{order.serviceOrder?.orderNumber}
                      </Button>
                    </Link>
                  </div>
                )}
                {order.uploadedBy && (
                  <div>
                    <p className="text-[10.5px] text-text-muted font-bold uppercase tracking-wider mb-2">Cadastrado por</p>
                    <div className="flex items-center gap-2 text-foreground p-3 rounded-xl bg-muted/40">
                      <User className="h-4 w-4 text-status-green-fg" />
                      <span className="text-[13px] font-medium">{order.uploadedBy.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-status-green-fg" />
                Arquivos
              </div>
              {order.fileUrl ? (
                <Button className="w-full bg-status-green-bg text-status-green-fg hover:bg-status-green-bg/80 border-none rounded-xl font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Visualizar Documento
                </Button>
              ) : (
                <p className="text-[13px] text-text-muted text-center italic">Nenhum documento anexo.</p>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
