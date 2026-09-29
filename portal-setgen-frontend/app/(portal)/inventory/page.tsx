"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inventoryApi } from "@/lib/api/inventory";
import { Product, MovementType } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  ScanLine,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowDownToLine,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { InlineDeleteAction } from "@/components/ui/inline-delete-action";
import { useInlineDelete } from "@/lib/hooks/use-inline-delete";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";

export default function InventoryPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Estado do Modal de Reposição Rápida
  const [replenishOpen, setReplenishOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [replenishQty, setReplenishQty] = useState("1");
  const [replenishCost, setReplenishCost] = useState("");
  const [replenishReason, setReplenishReason] = useState("Reposição de Estoque / Compra Fornecedor");
  const [submittingReplenish, setSubmittingReplenish] = useState(false);

  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => inventoryApi.delete(id),
    (id) => setItems((prev) => prev.filter((i) => i.id !== id))
  );

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = () => {
    inventoryApi
      .getAll()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openReplenishModal = (product?: Product) => {
    if (product) {
      setSelectedProductId(product.id);
      setReplenishCost(product.unitCost ? String(product.unitCost) : product.unitPrice ? String(product.unitPrice) : "");
    } else {
      setSelectedProductId(items[0]?.id || "");
      setReplenishCost(items[0]?.unitCost ? String(items[0]?.unitCost) : "");
    }
    setReplenishQty("1");
    setReplenishReason("Reposição de Estoque / Compra Fornecedor");
    setReplenishOpen(true);
  };

  const handleConfirmReplenish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error("Selecione um produto para reposição.");
      return;
    }

    const qty = Number(replenishQty.replace(",", "."));
    if (isNaN(qty) || qty <= 0) {
      toast.error("Informe uma quantidade válida maior que zero.");
      return;
    }

    const cost = replenishCost ? Number(replenishCost.replace(",", ".")) : undefined;

    setSubmittingReplenish(true);
    try {
      await inventoryApi.createMovement({
        productId: selectedProductId,
        type: MovementType.ENTRY,
        quantity: Math.round(qty),
        unitCost: cost && !isNaN(cost) ? cost : undefined,
        reason: replenishReason.trim() || "Reposição de Estoque",
      });

      // Atualiza o estoque localmente imediatamente
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedProductId
            ? { ...item, currentStock: item.currentStock + Math.round(qty) }
            : item
        )
      );

      const targetProduct = items.find((p) => p.id === selectedProductId);
      toast.success(
        `Reposição de +${Math.round(qty)} ${targetProduct?.unit || "un"} de "${targetProduct?.name}" registrada com sucesso!`
      );
      setReplenishOpen(false);
    } catch (error: any) {
      console.error("Erro ao registrar reposição:", error);
      toast.error(error.response?.data?.message || "Erro ao registrar reposição de estoque.");
    } finally {
      setSubmittingReplenish(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const lowStockItems = items.filter((item) => item.currentStock <= item.minStock && item.currentStock > item.minStock / 2);
  const criticalItems = items.filter((item) => item.currentStock <= item.minStock / 2);
  const regularItems = items.filter((item) => item.currentStock > item.minStock);

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.code.toLowerCase().includes(term) ||
      item.barcode?.toLowerCase().includes(term)
    );
  });

  const selectedProduct = items.find((i) => i.id === selectedProductId);

  const statusOf = (item: Product) => {
    if (item.currentStock <= item.minStock / 2) return { label: 'Crítico', cls: 'bg-red-100 text-red-700' };
    if (item.currentStock <= item.minStock) return { label: 'Baixo', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'Normal', cls: 'bg-emerald-100 text-emerald-700' };
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Estoque de Peças & Geradores"
        subtitle={`${items.length} itens cadastrados no almoxarifado`}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              onClick={() => openReplenishModal()}
              className="rounded-[9px] font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white shadow-xs"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Reposição / Entrada Rápida
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/inventory/movements/new')}
              className="rounded-[9px] font-bold gap-2 border-gray-200"
            >
              <ScanLine className="h-4 w-4" />
              Bipagem / Lote
            </Button>
            <Button
              onClick={() => router.push('/inventory/new')}
              variant="outline"
              className="rounded-[9px] font-bold gap-2 border-gray-200"
            >
              <Plus className="h-4 w-4" />
              Nova Peça
            </Button>
          </div>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total de Itens" value={items.length} icon={Package} variant="orange" />
        <StatusCard label="Saldo Regular" value={regularItems.length} icon={CheckCircle} variant="emerald" />
        <StatusCard label="Estoque Baixo" value={lowStockItems.length} icon={AlertCircle} variant="amber" />
        <StatusCard label="Nível Crítico" value={criticalItems.length} icon={XCircle} variant="red" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, código ou EAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-[8px] text-[12.5px] outline-none focus:ring-1 focus:ring-primary bg-background"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Peça / Item</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-center">Qtd.</TableHead>
              <TableHead className="text-center">Mínimo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Un.</TableHead>
              <TableHead className="w-[120px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty colSpan={8} icon={Package} message="Nenhum produto cadastrado" />
            ) : (
              filtered.map((item) => {
                const status = statusOf(item);
                return (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/inventory/${item.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-[34px] h-[34px] rounded-[9px] bg-muted/60 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-foreground">{item.name}</div>
                          {item.description && <div className="text-[11.5px] text-muted-foreground truncate max-w-xs">{item.description}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12.5px] font-mono text-muted-foreground">{item.code}</TableCell>
                    <TableCell className="text-[12.5px] text-muted-foreground">
                      {item.location?.code || <span className="italic text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-center text-[12.5px] font-bold text-foreground">
                      {item.currentStock} {item.unit}
                    </TableCell>
                    <TableCell className="text-center text-[12.5px] text-muted-foreground">
                      {item.minStock} {item.unit}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.cls}`}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-[12.5px] font-bold text-foreground">
                      {item.unitPrice ? formatCurrency(item.unitPrice) : '—'}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openReplenishModal(item)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Dar Entrada / Repor Estoque em 1 Clique"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </button>
                        <InlineDeleteAction
                          confirming={confirmId === item.id}
                          deleting={deleting}
                          onRequestDelete={() => requestDelete(item.id)}
                          onCancelDelete={cancelDelete}
                          onConfirmDelete={() => confirmDelete(item.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* MODAL DE REPOSIÇÃO RÁPIDA / ENTRADA DE ESTOQUE */}
      <Dialog open={replenishOpen} onOpenChange={setReplenishOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ArrowDownToLine className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-gray-900">
                  Reposição / Entrada de Estoque
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Lance reposição ou chegada de peças direto no estoque sem sair da tela.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleConfirmReplenish} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Peça / Produto *</Label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const p = items.find((i) => i.id === e.target.value);
                  if (p) {
                    setReplenishCost(p.unitCost ? String(p.unitCost) : p.unitPrice ? String(p.unitPrice) : "");
                  }
                }}
                className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#E2661D]"
              >
                {items.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} ({prod.code}) — Atual: {prod.currentStock} {prod.unit}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-800">Saldo Atual:</span>{" "}
                  <span className="font-black text-[#E2661D]">{selectedProduct.currentStock} {selectedProduct.unit}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-800">Mínimo:</span>{" "}
                  <span className="text-gray-600">{selectedProduct.minStock} {selectedProduct.unit}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-800">Local:</span>{" "}
                  <span className="text-gray-600">{selectedProduct.location?.code || "Galpão Principal"}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700 mb-1 block">
                  Qtd. Reposta * ({selectedProduct?.unit || "un"})
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={replenishQty}
                  onChange={(e) => setReplenishQty(e.target.value)}
                  placeholder="Ex: 10"
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-700 mb-1 block">
                  Custo Un. (R$) - Opcional
                </Label>
                <Input
                  type="text"
                  value={replenishCost}
                  onChange={(e) => setReplenishCost(e.target.value)}
                  placeholder="Ex: 85.00"
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">
                Motivo / Nota Fiscal / Observação
              </Label>
              <Input
                type="text"
                value={replenishReason}
                onChange={(e) => setReplenishReason(e.target.value)}
                placeholder="Ex: NF 1234 - Fornecedor Cummins"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReplenishOpen(false)}
                className="rounded-xl h-10 text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submittingReplenish}
                className="rounded-xl h-10 text-xs font-bold bg-[#E2661D] hover:bg-[#c95716] text-white gap-2"
              >
                {submittingReplenish ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Confirmar Entrada
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
