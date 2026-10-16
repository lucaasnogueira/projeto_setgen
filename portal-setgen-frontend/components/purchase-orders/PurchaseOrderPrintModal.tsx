"use client";

import { useRef } from "react";
import { PurchaseOrder } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { formatDateBR } from "@/lib/date";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Share2, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { PurchaseOrderDocumentSheet } from "./PurchaseOrderDocumentSheet";

interface PurchaseOrderPrintModalProps {
  order: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseOrderPrintModal({
  order,
  open,
  onOpenChange,
}: PurchaseOrderPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const totalAmount =
    order.totalAmount ||
    order.value ||
    items.reduce(
      (acc, it) => acc + (Number(it.quantity || 1) * Number(it.unitPrice || 0)),
      0
    );

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/purchase-orders/${order.id}`);
      toast.success("Link do documento copiado para a área de transferência!");
    }
  };

  const handleShareWhatsApp = () => {
    const lines = [
      `*SETGEN & SERVIÇOS - AUTORIZAÇÃO DE RETIRADA / ORDEM DE COMPRA*`,
      `📄 *Doc:* ${order.orderNumber} (SGQ-SUP-01)`,
      `🏪 *Loja / Fornecedor:* ${order.supplierName}`,
      order.supplierAddress ? `📍 *Endereço:* ${order.supplierAddress}` : "",
      `👤 *Portador Autorizado:* ${order.carrierName}`,
      order.carrierDoc ? `🪪 *Doc (CPF/RG):* ${order.carrierDoc}` : "",
      order.carrierVehicle ? `🚗 *Veículo:* ${order.carrierVehicle}` : "",
      order.destination ? `🎯 *Destino / O.S.:* ${order.destination}` : "",
      `📅 *Data de Emissão:* ${formatDateBR(order.issueDate)}`,
      order.pickupDate ? `⏰ *Previsão de Retirada:* ${formatDateBR(order.pickupDate)}` : "",
      `📦 *Materiais Autorizados:*`,
      ...items.map(
        (it, idx) =>
          `  ${idx + 1}. ${it.description} - Qtd: ${it.quantity} ${it.unit || "UN"}${
            it.unitPrice ? ` (${formatCurrency(Number(it.unitPrice))})` : ""
          }`
      ),
      totalAmount > 0 ? `💰 *Valor Total:* ${formatCurrency(totalAmount)}` : "",
      order.paymentMethod ? `💳 *Faturamento:* ${order.paymentMethod}` : "",
      order.notes ? `📝 *Observações:* ${order.notes}` : "",
      `\n_Favor liberar os materiais ao portador indicado mediante apresentação de documento com foto._`,
    ]
      .filter(Boolean)
      .join("\n");

    const encoded = encodeURIComponent(lines);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    toast.success("Mensagem formatada para o WhatsApp!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto p-0 rounded-xl bg-slate-100 border-none shadow-2xl">
        {/* Barra superior de ações (oculta na impressão) */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-3.5 bg-slate-900 text-white shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E2661D] text-white">
              {order.orderNumber}
            </span>
            <span className="text-xs sm:text-sm font-bold truncate max-w-md">
              Autorização de Retirada de Materiais / Ordem de Compra
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="rounded-lg text-xs font-bold gap-1.5 border-slate-700 bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-white h-8"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar Link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleShareWhatsApp}
              className="bg-emerald-600/20 border-emerald-500 text-emerald-300 hover:bg-emerald-600 hover:text-white font-semibold text-xs gap-1.5 rounded-lg h-8"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              size="sm"
              className="bg-[#E2661D] hover:bg-[#d05a18] text-white font-bold gap-1.5 rounded-lg shadow-xs h-8"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar PDF
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Folha do Documento (A4 Padrão SGQ Setgen idêntico a documents/[clientId]/[docId]/view) */}
        <div ref={printRef} className="p-4 sm:p-8 flex justify-center bg-slate-100">
          <div className="w-full max-w-[860px]">
            <PurchaseOrderDocumentSheet order={order} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
