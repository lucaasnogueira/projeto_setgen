"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { suppliersApi } from "@/lib/api/suppliers";
import { usersApi } from "@/lib/api/users";
import { inventoryApi } from "@/lib/api/inventory";
import { ordersApi } from "@/lib/api/orders";
import {
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  User,
  Product,
  ServiceOrder,
} from "@/types";
import {
  Building2,
  User as UserIcon,
  Truck,
  Package,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  FileText,
  Search,
  Check,
  AlertCircle,
  Copy,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { toDateInputValue } from "@/lib/date";
import { toast } from "sonner";

interface PurchaseOrderFormProps {
  initialData?: Partial<PurchaseOrder>;
  onSubmit: (data: Partial<PurchaseOrder>, openPrintAfter?: boolean) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

const COMMON_PAYMENT_METHODS = [
  "Boleto Faturado Setgen (28 Dias)",
  "Boleto Faturado (15/30 Dias)",
  "Boleto Faturado (30/60 Dias)",
  "Cartão Corporativo Setgen",
  "PIX / À Vista no Balcão",
  "Conta Corrente Loja / Faturado Mensal",
  "Dinheiro em Espécie",
];

const COMMON_VEHICLES = [
  "Fiat Strada Branca - Placa OAA-1234",
  "Saveiro Prata - Placa PHB-5678",
  "Hilux Operações - Placa JXY-9012",
  "Veículo Próprio do Técnico",
  "A pé / Loja Próxima",
];

export function PurchaseOrderForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}: PurchaseOrderFormProps) {
  const router = useRouter();

  // Lookups
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [productsCatalog, setProductsCatalog] = useState<Product[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);

  // Form Fields
  const [orderNumber, setOrderNumber] = useState(initialData?.orderNumber || "");
  const [supplierName, setSupplierName] = useState(initialData?.supplierName || "");
  const [supplierCnpj, setSupplierCnpj] = useState(initialData?.supplierCnpj || "");
  const [supplierPhone, setSupplierPhone] = useState(initialData?.supplierPhone || "");
  const [supplierAddress, setSupplierAddress] = useState(initialData?.supplierAddress || "");
  const [supplierId, setSupplierId] = useState(initialData?.supplierId || "");

  const [carrierName, setCarrierName] = useState(initialData?.carrierName || "");
  const [carrierDoc, setCarrierDoc] = useState(initialData?.carrierDoc || "");
  const [carrierVehicle, setCarrierVehicle] = useState(initialData?.carrierVehicle || "");

  const [destination, setDestination] = useState(initialData?.destination || "");
  const [serviceOrderId, setServiceOrderId] = useState(initialData?.serviceOrderId || "");
  const [paymentMethod, setPaymentMethod] = useState(
    initialData?.paymentMethod || COMMON_PAYMENT_METHODS[0]
  );
  const [issueDate, setIssueDate] = useState(
    toDateInputValue(initialData?.issueDate) || toDateInputValue(new Date().toISOString())
  );
  const [pickupDate, setPickupDate] = useState(toDateInputValue(initialData?.pickupDate) || "");
  const [pickupStatus, setPickupStatus] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED'>(
    initialData?.pickupStatus || 'PENDING'
  );
  const [notes, setNotes] = useState(
    initialData?.notes ||
      "Mercadoria autorizada pela Diretoria de Compras da Setgen. Entregar apenas para o portador identificado acima mediante documento com foto."
  );

  // Items (inicia vazio por padrão se for novo, sem linha fantasma)
  const [items, setItems] = useState<PurchaseOrderItem[]>(
    Array.isArray(initialData?.items) && initialData!.items.length > 0
      ? initialData!.items
      : []
  );

  // Modal de Seleção Múltipla do Estoque
  const [showMultiPickerModal, setShowMultiPickerModal] = useState(false);
  const [multiPickerSearch, setMultiPickerSearch] = useState("");
  const [multiSelectedMap, setMultiSelectedMap] = useState<Record<string, { selected: boolean; qty: number }>>({});

  useEffect(() => {
    // Carregar lookups auxiliares
    Promise.all([
      suppliersApi.getAll().catch(() => []),
      usersApi.getAll().catch(() => []),
      inventoryApi.getAll().catch(() => []),
      ordersApi.getAll().catch(() => []),
    ]).then(([sups, usrs, prods, ords]) => {
      setSuppliers(sups);
      setTechnicians(usrs.filter((u: any) => u.active));
      setProductsCatalog(prods);
      setServiceOrders(ords);
    });
  }, []);

  const handleSupplierSelect = (id: string) => {
    setSupplierId(id);
    const found = suppliers.find((s) => s.id === id);
    if (found) {
      setSupplierName(found.name);
      if (found.cnpj) setSupplierCnpj(found.cnpj);
      if (found.phone) setSupplierPhone(found.phone);
      if (found.email) setSupplierPhone((prev) => prev || found.email || "");
    }
  };

  const handleCarrierSelect = (name: string) => {
    setCarrierName(name);
  };

  const handleServiceOrderSelect = (soId: string) => {
    setServiceOrderId(soId);
    const found = serviceOrders.find((s) => s.id === soId);
    if (found) {
      setDestination(`OS #${found.orderNumber || soId.slice(0, 8)} - ${found.client?.companyName || "Cliente"}`);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", code: "", quantity: 1, unit: "UN", unitPrice: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const cur = { ...updated[index], [field]: value };
      const qty = Number(cur.quantity || 1);
      const price = Number(cur.unitPrice || 0);
      cur.total = qty * price;
      updated[index] = cur;
      return updated;
    });
  };

  // Abrir modal de seleção de estoque sincronizado com os itens já presentes
  const handleOpenMultiPicker = () => {
    const initialMap: Record<string, { selected: boolean; qty: number }> = {};
    items.forEach((it) => {
      const found = productsCatalog.find(
        (p) =>
          p.name.trim().toLowerCase() === it.description.trim().toLowerCase() ||
          (it.code && p.code && p.code.trim().toLowerCase() === it.code.trim().toLowerCase())
      );
      if (found) {
        initialMap[found.id] = { selected: true, qty: it.quantity || 1 };
      }
    });
    setMultiSelectedMap(initialMap);
    setMultiPickerSearch("");
    setShowMultiPickerModal(true);
  };

  // Confirmar itens selecionados do modal do estoque
  const handleConfirmMultiPicker = () => {
    const selectedEntries = Object.entries(multiSelectedMap).filter(([_, val]) => val.selected);
    if (selectedEntries.length === 0) {
      toast.info("Nenhum material selecionado.");
      setShowMultiPickerModal(false);
      return;
    }

    const newItems: PurchaseOrderItem[] = [];
    selectedEntries.forEach(([prodId, val]) => {
      const prod = productsCatalog.find((p) => p.id === prodId);
      if (prod) {
        const qty = Math.max(1, val.qty || 1);
        const price = Number(prod.unitCost ?? prod.salePrice ?? 0);
        newItems.push({
          description: prod.name,
          code: prod.code || "",
          quantity: qty,
          unit: prod.unit || "UN",
          unitPrice: price,
          total: qty * price,
        });
      }
    });

    // Preserva itens avulsos que não pertenciam ao catálogo
    const nonCatalogExisting = items.filter(
      (it) =>
        it.description.trim() !== "" &&
        !productsCatalog.some(
          (p) => p.name.trim().toLowerCase() === it.description.trim().toLowerCase()
        )
    );

    setItems([...nonCatalogExisting, ...newItems]);
    setShowMultiPickerModal(false);
    toast.success(`${newItems.length} material(is) selecionado(s) do estoque com sucesso!`);
  };

  const totalAmount = items.reduce(
    (acc, it) => acc + (Number(it.quantity || 1) * Number(it.unitPrice || 0)),
    0
  );

  const handleSubmit = (openPrint: boolean = false) => {
    if (!supplierName.trim()) {
      toast.error("Informe o nome da loja ou fornecedor.");
      return;
    }
    if (!carrierName.trim()) {
      toast.error("Informe o nome do portador que irá retirar o material na loja.");
      return;
    }
    const validItems = items.filter((it) => it.description.trim().length > 0);
    if (validItems.length === 0) {
      toast.error("Adicione ao menos um material ou peça para retirada.");
      return;
    }

    const payload: Partial<PurchaseOrder> = {
      orderNumber: orderNumber.trim() || undefined,
      supplierName: supplierName.trim(),
      supplierCnpj: supplierCnpj.trim() || undefined,
      supplierPhone: supplierPhone.trim() || undefined,
      supplierAddress: supplierAddress.trim() || undefined,
      supplierId: supplierId || undefined,
      carrierName: carrierName.trim(),
      carrierDoc: carrierDoc.trim() || undefined,
      carrierVehicle: carrierVehicle.trim() || undefined,
      destination: destination.trim() || undefined,
      serviceOrderId: serviceOrderId || undefined,
      paymentMethod: paymentMethod.trim() || undefined,
      items: validItems,
      totalAmount,
      value: totalAmount,
      issueDate: issueDate ? new Date(issueDate).toISOString() : new Date().toISOString(),
      pickupDate: pickupDate ? new Date(pickupDate).toISOString() : undefined,
      pickupStatus,
      notes: notes.trim() || undefined,
    };

    onSubmit(payload, openPrint);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      {/* 1. SEÇÃO: FORNECEDOR / LOJA */}
      <Card className="rounded-xl border border-gray-200/75 p-4 sm:p-5 shadow-2xs bg-white space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
          <Building2 className="w-4 h-4 text-orange-600 shrink-0" />
          <div>
            <h3 className="text-xs sm:text-[13px] font-bold text-gray-900">
              1. Dados da Loja ou Fornecedor
            </h3>
            <p className="text-[11px] text-gray-400">
              Local onde a equipe Setgen irá retirar as peças ou materiais
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Fornecedor Cadastrado (Opcional)
            </Label>
            <select
              value={supplierId}
              onChange={(e) => handleSupplierSelect(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 rounded-lg border border-gray-200 outline-none"
            >
              <option value="">Digitar loja avulsa...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.cnpj ? `(${s.cnpj})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Nome da Loja / Razão Social *
            </Label>
            <Input
              placeholder="Ex: Distribuidora Elétrica Amazonas, Auto Peças Líder..."
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="h-9 text-xs bg-white rounded-lg border-gray-200 font-medium"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              CNPJ da Loja (Opcional)
            </Label>
            <Input
              placeholder="00.000.000/0000-00"
              value={supplierCnpj}
              onChange={(e) => setSupplierCnpj(e.target.value)}
              className="h-9 text-xs bg-white rounded-lg border-gray-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Telefone / Vendedor na Loja
            </Label>
            <Input
              placeholder="Ex: (92) 3301-4400 / Falar c/ Marcos"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              className="h-9 text-xs bg-white rounded-lg border-gray-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Endereço / Unidade da Loja
            </Label>
            <Input
              placeholder="Ex: Av. Tefé, 450 - Cachoeirinha"
              value={supplierAddress}
              onChange={(e) => setSupplierAddress(e.target.value)}
              className="h-9 text-xs bg-white rounded-lg border-gray-200"
            />
          </div>
        </div>
      </Card>

      {/* 2. SEÇÃO: QUEM VAI RETIRAR (PORTADOR) */}
      <Card className="rounded-xl border border-orange-200/90 p-4 sm:p-5 shadow-2xs bg-orange-50/15 space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-orange-200/60">
          <UserIcon className="w-4 h-4 text-orange-600 shrink-0" />
          <div>
            <h3 className="text-xs sm:text-[13px] font-bold text-gray-900">
              2. Portador Autorizado a Retirar na Loja
            </h3>
            <p className="text-[11px] text-orange-950/70">
              Dados do técnico, motorista ou funcionário autorizado a retirar o material no balcão
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Equipe / Técnico Setgen (Opcional)
            </Label>
            <select
              onChange={(e) => handleCarrierSelect(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white rounded-lg border border-gray-200 outline-none"
            >
              <option value="">Selecionar técnico/colaborador...</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.jobTitle || t.role})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Nome Completo do Portador *
            </Label>
            <Input
              placeholder="Ex: Lucas Silva (Técnico Mecânico) ou Marcos Motorista"
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              className="h-9 text-xs bg-white rounded-lg border-gray-200 font-bold text-gray-900"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Documento do Portador (CPF ou RG)
            </Label>
            <Input
              placeholder="Ex: 000.000.000-00 ou RG 1234567-8"
              value={carrierDoc}
              onChange={(e) => setCarrierDoc(e.target.value)}
              className="h-9 text-xs bg-white rounded-lg border-gray-200"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">
              Apresentar documento original com foto no balcão
            </span>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Veículo / Placa (Opcional)
            </Label>
            <select
              value={carrierVehicle}
              onChange={(e) => setCarrierVehicle(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white rounded-lg border border-gray-200 outline-none mb-1.5"
            >
              <option value="">Selecionar da frota...</option>
              {COMMON_VEHICLES.map((v, idx) => (
                <option key={idx} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <Input
              placeholder="Ou digite o veículo/placa..."
              value={carrierVehicle}
              onChange={(e) => setCarrierVehicle(e.target.value)}
              className="h-7.5 text-[11px] bg-white rounded-md border-gray-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Previsão de Retirada
            </Label>
            <Input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="h-9 text-xs bg-white rounded-lg border-gray-200"
            />
          </div>
        </div>
      </Card>

      {/* 3. SEÇÃO: DESTINO & FORMA DE FATURAMENTO */}
      <Card className="rounded-xl border border-gray-200/75 p-4 sm:p-5 shadow-2xs bg-white space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
          <Truck className="w-4 h-4 text-orange-600 shrink-0" />
          <div>
            <h3 className="text-xs sm:text-[13px] font-bold text-gray-900">
              3. Vínculo Operacional & Faturamento
            </h3>
            <p className="text-[11px] text-gray-400">
              Para qual serviço ou ordem é esse material e como a loja irá faturar para a Setgen
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Vincular a Ordem de Serviço (O.S.)
            </Label>
            <select
              value={serviceOrderId}
              onChange={(e) => handleServiceOrderSelect(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 rounded-lg border border-gray-200 outline-none"
            >
              <option value="">Sem vínculo com O.S. (Geral)</option>
              {serviceOrders.map((so) => (
                <option key={so.id} value={so.id}>
                  OS #{so.orderNumber || so.id.slice(0, 6)} - {so.client?.companyName || "Cliente"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Aplicação / Destino do Material
            </Label>
            <Input
              placeholder="Ex: OS #1024 - Manutenção Preventiva Gerador 500kVA"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-9 text-xs bg-white rounded-lg border-gray-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700 block mb-1">
              Forma de Pagamento / Faturamento na Loja
            </Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white rounded-lg border border-gray-200 outline-none font-medium text-gray-900"
            >
              {COMMON_PAYMENT_METHODS.map((pm, idx) => (
                <option key={idx} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* 4. SEÇÃO: MATERIAIS / PEÇAS A RETIRAR */}
      <Card className="rounded-xl border border-gray-200/75 p-4 sm:p-5 shadow-2xs bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-600 shrink-0" />
            <div>
              <h3 className="text-xs sm:text-[13px] font-bold text-gray-900">
                4. Lista de Materiais e Peças a Retirar ({items.length})
              </h3>
              <p className="text-[11px] text-gray-400">
                Especifique os itens que o portador está autorizado a pegar na loja
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleOpenMultiPicker}
              className="h-7.5 px-3 gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-bold shadow-2xs rounded-lg"
            >
              <Layers className="w-3.5 h-3.5" />
              Selecionar do Estoque
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddItem}
              className="h-7.5 px-3 gap-1.5 text-xs font-semibold rounded-lg border-gray-200"
            >
              <Plus className="w-3.5 h-3.5" />
              + Item Avulso
            </Button>
          </div>
        </div>

        {/* Gatilho rápido para abrir a seleção múltipla do catálogo */}
        <button
          type="button"
          onClick={handleOpenMultiPicker}
          className="w-full text-left p-2.5 bg-slate-50 hover:bg-orange-50/50 border border-dashed border-gray-300 hover:border-orange-400 rounded-lg flex items-center justify-between transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform">
              <Search className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 group-hover:text-orange-700">
                Puxar Peças e Materiais do Catálogo de Estoque
              </p>
              <p className="text-[11px] text-gray-500">
                Clique aqui para pesquisar por nome ou código e marcar múltiplos produtos com quantidade
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-orange-600 bg-white px-2.5 py-1 rounded-md border border-orange-200 shadow-2xs group-hover:bg-orange-600 group-hover:text-white transition-colors">
            Abrir Estoque
          </span>
        </button>

        {/* Estado Vazio ou Tabela de Itens */}
        {items.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-gray-200 rounded-lg bg-slate-50/50">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-gray-700">Nenhum material adicionado ainda (0)</p>
            <p className="text-[11px] text-gray-500 mb-3 max-w-md mx-auto">
              Selecione as peças necessárias do estoque da Setgen ou clique em item avulso caso seja um material sob encomenda não cadastrado.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleOpenMultiPicker}
                className="h-7.5 px-3 gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-bold shadow-2xs rounded-lg"
              >
                <Layers className="w-3.5 h-3.5" />
                Selecionar Peças do Estoque
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddItem}
                className="h-7.5 px-3 gap-1.5 text-xs font-semibold rounded-lg border-gray-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Item Avulso
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-xs bg-white">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2 px-3">Descrição do Material *</th>
                  <th className="py-2 px-3 w-32">Código / Ref</th>
                  <th className="py-2 px-2 w-20 text-center">Qtd *</th>
                  <th className="py-2 px-2 w-24 text-center">Unidade</th>
                  <th className="py-2 px-3 w-32 text-right">Unitário (R$)</th>
                  <th className="py-2 px-3 w-32 text-right">Subtotal</th>
                  <th className="py-2 px-2 w-12 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-1.5 px-3">
                      <Input
                        placeholder="Ex: Óleo 15W40 CI-4, Filtro Combustível, Cabo 50mm..."
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        className="h-7.5 text-xs bg-white rounded-md border-gray-200 font-medium"
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <Input
                        placeholder="Cód. peça"
                        value={it.code || ""}
                        onChange={(e) => handleItemChange(idx, "code", e.target.value)}
                        className="h-7.5 text-xs bg-white rounded-md border-gray-200"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <Input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", Math.max(1, Number(e.target.value) || 1))
                        }
                        className="h-7.5 text-xs w-20 text-center rounded-md border-gray-200 font-bold"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <Input
                        placeholder="UN"
                        value={it.unit || "UN"}
                        onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                        className="h-7.5 text-xs w-24 text-center rounded-md border-gray-200 uppercase"
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0,00"
                        value={it.unitPrice || ""}
                        onChange={(e) =>
                          handleItemChange(idx, "unitPrice", Number(e.target.value) || 0)
                        }
                        className="h-7.5 text-xs text-right rounded-md border-gray-200"
                      />
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-gray-900">
                      {formatCurrency((it.quantity || 1) * (it.unitPrice || 0))}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded cursor-pointer transition-colors"
                        title="Remover material da lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-gray-200 text-xs">
                  <td colSpan={4} className="py-2 px-3 text-right text-gray-600">
                    Total Estimado / Autorizado:
                  </td>
                  <td colSpan={3} className="py-2 px-3 text-right text-sm text-gray-900">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* 5. SEÇÃO: INSTRUÇÕES E OBSERVAÇÕES */}
      <Card className="rounded-xl border border-gray-200/75 p-4 sm:p-5 shadow-2xs bg-white space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
          <FileText className="w-4 h-4 text-orange-600 shrink-0" />
          <div>
            <h3 className="text-xs sm:text-[13px] font-bold text-gray-900">
              5. Instruções para o Balcão da Loja & Observações
            </h3>
            <p className="text-[11px] text-gray-400">
              Orientações impressas no documento para o atendente ou vendedor da loja
            </p>
          </div>
        </div>

        <div>
          <textarea
            rows={2.5 as any}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 text-xs rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-orange-500/20"
            placeholder="Instruções adicionais para a loja..."
          />
        </div>
      </Card>

      {/* BARRA FIXA DE SALVAR E AÇÕES */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto h-9 rounded-lg font-semibold border-gray-200 text-xs"
        >
          Cancelar
        </Button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto h-9 rounded-lg font-bold border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 gap-1.5 shadow-2xs text-xs"
          >
            <FileText className="w-3.5 h-3.5 text-orange-600" />
            Salvar e Emitir Arquivo (PDF)
          </Button>

          <Button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto h-9 rounded-lg font-bold bg-[#E2661D] hover:bg-[#c95716] text-white gap-1.5 shadow-xs text-xs"
          >
            <Check className="w-3.5 h-3.5" />
            {loading ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </div>

      {/* ===== MODAL: SELEÇÃO MÚLTIPLA DE PRODUTOS DO ESTOQUE ===== */}
      <Dialog open={showMultiPickerModal} onOpenChange={setShowMultiPickerModal}>
        <DialogContent className="w-full max-w-2xl bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#E2661D] shrink-0" />
              Selecionar Múltiplos Produtos do Estoque
            </DialogTitle>
            <DialogDescription className="text-[11px] text-gray-500">
              Marque os produtos e quantidades desejadas para adicionar à lista de retirada de materiais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 w-full min-w-0">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Pesquisar por nome ou código da peça..."
                value={multiPickerSearch}
                onChange={(e) => setMultiPickerSearch(e.target.value)}
                className="pl-8.5 h-9 text-xs rounded-lg border-gray-200 w-full"
                autoFocus
              />
            </div>

            <div className="max-h-[360px] overflow-y-auto overflow-x-hidden border border-gray-200 rounded-xl divide-y divide-gray-100 w-full min-w-0">
              {productsCatalog
                .filter((p) => {
                  const s = multiPickerSearch.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(s) ||
                    (p.code && p.code.toLowerCase().includes(s))
                  );
                })
                .map((prod) => {
                  const isChecked = !!multiSelectedMap[prod.id]?.selected;
                  const qty = multiSelectedMap[prod.id]?.qty || 1;
                  const price = Number(prod.unitCost ?? prod.salePrice ?? 0);

                  return (
                    <div
                      key={prod.id}
                      className={cn(
                        "p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors w-full min-w-0",
                        isChecked && "bg-orange-50/60"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setMultiSelectedMap((prev) => ({
                              ...prev,
                              [prod.id]: { selected: e.target.checked, qty },
                            }));
                          }}
                          className="rounded text-orange-600 w-4 h-4 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate" title={prod.name}>
                            {prod.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                            {prod.code && <span>Cód: <strong className="text-slate-700">{prod.code}</strong></span>}
                            <span>Custo Est.: <strong className="text-slate-700">{formatCurrency(price)}</strong></span>
                            {prod.currentStock !== undefined && (
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded font-semibold",
                                  prod.currentStock > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-600"
                                )}
                              >
                                Estoque: {prod.currentStock} {prod.unit || "UN"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isChecked && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-500 font-semibold">Qtd:</span>
                          <Input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value) || 1);
                              setMultiSelectedMap((prev) => ({
                                ...prev,
                                [prod.id]: { selected: true, qty: val },
                              }));
                            }}
                            className="h-8 w-16 text-center text-xs bg-white rounded-lg border-gray-200 font-bold"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              {productsCatalog.filter((p) => {
                const s = multiPickerSearch.toLowerCase();
                return (
                  p.name.toLowerCase().includes(s) ||
                  (p.code && p.code.toLowerCase().includes(s))
                );
              }).length === 0 && (
                <div className="p-6 text-center text-xs text-gray-400">
                  Nenhum produto encontrado para "{multiPickerSearch}".
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMultiPickerModal(false)}
              className="rounded-xl font-semibold border-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmMultiPicker}
              className="rounded-xl font-bold bg-[#E2661D] hover:bg-[#c95716] text-white gap-2 shadow-xs"
            >
              <Check className="w-4 h-4" />
              Adicionar Selecionados à Lista (
              {Object.values(multiSelectedMap).filter((v) => v.selected).length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
