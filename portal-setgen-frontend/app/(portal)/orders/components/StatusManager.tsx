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
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatusManagerProps {
  currentStatus: ServiceOrderStatus;
  userRole: UserRole;
  onStatusChange: (newStatus: ServiceOrderStatus, comments?: string) => Promise<void>;
}

const statusTransitions: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  [ServiceOrderStatus.DRAFT]: [ServiceOrderStatus.PENDING_APPROVAL],
  [ServiceOrderStatus.PENDING_APPROVAL]: [ServiceOrderStatus.APPROVED, ServiceOrderStatus.REJECTED],
  [ServiceOrderStatus.APPROVED]: [ServiceOrderStatus.IN_PROGRESS],
  [ServiceOrderStatus.REJECTED]: [],
  [ServiceOrderStatus.IN_PROGRESS]: [ServiceOrderStatus.COMPLETED],
  [ServiceOrderStatus.COMPLETED]: [],
  [ServiceOrderStatus.CANCELLED]: []
};

const statusLabels: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.DRAFT]: 'Rascunho',
  [ServiceOrderStatus.PENDING_APPROVAL]: 'Aguardando Aprovação',
  [ServiceOrderStatus.APPROVED]: 'Aprovada',
  [ServiceOrderStatus.REJECTED]: 'Rejeitada',
  [ServiceOrderStatus.IN_PROGRESS]: 'Em Andamento',
  [ServiceOrderStatus.COMPLETED]: 'Concluída',
  [ServiceOrderStatus.CANCELLED]: 'Cancelada'
};

const statusIcons: Record<ServiceOrderStatus, any> = {
  [ServiceOrderStatus.DRAFT]: ArrowRight,
  [ServiceOrderStatus.PENDING_APPROVAL]: CheckCircle,
  [ServiceOrderStatus.APPROVED]: PlayCircle,
  [ServiceOrderStatus.REJECTED]: XCircle,
  [ServiceOrderStatus.IN_PROGRESS]: Flag,
  [ServiceOrderStatus.COMPLETED]: CheckCircle,
  [ServiceOrderStatus.CANCELLED]: Ban
};

const statusColors: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.DRAFT]: 'blue',
  [ServiceOrderStatus.PENDING_APPROVAL]: 'yellow',
  [ServiceOrderStatus.APPROVED]: 'green',
  [ServiceOrderStatus.REJECTED]: 'red',
  [ServiceOrderStatus.IN_PROGRESS]: 'blue',
  [ServiceOrderStatus.COMPLETED]: 'emerald',
  [ServiceOrderStatus.CANCELLED]: 'red'
};

export function StatusManager({ currentStatus, userRole, onStatusChange }: StatusManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ServiceOrderStatus | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const availableTransitions = statusTransitions[currentStatus] || [];
  const canCancel = (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && 
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
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Erro ao alterar status da OS');
    } finally {
      setLoading(false);
    }
  };

  if (availableTransitions.length === 0 && !canCancel) {
    return null;
  }

  return (
    <>
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <ArrowRight className="h-5 w-5 text-blue-600" />
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Confirmar Mudança de Status</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {statusLabels[currentStatus]} → {statusLabels[selectedStatus]}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg"
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
