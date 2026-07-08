"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { inventoryApi } from "@/lib/api/inventory";
import { MovementType, Product } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ScanLine } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";

const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  [MovementType.ENTRY]: "Entrada",
  [MovementType.EXIT]: "Saída",
  [MovementType.ADJUSTMENT_IN]: "Ajuste (+)",
  [MovementType.ADJUSTMENT_OUT]: "Ajuste (-)",
  [MovementType.TRANSFER]: "Transferência",
};

interface CartItem {
  product: Product;
  quantity: number;
}

export default function BatchMovementPage() {
  const router = useRouter();
  const [type, setType] = useState<MovementType>(MovementType.ENTRY);
  const [reason, setReason] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = async () => {
    const code = barcodeInput.trim();
    if (!code) return;
    setScanning(true);
    try {
      const product = await inventoryApi.getByBarcode(code);
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
        }
        return [...prev, { product, quantity: 1 }];
      });
    } catch (error: any) {
      alert(error.response?.data?.message || "Produto não encontrado para este código de barras");
    } finally {
      setBarcodeInput("");
      setScanning(false);
      inputRef.current?.focus();
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleSave = async () => {
    if (cart.length === 0) {
      alert("Escaneie ao menos um produto");
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.createMovementBatch({
        type,
        reason: reason || undefined,
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      alert("Movimentação registrada com sucesso!");
      setCart([]);
      setReason("");
      inputRef.current?.focus();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao registrar movimentação");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Movimentação em Lote" subtitle="Bipe vários produtos e salve tudo de uma vez" />

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={type} onValueChange={(val) => setType(val as MovementType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MovementType.ENTRY}>{MOVEMENT_TYPE_LABELS[MovementType.ENTRY]}</SelectItem>
              <SelectItem value={MovementType.EXIT}>{MOVEMENT_TYPE_LABELS[MovementType.EXIT]}</SelectItem>
              <SelectItem value={MovementType.ADJUSTMENT_IN}>{MOVEMENT_TYPE_LABELS[MovementType.ADJUSTMENT_IN]}</SelectItem>
              <SelectItem value={MovementType.ADJUSTMENT_OUT}>{MOVEMENT_TYPE_LABELS[MovementType.ADJUSTMENT_OUT]}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Motivo / referência (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="md:col-span-2"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12.5px] font-bold text-text-secondary">Escaneie o código de barras e aperte Enter</label>
          <div className="relative max-w-sm">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              ref={inputRef}
              autoFocus
              disabled={scanning}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleScan();
                }
              }}
              className="pl-9"
              placeholder="7891234567890"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Referência</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-center w-[120px]">Qtda</TableHead>
              <TableHead>Código de barras</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cart.length === 0 ? (
              <TableEmpty colSpan={5} message="Nenhum produto escaneado ainda." />
            ) : (
              cart.map((item) => (
                <TableRow key={item.product.id}>
                  <TableCell className="text-[12.5px] text-text-secondary">{item.product.code}</TableCell>
                  <TableCell className="text-[13px] font-bold text-foreground">{item.product.name}</TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product.id, Math.max(1, Number(e.target.value)))}
                      className="h-9 w-20 text-center mx-auto"
                    />
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">{item.product.barcode}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1.5 text-text-muted hover:text-destructive hover:bg-muted/40 rounded-md transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || cart.length === 0} className="rounded-[9px] font-bold gap-2">
          {saving ? "Salvando..." : "Salvar Movimentação"}
        </Button>
      </div>
    </div>
  );
}
