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
  PackageX,
  type LucideIcon,
} from 'lucide-react';
import { QuoteStatus, ServiceOrderStatus } from '@/types';

export interface StatusConfigEntry {
  label: string;
  icon: LucideIcon;
  /** Cor semântica — usada junto com as classes bg-status- (tokens do tema) */
  color: 'gray' | 'yellow' | 'green' | 'blue' | 'red' | 'emerald' | 'purple';
  /** Posição na linha do tempo principal; -1 = fora do fluxo linear (exceção/encerramento) */
  order: number;
}

// Único mapa de status→label/cor/ícone para orçamento (Quote). Substitui os
// mapas antigos duplicados em StatusManager/StatusTimeline/orders[id]/lib.utils.
export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, StatusConfigEntry> = {
  [QuoteStatus.DRAFT]: { label: 'Rascunho', icon: FileText, color: 'gray', order: 0 },
  [QuoteStatus.PENDING_APPROVAL]: { label: 'Aguardando Aprovação', icon: Clock, color: 'yellow', order: 1 },
  [QuoteStatus.APPROVED]: { label: 'Aprovado', icon: CheckCircle, color: 'green', order: 2 },
  [QuoteStatus.SENT_TO_CLIENT]: { label: 'Enviado ao Cliente', icon: Send, color: 'blue', order: 3 },
  [QuoteStatus.AWAITING_RESPONSE]: { label: 'Aguardando Resposta', icon: Hourglass, color: 'yellow', order: 4 },
  [QuoteStatus.ACCEPTED]: { label: 'Aceito', icon: CheckCircle, color: 'emerald', order: 5 },
  [QuoteStatus.REJECTED]: { label: 'Rejeitado', icon: XCircle, color: 'red', order: -1 },
  [QuoteStatus.EXPIRED]: { label: 'Expirado', icon: CalendarX, color: 'red', order: -1 },
  [QuoteStatus.CANCELLED]: { label: 'Cancelado', icon: Ban, color: 'red', order: -1 },
};

export const QUOTE_MAIN_FLOW: QuoteStatus[] = [
  QuoteStatus.DRAFT,
  QuoteStatus.PENDING_APPROVAL,
  QuoteStatus.APPROVED,
  QuoteStatus.SENT_TO_CLIENT,
  QuoteStatus.AWAITING_RESPONSE,
  QuoteStatus.ACCEPTED,
];

// Máquina de estados do orçamento espelhando QuotesService (backend).
export const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.PENDING_APPROVAL, QuoteStatus.CANCELLED],
  [QuoteStatus.PENDING_APPROVAL]: [QuoteStatus.APPROVED, QuoteStatus.REJECTED, QuoteStatus.CANCELLED],
  [QuoteStatus.APPROVED]: [QuoteStatus.SENT_TO_CLIENT, QuoteStatus.ACCEPTED, QuoteStatus.CANCELLED],
  [QuoteStatus.SENT_TO_CLIENT]: [QuoteStatus.AWAITING_RESPONSE, QuoteStatus.CANCELLED],
  [QuoteStatus.AWAITING_RESPONSE]: [QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.EXPIRED, QuoteStatus.CANCELLED],
  [QuoteStatus.EXPIRED]: [QuoteStatus.PENDING_APPROVAL],
  [QuoteStatus.REJECTED]: [QuoteStatus.PENDING_APPROVAL, QuoteStatus.CANCELLED],
  [QuoteStatus.ACCEPTED]: [],
  [QuoteStatus.CANCELLED]: [],
};

// Único mapa de status→label/cor/ícone pra Ordem de Serviço (execução).
export const SERVICE_ORDER_STATUS_CONFIG: Record<ServiceOrderStatus, StatusConfigEntry> = {
  [ServiceOrderStatus.AWAITING_MATERIALS]: { label: 'Aguardando Materiais', icon: PackageX, color: 'yellow', order: 0 },
  [ServiceOrderStatus.IN_PROGRESS]: { label: 'Em Andamento', icon: PlayCircle, color: 'blue', order: 1 },
  [ServiceOrderStatus.COMPLETED]: { label: 'Concluída', icon: Flag, color: 'emerald', order: 2 },
  [ServiceOrderStatus.CANCELLED]: { label: 'Cancelada', icon: Ban, color: 'red', order: -1 },
};

export const SERVICE_ORDER_MAIN_FLOW: ServiceOrderStatus[] = [
  ServiceOrderStatus.AWAITING_MATERIALS,
  ServiceOrderStatus.IN_PROGRESS,
  ServiceOrderStatus.COMPLETED,
];

// Máquina de estados da OS de execução espelhando ServiceOrdersService (backend).
export const SERVICE_ORDER_STATUS_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  [ServiceOrderStatus.AWAITING_MATERIALS]: [ServiceOrderStatus.IN_PROGRESS, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.IN_PROGRESS]: [ServiceOrderStatus.AWAITING_MATERIALS, ServiceOrderStatus.COMPLETED, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.COMPLETED]: [],
  [ServiceOrderStatus.CANCELLED]: [],
};

const COLOR_HEX: Record<StatusConfigEntry['color'], { bg: string; fg: string; ring: string }> = {
  gray: { bg: '#6b7280', fg: '#f3f4f6', ring: '#e5e7eb' },
  yellow: { bg: '#eab308', fg: '#fef3c7', ring: '#fef3c7' },
  green: { bg: '#22c55e', fg: '#d1fae5', ring: '#d1fae5' },
  blue: { bg: '#3b82f6', fg: '#dbeafe', ring: '#dbeafe' },
  emerald: { bg: '#10b981', fg: '#d1fae5', ring: '#d1fae5' },
  red: { bg: '#ef4444', fg: '#fee2e2', ring: '#fee2e2' },
  purple: { bg: '#a855f7', fg: '#f3e8ff', ring: '#f3e8ff' },
};

export function statusColorHex(color: StatusConfigEntry['color']) {
  return COLOR_HEX[color];
}

// Classes tailwind pro badge de status (mesma paleta bg-status-*/text-status-* já usada no app).
const BADGE_CLASSNAMES: Record<StatusConfigEntry['color'], string> = {
  gray: 'bg-status-gray-bg text-status-gray-fg',
  yellow: 'bg-status-amber-bg text-status-amber-fg',
  green: 'bg-status-green-bg text-status-green-fg',
  blue: 'bg-status-blue-bg text-status-blue-fg',
  emerald: 'bg-status-green-bg text-status-green-fg',
  red: 'bg-status-red-bg text-status-red-fg',
  purple: 'bg-status-purple-bg text-status-purple-fg',
};

export function quoteStatusBadgeClass(status: QuoteStatus): string {
  return BADGE_CLASSNAMES[QUOTE_STATUS_CONFIG[status].color];
}

export function serviceOrderStatusBadgeClass(status: ServiceOrderStatus): string {
  return BADGE_CLASSNAMES[SERVICE_ORDER_STATUS_CONFIG[status].color];
}
