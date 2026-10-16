import React from "react";
import { AlertCircle, DollarSign } from "lucide-react";
import { ProcurementOrder } from "@/types";
import { Button } from "@/components/ui/button";

interface WarehouseDemandsAlertProps {
  demands: ProcurementOrder[];
  onEditQuotation: (order: ProcurementOrder) => void;
}

export function WarehouseDemandsAlert({
  demands,
  onEditQuotation,
}: WarehouseDemandsAlertProps) {
  if (demands.length === 0) return null;

  return (
    <div className="p-3 sm:p-3.5 rounded-xl border border-rose-200/90 bg-rose-50/60 text-rose-950 space-y-2.5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-300 flex items-center justify-center text-rose-600 shrink-0">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-rose-900">
              {demands.length} Solicitação(ões) do Almoxarifado Aguardando Cotação do Administrativo
            </h4>
            <p className="text-[11px] text-rose-800">
              O Almoxarife solicitou apenas as quantidades físicas faltantes. O time Administrativo é responsável por definir os fornecedores e cotar os preços unitários.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {demands.map((wo) => {
          const osNum = wo.materialRequest?.serviceOrder?.orderNumber;
          const clientName =
            wo.materialRequest?.serviceOrder?.client?.tradeName ||
            wo.materialRequest?.serviceOrder?.client?.companyName;
          const itemCount = wo.items?.length || 0;

          return (
            <div
              key={wo.id}
              className="px-2.5 py-2 bg-white rounded-lg border border-rose-200/90 flex items-center justify-between gap-2 text-xs shadow-2xs"
            >
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate text-[11.5px]">
                  OS #{osNum || "S/N"} {clientName && `• ${clientName}`}
                </p>
                <p className="text-[10.5px] text-rose-700 font-medium">
                  {itemCount} peça(s) faltante(s) • Aguardando cotação
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => onEditQuotation(wo)}
                className="h-6.5 px-2 text-[10.5px] font-bold bg-[#E2661D] hover:bg-[#c95716] text-white rounded-md gap-1 shrink-0 shadow-2xs"
              >
                <DollarSign className="h-3 w-3" />
                Definir Preços
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

