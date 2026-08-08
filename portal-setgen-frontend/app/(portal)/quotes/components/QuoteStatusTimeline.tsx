"use client"

import { QuoteStatus } from '@/types';
import { QUOTE_STATUS_CONFIG, QUOTE_MAIN_FLOW, statusColorHex } from '@/lib/status-config';

interface QuoteStatusTimelineProps {
  currentStatus: QuoteStatus;
}

export function QuoteStatusTimeline({ currentStatus }: QuoteStatusTimelineProps) {
  const currentOrder = QUOTE_STATUS_CONFIG[currentStatus].order;
  const isOffMainFlow = !QUOTE_MAIN_FLOW.includes(currentStatus);

  return (
    <div className="space-y-6">
      <div className="relative">
        {QUOTE_MAIN_FLOW.map((status, index) => {
          const config = QUOTE_STATUS_CONFIG[status];
          const Icon = config.icon;
          const hex = statusColorHex(config.color);
          const isPast = config.order < currentOrder;
          const isCurrent = status === currentStatus;
          const isActive = isPast || isCurrent;

          return (
            <div key={status} className="relative">
              {index < QUOTE_MAIN_FLOW.length - 1 && (
                <div
                  className="absolute left-6 top-12 w-0.5 h-12 transition-colors"
                  style={{ backgroundColor: isPast ? hex.bg : '#e5e7eb' }}
                />
              )}

              <div className="flex items-center gap-4 pb-12">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all relative z-10"
                  style={{
                    backgroundColor: isCurrent || isPast ? hex.bg : '#f3f4f6',
                    boxShadow: isCurrent ? `0 0 0 4px ${hex.fg}` : 'none',
                  }}
                >
                  <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className={`font-bold ${isCurrent || isPast ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {config.label}
                  </p>
                  {isCurrent && <p className="text-sm text-muted-foreground mt-1">Status atual</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isOffMainFlow && (() => {
        const config = QUOTE_STATUS_CONFIG[currentStatus];
        const Icon = config.icon;
        const hex = statusColorHex(config.color);
        return (
          <div className="border-t border-border pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: hex.bg }}>
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
