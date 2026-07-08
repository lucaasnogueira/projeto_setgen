"use client"

import { ServiceOrderStatus } from '@/types';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Flag,
  Ban,
  Send,
  Hourglass,
  CalendarX,
  PackageX
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
  [ServiceOrderStatus.SENT_TO_CLIENT]: {
    label: 'Enviado ao Cliente',
    icon: Send,
    color: 'blue',
    order: 3
  },
  [ServiceOrderStatus.AWAITING_RESPONSE]: {
    label: 'Aguardando Resposta',
    icon: Hourglass,
    color: 'yellow',
    order: 4
  },
  [ServiceOrderStatus.EXPIRED]: {
    label: 'Expirado',
    icon: CalendarX,
    color: 'red',
    order: -1
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
    order: 5
  },
  [ServiceOrderStatus.AWAITING_MATERIALS]: {
    label: 'Aguardando Materiais',
    icon: PackageX,
    color: 'yellow',
    order: 6
  },
  [ServiceOrderStatus.COMPLETED]: {
    label: 'Concluída',
    icon: Flag,
    color: 'emerald',
    order: 7
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
  // Status que não fazem parte da linha principal (comercial/exceção): exibidos
  // como um marcador à parte, para não sumir da timeline sem indicação de "atual".
  const isOffMainFlow = !mainFlow.includes(currentStatus);

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
                      : 'bg-muted'
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
                      isActive ? 'text-white' : 'text-muted-foreground'
                    }`} 
                  />
                </div>
                <div>
                  <p className={`font-bold ${
                    isCurrent ? 'text-foreground' : isPast ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {config.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-muted-foreground mt-1">Status atual</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status fora da linha principal (comercial ou exceção) */}
      {isOffMainFlow && (() => {
        const config = statusConfig[currentStatus];
        const Icon = config.icon;
        const bg = config.color === 'yellow' ? '#eab308'
          : config.color === 'blue' ? '#3b82f6'
          : '#ef4444';
        return (
          <div className="border-t border-border pt-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: bg }}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground">{config.label}</p>
                <p className="text-sm text-muted-foreground mt-1">Status atual</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
