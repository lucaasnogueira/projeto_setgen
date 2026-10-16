"use client"

import { useState } from 'react';
import { QuoteStatus, UserRole } from '@/types';
import { QUOTE_STATUS_TRANSITIONS, QUOTE_STATUS_CONFIG, statusColorHex } from '@/lib/status-config';
import { ArrowRight, AlertCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface QuoteStatusManagerProps {
  currentStatus: QuoteStatus;
  userRole: UserRole;
  onStatusChange: (newStatus: QuoteStatus, comments?: string) => Promise<void>;
}

export function QuoteStatusManager({ currentStatus, userRole, onStatusChange }: QuoteStatusManagerProps) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  // Mudar status do orçamento é restrito a ADMIN/MANAGER no backend
  // (@Roles em PATCH /quotes/:id/status) — esconder os botões pra outros
  // perfis em vez de deixar clicar e falhar com 403 sem explicação.
  const canManageStatus = userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;
  const availableTransitions = canManageStatus ? QUOTE_STATUS_TRANSITIONS[currentStatus] || [] : [];
  const canCancel = canManageStatus &&
                    currentStatus !== QuoteStatus.ACCEPTED &&
                    currentStatus !== QuoteStatus.CANCELLED &&
                    !availableTransitions.includes(QuoteStatus.CANCELLED);

  const handleTransition = (newStatus: QuoteStatus) => {
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
        description: error.response?.data?.message || 'Não foi possível alterar o status do orçamento.',
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
            const config = QUOTE_STATUS_CONFIG[status];
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
              onClick={() => handleTransition(QuoteStatus.CANCELLED)}
              className="w-full justify-start gap-2 h-9 rounded-lg font-semibold text-xs transition-colors bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              variant="outline"
            >
              <Ban className="h-3.5 w-3.5" />
              Cancelar Orçamento
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
                    {QUOTE_STATUS_CONFIG[currentStatus]?.label || currentStatus} → {selectedStatus ? (QUOTE_STATUS_CONFIG[selectedStatus]?.label || selectedStatus) : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Observações {selectedStatus === QuoteStatus.REJECTED && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder={
                    selectedStatus === QuoteStatus.REJECTED
                      ? 'Informe o motivo da rejeição...'
                      : 'Adicione observações sobre esta mudança (opcional)...'
                  }
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                  required={selectedStatus === QuoteStatus.REJECTED}
                />
                {selectedStatus === QuoteStatus.REJECTED && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Se este orçamento veio de uma visita técnica, ela será marcada como cobrável automaticamente.
                  </p>
                )}
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
                  disabled={loading || (selectedStatus === QuoteStatus.REJECTED && !comments.trim())}
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
