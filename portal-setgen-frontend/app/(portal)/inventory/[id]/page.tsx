"use client"

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { inventoryApi } from '@/lib/api/inventory';
import { Product, UserRole, MovementType } from '@/types';
import { useAuthStore } from '@/store/auth';
import { formatDateTime, formatCurrency, cn } from '@/lib/utils';
import { useCanViewValues } from '@/lib/permissions';
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
  ShoppingCart,
  CheckCircle2,
  Boxes,
  Barcode,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import { FieldBlock } from "@/components/ui/field-block";
import { AuthImage } from "@/components/ui/auth-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
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
  const canViewValues = useCanViewValues();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const queryTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(queryTab || 'detalhes');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [submittingMovement, setSubmittingMovement] = useState(false);
  const [movementsPage, setMovementsPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const movements = useMemo(() => {
    return Array.isArray(product?.movements) ? product.movements : [];
  }, [product?.movements]);

  const totalMovementPages = Math.ceil(movements.length / pageSize) || 1;
  const paginatedMovements = useMemo(() => {
    const start = (movementsPage - 1) * pageSize;
    return movements.slice(start, start + pageSize);
  }, [movements, movementsPage, pageSize]);

  useEffect(() => {
    if (queryTab === 'estoque' || queryTab === 'detalhes') {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  useEffect(() => {
    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      const data = await inventoryApi.getById(params.id as string);
      setProduct(data);
      // Se veio sem tab especificada e o item está com estoque baixo, abre direto em estoque
      if (!queryTab && data) {
        const cur = Number(data.currentStock) || 0;
        const min = Number(data.minStock) || 0;
        if (min > 0 && cur <= min) {
          setActiveTab('estoque');
        }
      }
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

  const currentStock = Number(product.currentStock) || 0;
  const minStock = Number(product.minStock) || 0;
  const isLowStock = minStock > 0 && currentStock <= minStock;
  const now = new Date();
  const monthMovements = movements.filter((m) => {
    if (!m?.createdAt) return false;
    const d = new Date(m.createdAt);
    return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthEntries = monthMovements
    .filter((m) => INBOUND_TYPES.includes(m.type))
    .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
  const monthExits = monthMovements
    .filter((m) => !INBOUND_TYPES.includes(m.type) && m.type !== MovementType.TRANSFER)
    .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);

  const suggestedPurchaseQty = Math.max(1, minStock - currentStock);

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={Package}
        tone="amber"
        title={product.name}
        badge={{
          label: product.active ? 'Ativo' : 'Inativo',
          className: product.active
            ? 'bg-status-green-bg text-status-green-fg'
            : 'bg-status-red-bg text-status-red-fg',
        }}
        meta={<>Código: {product.code}</>}
        backLabel="Voltar para lista de estoque"
        onBack={() => router.push('/inventory')}
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

      {/* Banner de Destaque Operacional: Alerta de Estoque Crítico */}
      {isLowStock && (
        <div className="bg-amber-50 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 rounded-xl p-4 sm:p-5 shadow-2xs transition-all animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    Alerta de Reposição
                  </span>
                  <span className="text-xs text-amber-800/80 dark:text-amber-300/80 font-medium">
                    Item disparou notificação automática
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1">
                  Saldo em Nível Crítico: <span className="text-rose-600 font-extrabold">{currentStock} {product.unit}</span> (Mínimo recomendado: {minStock} {product.unit})
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
                  Este produto atingiu o ponto de pedido no almoxarifado. Para garantir a continuidade das ordens de serviço, realize um pedido de compra ou registre a entrada de peças.
                </p>
              </div>
            </div>

            {/* Ações Rápidas Imediatas */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                onClick={() =>
                  router.push(
                    `/procurement?new=true&productId=${product.id}&qty=${suggestedPurchaseQty}`
                  )
                }
                className="bg-[#E2661D] hover:bg-[#E2661D]/90 text-white font-bold gap-2 text-xs h-9 px-4 rounded-xl shadow-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                Fazer Pedido de Compra
              </Button>
              {canManageStock && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setMovementForm({ ...emptyMovement, type: MovementType.ENTRY });
                    setIsMovementOpen(true);
                  }}
                  className="font-bold gap-2 text-xs h-9 px-3.5 rounded-xl border-amber-300 text-amber-900 bg-white hover:bg-amber-100/60 dark:bg-card dark:text-amber-200"
                >
                  <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                  Registrar Entrada
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/70 p-1 rounded-xl">
          <TabsTrigger value="detalhes" className="rounded-lg font-semibold text-xs">
            Visão Geral & Cadastro
          </TabsTrigger>
          <TabsTrigger value="estoque" className="rounded-lg font-semibold text-xs flex items-center gap-1.5">
            Saldo & Movimentações
            {isLowStock && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: Visão Geral & Cadastro */}
        <TabsContent value="detalhes" className="mt-4 space-y-4">
          {/* Card 1: Situação do Estoque na aba de Detalhes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 flex items-center gap-3.5">
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                isLowStock ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              )}>
                <Boxes className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Saldo Físico Atual
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={cn(
                    "text-2xl font-black",
                    isLowStock ? "text-rose-600" : "text-foreground"
                  )}>
                    {currentStock}
                  </span>
                  <span className="text-xs text-muted-foreground font-bold">{product.unit || 'UN'}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Estoque Mínimo
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-foreground">
                    {minStock}
                  </span>
                  <span className="text-xs text-muted-foreground font-bold">{product.unit || 'UN'}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-3.5">
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                isLowStock ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
              )}>
                {isLowStock ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Status Operacional
                </span>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1",
                  isLowStock
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                )}>
                  {isLowStock ? 'Reposição Necessária' : 'Estoque Regular'}
                </span>
              </div>
            </Card>
          </div>

          {/* Card 2: Especificações Técnicas e Cadastrais */}
          <Card className="p-6">
            <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600" />
              Especificações do Produto
            </div>
            {product.photoUrl && (
              <AuthImage
                src={product.photoUrl}
                alt={product.name}
                className="h-28 rounded-xl border object-cover mb-4"
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FieldBlock label="Unidade de Medida" value={product.unit || 'UN'} />
              <FieldBlock
                label="Localização no Almoxarifado"
                value={product.location?.code || 'Central / Prateleira Geral'}
              />
              <FieldBlock
                label="Código de Barras / EAN"
                value={product.barcode || 'Não cadastrado'}
              />
              <FieldBlock
                label="Categoria / Tipo"
                value={product.category || 'Peça / Componente Geral'}
              />
              <div className="md:col-span-2">
                <FieldBlock
                  label="Descrição / Aplicação Técnica"
                  value={
                    product.description?.trim()
                      ? product.description
                      : 'Item de catálogo para aplicação técnica e manutenção em grupos geradores.'
                  }
                />
              </div>
            </div>

            {/* Valores Monetários (Apenas usuários autorizados) */}
            {canViewValues && (
              <div className="mt-6 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FieldBlock
                  label="Preço de Custo Médio"
                  value={product.unitPrice ? formatCurrency(product.unitPrice) : 'Não informado'}
                />
                <FieldBlock
                  label="Preço de Venda / Tabela"
                  value={product.salePrice ? formatCurrency(product.salePrice) : 'Não informado'}
                />
                <FieldBlock
                  label="Margem Bruta Estimada"
                  value={
                    product.marginPercent
                      ? `${product.marginPercent}%`
                      : product.unitPrice && product.salePrice
                      ? `${Math.round(((product.salePrice - product.unitPrice) / product.salePrice) * 100)}%`
                      : '—'
                  }
                />
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ABA 2: Saldo & Movimentações */}
        <TabsContent value="estoque" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center justify-center gap-2">
                <Layers className="h-4 w-4 text-amber-600" />
                Nível de Estoque Físico
              </div>
              <div
                className={`text-5xl font-black mb-1 ${
                  isLowStock ? 'text-status-red-fg' : 'text-amber-600'
                }`}
              >
                {product.currentStock}
              </div>
              <p className="text-text-muted font-bold uppercase tracking-widest text-[11px] mb-5">
                {product.unit} em estoque
              </p>

              <div className="pt-5 border-t border-border space-y-3 text-left">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-text-secondary font-medium">Estoque Mínimo de Segurança</span>
                  <span className="font-bold text-foreground">
                    {product.minStock} {product.unit}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isLowStock ? 'bg-status-red-fg' : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (product.currentStock / Math.max(1, product.minStock * 2)) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                  <History className="h-4 w-4 text-amber-600" />
                  Movimentações do Mês
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-status-green-fg" />
                      <span className="text-[13px] text-text-secondary">Entradas no Mês</span>
                    </div>
                    <span className="font-bold text-foreground">+{monthEntries} {product.unit}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-status-red-fg" />
                      <span className="text-[13px] text-text-secondary">Saídas no Mês</span>
                    </div>
                    <span className="font-bold text-foreground">-{monthExits} {product.unit}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex flex-col gap-2">
                <Button
                  onClick={() =>
                    router.push(
                      `/procurement?new=true&productId=${product.id}&qty=${suggestedPurchaseQty}`
                    )
                  }
                  className="w-full bg-[#E2661D] hover:bg-[#E2661D]/90 text-white rounded-xl font-bold gap-2 text-xs h-9"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Comprar / Pedido de Reposição
                </Button>
                {canManageStock && (
                  <Button
                    onClick={() => {
                      setMovementForm(emptyMovement);
                      setIsMovementOpen(true);
                    }}
                    variant="outline"
                    className="w-full rounded-xl font-bold gap-2 text-xs h-9"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    Registrar Movimentação Manual
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Tabela de Kardex */}
          <Card className="overflow-hidden mt-4">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="text-[13.5px] font-bold text-foreground">
                Kardex (Histórico de Movimentações)
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {movements.length} registro{movements.length === 1 ? '' : 's'}
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-t-0 hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  {canViewValues && <TableHead className="text-right">Custo Unit.</TableHead>}
                  <TableHead>Motivo</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableEmpty
                    colSpan={canViewValues ? 6 : 5}
                    message="Nenhuma movimentação registrada ainda para este produto."
                  />
                ) : (
                  paginatedMovements.map((m) => {
                    const inbound = INBOUND_TYPES.includes(m.type);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-[12.5px] text-text-secondary whitespace-nowrap">
                          {formatDateTime(m.createdAt)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2 py-0.5 rounded-full ${
                              inbound
                                ? 'bg-status-green-bg text-status-green-fg'
                                : 'bg-status-red-bg text-status-red-fg'
                            }`}
                          >
                            {inbound ? (
                              <ArrowUpCircle className="h-3 w-3" />
                            ) : (
                              <ArrowDownCircle className="h-3 w-3" />
                            )}
                            {MOVEMENT_TYPE_LABELS[m.type]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">
                          {inbound ? '+' : '-'}
                          {m.quantity} {product.unit}
                        </TableCell>
                        {canViewValues && (
                          <TableCell className="text-right text-[12.5px] text-text-secondary">
                            {m.unitCost ? formatCurrency(m.unitCost) : '-'}
                          </TableCell>
                        )}
                        <TableCell className="text-[12.5px] text-text-secondary">
                          {m.reason || '-'}
                        </TableCell>
                        <TableCell className="text-[12.5px] text-text-secondary">
                          {m.createdBy?.name || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Paginação do Kardex */}
            {movements.length > 0 && (
              <div className="px-5 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/15">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Exibindo {(movementsPage - 1) * pageSize + 1} a{' '}
                    {Math.min(movementsPage * pageSize, movements.length)} de {movements.length} registro{movements.length === 1 ? '' : 's'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>Linhas:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setMovementsPage(1);
                      }}
                      className="h-7 text-xs rounded border border-border bg-background px-1.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <Pagination
                  currentPage={movementsPage}
                  totalPages={totalMovementPages}
                  onPageChange={setMovementsPage}
                  className="py-0"
                />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Movimentação */}
      <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de Movimentação</Label>
              <Select
                value={movementForm.type}
                onValueChange={(v) =>
                  setMovementForm((prev) => ({ ...prev, type: v as MovementType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MovementType.ENTRY}>
                    {MOVEMENT_TYPE_LABELS[MovementType.ENTRY]} (Recebimento / Compra)
                  </SelectItem>
                  <SelectItem value={MovementType.EXIT}>
                    {MOVEMENT_TYPE_LABELS[MovementType.EXIT]} (Consumo / Baixa)
                  </SelectItem>
                  <SelectItem value={MovementType.ADJUSTMENT_IN}>
                    {MOVEMENT_TYPE_LABELS[MovementType.ADJUSTMENT_IN]} (Inventário Positivo)
                  </SelectItem>
                  <SelectItem value={MovementType.ADJUSTMENT_OUT}>
                    {MOVEMENT_TYPE_LABELS[MovementType.ADJUSTMENT_OUT]} (Inventário Negativo)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={canViewValues ? "grid grid-cols-2 gap-4" : "space-y-1.5"}>
              <div className="space-y-1.5">
                <Label>Quantidade ({product.unit})</Label>
                <Input
                  type="number"
                  min={1}
                  value={movementForm.quantity}
                  onChange={(e) =>
                    setMovementForm((prev) => ({ ...prev, quantity: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              {canViewValues && (
                <div className="space-y-1.5">
                  <Label>Custo Unit. (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={movementForm.unitCost}
                    onChange={(e) =>
                      setMovementForm((prev) => ({ ...prev, unitCost: e.target.value }))
                    }
                    placeholder="0,00"
                  />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Motivo / Observação</Label>
              <Input
                value={movementForm.reason}
                onChange={(e) =>
                  setMovementForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Ex: reposição de estoque, contagem física..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMovementOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateMovement}
              disabled={submittingMovement}
            >
              {submittingMovement ? 'Salvando...' : 'Registrar Movimentação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
