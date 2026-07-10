"use client"

import { useState } from 'react';
import { ServiceOrderStatus, UserRole } from '@/types';
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  PlayCircle,
  Flag,
  Ban,
  AlertCircle,
  Send,
  Hourglass,
  CalendarX,
  PackageX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface StatusManagerProps {
  currentStatus: ServiceOrderStatus;
  userRole: UserRole;
  onStatusChange: (newStatus: ServiceOrderStatus, comments?: string) => Promise<void>;
}

// Espelha VALID_STATUS_TRANSITIONS de service-orders.service.ts no backend.
const statusTransitions: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  [ServiceOrderStatus.DRAFT]: [ServiceOrderStatus.PENDING_APPROVAL],
  [ServiceOrderStatus.PENDING_APPROVAL]: [ServiceOrderStatus.APPROVED, ServiceOrderStatus.REJECTED],
  [ServiceOrderStatus.APPROVED]: [ServiceOrderStatus.SENT_TO_CLIENT, ServiceOrderStatus.IN_PROGRESS],
  [ServiceOrderStatus.SENT_TO_CLIENT]: [ServiceOrderStatus.AWAITING_RESPONSE],
  [ServiceOrderStatus.AWAITING_RESPONSE]: [ServiceOrderStatus.IN_PROGRESS, ServiceOrderStatus.REJECTED, ServiceOrderStatus.EXPIRED],
  [ServiceOrderStatus.EXPIRED]: [ServiceOrderStatus.PENDING_APPROVAL],
  [ServiceOrderStatus.REJECTED]: [ServiceOrderStatus.PENDING_APPROVAL],
  [ServiceOrderStatus.IN_PROGRESS]: [ServiceOrderStatus.AWAITING_MATERIALS, ServiceOrderStatus.COMPLETED],
  [ServiceOrderStatus.AWAITING_MATERIALS]: [ServiceOrderStatus.IN_PROGRESS],
  [ServiceOrderStatus.COMPLETED]: [],
  [ServiceOrderStatus.CANCELLED]: []
};

const statusLabels: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.DRAFT]: 'Rascunho',
  [ServiceOrderStatus.PENDING_APPROVAL]: 'Aguardando Aprovação',
  [ServiceOrderStatus.APPROVED]: 'Aprovada',
  [ServiceOrderStatus.SENT_TO_CLIENT]: 'Enviado ao Cliente',
  [ServiceOrderStatus.AWAITING_RESPONSE]: 'Aguardando Resposta do Cliente',
  [ServiceOrderStatus.EXPIRED]: 'Expirado',
  [ServiceOrderStatus.REJECTED]: 'Rejeitada',
  [ServiceOrderStatus.IN_PROGRESS]: 'Em Andamento',
  [ServiceOrderStatus.AWAITING_MATERIALS]: 'Aguardando Materiais',
  [ServiceOrderStatus.COMPLETED]: 'Concluída',
  [ServiceOrderStatus.CANCELLED]: 'Cancelada'
};

const statusIcons: Record<ServiceOrderStatus, any> = {
  [ServiceOrderStatus.DRAFT]: ArrowRight,
  [ServiceOrderStatus.PENDING_APPROVAL]: CheckCircle,
  [ServiceOrderStatus.APPROVED]: PlayCircle,
  [ServiceOrderStatus.SENT_TO_CLIENT]: Send,
  [ServiceOrderStatus.AWAITING_RESPONSE]: Hourglass,
  [ServiceOrderStatus.EXPIRED]: CalendarX,
  [ServiceOrderStatus.REJECTED]: XCircle,
  [ServiceOrderStatus.IN_PROGRESS]: Flag,
  [ServiceOrderStatus.AWAITING_MATERIALS]: PackageX,
  [ServiceOrderStatus.COMPLETED]: CheckCircle,
  [ServiceOrderStatus.CANCELLED]: Ban
};

const statusColors: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.DRAFT]: 'blue',
  [ServiceOrderStatus.PENDING_APPROVAL]: 'yellow',
  [ServiceOrderStatus.APPROVED]: 'green',
  [ServiceOrderStatus.SENT_TO_CLIENT]: 'blue',
  [ServiceOrderStatus.AWAITING_RESPONSE]: 'yellow',
  [ServiceOrderStatus.EXPIRED]: 'red',
  [ServiceOrderStatus.REJECTED]: 'red',
  [ServiceOrderStatus.IN_PROGRESS]: 'blue',
  [ServiceOrderStatus.AWAITING_MATERIALS]: 'yellow',
  [ServiceOrderStatus.COMPLETED]: 'emerald',
  [ServiceOrderStatus.CANCELLED]: 'red'
};

export function StatusManager({ currentStatus, userRole, onStatusChange }: StatusManagerProps) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ServiceOrderStatus | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  // Mudar status da OS é restrito a ADMIN/MANAGER no backend (@Roles em
  // PATCH /service-orders/:id/status) — esconder os botões pra outros perfis
  // em vez de deixar clicar e falhar com 403 sem explicação.
  const canManageStatus = userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;
  const availableTransitions = canManageStatus ? statusTransitions[currentStatus] || [] : [];
  const canCancel = canManageStatus &&
                    currentStatus !== ServiceOrderStatus.COMPLETED &&
                    currentStatus !== ServiceOrderStatus.CANCELLED;

  const handleTransition = (newStatus: ServiceOrderStatus) => {
    setSelectedStatus(newStatus);
    setShowModal(true);
  };

  const confirmTransition = async () => {
    if (!selectedStatus) return;

    setLoading(true);
    try {
      await onStatusChange(selectedStatus, comments || undefined);
      setShowModal(false);
      setComments('');
      setSelectedStatus(null);
    } catch (error: any) {
      console.error('Error changing status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: error.response?.data?.message || 'Não foi possível alterar o status da OS.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (availableTransitions.length === 0 && !canCancel) {
    return null;
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowRight className="h-5 w-5 text-primary" />
            Ações de Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {availableTransitions.map((status) => {
            const Icon = statusIcons[status];
            const color = statusColors[status];
            
            return (
              <Button
                key={status}
                onClick={() => handleTransition(status)}
                className={`w-full justify-start gap-3 h-12 rounded-xl font-bold transition-all hover:scale-[1.02] bg-${color}-50 hover:bg-${color}-100 text-${color}-700 border-${color}-200`}
                style={{
                  backgroundColor: color === 'yellow' ? '#fef3c7' : 
                                   color === 'green' ? '#d1fae5' :
                                   color === 'blue' ? '#dbeafe' :
                                   color === 'emerald' ? '#d1fae5' :
                                   color === 'red' ? '#fee2e2' : '#dbeafe',
                  color: color === 'yellow' ? '#a16207' :
                         color === 'green' ? '#047857' :
                         color === 'blue' ? '#1d4ed8' :
                         color === 'emerald' ? '#047857' :
                         color === 'red' ? '#b91c1c' : '#1d4ed8'
                }}
                variant="outline"
              >
                <Icon className="h-5 w-5" />
                {statusLabels[status]}
              </Button>
            );
          })}
          
          {canCancel && (
            <Button
              onClick={() => handleTransition(ServiceOrderStatus.CANCELLED)}
              className="w-full justify-start gap-3 h-12 rounded-xl font-bold transition-all hover:scale-[1.02] bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              variant="outline"
            >
              <Ban className="h-5 w-5" />
              Cancelar OS
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação */}
      {showModal && selectedStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Confirmar Mudança de Status</h3>
                  <p className="text-orange-100 text-sm mt-1">
                    {statusLabels[currentStatus]} → {statusLabels[selectedStatus]}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Observações {selectedStatus === 'REJECTED' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder={
                    selectedStatus === 'REJECTED' 
                      ? 'Informe o motivo da rejeição...'
                      : 'Adicione observações sobre esta mudança (opcional)...'
                  }
                  className="w-full rounded-xl border border-input p-3 text-sm focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                  required={selectedStatus === 'REJECTED'}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowModal(false);
                    setComments('');
                    setSelectedStatus(null);
                  }}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl font-bold"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmTransition}
                  disabled={loading || (selectedStatus === 'REJECTED' && !comments.trim())}
                  className="flex-1 h-11 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-bold shadow-lg"
                >
                  {loading ? 'Processando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
