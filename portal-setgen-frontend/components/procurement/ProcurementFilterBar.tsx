import React from "react";
import { LayoutList, LayoutGrid, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProcurementOrderStatus } from "@/types";

interface ProcurementFilterBarProps {
  viewMode: "LIST" | "ORDERS";
  onViewModeChange: (mode: "LIST" | "ORDERS") => void;
  flatItemsCount: number;
  filteredOrdersCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  statusCounts: {
    total: number;
    quoting: number;
    orderIssued: number;
    awaitingDelivery: number;
    received: number;
  };
}

export function ProcurementFilterBar({
  viewMode,
  onViewModeChange,
  flatItemsCount,
  filteredOrdersCount,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
}: ProcurementFilterBarProps) {
  const tabs = [
    { id: "ALL", label: "Todos", count: statusCounts.total },
    {
      id: ProcurementOrderStatus.QUOTING,
      label: "Em Cotação",
      count: statusCounts.quoting,
    },
    {
      id: ProcurementOrderStatus.ORDER_ISSUED,
      label: "Pedido Emitido",
      count: statusCounts.orderIssued,
    },
    {
      id: ProcurementOrderStatus.AWAITING_DELIVERY,
      label: "Aguardando Entrega",
      count: statusCounts.awaitingDelivery,
    },
    {
      id: ProcurementOrderStatus.RECEIVED,
      label: "Recebidos / Estoque",
      count: statusCounts.received,
    },
  ];

  return (
    <Card className="p-3 sm:p-3.5 rounded-xl border border-gray-200/75 space-y-2.5 bg-white shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Alternância de Modo de Visualização */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100/90 p-0.5 rounded-lg flex items-center gap-1 border border-gray-200/80">
            <button
              type="button"
              onClick={() => onViewModeChange("LIST")}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "LIST"
                  ? "bg-[#E2661D] text-white shadow-2xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Visão por Lista (Itens)
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
                {flatItemsCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("ORDERS")}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "ORDERS"
                  ? "bg-gray-900 text-white shadow-2xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Visão por Pedidos
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
                {filteredOrdersCount}
              </span>
            </button>
          </div>
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por OS, cliente, fornecedor, peça ou NF..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#E2661D]/30"
          />
        </div>
      </div>

      {/* Pílulas de Status */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-gray-100">
        {tabs.map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                active
                  ? "bg-gray-900 text-white shadow-2xs"
                  : "bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  active
                    ? "bg-white/20 text-white font-mono"
                    : "bg-gray-100 text-gray-700 font-mono"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

