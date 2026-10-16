import { ProcurementOrderStatus } from "@/types";

export const STATUS_LABELS: Record<ProcurementOrderStatus, string> = {
  [ProcurementOrderStatus.QUOTING]: "Em Cotação",
  [ProcurementOrderStatus.ORDER_ISSUED]: "Pedido Emitido",
  [ProcurementOrderStatus.AWAITING_DELIVERY]: "Aguardando Entrega",
  [ProcurementOrderStatus.RECEIVED]: "Recebido no Estoque",
  [ProcurementOrderStatus.CANCELLED]: "Cancelado",
};

export const STATUS_BADGES: Record<
  ProcurementOrderStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  [ProcurementOrderStatus.QUOTING]: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  [ProcurementOrderStatus.ORDER_ISSUED]: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  [ProcurementOrderStatus.AWAITING_DELIVERY]: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  [ProcurementOrderStatus.RECEIVED]: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  [ProcurementOrderStatus.CANCELLED]: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
};

