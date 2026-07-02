"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inventoryApi } from "@/lib/api/inventory";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Package, Plus, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();

  useEffect(() => {
    inventoryApi
      .getAll()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );

  const lowStockItems = items.filter((item) => item.currentStock <= item.minStock);
  const criticalItems = items.filter((item) => item.currentStock <= item.minStock / 2);

  const statusOf = (item: Product) => {
    if (item.currentStock <= item.minStock / 2) return { label: 'Crítico', cls: 'bg-status-red-bg text-status-red-fg' };
    if (item.currentStock <= item.minStock) return { label: 'Baixo', cls: 'bg-status-amber-bg text-status-amber-fg' };
    return { label: 'OK', cls: 'bg-status-green-bg text-status-green-fg' };
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Estoque"
        subtitle={`${items.length} peças cadastradas${criticalItems.length > 0 ? ` · ${criticalItems.length} em nível crítico` : ''}`}
        actions={
          <Button onClick={() => router.push('/inventory/new')} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Nova Peça
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Peça</TableHead>
              <TableHead>Código</TableHead>
              <TableHead className="text-center">Qtd.</TableHead>
              <TableHead className="text-center">Mínimo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Un.</TableHead>
              <TableHead className="text-right">Unid./Caixa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableEmpty colSpan={7} icon={Package} message="Nenhum produto cadastrado" />
            ) : (
              items.map((item) => {
                const status = statusOf(item);
                return (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/inventory/${item.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-[34px] h-[34px] rounded-[9px] bg-muted/60 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-text-secondary" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-foreground">{item.name}</div>
                          {item.description && <div className="text-[11.5px] text-text-muted">{item.description}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-text-secondary">{item.code}</TableCell>
                    <TableCell className="text-center text-[12.5px] font-bold text-foreground">
                      {item.currentStock} {item.unit}
                    </TableCell>
                    <TableCell className="text-center text-[12.5px] text-text-muted">
                      {item.minStock} {item.unit}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${status.cls}`}>
                        {status.label === 'Crítico' && <AlertTriangle className="h-3 w-3" />}
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-[12.5px] font-bold text-foreground">
                      {item.unitPrice ? formatCurrency(item.unitPrice) : (
                        <span className="text-xs text-text-muted italic font-normal">Não definido</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-[12.5px] text-text-secondary">
                      {item.unitsPerPackage ? (
                        <div>
                          <div>{item.unitsPerPackage} un.</div>
                          {item.unitPrice && (
                            <div className="text-[11px] text-text-muted">
                              Caixa: {formatCurrency(item.unitPrice * item.unitsPerPackage)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted italic">-</span>
                      )}
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
