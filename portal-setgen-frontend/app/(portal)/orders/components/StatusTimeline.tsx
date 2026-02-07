"use client"

import { ServiceOrderStatus } from '@/types';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlayCircle, 
  Flag,
  Ban
} from 'lucide-react';

interface StatusTimelineProps {
  currentStatus: ServiceOrderStatus;
}

const statusConfig = {
  [ServiceOrderStatus.DRAFT]: {
    label: 'Rascunho',
    icon: FileText,
    color: 'gray',
    order: 0
  },
  [ServiceOrderStatus.PENDING_APPROVAL]: {
    label: 'Aguardando Aprovação',
    icon: Clock,
    color: 'yellow',
    order: 1
  },
  [ServiceOrderStatus.APPROVED]: {
    label: 'Aprovada',
    icon: CheckCircle,
    color: 'green',
    order: 2
  },
  [ServiceOrderStatus.REJECTED]: {
    label: 'Rejeitada',
    icon: XCircle,
    color: 'red',
    order: -1
  },
  [ServiceOrderStatus.IN_PROGRESS]: {
    label: 'Em Andamento',
    icon: PlayCircle,
    color: 'blue',
    order: 3
  },
  [ServiceOrderStatus.COMPLETED]: {
    label: 'Concluída',
    icon: Flag,
    color: 'emerald',
    order: 4
  },
  [ServiceOrderStatus.CANCELLED]: {
    label: 'Cancelada',
    icon: Ban,
    color: 'red',
    order: -1
  }
};

const mainFlow: ServiceOrderStatus[] = [
  ServiceOrderStatus.DRAFT,
  ServiceOrderStatus.PENDING_APPROVAL,
  ServiceOrderStatus.APPROVED,
  ServiceOrderStatus.IN_PROGRESS,
  ServiceOrderStatus.COMPLETED
];

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentOrder = statusConfig[currentStatus].order;
  const isRejectedOrCancelled = currentStatus === 'REJECTED' || currentStatus === 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Main Flow Timeline */}
      <div className="relative">
        {mainFlow.map((status, index) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const isPast = config.order < currentOrder;
          const isCurrent = status === currentStatus;
          const isFuture = config.order > currentOrder;
          
          const isActive = isPast || isCurrent;
          
          return (
            <div key={status} className="relative">
              {/* Connector Line */}
              {index < mainFlow.length - 1 && (
                <div 
                  className={`absolute left-6 top-12 w-0.5 h-12 transition-colors ${
                    isPast ? `bg-${config.color}-500` : 'bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: isPast ? 
                      (config.color === 'gray' ? '#6b7280' :
                       config.color === 'yellow' ? '#eab308' :
                       config.color === 'green' ? '#22c55e' :
                       config.color === 'blue' ? '#3b82f6' :
                       config.color === 'emerald' ? '#10b981' : '#6b7280') 
                      : '#e5e7eb'
                  }}
                />
              )}
              
              {/* Status Item */}
              <div className="flex items-center gap-4 pb-12">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative z-10 ${
                    isCurrent 
                      ? `bg-${config.color}-500 ring-4 ring-${config.color}-100 shadow-lg`
                      : isPast
                      ? `bg-${config.color}-500`
                      : 'bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: isCurrent || isPast ?
                      (config.color === 'gray' ? '#6b7280' :
                       config.color === 'yellow' ? '#eab308' :
                       config.color === 'green' ? '#22c55e' :
                       config.color === 'blue' ? '#3b82f6' :
                       config.color === 'emerald' ? '#10b981' : '#6b7280')
                      : '#f3f4f6',
                    boxShadow: isCurrent ? `0 0 0 4px ${
                      config.color === 'yellow' ? '#fef3c7' :
                      config.color === 'green' ? '#d1fae5' :
                      config.color === 'blue' ? '#dbeafe' :
                      config.color === 'emerald' ? '#d1fae5' : '#f3f4f6'
                    }` : 'none'
                  }}
                >
                  <Icon 
                    className={`h-6 w-6 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`} 
                  />
                </div>
                <div>
                  <p className={`font-bold ${
                    isCurrent ? 'text-gray-900' : isPast ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {config.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-gray-500 mt-1">Status atual</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejected/Cancelled Status */}
      {isRejectedOrCancelled && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 ring-4 ring-red-100 shadow-lg"
            >
              {currentStatus === 'REJECTED' ? (
                <XCircle className="h-6 w-6 text-white" />
              ) : (
                <Ban className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {statusConfig[currentStatus].label}
              </p>
              <p className="text-sm text-gray-500 mt-1">Status atual</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
