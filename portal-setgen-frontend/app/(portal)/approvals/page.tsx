"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { approvalsApi } from '@/lib/api/approvals';
import { ServiceOrder } from '@/types';
import {
  CheckCircle,
  XCircle,
  FileText,
  Building2,
  User,
  Calendar,
  Plus
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ApprovalsPage() {
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      const data = await approvalsApi.getPending();
      setPendingOrders(data);
    } catch (error) {
      console.error('Erro ao carregar aprovações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await approvalsApi.approve(id);
      loadPendingApprovals();
      alert('OS aprovada com sucesso!');
    } catch (error) {
      alert('Erro ao aprovar OS');
    }
  };

  const handleReject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;

    try {
      await approvalsApi.reject(id, reason);
      loadPendingApprovals();
      alert('OS rejeitada');
    } catch (error) {
      alert('Erro ao rejeitar OS');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Aprovações"
        subtitle={`${pendingOrders.length} ordens aguardando aprovação`}
        actions={
          <Button onClick={() => router.push('/approvals/new')} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Nova Aprovação
          </Button>
        }
      />

      <div className="space-y-3.5">
        {pendingOrders.length === 0 ? (
          <Card className="p-16 text-center">
            <CheckCircle className="h-12 w-12 text-status-green-fg mx-auto mb-3" />
            <p className="text-text-secondary font-bold text-[15px]">Tudo em dia!</p>
            <p className="text-text-muted text-[12.5px] mt-1">
              Não há ordens pendentes de aprovação no momento
            </p>
          </Card>
        ) : (
          pendingOrders.map((order) => (
            <Card
              key={order.id}
              className="p-5 hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => router.push(`/approvals/${order.id}`)}
            >
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-11 h-11 rounded-[10px] bg-status-amber-bg flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-status-amber-fg" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-foreground">OS {order.orderNumber}</h3>
                  <p className="text-[12.5px] text-text-muted">
                    {order.type === 'VISIT_REPORT' ? 'Relatório de Visita' : 'Execução'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3.5">
                <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <Building2 className="h-3.5 w-3.5 text-text-muted" />
                  {order.client?.companyName}
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <User className="h-3.5 w-3.5 text-text-muted" />
                  {order.createdBy?.name || 'Sem responsável'}
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>

              {order.scope && (
                <div className="bg-muted/30 rounded-[10px] p-3.5 mb-3.5">
                  <p className="text-[12.5px] font-bold text-foreground mb-1">Escopo:</p>
                  <p className="text-[12.5px] text-text-secondary">{order.scope}</p>
                </div>
              )}

              <div className="flex gap-2.5">
                <Button
                  onClick={(e) => handleApprove(e, order.id)}
                  className="flex-1 rounded-[9px] font-bold gap-2 bg-status-green-fg hover:bg-status-green-fg/90"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprovar
                </Button>
                <Button
                  onClick={(e) => handleReject(e, order.id)}
                  variant="destructive"
                  className="flex-1 rounded-[9px] font-bold gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeitar
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
