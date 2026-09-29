"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inventoryApi } from "@/lib/api/inventory";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Package, Plus, AlertTriangle, Search, ScanLine, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { InlineDeleteAction } from "@/components/ui/inline-delete-action";
import { useInlineDelete } from "@/lib/hooks/use-inline-delete";
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
  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => inventoryApi.delete(id),
    (id) => setItems((prev) => prev.filter((i) => i.id !== id))
  );

  useEffect(() => {
    inventoryApi
      .getAll()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
            <Button variant="outline" onClick={() => router.push('/inventory/movements/new')} className="rounded-[9px] font-bold gap-2">
              <ScanLine className="h-4 w-4" />
              Movimentação em Lote
            </Button>
            <Button onClick={() => router.push('/inventory/new')} className="rounded-[9px] font-bold gap-2 bg-primary hover:bg-primary/90 text-white">
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
              <TableHead className="w-[96px] text-right">Ações</TableHead>
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
                      <InlineDeleteAction
                        confirming={confirmId === item.id}
                        deleting={deleting}
                        onRequestDelete={() => requestDelete(item.id)}
                        onCancelDelete={cancelDelete}
                        onConfirmDelete={() => confirmDelete(item.id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
