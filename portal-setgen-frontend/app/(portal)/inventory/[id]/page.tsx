"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { inventoryApi } from '@/lib/api/inventory';
import { Product, UserRole, MovementType } from '@/types';
import { useAuthStore } from '@/store/auth';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import {
  Package,
  Layers,
  Edit,
  Trash2,
  AlertTriangle,
  History,
  TrendingUp,
  TrendingDown,
  Info,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import { FieldBlock } from "@/components/ui/field-block";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from "@/components/ui/table";
import Link from 'next/link';

const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  [MovementType.ENTRY]: 'Entrada',
  [MovementType.EXIT]: 'Saída',
  [MovementType.ADJUSTMENT_IN]: 'Ajuste (+)',
  [MovementType.ADJUSTMENT_OUT]: 'Ajuste (-)',
  [MovementType.TRANSFER]: 'Transferência',
};

const INBOUND_TYPES = [MovementType.ENTRY, MovementType.ADJUSTMENT_IN];

const emptyMovement = {
  type: MovementType.ENTRY as MovementType,
  quantity: '',
  unitCost: '',
  reason: '',
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [submittingMovement, setSubmittingMovement] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      const data = await inventoryApi.getById(params.id as string);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Erro ao carregar detalhes do produto');
      router.push('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      await inventoryApi.delete(params.id as string);
      alert('Produto excluído com sucesso!');
      router.push('/inventory');
    } catch (error) {
      alert('Erro ao excluir produto');
    }
  };

  const handleCreateMovement = async () => {
    if (!product) return;
    const quantity = Number(movementForm.quantity);
    if (!quantity || quantity <= 0) {
      alert('Informe uma quantidade válida');
      return;
    }
    setSubmittingMovement(true);
    try {
      await inventoryApi.createMovement({
        productId: product.id,
        type: movementForm.type,
        quantity,
        unitCost: movementForm.unitCost ? Number(movementForm.unitCost) : undefined,
        reason: movementForm.reason || undefined,
      });
      setMovementForm(emptyMovement);
      setIsMovementOpen(false);
      await loadProduct();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao registrar movimentação');
    } finally {
      setSubmittingMovement(false);
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const canManageStock = user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) return null;

  const isLowStock = product.currentStock <= product.minStock;
  const movements = product.movements || [];
  const now = new Date();
  const monthMovements = movements.filter((m) => {
    const d = new Date(m.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthEntries = monthMovements
    .filter((m) => INBOUND_TYPES.includes(m.type))
    .reduce((sum, m) => sum + m.quantity, 0);
  const monthExits = monthMovements
    .filter((m) => !INBOUND_TYPES.includes(m.type) && m.type !== MovementType.TRANSFER)
    .reduce((sum, m) => sum + m.quantity, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={Package}
        tone="amber"
        title={product.name}
        badge={{ label: product.active ? 'Ativo' : 'Inativo', className: product.active ? 'bg-status-green-bg text-status-green-fg' : 'bg-status-red-bg text-status-red-fg' }}
        meta={<>Código: {product.code}</>}
        backLabel="Voltar para lista"
        onBack={() => router.back()}
        actions={
          <>
            <Link href={`/inventory/${product.id}/edit`}>
              <Button variant="outline" className="rounded-[9px] font-bold gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="rounded-[9px] font-bold gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
          </>
        }
      />

      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="mt-4 space-y-4">
          <Card className="p-6">
            <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600" />
              Especificações
            </div>
            {product.photoUrl && (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/${product.photoUrl}`}
                alt={product.name}
                className="h-24 rounded-xl border object-cover mb-4"
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
              <FieldBlock label="Unidade" value={product.unit || 'UN'} />
              <FieldBlock label="Localização" value={product.location?.code} />
              <FieldBlock label="Código de Barras" value={product.barcode} />
              <FieldBlock label="Descrição" value={product.description || 'Nenhuma descrição detalhada informada.'} />
            </div>
          </Card>

          {isLowStock && (
            <div className="bg-status-amber-bg border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-2.5 bg-white/60 rounded-xl text-status-amber-fg shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-status-amber-fg text-[13.5px]">Alerta de Estoque Baixo</h3>
                <p className="text-status-amber-fg text-[12.5px] mt-0.5">
                  Este produto atingiu o nível de estoque mínimo ({product.minStock} {product.unit}).
                  Considere realizar um novo pedido de compra.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="estoque" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center justify-center gap-2">
                <Layers className="h-4 w-4 text-amber-600" />
                Nível de Estoque
              </div>
              <div className={`text-5xl font-black mb-1 ${isLowStock ? 'text-status-red-fg' : 'text-amber-600'}`}>
                {product.currentStock}
              </div>
              <p className="text-text-muted font-bold uppercase tracking-widest text-[11px] mb-5">
                {product.unit} em estoque
              </p>

              <div className="pt-5 border-t border-border space-y-3 text-left">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-text-secondary font-medium">Estoque Mínimo</span>
                  <span className="font-bold text-foreground">{product.minStock} {product.unit}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${isLowStock ? 'bg-status-red-fg' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, (product.currentStock / (product.minStock * 2)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-amber-600" />
                Histórico Rápido
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-status-green-fg" />
                    <span className="text-[13px] text-text-secondary">Entradas (Mês)</span>
                  </div>
                  <span className="font-bold text-foreground">{monthEntries}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-status-red-fg" />
                    <span className="text-[13px] text-text-secondary">Saídas (Mês)</span>
                  </div>
                  <span className="font-bold text-foreground">{monthExits}</span>
                </div>
              </div>
              {canManageStock && (
                <Button
                  onClick={() => setIsMovementOpen(true)}
                  className="w-full mt-5 bg-status-amber-bg text-status-amber-fg hover:bg-status-amber-bg/80 border-none rounded-xl font-bold"
                >
                  Nova Movimentação
                </Button>
              )}
            </Card>
          </div>

          <Card className="overflow-hidden mt-4">
            <div className="px-5 py-4 border-b border-border text-[13.5px] font-bold text-foreground">
              Kardex (últimas movimentações)
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-t-0 hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableEmpty colSpan={6} message="Nenhuma movimentação registrada ainda" />
                ) : (
                  movements.map((m) => {
                    const inbound = INBOUND_TYPES.includes(m.type);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-[12.5px] text-text-secondary whitespace-nowrap">
                          {formatDateTime(m.createdAt)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2 py-0.5 rounded-full ${inbound ? 'bg-status-green-bg text-status-green-fg' : 'bg-status-red-bg text-status-red-fg'}`}>
                            {inbound ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                            {MOVEMENT_TYPE_LABELS[m.type]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">
                          {inbound ? '+' : '-'}{m.quantity} {product.unit}
                        </TableCell>
                        <TableCell className="text-right text-[12.5px] text-text-secondary">
                          {m.unitCost ? formatCurrency(m.unitCost) : '-'}
                        </TableCell>
                        <TableCell className="text-[12.5px] text-text-secondary">{m.reason || '-'}</TableCell>
                        <TableCell className="text-[12.5px] text-text-secondary">{m.createdBy?.name || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={movementForm.type}
                onValueChange={(v) => setMovementForm((prev) => ({ ...prev, type: v as MovementType }))}
              >
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantidade ({product.unit})</Label>
                <Input
                  type="number"
                  min={1}
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Custo Unit. (opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={movementForm.unitCost}
                  onChange={(e) => setMovementForm((prev) => ({ ...prev, unitCost: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo (opcional)</Label>
              <Input
                value={movementForm.reason}
                onChange={(e) => setMovementForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Ex: contagem de inventário, recebimento de compra..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsMovementOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateMovement} disabled={submittingMovement}>
              {submittingMovement ? 'Salvando...' : 'Registrar Movimentação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
