"use client"

import { useState } from 'react';
import { ServiceOrderStatus, UserRole } from '@/types';
import { SERVICE_ORDER_STATUS_TRANSITIONS, SERVICE_ORDER_STATUS_CONFIG, statusColorHex } from '@/lib/status-config';
import { ArrowRight, AlertCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface StatusManagerProps {
  currentStatus: ServiceOrderStatus;
  userRole: UserRole;
  onStatusChange: (newStatus: ServiceOrderStatus, comments?: string) => Promise<void>;
}

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
  const availableTransitions = canManageStatus ? SERVICE_ORDER_STATUS_TRANSITIONS[currentStatus] || [] : [];
  const canCancel = canManageStatus &&
                    currentStatus !== ServiceOrderStatus.COMPLETED &&
                    currentStatus !== ServiceOrderStatus.CANCELLED &&
                    !availableTransitions.includes(ServiceOrderStatus.CANCELLED);

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
            const config = SERVICE_ORDER_STATUS_CONFIG[status];
            const Icon = config.icon;
            const hex = statusColorHex(config.color);

            return (
              <Button
                key={status}
                onClick={() => handleTransition(status)}
                className="w-full justify-start gap-3 h-12 rounded-xl font-bold transition-all hover:scale-[1.02]"
                style={{ backgroundColor: hex.fg, color: hex.bg }}
                variant="outline"
              >
                <Icon className="h-5 w-5" />
                {config.label}
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
                    {SERVICE_ORDER_STATUS_CONFIG[currentStatus]?.label || currentStatus} → {selectedStatus ? (SERVICE_ORDER_STATUS_CONFIG[selectedStatus]?.label || selectedStatus) : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Observações</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder="Adicione observações sobre esta mudança (opcional)..."
                  className="w-full rounded-xl border border-input p-3 text-sm focus:ring-2 focus:ring-primary/30 focus:border-transparent"
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
                  disabled={loading}
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
