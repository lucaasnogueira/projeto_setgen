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
      <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <ArrowRight className="h-3.5 w-3.5 text-[#E2661D]" />
            Ações de Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-4 space-y-2">
          {availableTransitions.map((status) => {
            const config = SERVICE_ORDER_STATUS_CONFIG[status];
            const Icon = config.icon;
            const hex = statusColorHex(config.color);

            return (
              <Button
                key={status}
                onClick={() => handleTransition(status)}
                className="w-full justify-start gap-2 h-9 rounded-lg font-semibold text-xs transition-colors"
                style={{ backgroundColor: hex.fg, color: hex.bg }}
                variant="outline"
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </Button>
            );
          })}

          {canCancel && (
            <Button
              onClick={() => handleTransition(ServiceOrderStatus.CANCELLED)}
              className="w-full justify-start gap-2 h-9 rounded-lg font-semibold text-xs transition-colors bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              variant="outline"
            >
              <Ban className="h-3.5 w-3.5" />
              Cancelar OS
            </Button>
          )}
        </CardContent>
      </Card>

      {showModal && selectedStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Confirmar Mudança de Status</h3>
                  <p className="text-orange-100 text-xs mt-0.5">
                    {SERVICE_ORDER_STATUS_CONFIG[currentStatus]?.label || currentStatus} → {selectedStatus ? (SERVICE_ORDER_STATUS_CONFIG[selectedStatus]?.label || selectedStatus) : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Observações</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder="Adicione observações sobre esta mudança (opcional)..."
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <Button
                  onClick={() => {
                    setShowModal(false);
                    setComments('');
                    setSelectedStatus(null);
                  }}
                  variant="outline"
                  className="flex-1 h-9 rounded-lg text-xs font-semibold"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmTransition}
                  disabled={loading}
                  className="flex-1 h-9 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-2xs"
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
