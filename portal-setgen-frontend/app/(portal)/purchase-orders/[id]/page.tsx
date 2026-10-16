"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { PurchaseOrder } from "@/types";
import {
  Printer,
  Edit,
  Trash2,
  CheckCircle,
  Share2,
  ArrowLeft,
  Copy,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseOrderDocumentSheet } from "@/components/purchase-orders/PurchaseOrderDocumentSheet";
import { formatCurrency } from "@/lib/utils";
import { formatDateBR } from "@/lib/date";
import { toast } from "sonner";

export default function PurchaseOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const orderId = params.id as string;
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const data = await purchaseOrdersApi.getById(orderId);
      setOrder(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar detalhes da Ordem de Compra");
      router.push("/purchase-orders");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do documento copiado para a área de transferência!");
    }
  };

  const handleShareWhatsApp = () => {
    if (!order) return;
    const items = Array.isArray(order.items) ? order.items : [];
    const total =
      order.totalAmount ||
      order.value ||
      items.reduce(
        (acc, it) => acc + (Number(it.quantity || 1) * Number(it.unitPrice || 0)),
        0
      );

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
      total > 0 ? `💰 *Valor Total:* ${formatCurrency(total)}` : "",
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

  const handleMarkCompleted = async () => {
    if (!order) return;
    try {
      const updated = await purchaseOrdersApi.update(order.id, { pickupStatus: "COMPLETED" });
      setOrder(updated);
      toast.success("Ordem marcada como Material Retirado!");
    } catch (err) {
      toast.error("Erro ao atualizar status da ordem.");
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    if (!window.confirm(`Tem certeza que deseja excluir a Ordem de Compra ${order.orderNumber}?`))
      return;

    try {
      await purchaseOrdersApi.delete(order.id);
      toast.success("Ordem de Compra excluída com sucesso!");
      router.push("/purchase-orders");
    } catch (error) {
      toast.error("Erro ao excluir Ordem de Compra");
    }
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#E2661D]" />
        <span className="text-sm font-medium">Carregando documento em padrão executivo...</span>
      </div>
    );
  }

  if (!order) return null;

  const isCompleted = order.pickupStatus === "COMPLETED";
  const isCancelled = order.pickupStatus === "CANCELLED";

  return (
    <div className="space-y-6 pb-20 max-w-[860px] mx-auto print:max-w-none print:m-0 print:p-0">
      {/* =================================================================== */}
      {/* BARRA SUPERIOR DE AÇÕES E PRODUTIVIDADE (OCULTA NA IMPRESSÃO)      */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs print:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/purchase-orders")}
            className="text-gray-500 hover:text-gray-900 gap-1.5 text-xs font-semibold shrink-0 h-9"
            title="Voltar para Ordens de Compra"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">Voltar para Ordens</span>
          </Button>
          <div className="h-4 w-px bg-gray-200 hidden sm:block shrink-0" />
          <span className="text-xs font-mono font-bold text-gray-500 hidden sm:inline whitespace-nowrap shrink-0">
            Código: <strong className="text-gray-900">{order.orderNumber}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {!isCompleted && !isCancelled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkCompleted}
              className="rounded-lg h-9 text-xs font-semibold gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shrink-0"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Marcar Retirado
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareWhatsApp}
            className="rounded-lg h-9 text-xs font-semibold gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shrink-0"
            title="Compartilhar autorização no WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            WhatsApp
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="rounded-lg h-9 text-xs font-semibold gap-1.5 border-gray-300 hover:bg-gray-50 shrink-0"
            title="Copiar link deste documento"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar Link
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/purchase-orders/${order.id}/edit`)}
            className="rounded-lg h-9 text-xs font-semibold gap-1.5 border-gray-300 hover:bg-gray-50 shrink-0"
          >
            <Edit className="w-3.5 h-3.5" />
            Editar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="rounded-lg h-9 text-xs font-semibold gap-1.5 bg-[#E2661D] hover:bg-[#d05a18] text-white shadow-2xs shrink-0"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="rounded-lg h-9 text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 p-2 shrink-0"
            title="Excluir ordem de compra"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* FOLHA OFICIAL A4 — PADRÃO EXECUTIVO SGQ                             */}
      {/* =================================================================== */}
      <div className="w-full print:p-0 print:m-0" ref={printRef}>
        <PurchaseOrderDocumentSheet order={order} />
      </div>
    </div>
  );
}
