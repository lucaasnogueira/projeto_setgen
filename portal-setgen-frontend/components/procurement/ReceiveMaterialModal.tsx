"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Barcode,
  Search,
  CheckCircle2,
  PackageCheck,
  Truck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Upload,
  AlertCircle,
  FileText,
  Boxes,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { procurementOrdersApi } from "@/lib/api/procurement-orders";
import { ProcurementOrder, ProcurementOrderStatus } from "@/types";
import { formatDate } from "@/lib/utils";

interface ReceiveMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialOrderId?: string;
}

export function ReceiveMaterialModal({
  isOpen,
  onClose,
  onSuccess,
  initialOrderId,
}: ReceiveMaterialModalProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProcurementOrder | null>(null);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAccessKey, setInvoiceAccessKey] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<{
    nfNumber?: string;
    cnpj?: string;
    uf?: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setBarcodeInput("");
      setParsedInfo(null);
      setInvoiceFile(null);
      loadPendingOrders();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, initialOrderId]);

  const loadPendingOrders = async (query?: string) => {
    try {
      setSearching(true);
      const data = await procurementOrdersApi.getAll({
        search: query?.trim() || undefined,
      });

      // Prioriza pedidos que ainda não foram recebidos
      const pending = data.filter(
        (o) => o.status !== ProcurementOrderStatus.RECEIVED && o.status !== ProcurementOrderStatus.CANCELLED
      );
      setOrders(pending);

      if (initialOrderId) {
        const found = data.find((o) => o.id === initialOrderId);
        if (found) handleSelectOrder(found);
      }
    } catch (err) {
      console.error("Erro ao buscar pedidos para recebimento:", err);
      toast.error("Erro ao listar pedidos de compra.");
    } finally {
      setSearching(false);
    }
  };

  const parseDanfeKey = (key: string) => {
    const clean = key.replace(/\D/g, "");
    if (clean.length === 44) {
      const ufCode = clean.substring(0, 2);
      const cnpj = clean.substring(6, 20);
      const rawNf = clean.substring(25, 34);
      const nfNum = String(parseInt(rawNf, 10));

      const formattedCnpj = cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
      );

      return {
        nfNumber: nfNum,
        cnpj: formattedCnpj,
        cleanCnpj: cnpj,
        uf: ufCode,
        key: clean,
      };
    }
    return null;
  };

  const handleBarcodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    const parsed = parseDanfeKey(raw);
    if (parsed) {
      setParsedInfo({
        nfNumber: parsed.nfNumber,
        cnpj: parsed.cnpj,
        uf: parsed.uf,
      });
      setInvoiceAccessKey(parsed.key);
      if (parsed.nfNumber) setInvoiceNumber(parsed.nfNumber);
      toast.info(`DANFE Bipado: NF nº ${parsed.nfNumber} detectada!`);
    }

    try {
      setSearching(true);
      const results = await procurementOrdersApi.getAll({ search: raw });
      const pending = results.filter(
        (o) => o.status !== ProcurementOrderStatus.RECEIVED && o.status !== ProcurementOrderStatus.CANCELLED
      );

      if (pending.length === 1) {
        handleSelectOrder(pending[0], parsed);
        toast.success(`Pedido #${pending[0].id.substring(0, 8)} localizado automaticamente!`);
      } else if (pending.length > 1) {
        setOrders(pending);
        toast.info(`${pending.length} pedidos encontrados para este código. Selecione abaixo.`);
      } else {
        // Tenta ver se já foi recebido antes
        const alreadyReceived = results.find(
          (o) => o.status === ProcurementOrderStatus.RECEIVED
        );
        if (alreadyReceived) {
          toast.warning(`Este pedido ou NF já foi recebido no estoque anteriormente (#${alreadyReceived.id.substring(0, 8)}).`);
        } else {
          toast.error("Nenhum pedido de compra pendente encontrado para esta chave/código.");
        }
      }
    } catch (err) {
      toast.error("Erro ao pesquisar pedido.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectOrder = (
    order: ProcurementOrder,
    customParsed?: ReturnType<typeof parseDanfeKey>
  ) => {
    setSelectedOrder(order);
    setInvoiceNumber(order.invoiceNumber || customParsed?.nfNumber || invoiceNumber || "");
    setInvoiceAccessKey(order.invoiceAccessKey || customParsed?.key || invoiceAccessKey || "");

    // Inicializa quantidades recebidas com as quantidades compradas do pedido
    const initialQty: Record<string, number> = {};
    order.items?.forEach((item) => {
      initialQty[item.id] = item.quantity;
    });
    setReceivedQuantities(initialQty);
  };

  const handleQuantityChange = (itemId: string, value: number) => {
    setReceivedQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, value),
    }));
  };

  const handleConfirmReceive = async () => {
    if (!selectedOrder) return;

    try {
      setSubmitting(true);

      // 1. Verifica se houve divergência de quantidade física na conferência
      const hasQtyChanges = selectedOrder.items?.some(
        (it) => receivedQuantities[it.id] !== undefined && receivedQuantities[it.id] !== it.quantity
      );

      const itemsPayload = hasQtyChanges
        ? selectedOrder.items?.map((it) => ({
            productId: it.productId,
            requestedQuantity: it.requestedQuantity ?? it.quantity,
            quantity: receivedQuantities[it.id] !== undefined ? receivedQuantities[it.id] : it.quantity,
            unitCost: Number(it.unitCost || 0),
          }))
        : undefined;

      // 2. Atualiza dados fiscais e quantidades conferidas no pedido
      const shouldUpdateOrder =
        invoiceNumber !== selectedOrder.invoiceNumber ||
        invoiceAccessKey !== selectedOrder.invoiceAccessKey ||
        hasQtyChanges;

      if (shouldUpdateOrder) {
        await procurementOrdersApi.update(selectedOrder.id, {
          invoiceNumber: invoiceNumber.trim() || undefined,
          invoiceAccessKey: invoiceAccessKey.trim() || undefined,
          ...(itemsPayload && { items: itemsPayload }),
        });
      }

      // 2. Se anexou arquivo físico da NF, faz o upload
      if (invoiceFile) {
        try {
          await procurementOrdersApi.uploadInvoice(selectedOrder.id, invoiceFile);
        } catch (uploadErr) {
          console.error("Aviso: falha ao anexar arquivo da NF", uploadErr);
        }
      }

      // 3. Atualiza o status para RECEIVED (gera movimento de entrada ENTRY e reserva a OS)
      await procurementOrdersApi.updateStatus(
        selectedOrder.id,
        ProcurementOrderStatus.RECEIVED
      );

      toast.success(
        `Material recebido com sucesso! Entrada física registrada no estoque.`
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao dar baixa no recebimento:", err);
      toast.error(
        err.response?.data?.message || "Erro ao confirmar recebimento do material."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Barcode className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Recebimento de Material / Bipagem de NF
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold">
                  Almoxarifado
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Bipe o código de barras do DANFE (44 dígitos) ou digite o nº da NF/Pedido para dar entrada automática no estoque.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ÁREA DE BIPAGEM / SCANNER COM FOCO RÁPIDO */}
        <div className="bg-emerald-50/70 border-2 border-dashed border-emerald-300 rounded-xl p-4 mt-2">
          <form onSubmit={handleBarcodeSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Leitor Óptico / Pistola USB & Digitação Rápida
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                Pressione Enter após bipar
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
                <Input
                  ref={inputRef}
                  value={barcodeInput}
                  onChange={(e) => {
                    setBarcodeInput(e.target.value);
                    if (e.target.value.replace(/\D/g, "").length === 44) {
                      const parsed = parseDanfeKey(e.target.value);
                      if (parsed) {
                        setParsedInfo(parsed);
                        setInvoiceAccessKey(parsed.key);
                        if (parsed.nfNumber) setInvoiceNumber(parsed.nfNumber);
                      }
                    }
                  }}
                  placeholder="Aponte o leitor aqui ou digite Chave de 44 dígitos / Nº da NF..."
                  className="pl-11 h-12 bg-white text-sm font-mono border-emerald-300 focus-visible:ring-emerald-500 shadow-xs"
                />
              </div>
              <Button
                type="submit"
                disabled={searching || !barcodeInput.trim()}
                className="h-12 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Buscar</span>
              </Button>
            </div>

            {parsedInfo && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-emerald-900 bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                  NF-e Identificada
                </Badge>
                <span>
                  <strong>Nº NF:</strong> {parsedInfo.nfNumber}
                </span>
                <span>•</span>
                <span>
                  <strong>CNPJ Emitente:</strong> {parsedInfo.cnpj}
                </span>
                <span>•</span>
                <span>
                  <strong>UF:</strong> {parsedInfo.uf}
                </span>
              </div>
            )}
          </form>
        </div>

        {/* ETAPA DE CONFERÊNCIA OU LISTAGEM DE PEDIDOS PENDENTES */}
        {!selectedOrder ? (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" />
                Pedidos Aguardando Entrega / Recebimento ({orders.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadPendingOrders()}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Atualizar lista
              </Button>
            </div>

            {searching ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mr-2" />
                <span>Buscando pedidos...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center p-8 bg-muted/20 border border-dashed rounded-xl">
                <PackageCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-foreground">
                  Nenhum pedido de compra aguardando recebimento no momento.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos os pedidos emitidos já deram entrada no estoque ou estão em cotação.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className="p-3.5 bg-card hover:bg-muted/40 border border-border rounded-xl flex items-center justify-between cursor-pointer transition-all hover:border-emerald-400 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          Pedido #{order.id.substring(0, 8)}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                          {order.status === ProcurementOrderStatus.AWAITING_DELIVERY
                            ? "Aguardando Entrega"
                            : "Pedido Emitido"}
                        </Badge>
                        {order.invoiceNumber && (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-800 border-blue-300">
                            NF {order.invoiceNumber}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {order.supplier?.name || "Fornecedor não informado"}
                        </span>
                        {order.materialRequest?.serviceOrder && (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <Layers className="h-3 w-3" />
                            OS #{order.materialRequest.serviceOrder.orderNumber} (
                            {order.materialRequest.serviceOrder.client?.tradeName ||
                              order.materialRequest.serviceOrder.client?.companyName}
                            )
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Boxes className="h-3 w-3" />
                          {order.items?.length || 0} itens
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 group-hover:scale-105 transition-transform"
                    >
                      <span>Conferir & Receber</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TELA DE CONFERÊNCIA DO PEDIDO SELECIONADO */
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    Conferindo Pedido #{selectedOrder.id.substring(0, 8)}
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                    {selectedOrder.supplier?.name || "Fornecedor"}
                  </Badge>
                </div>
                {selectedOrder.materialRequest?.serviceOrder && (
                  <p className="text-xs text-primary font-medium">
                    Vinculado à OS #{selectedOrder.materialRequest.serviceOrder.orderNumber} —{" "}
                    {selectedOrder.materialRequest.serviceOrder.client?.tradeName ||
                      selectedOrder.materialRequest.serviceOrder.client?.companyName}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="text-xs h-8"
              >
                Trocar Pedido
              </Button>
            </div>

            {/* TABELA DE CONFERÊNCIA DOS ITENS FÍSICOS */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Boxes className="h-4 w-4 text-emerald-600" />
                Conferência Física dos Itens (Caixa / Galpão)
              </span>

              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="grid grid-cols-12 gap-2 bg-muted/60 p-2.5 text-[11px] font-bold text-muted-foreground uppercase border-b border-border">
                  <div className="col-span-6">Peça / Produto</div>
                  <div className="col-span-3 text-center">Qtd Comprada</div>
                  <div className="col-span-3 text-right">Qtd Recebida</div>
                </div>

                <div className="divide-y divide-border max-h-[220px] overflow-y-auto">
                  {selectedOrder.items?.map((item) => {
                    const received = receivedQuantities[item.id] ?? item.quantity;
                    const isFull = received >= item.quantity;

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-muted/20 text-xs"
                      >
                        <div className="col-span-6 space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {item.product?.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            SKU: {item.product?.code || "S/N"}
                          </p>
                        </div>

                        <div className="col-span-3 text-center">
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.quantity} un
                          </Badge>
                        </div>

                        <div className="col-span-3 flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            min={0}
                            value={received}
                            onChange={(e) =>
                              handleQuantityChange(item.id, Number(e.target.value))
                            }
                            className={`w-20 h-8 text-right font-mono text-xs font-bold ${
                              isFull
                                ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                                : "border-amber-400 bg-amber-50 text-amber-900"
                            }`}
                          />
                          {isFull ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DADOS FISCAIS E ANEXO DE NOTA FISCAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border border-border">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Número da Nota Fiscal (NF)
                </label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex: 004921"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Barcode className="h-3.5 w-3.5 text-muted-foreground" />
                  Chave de Acesso (44 dígitos DANFE)
                </label>
                <Input
                  value={invoiceAccessKey}
                  onChange={(e) => setInvoiceAccessKey(e.target.value)}
                  placeholder="Ex: 352310..."
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                  Anexar Nota Fiscal (PDF, XML ou Foto da entrega)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.xml,image/*"
                    onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                    className="h-9 text-xs cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
                  />
                  {invoiceFile && (
                    <Badge variant="outline" className="text-xs text-emerald-800 bg-emerald-50 border-emerald-300">
                      {invoiceFile.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* BOTÕES DE FINALIZAÇÃO */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="text-xs"
              >
                Voltar à Lista
              </Button>

              <Button
                onClick={handleConfirmReceive}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl shadow-xs gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Lançando no Estoque...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Confirmar Entrada no Estoque</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

