import React from "react";
import { ShoppingCart, Clock, Truck, CheckCircle } from "lucide-react";
import { StatusCard } from "@/components/ui/status-card";

interface ProcurementKPIsProps {
  totalCount: number;
  quotingCount: number;
  awaitingDeliveryCount: number;
  receivedCount: number;
}

export function ProcurementKPIs({
  totalCount,
  quotingCount,
  awaitingDeliveryCount,
  receivedCount,
}: ProcurementKPIsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
      <StatusCard
        label="Total de Pedidos"
        value={totalCount}
        icon={ShoppingCart}
        variant="orange"
      />
      <StatusCard
        label="Em Cotação"
        value={quotingCount}
        icon={Clock}
        variant="amber"
      />
      <StatusCard
        label="Aguardando Entrega"
        value={awaitingDeliveryCount}
        icon={Truck}
        variant="blue"
      />
      <StatusCard
        label="Recebidos no Estoque"
        value={receivedCount}
        icon={CheckCircle}
        variant="emerald"
      />
    </div>
  );
}

