"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { visitsApi } from '@/lib/api/visits';
import { inventoryApi } from '@/lib/api/inventory';
import { servicesApi } from '@/lib/api/services';
import { usersApi } from '@/lib/api/users';
import { artApi } from '@/lib/api/art';
import { checklistTemplatesApi } from '@/lib/api/checklist-templates';
import { openAuthedFile } from '@/lib/utils/auth-file';
import { ServiceOrder, UserRole, ServiceOrderStatus, ServiceOrderAuditLogEntry, TechnicalVisit, Product, ServiceItem, ChecklistTemplate } from '@/types';
import { useAuthStore } from '@/store/auth';
import {
  FileText,
  Calendar,
  User,
  Clock,
  Edit,
  Trash2,
  Info,
  CheckCircle,
  ClipboardList,
  Layers,
  Tag,
  History,
  ExternalLink,
  Link2,
  Wrench,
  X,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Printer,
  Car,
  UtensilsCrossed,
  Receipt,
  Fuel,
  Hotel,
  Navigation,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Save,
  Plus,
  Loader2,
  Package,
  Building2,
  Phone,
  Mail,
  MapPin,
  Check,
  Sparkles,
  ArrowRight,
  PenTool,
  Coins,
  ChevronDown,
  ChevronUp,
  HardHat,
  FileDown,
  Upload,
  RefreshCw,
  CheckSquare,
  Square,
  Timer,
  Sliders,
  CalendarDays
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import Link from 'next/link';
import { StatusTimeline } from '../components/StatusTimeline';
import { StatusManager } from '../components/StatusManager';
import { ArtCard } from '../components/ArtCard';
import { SignaturePad } from '../components/SignaturePad';
import { SERVICE_ORDER_STATUS_CONFIG, serviceOrderStatusBadgeClass, isServiceOrderEditable } from '@/lib/status-config';
import { formatDateBR, formatDateTimeBR } from '@/lib/date';
import { toast } from 'sonner';

const PUBLIC_QUOTE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const formatMoney = (val: number | null | undefined) =>
  (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function InfoRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 p-2 bg-[#E2661D]/10 rounded-lg shrink-0 text-[#E2661D]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
        <div className="text-gray-900 font-medium text-[13.5px]">{children}</div>
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [internalView, setInternalView] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("externa");
  const [auditLog, setAuditLog] = useState<ServiceOrderAuditLogEntry[]>([]);
  const [clientVisits, setClientVisits] = useState<TechnicalVisit[]>([]);
  const [visitToLink, setVisitToLink] = useState('');
  const [linkingVisit, setLinkingVisit] = useState(false);

  // Catálogos do DRE
  const [productsCatalog, setProductsCatalog] = useState<Product[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceItem[]>([]);
  const [usersCatalog, setUsersCatalog] = useState<any[]>([]);

  // Assinatura Digital do Cliente
  const [signerName, setSignerName] = useState("");
  const [signerDoc, setSignerDoc] = useState("");
  const [savingSignature, setSavingSignature] = useState(false);

  // --- 1. Peças & CMV: Peças & Materiais Aplicados (CMV) ---
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductId, setNewProductId] = useState("");
  const [newProductQty, setNewProductQty] = useState("1");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  // --- 2. Serviços Técnicos: Serviços Prestados (Receita) ---
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceId, setNewServiceId] = useState("");
  const [newServiceQty, setNewServiceQty] = useState("1");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceObs, setNewServiceObs] = useState("");
  const [savingService, setSavingService] = useState(false);

  // --- 3. Mão de Obra: Mão de Obra Técnica (Técnicos & Horas) ---
  const [showAddLabor, setShowAddLabor] = useState(false);
  const [newLaborUserId, setNewLaborUserId] = useState("");
  const [newLaborHours, setNewLaborHours] = useState("4");
  const [newLaborRate, setNewLaborRate] = useState("85");
  const [newLaborDesc, setNewLaborDesc] = useState("");
  const [savingLabor, setSavingLabor] = useState(false);

  // --- 4. Frota & Deslocamento: Frota & Deslocamento (Trechos & KM) ---
  const [showAddDisp, setShowAddDisp] = useState(false);
  const [newDispRoute, setNewDispRoute] = useState("");
  const [newDispKm, setNewDispKm] = useState("50");
  const [newDispRate, setNewDispRate] = useState("1.85");
  const [savingDisp, setSavingDisp] = useState(false);

  // --- 5. Despesas de Campo: Despesas de Campo (Alimentação, Pedágio, etc.) ---
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Alimentação");
  const [savingExpense, setSavingExpense] = useState(false);

  
  // === Estados dos Modais de Cadastro Rápido (+) sem sair da tela ===
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProdName, setQuickProdName] = useState("");
  const [quickProdCode, setQuickProdCode] = useState("");
  const [quickProdUnit, setQuickProdUnit] = useState("UN");
  const [quickProdCost, setQuickProdCost] = useState("");
  const [quickProdPrice, setQuickProdPrice] = useState("");
  const [quickProdStock, setQuickProdStock] = useState("10");
  const [savingQuickProd, setSavingQuickProd] = useState(false);

  const [showQuickServiceModal, setShowQuickServiceModal] = useState(false);
  const [quickServTitle, setQuickServTitle] = useState("");
  const [quickServCode, setQuickServCode] = useState("");
  const [quickServPrice, setQuickServPrice] = useState("");
  const [quickServObs, setQuickServObs] = useState("");
  const [savingQuickServ, setSavingQuickServ] = useState(false);

  const [showQuickUserModal, setShowQuickUserModal] = useState(false);
  const [quickUserName, setQuickUserName] = useState("");
  const [quickUserEmail, setQuickUserEmail] = useState("");
  const [quickUserRole, setQuickUserRole] = useState("Técnico Mecânico");
  const [quickUserRate, setQuickUserRate] = useState("85");
  const [savingQuickUser, setSavingQuickUser] = useState(false);

  // === ESTADOS DO CHECKLIST MULTI-CRUD ===
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newChecklistCat, setNewChecklistCat] = useState('Geral');
  const [savingChecklist, setSavingChecklist] = useState(false);

  // === ESTADOS DE STATUS & PRAZO ===
  const [deadlineInput, setDeadlineInput] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [savingTech, setSavingTech] = useState(false);
  const [quickProgress, setQuickProgress] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [statusComment, setStatusComment] = useState('');
  const [savingStatusTransition, setSavingStatusTransition] = useState(false);

  // === ESTADOS DE ART MULTI-CRUD ===
  const [isEditingArt, setIsEditingArt] = useState(false);
  const [artNumber, setArtNumber] = useState('');
  const [artEngineer, setArtEngineer] = useState('');
  const [artCrea, setArtCrea] = useState('');
  const [artIssueDate, setArtIssueDate] = useState('');
  const [artFile, setArtFile] = useState<File | undefined>();
  const [savingArt, setSavingArt] = useState(false);

  // === ESTADOS DE VISITAS TÉCNICAS MULTI-CRUD ===
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [newVisitDate, setNewVisitDate] = useState('');
  const [newVisitTechId, setNewVisitTechId] = useState('');
  const [newVisitType, setNewVisitType] = useState('Manutenção Preventiva');
  const [newVisitDesc, setNewVisitDesc] = useState('');
  const [savingNewVisit, setSavingNewVisit] = useState(false);

  const handleQuickCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProdName.trim()) {
      toast.error("Informe o nome do produto / peça");
      return;
    }
    setSavingQuickProd(true);
    try {
      const code = quickProdCode.trim() || `PEC-${Date.now().toString().slice(-4)}`;
      const cost = Number(quickProdCost.replace(',', '.')) || 0;
      const price = Number(quickProdPrice.replace(',', '.')) || (cost > 0 ? cost * 1.5 : 0);
      const stock = Number(quickProdStock) || 0;

      const created = await inventoryApi.create({
        name: quickProdName.trim(),
        code,
        unit: quickProdUnit || "UN",
        unitCost: cost,
        unitPrice: price,
        salePrice: price,
        currentStock: stock,
        minStock: 1,
        active: true,
      });

      const freshProds = await inventoryApi.getAll().catch(() => []);
      setProductsCatalog(freshProds);
      setNewProductId(created.id);
      setNewProductPrice(String(created.salePrice || created.unitPrice || price));
      setShowQuickProductModal(false);
      setQuickProdName("");
      setQuickProdCode("");
      setQuickProdCost("");
      setQuickProdPrice("");
      toast.success(`Peça "${created.name}" cadastrada no estoque e selecionada!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao cadastrar peça rápida");
    } finally {
      setSavingQuickProd(false);
    }
  };

  const handleQuickCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickServTitle.trim()) {
      toast.error("Informe o título do serviço");
      return;
    }
    setSavingQuickServ(true);
    try {
      const price = Number(quickServPrice.replace(',', '.')) || 0;
      const created = await servicesApi.create({
        title: quickServTitle.trim(),
        externalCode: quickServCode.trim() || undefined,
        price,
        defaultObservation: quickServObs.trim() || undefined,
        active: true,
      });

      const freshSvcs = await servicesApi.getAll().catch(() => []);
      setServicesCatalog(freshSvcs);
      setNewServiceId(created.id);
      setNewServicePrice(String(created.price || price));
      setShowQuickServiceModal(false);
      setQuickServTitle("");
      setQuickServCode("");
      setQuickServPrice("");
      setQuickServObs("");
      toast.success(`Serviço "${created.title}" cadastrado e selecionado!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao cadastrar serviço rápido");
    } finally {
      setSavingQuickServ(false);
    }
  };

  const handleQuickCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUserName.trim() || !quickUserEmail.trim()) {
      toast.error("Informe nome e e-mail do colaborador");
      return;
    }
    setSavingQuickUser(true);
    try {
      const rate = Number(quickUserRate.replace(',', '.')) || 85;
      const created = await usersApi.create({
        name: quickUserName.trim(),
        email: quickUserEmail.trim(),
        password: `Setgen@${Math.floor(1000 + Math.random() * 9000)}`,
        role: "TECHNICIAN",
      });

      const freshUsers = await usersApi.getAll().catch(() => []);
      setUsersCatalog(freshUsers);
      setNewLaborUserId(created.id);
      setNewLaborRate(String(rate));
      setShowQuickUserModal(false);
      setQuickUserName("");
      setQuickUserEmail("");
      toast.success(`Técnico "${created.name}" cadastrado e selecionado!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao cadastrar técnico rápido");
    } finally {
      setSavingQuickUser(false);
    }
  };

  // Ajustes diretos de KM e Horas
  const [customKm, setCustomKm] = useState<string>("");
  const [savingKm, setSavingKm] = useState(false);
  const [customHours, setCustomHours] = useState<string>("");
  const [savingHours, setSavingHours] = useState(false);

  // Ações de GPS/Check-in/Check-out
  const [executingAction, setExecutingAction] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadOrderData();
      loadCatalogs();
    }
  }, [params.id]);

  const loadCatalogs = async () => {
    try {
      const [prods, svcs, usrs, tmpls] = await Promise.all([
        inventoryApi.getAll().catch(() => []),
        servicesApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
        checklistTemplatesApi.getAll().catch(() => []),
      ]);
      setProductsCatalog(prods);
      setServicesCatalog(svcs);
      setUsersCatalog(usrs);
      setChecklistTemplates(tmpls);
    } catch (e) {
      console.error("Erro ao carregar catálogos para o DRE:", e);
    }
  };

  const loadOrderData = async () => {
    try {
      const id = params.id as string;
      const [orderData, internalData, history] = await Promise.all([
        ordersApi.getById(id),
        ordersApi.getInternalView(id).catch(() => null),
        ordersApi.getAuditLog(id).catch(() => []),
      ]);

      setOrder(orderData);
      setInternalView(internalData);
      setAuditLog(history);
      setCustomKm(String(orderData.totalKmTraveled || 0));
      setCustomHours(String(orderData.totalWorkedHours || 0));

      if (orderData.deadline) {
        setDeadlineInput(orderData.deadline.slice(0, 10));
      }
      if (orderData.assignedCollaboratorId || (orderData.responsibleIds && orderData.responsibleIds[0])) {
        setSelectedTechId(orderData.assignedCollaboratorId || orderData.responsibleIds[0]);
      }
      setQuickProgress(orderData.progress || 0);

      if (orderData.art) {
        setArtNumber(orderData.art.number || '');
        setArtEngineer(orderData.art.engineerName || '');
        setArtCrea(orderData.art.creaNumber || '');
        setArtIssueDate(orderData.art.issueDate ? orderData.art.issueDate.slice(0, 10) : '');
      }

      if (orderData.clientId) {
        visitsApi.getAll({ clientId: orderData.clientId }).then(setClientVisits).catch(() => setClientVisits([]));
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes da OS:', error);
      toast.error('Erro ao carregar detalhes da OS');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers de Peças (CMV) ---
  const handleAddProductItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !newProductId) {
      toast.error("Selecione um produto.");
      return;
    }
    const qty = Number(newProductQty.replace(',', '.'));
    const price = Number(newProductPrice.replace(',', '.'));
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      toast.error("Informe quantidade e valor válidos.");
      return;
    }
    setSavingProduct(true);
    try {
      await ordersApi.addItem(order.id, { productId: newProductId, quantity: qty, unitPrice: price });
      toast.success("Peça adicionada à OS com sucesso!");
      setNewProductId("");
      setNewProductQty("1");
      setNewProductPrice("");
      setShowAddProduct(false);
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao adicionar peça.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProductItem = async (itemId: string) => {
    if (!order) return;
    if (!window.confirm("Remover esta peça da Ordem de Serviço?")) return;
    try {
      await ordersApi.deleteItem(order.id, itemId);
      toast.success("Peça removida da OS.");
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao remover peça.");
    }
  };

  // --- Handlers de Serviços ---
  const handleAddServiceItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !newServiceId) {
      toast.error("Selecione um serviço técnico.");
      return;
    }
    const qty = Number(newServiceQty.replace(',', '.'));
    const price = Number(newServicePrice.replace(',', '.'));
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      toast.error("Informe quantidade e valor válidos.");
      return;
    }
    setSavingService(true);
    try {
      await ordersApi.addService(order.id, {
        serviceId: newServiceId,
        quantity: qty,
        unitPrice: price,
        scopeObservation: newServiceObs.trim() || undefined,
      });
      toast.success("Serviço adicionado à OS!");
      setNewServiceId("");
      setNewServiceQty("1");
      setNewServicePrice("");
      setNewServiceObs("");
      setShowAddService(false);
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao adicionar serviço.");
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteServiceItem = async (serviceId: string) => {
    if (!order) return;
    if (!window.confirm("Remover este serviço técnico da OS?")) return;
    try {
      await ordersApi.deleteService(order.id, serviceId);
      toast.success("Serviço removido.");
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao remover serviço.");
    }
  };

  // --- Handlers de Mão de Obra ---
  const handleAddLaborEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const hours = Number(newLaborHours.replace(',', '.'));
    const rate = Number(newLaborRate.replace(',', '.'));
    if (isNaN(hours) || hours <= 0 || isNaN(rate) || rate < 0) {
      toast.error("Informe horas e taxa válidas.");
      return;
    }
    setSavingLabor(true);
    try {
      await ordersApi.addLaborLog(order.id, {
        userId: newLaborUserId || user?.id || "",
        hours,
        hourlyRate: rate,
        description: newLaborDesc.trim() || "Horas técnicas de atendimento de campo",
      });
      toast.success("Mão de obra registrada no DRE!");
      setNewLaborDesc("");
      setShowAddLabor(false);
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao registrar mão de obra.");
    } finally {
      setSavingLabor(false);
    }
  };

  // --- Handlers de Deslocamento / KM ---
  const handleAddDisplacementEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const km = Number(newDispKm.replace(',', '.'));
    const rate = Number(newDispRate.replace(',', '.'));
    if (isNaN(km) || km <= 0 || isNaN(rate) || rate < 0) {
      toast.error("Informe quilometragem e taxa válidas.");
      return;
    }
    setSavingDisp(true);
    try {
      await ordersApi.addDisplacementLog(order.id, {
        route: newDispRoute.trim() || "Deslocamento até local de atendimento",
        km,
        kmRate: rate,
      });
      toast.success("Trecho de frota registrado no DRE!");
      setNewDispRoute("");
      setShowAddDisp(false);
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao registrar deslocamento.");
    } finally {
      setSavingDisp(false);
    }
  };

  const handleDeleteExecutionLog = async (logId: string) => {
    if (!order) return;
    if (!window.confirm("Remover este registro de custo operacional?")) return;
    try {
      await ordersApi.deleteExecutionLog(order.id, logId);
      toast.success("Registro removido do DRE.");
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao excluir registro.");
    }
  };

  // --- Handlers de Despesas de Campo ---
  const handleAddExpense = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!order || !expenseDesc.trim() || !expenseAmount) {
      toast.error('Informe a descrição e o valor da despesa.');
      return;
    }
    const val = Number(expenseAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor monetário válido maior que zero.');
      return;
    }

    setSavingExpense(true);
    try {
      await ordersApi.addExpense(order.id, {
        description: `${expenseCategory}: ${expenseDesc.trim()}`,
        amount: val,
        categoryName: expenseCategory,
      });
      toast.success(`Despesa "${expenseDesc}" (${formatMoney(val)}) registrada!`);
      setExpenseDesc('');
      setExpenseAmount('');
      setShowAddExpense(false);
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao registrar despesa na OS.');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!order) return;
    if (!window.confirm("Deseja realmente excluir esta despesa da OS?")) return;
    try {
      await ordersApi.deleteExpense(order.id, expenseId);
      toast.success("Despesa excluída com sucesso.");
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao excluir despesa.");
    }
  };

  const handleSaveSignature = async (blob: Blob) => {
    if (!order) return;
    if (!signerName.trim()) {
      toast.error('Informe o nome do responsável pela assinatura.');
      return;
    }
    setSavingSignature(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await ordersApi.collectClientSignature(order.id, {
          signerName: signerName.trim(),
          signerDocument: signerDoc.trim() || 'Não informado',
          signatureImageUrl: base64data,
        });
        toast.success('Assinatura do cliente salva com sucesso!');
        loadOrderData();
      };
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao registrar assinatura.');
    } finally {
      setSavingSignature(false);
    }
  };

  const handleUpdateKm = async () => {
    if (!order) return;
    const km = Number(customKm.replace(',', '.'));
    if (isNaN(km) || km < 0) {
      toast.error('Informe uma quilometragem válida.');
      return;
    }
    setSavingKm(true);
    try {
      await ordersApi.updateKm(order.id, km);
      toast.success(`Quilometragem atualizada para ${km} KM!`);
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao atualizar quilometragem.');
    } finally {
      setSavingKm(false);
    }
  };

  const handleUpdateHours = async () => {
    if (!order) return;
    const hrs = Number(customHours.replace(',', '.'));
    if (isNaN(hrs) || hrs < 0) {
      toast.error('Informe uma quantidade de horas válida.');
      return;
    }
    setSavingHours(true);
    try {
      await ordersApi.updateWorkedHours(order.id, hrs);
      toast.success(`Horas trabalhadas atualizadas para ${hrs}h!`);
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao atualizar horas trabalhadas.');
    } finally {
      setSavingHours(false);
    }
  };

  const handleAction = async (action: 'displacement' | 'checkin' | 'checkout') => {
    if (!order) return;
    setExecutingAction(true);
    try {
      if (action === 'displacement') {
        await ordersApi.startDisplacement(order.id, {
          latitude: -23.55052,
          longitude: -46.633308,
        });
        toast.success('Deslocamento da equipe iniciado com sucesso!');
      } else if (action === 'checkin') {
        await ordersApi.checkin(order.id, {
          latitude: -23.55052,
          longitude: -46.633308,
          notes: 'Check-in presencial no local do cliente',
        });
        toast.success('Check-in realizado no cliente!');
      } else if (action === 'checkout') {
        const confirmCheckout = window.confirm(
          'Deseja finalizar a OS com Check-out e realizar a baixa automática dos materiais em estoque?'
        );
        if (!confirmCheckout) return;
        await ordersApi.checkout(order.id, {
          latitude: -23.55052,
          longitude: -46.633308,
          notes: 'Serviço finalizado com sucesso.',
        });
        toast.success('Check-out realizado e materiais baixados do estoque!');
      }
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao executar ação operacional.');
    } finally {
      setExecutingAction(false);
    }
  };

  const handleLinkVisit = async () => {
    if (!visitToLink || !order) return;
    setLinkingVisit(true);
    try {
      await ordersApi.linkVisit(order.id, visitToLink);
      toast.success('Visita vinculada à OS!');
      loadOrderData();
      setVisitToLink('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao vincular visita');
    } finally {
      setLinkingVisit(false);
    }
  };

  const handleUnlinkVisit = async (visitId: string) => {
    if (!order) return;
    try {
      await ordersApi.unlinkVisit(order.id, visitId);
      toast.success('Visita desvinculada');
      setOrder({ ...order, linkedVisits: (order.linkedVisits || []).filter((v) => v.technicalVisitId !== visitId) });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao desvincular visita');
    }
  };

  const handleStatusChange = async (newStatus: ServiceOrderStatus, comments?: string) => {
    if (!order) return;
    try {
      const updatedOrder = await ordersApi.updateStatus(order.id, newStatus, comments);
      setOrder(updatedOrder);
      const history = await ordersApi.getAuditLog(order.id);
      setAuditLog(history);
      toast.success(`Status da OS alterado para ${SERVICE_ORDER_STATUS_CONFIG[newStatus]?.label || newStatus}!`);
      loadOrderData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status');
      throw error;
    }
  };

  // Informações de SLA calculadas em tempo real
  const slaInfo = useMemo(() => {
    if (!order?.deadline) return null;
    const deadline = new Date(order.deadline);
    const now = new Date();
    deadline.setHours(23, 59, 59, 999);
    now.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        status: 'overdue',
        label: `Atrasado há ${absDays} ${absDays === 1 ? 'dia' : 'dias'}`,
        badgeClass: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-300 font-bold',
        days: diffDays,
      };
    } else if (diffDays === 0) {
      return {
        status: 'today',
        label: 'Vence Hoje!',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400 font-bold',
        days: 0,
      };
    } else {
      return {
        status: 'ok',
        label: `No prazo · Faltam ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-300 font-semibold',
        days: diffDays,
      };
    }
  }, [order?.deadline]);

  // --- Handlers de Prazos & Status ---
  const handleSetDeadlinePreset = async (days: number) => {
    if (!order) return;
    const target = new Date();
    target.setDate(target.getDate() + days);
    const dateStr = target.toISOString().slice(0, 10);
    setDeadlineInput(dateStr);
    setSavingDeadline(true);
    try {
      const updated = await ordersApi.update(order.id, { deadline: target.toISOString() });
      setOrder(updated);
      toast.success(`Prazo definido para ${formatDateBR(target.toISOString())} (+${days} dias)!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao definir prazo');
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleSaveCustomDeadline = async () => {
    if (!order || !deadlineInput) {
      toast.error('Selecione uma data para o prazo');
      return;
    }
    setSavingDeadline(true);
    try {
      const isoDate = new Date(`${deadlineInput}T23:59:59.000Z`).toISOString();
      const updated = await ordersApi.update(order.id, { deadline: isoDate });
      setOrder(updated);
      toast.success(`Prazo atualizado para ${formatDateBR(isoDate)}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar prazo');
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleAssignTechnician = async (techId: string) => {
    if (!order || !techId) return;
    setSelectedTechId(techId);
    setSavingTech(true);
    try {
      const updated = await ordersApi.update(order.id, { responsibleIds: [techId] });
      setOrder(updated);
      const tech = usersCatalog.find((u) => u.id === techId);
      toast.success(`Técnico ${tech?.name || 'responsável'} atribuído à OS!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao atribuir técnico');
    } finally {
      setSavingTech(false);
    }
  };

  const handleUpdateProgressQuick = async (val: number) => {
    if (!order) return;
    setQuickProgress(val);
    setSavingProgress(true);
    try {
      const updated = await ordersApi.updateProgress(order.id, val);
      setOrder(updated);
      toast.success(`Progresso atualizado para ${val}%!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao atualizar progresso');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleDirectStatusTransition = async (newStatus: ServiceOrderStatus) => {
    if (!order) return;
    setSavingStatusTransition(true);
    try {
      await handleStatusChange(newStatus, statusComment || undefined);
      setStatusComment('');
    } finally {
      setSavingStatusTransition(false);
    }
  };

  // --- Handlers de Checklist Multi-CRUD ---
  const handleToggleChecklistItem = async (index: number) => {
    if (!order) return;
    const currentList = Array.isArray(order.checklist) ? [...order.checklist] : [];
    if (!currentList[index]) return;
    const item = currentList[index];
    const newCompleted = !item.completed;
    currentList[index] = {
      ...item,
      completed: newCompleted,
      answer: newCompleted && !item.answer ? 'Conforme' : item.answer,
    };
    setOrder({ ...order, checklist: currentList });
    try {
      await ordersApi.update(order.id, { checklist: currentList as any });
    } catch (err: any) {
      toast.error('Erro ao atualizar item');
      loadOrderData();
    }
  };

  const handleSetChecklistItemAnswer = async (index: number, answer: string) => {
    if (!order) return;
    const currentList = Array.isArray(order.checklist) ? [...order.checklist] : [];
    if (!currentList[index]) return;
    const isOk = answer === 'Conforme' || answer === 'Ajustado' || answer === 'OK';
    currentList[index] = {
      ...currentList[index],
      answer,
      completed: isOk ? true : currentList[index].completed,
    };
    setOrder({ ...order, checklist: currentList });
    try {
      await ordersApi.update(order.id, { checklist: currentList as any });
      toast.success(`Item marcado como "${answer}"`);
    } catch (err: any) {
      toast.error('Erro ao salvar avaliação');
      loadOrderData();
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !newChecklistText.trim()) {
      toast.error('Informe a descrição do item de checklist');
      return;
    }
    setSavingChecklist(true);
    try {
      const currentList = Array.isArray(order.checklist) ? [...order.checklist] : [];
      const newItem = {
        id: `chk-${Date.now()}`,
        item: newChecklistText.trim(),
        label: newChecklistText.trim(),
        category: newChecklistCat.trim() || 'Geral',
        completed: false,
        answer: '',
      };
      const updatedList = [...currentList, newItem];
      await ordersApi.update(order.id, { checklist: updatedList as any });
      setOrder({ ...order, checklist: updatedList as any });
      setNewChecklistText('');
      toast.success('Item adicionado ao checklist com sucesso!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao adicionar item de checklist');
    } finally {
      setSavingChecklist(false);
    }
  };

  const handleDeleteChecklistItem = async (index: number) => {
    if (!order) return;
    const currentList = Array.isArray(order.checklist) ? [...order.checklist] : [];
    currentList.splice(index, 1);
    setOrder({ ...order, checklist: currentList });
    try {
      await ordersApi.update(order.id, { checklist: currentList as any });
      toast.success('Item removido do checklist.');
    } catch (err: any) {
      toast.error('Erro ao remover item');
      loadOrderData();
    }
  };

  const handleApplyChecklistTemplate = async (templateId: string) => {
    if (!order || !templateId) return;
    const tmpl = checklistTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;

    if (!window.confirm(`Deseja importar o modelo "${tmpl.name}"? Os itens serão adicionados ao checklist desta OS.`)) {
      return;
    }

    setSavingChecklist(true);
    try {
      const currentList = Array.isArray(order.checklist) ? [...order.checklist] : [];
      const templateItems = (tmpl.fields || []).map((f: any, idx: number) => ({
        id: `tmpl-${tmpl.id}-${idx}-${Date.now()}`,
        item: f.label || f.item || `Verificação ${idx + 1}`,
        label: f.label || f.item || `Verificação ${idx + 1}`,
        category: tmpl.name,
        completed: false,
        answer: '',
      }));
      const combined = [...currentList, ...templateItems];
      await ordersApi.update(order.id, { checklist: combined as any, checklistTemplateId: tmpl.id });
      setOrder({ ...order, checklist: combined as any, checklistTemplateId: tmpl.id });
      setSelectedTemplateId('');
      toast.success(`Modelo "${tmpl.name}" aplicado! (+${templateItems.length} itens)`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao carregar modelo de checklist');
    } finally {
      setSavingChecklist(false);
    }
  };

  const handleToggleAllChecklist = async (complete: boolean) => {
    if (!order || !order.checklist || order.checklist.length === 0) return;
    const currentList = order.checklist.map((i: any) => ({
      ...i,
      completed: complete,
      answer: complete ? (i.answer || 'Conforme') : '',
    }));
    setOrder({ ...order, checklist: currentList });
    try {
      await ordersApi.update(order.id, { checklist: currentList as any });
      toast.success(complete ? 'Todos os itens foram marcados como concluídos!' : 'Itens desmarcados.');
    } catch (err: any) {
      toast.error('Erro ao atualizar itens');
      loadOrderData();
    }
  };

  const handleSyncProgressFromChecklist = async () => {
    if (!order || !order.checklist || order.checklist.length === 0) {
      toast.error('Não há itens no checklist para calcular progresso.');
      return;
    }
    const total = order.checklist.length;
    const done = order.checklist.filter((i: any) => i.completed).length;
    const pct = Math.round((done / total) * 100);
    try {
      await ordersApi.updateProgress(order.id, pct);
      setOrder({ ...order, progress: pct });
      setQuickProgress(pct);
      toast.success(`Progresso da OS sincronizado com o checklist: ${pct}%!`);
    } catch (err: any) {
      toast.error('Erro ao sincronizar progresso');
    }
  };

  // --- Handlers de ART Multi-CRUD ---
  const handleSaveArt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!artNumber.trim() || !artEngineer.trim() || !artCrea.trim()) {
      toast.error('Preencha o Número da ART, Responsável Técnico e CREA.');
      return;
    }
    setSavingArt(true);
    try {
      const issueIso = artIssueDate ? new Date(artIssueDate).toISOString() : new Date().toISOString();
      if (order.art?.id) {
        const updated = await artApi.update(order.art.id, {
          serviceOrderId: order.id,
          number: artNumber.trim(),
          engineerName: artEngineer.trim(),
          creaNumber: artCrea.trim(),
          issueDate: issueIso,
          file: artFile,
        });
        setOrder({ ...order, art: updated });
        setIsEditingArt(false);
        toast.success('ART atualizada com sucesso!');
      } else {
        const created = await artApi.create({
          serviceOrderId: order.id,
          number: artNumber.trim(),
          engineerName: artEngineer.trim(),
          creaNumber: artCrea.trim(),
          issueDate: issueIso,
          file: artFile,
        });
        setOrder({ ...order, art: created });
        setIsEditingArt(false);
        toast.success('ART emitida e vinculada à OS!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao registrar ART');
    } finally {
      setSavingArt(false);
    }
  };

  const handleDeleteArt = async () => {
    if (!order?.art?.id) return;
    if (!window.confirm('Tem certeza que deseja excluir esta ART vinculada à OS?')) return;
    setSavingArt(true);
    try {
      await artApi.delete(order.art.id);
      setOrder({ ...order, art: undefined });
      setArtNumber('');
      setArtEngineer('');
      setArtCrea('');
      setArtIssueDate('');
      setIsEditingArt(false);
      toast.success('ART excluída com sucesso.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao excluir ART');
    } finally {
      setSavingArt(false);
    }
  };

  // --- Handlers de Visitas Técnicas Multi-CRUD ---
  const handleCreateAndLinkVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!newVisitDate) {
      toast.error('Informe a data e horário da visita');
      return;
    }
    setSavingNewVisit(true);
    try {
      const createdVisit = await visitsApi.create({
        clientId: order.clientId,
        technicianId: newVisitTechId || undefined,
        visitDate: new Date(newVisitDate).toISOString(),
        visitType: (newVisitType as any) || 'PREVENTIVE',
        description: newVisitDesc.trim() || `Visita técnica OS #${order.orderNumber}`,
        location: typeof order.client?.address === 'string'
          ? order.client.address
          : order.client?.address
            ? `${order.client.address.street || ''}, ${order.client.address.city || ''}`
            : 'Local do cliente',
        attachments: [],
      });

      await ordersApi.linkVisit(order.id, createdVisit.id);
      toast.success('Visita técnica agendada e vinculada à OS com sucesso!');
      setShowAddVisitModal(false);
      setNewVisitDate('');
      setNewVisitTechId('');
      setNewVisitDesc('');
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao agendar visita técnica');
    } finally {
      setSavingNewVisit(false);
    }
  };

  const handleUpdateVisitStatus = async (visitId: string, newStatus: string) => {
    try {
      await visitsApi.update(visitId, { status: newStatus as any });
      toast.success(`Status da visita alterado para ${newStatus}`);
      loadOrderData();
    } catch (err: any) {
      toast.error('Erro ao atualizar status da visita');
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!order) return;
    if (!window.confirm('Deseja realmente excluir esta visita técnica?')) return;
    try {
      await ordersApi.unlinkVisit(order.id, visitId).catch(() => null);
      await visitsApi.delete(visitId);
      toast.success('Visita técnica removida com sucesso!');
      loadOrderData();
    } catch (err: any) {
      toast.error('Erro ao remover visita');
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    if (!window.confirm('Tem certeza que deseja excluir esta OS? Esta ação não pode ser desfeita.')) return;
    try {
      await ordersApi.delete(order.id);
      toast.success('OS excluída com sucesso!');
      router.push('/orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir OS');
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  // Cálculos consolidados para a OS Externa
  const externalTotals = useMemo(() => {
    if (!order) return { materials: 0, services: 0, grandTotal: 0 };
    let materials = (order.items || []).reduce((acc: number, it: any) => acc + Number(it.totalPrice || 0), 0);
    let services = (order.itemServices || []).reduce((acc: number, s: any) => acc + Number(s.quantity || 0) * Number(s.unitPrice || 0), 0);
    
    if (materials === 0 && order.quote?.quoteLines?.length) {
      materials = order.quote.quoteLines
        .filter((l: any) => l.type === 'MATERIAL')
        .reduce((acc: number, l: any) => acc + Number(l.totalValue || 0), 0);
    }
    if (services === 0 && order.quote?.quoteLines?.length) {
      services = order.quote.quoteLines
        .filter((l: any) => l.type === 'SERVICE')
        .reduce((acc: number, l: any) => acc + Number(l.totalValue || 0), 0);
    }
    let grandTotal = materials + services;
    if (grandTotal === 0 && order.quote?.quoteLines?.length) {
      grandTotal = order.quote.quoteLines.reduce((acc: number, l: any) => acc + Number(l.totalValue || 0), 0);
    }
    return { materials, services, grandTotal };
  }, [order]);

  // Indicadores consolidados do DRE para a OS Interna
  const dre = useMemo(() => {
    if (!order) {
      return {
        revenue: 0,
        materialsCost: 0,
        laborCost: 0,
        displacementCost: 0,
        fieldExpensesCost: 0,
        totalCost: 0,
        netProfit: 0,
        marginPercent: 0,
      };
    }

    const revenue = externalTotals.grandTotal;

    // Custo Real de Materiais (CMV Estoque)
    let materialsCost = (order.items || []).reduce((acc: number, it: any) => {
      const cost = Number(it.product?.unitCost) || 0;
      return acc + (it.quantity || 0) * cost;
    }, 0);
    if (materialsCost === 0 && externalTotals.materials > 0) {
      // Se itens não tiverem unitCost cadastrado, estima CMV conservador de 60%
      materialsCost = externalTotals.materials * 0.6;
    }

    // Custo de Mão de Obra Técnica
    let laborCost = 0;
    const laborLogs = (order.executionLogs || []).filter((l: any) => l.actionType === 'LABOR_LOG');
    if (laborLogs.length > 0) {
      laborLogs.forEach((l: any) => {
        try {
          const parsed = JSON.parse(l.notes || '{}');
          laborCost += Number(parsed.laborCost || (parsed.hours * parsed.hourlyRate) || 0);
        } catch {}
      });
    } else {
      const hourlyRate = Number(order.hourlyRateSnapshot) || Number(order.assignedCollaborator?.hourlyRate) || 85;
      const hours = Number(order.totalWorkedHours) || 0;
      laborCost = Number(order.laborCostReal) || (hours * hourlyRate);
    }

    // Custo de Frota e Deslocamento
    let displacementCost = 0;
    const dispLogs = (order.executionLogs || []).filter((l: any) => l.actionType === 'DISPLACEMENT_LOG');
    if (dispLogs.length > 0) {
      dispLogs.forEach((l: any) => {
        try {
          const parsed = JSON.parse(l.notes || '{}');
          displacementCost += Number(parsed.displacementCost || (parsed.km * parsed.kmRate) || 0);
        } catch {}
      });
    } else {
      const kmRate = Number(order.kmRateSnapshot) || Number(order.assignedCollaborator?.kmRate) || 1.85;
      const km = Number(order.totalKmTraveled) || 0;
      displacementCost = Number(order.displacementCostReal) || (km * kmRate);
    }

    // Despesas de Campo
    const fieldExpensesCost = (order.expenses || []).reduce((acc: number, exp: any) => acc + Number(exp.amount || 0), 0);

    const totalCost = materialsCost + laborCost + displacementCost + fieldExpensesCost;
    const netProfit = revenue - totalCost;
    const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      materialsCost,
      laborCost,
      displacementCost,
      fieldExpensesCost,
      totalCost,
      netProfit,
      marginPercent,
    };
  }, [order, externalTotals]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-[#E2661D]" />
        <p className="text-sm text-gray-500 font-medium">Carregando dados da Ordem de Serviço...</p>
      </div>
    );
  }

  if (!order) return null;

  const laborLogsList = (order.executionLogs || []).filter((l: any) => l.actionType === 'LABOR_LOG');
  const dispLogsList = (order.executionLogs || []).filter((l: any) => l.actionType === 'DISPLACEMENT_LOG');

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-16 print:p-0 print:max-w-none">
      {/* Estilos para impressão limpa da OS Externa */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, nav, aside, .no-print, [role="tablist"] {
            display: none !important;
          }
          .print-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Cabeçalho Aurora Setgen (Oculto na impressão) */}
      <div className="no-print space-y-4">
        <CompactDetailHeader
          icon={FileText}
          tone="amber"
          title={`OS #${order.orderNumber}`}
          badge={{
            label: SERVICE_ORDER_STATUS_CONFIG[order.status]?.label || order.status,
            className: serviceOrderStatusBadgeClass(order.status),
          }}
          meta={
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4 text-[#E2661D]" />
              <span className="font-bold text-gray-900">{order.client?.companyName}</span>
              {order.client?.tradeName && (
                <span className="text-gray-400 font-normal">({order.client.tradeName})</span>
              )}
            </div>
          }
          backLabel="Voltar para Ordens de Serviço"
          onBack={() => router.push('/orders')}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab("externa");
                  setTimeout(() => window.print(), 250);
                }}
                className="rounded-xl font-bold gap-2 text-gray-700 hover:text-[#E2661D] hover:border-[#E2661D]/50"
              >
                <Printer className="h-4 w-4 text-[#E2661D]" />
                Imprimir OS do Cliente
              </Button>

              {order.quote && (
                <a
                  href={`${PUBLIC_QUOTE_BASE_URL}/public/quotes/${order.quoteId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2 text-xs">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Proposta Pública
                  </Button>
                </a>
              )}

              {isServiceOrderEditable(order.status) && (
                <Link href={`/orders/${order.id}/edit`}>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2 text-xs">
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </Link>
              )}

              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="rounded-xl font-bold gap-2 text-xs bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </Button>
              )}
            </>
          }
        />

        {order.quote && (
          <Link href={`/quotes/${order.quote.id}`}>
            <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/70 flex items-center justify-between hover:bg-orange-50 transition-all cursor-pointer shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E2661D]/15 rounded-xl text-[#E2661D]">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Origem Comercial</p>
                  <p className="text-sm font-bold text-gray-900">
                    Orçamento #{order.quote.quoteNumber}{' '}
                    <span className="font-normal text-gray-500">
                      · Contratado em {formatDateBR(order.createdAt)} · Valor Total: {formatMoney(externalTotals.grandTotal)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#E2661D]">
                Abrir Orçamento <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="no-print grid grid-cols-2 md:grid-cols-5 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80 h-auto gap-1">
          <TabsTrigger
            value="externa"
            className="rounded-xl py-2.5 font-bold text-xs gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E2661D] data-[state=active]:shadow-xs transition-all"
          >
            <FileText className="h-4 w-4" />
            OS Externa (Cliente)
          </TabsTrigger>

          <TabsTrigger
            value="interna"
            className="rounded-xl py-2.5 font-bold text-xs gap-2 data-[state=active]:bg-[#1e293b] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all relative"
          >
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            OS Interna
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 data-[state=active]:text-emerald-300 text-[10px] rounded-full font-black">
              DRE Real
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="execucao"
            className="rounded-xl py-2.5 font-bold text-xs gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E2661D] data-[state=active]:shadow-xs transition-all"
          >
            <ClipboardList className="h-4 w-4" />
            Checklist & Execução
          </TabsTrigger>

          <TabsTrigger
            value="status"
            className="rounded-xl py-2.5 font-bold text-xs gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E2661D] data-[state=active]:shadow-xs transition-all"
          >
            <Clock className="h-4 w-4" />
            Status & Prazo
          </TabsTrigger>

          <TabsTrigger
            value="art"
            className="rounded-xl py-2.5 font-bold text-xs gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E2661D] data-[state=active]:shadow-xs transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            ART & Visitas
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* ABA 1: OS EXTERNA (CLIENTE) - VISÃO PÚBLICA & FORMAL      */}
        {/* ======================================================== */}
        <TabsContent value="externa" className="mt-4 space-y-5 print-sheet">
          <Card className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs bg-white">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E2661D] text-white flex items-center justify-center font-black text-xl shadow-xs">
                  S
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">SETGEN - SOLUÇÕES EM ENERGIA</h2>
                  <p className="text-xs text-gray-500 font-medium">Ordem de Serviço Técnica de Campo · Atendimento Autorizado</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100/80 text-[#E2661D] rounded-full text-xs font-black tracking-wide">
                  OS Nº {order.orderNumber}
                </div>
                <p className="text-xs text-gray-500 mt-1">Emissão: {formatDateBR(order.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 border-b border-gray-200">
              <div className="p-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#E2661D]" /> Dados do Cliente (Contratante)
                </h3>
                <div className="space-y-1.5 text-sm">
                  <p className="font-bold text-gray-900 text-base">{order.client?.companyName || 'Cliente não identificado'}</p>
                  {order.client?.tradeName && (
                    <p className="text-xs text-gray-500">Nome Fantasia: <span className="text-gray-800 font-medium">{order.client.tradeName}</span></p>
                  )}
                  {order.client?.cnpjCpf && (
                    <p className="text-xs text-gray-500">CNPJ/CPF: <span className="text-gray-800 font-medium">{order.client.cnpjCpf}</span></p>
                  )}
                  {order.client?.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" /> {order.client.phone}
                    </p>
                  )}
                  {order.client?.email && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" /> {order.client.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-3 bg-gray-50/40">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-[#E2661D]" /> Equipamento / Gerador Atendido
                </h3>
                <div className="space-y-1.5 text-sm">
                  <p className="font-bold text-gray-900 text-base">
                    {order.equipment?.name || order.equipment?.brand || order.equipment?.model || 'Grupo Moto Gerador Diesel'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1">
                    <div>
                      <span className="block text-gray-400">Fabricante / Marca:</span>
                      <strong className="text-gray-800 font-medium">{order.equipment?.brand || order.equipment?.manufacturer || 'SETGEN / Cummins / MWM'}</strong>
                    </div>
                    <div>
                      <span className="block text-gray-400">Número de Série:</span>
                      <strong className="text-gray-800 font-medium">{order.equipment?.serialNumber || 'SN-GER-0091'}</strong>
                    </div>
                    <div>
                      <span className="block text-gray-400">Potência:</span>
                      <strong className="text-gray-800 font-medium">{order.equipment?.powerRating || (order.equipment?.powerKva ? `${order.equipment.powerKva} kVA` : '450 kVA')}</strong>
                    </div>
                    <div>
                      <span className="block text-gray-400">Horímetro:</span>
                      <strong className="text-gray-800 font-medium">{order.equipment?.hourMeter ? `${order.equipment.hourMeter} h` : '340 h'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-gray-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#E2661D]" /> Escopo Técnico Contratado
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200/80 whitespace-pre-wrap">
                {order.scope || order.quote?.scope || 'Manutenção preventiva e corretiva com fornecimento de peças originais e mão de obra técnica especializada conforme proposta aprovada.'}
              </p>
            </div>

            {/* Materiais & Peças */}
            <div className="p-6 border-b border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#E2661D]" /> Materiais, Insumos e Peças Fornecidas
                </h3>
                <span className="text-xs text-gray-500 font-bold">
                  Total: {formatMoney(externalTotals.materials)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4 text-left">Item / Produto</th>
                      <th className="py-3 px-4 text-center">Qtd</th>
                      <th className="py-3 px-4 text-right">Valor Unitário</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(!order.items || order.items.length === 0) ? (
                      (order.quote?.quoteLines?.filter((l: any) => l.type === 'MATERIAL') || []).length > 0 ? (
                        order.quote!.quoteLines!
                          .filter((l: any) => l.type === 'MATERIAL')
                          .map((item: any, idx: number) => (
                            <tr key={item.id || idx} className="hover:bg-gray-50/50">
                              <td className="py-3 px-4">
                                <p className="font-bold text-gray-800 text-[13px]">{item.description}</p>
                                <p className="text-[11px] text-gray-400">Do Orçamento #{order.quote?.quoteNumber}</p>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-gray-700">
                                {item.quantity} un
                              </td>
                              <td className="py-3 px-4 text-right text-gray-600">
                                {formatMoney(Number(item.unitValue || 0))}
                              </td>
                              <td className="py-3 px-4 text-right font-black text-gray-900">
                                {formatMoney(Number(item.totalValue || 0))}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-400 italic">
                            Nenhum produto ou peça faturada nesta OS.
                          </td>
                        </tr>
                      )
                    ) : (
                      order.items.map((item: any, idx: number) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-800 text-[13px]">{item.product?.name || 'Peça / Insumo'}</p>
                            <p className="text-[11px] text-gray-400">Cód: {item.product?.code || 'SKU-001'}</p>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-700">
                            {item.quantity} {item.product?.unit || 'un'}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {formatMoney(Number(item.unitPrice || 0))}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-gray-900">
                            {formatMoney(Number(item.totalPrice || (item.quantity * Number(item.unitPrice || 0))))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Serviços Técnicos */}
            <div className="p-6 border-b border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-[#E2661D]" /> Serviços Técnicos Especializados
                </h3>
                <span className="text-xs text-gray-500 font-bold">
                  Total: {formatMoney(externalTotals.services)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4 text-left">Serviço / Atividade Técnica</th>
                      <th className="py-3 px-4 text-center">Qtd</th>
                      <th className="py-3 px-4 text-right">Valor Unitário</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(!order.itemServices || order.itemServices.length === 0) ? (
                      (order.quote?.quoteLines?.filter((l: any) => l.type === 'SERVICE') || []).length > 0 ? (
                        order.quote!.quoteLines!
                          .filter((l: any) => l.type === 'SERVICE')
                          .map((svc: any, idx: number) => (
                            <tr key={svc.id || idx} className="hover:bg-gray-50/50">
                              <td className="py-3 px-4">
                                <p className="font-bold text-gray-800 text-[13px]">{svc.description}</p>
                                <p className="text-[11px] text-gray-400">Do Orçamento #{order.quote?.quoteNumber}</p>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-gray-700">
                                {svc.quantity}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-600">
                                {formatMoney(Number(svc.unitValue || 0))}
                              </td>
                              <td className="py-3 px-4 text-right font-black text-gray-900">
                                {formatMoney(Number(svc.totalValue || 0))}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-400 italic">
                            Nenhum serviço faturado listado separadamente nesta OS.
                          </td>
                        </tr>
                      )
                    ) : (
                      order.itemServices.map((svc: any, idx: number) => (
                        <tr key={svc.id || idx} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-800 text-[13px]">{svc.service?.title || svc.service?.name || 'Serviço Técnico'}</p>
                            {svc.scopeObservation && (
                              <p className="text-[11px] text-gray-500 mt-0.5">{svc.scopeObservation}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-700">
                            {svc.quantity}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {formatMoney(Number(svc.unitPrice || 0))}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-gray-900">
                            {formatMoney(Number(svc.quantity || 1) * Number(svc.unitPrice || 0))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totalização Comercial Formal */}
            <div className="p-6 bg-gradient-to-r from-gray-50 via-orange-50/30 to-gray-50 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-xs text-gray-500">
                <p>• Prazo de Execução: <strong className="text-gray-800">{order.deadline ? formatDateBR(order.deadline) : 'Conforme cronograma técnico'}</strong></p>
                <p>• Garantia dos Serviços e Peças: <strong className="text-gray-800">90 dias a contar da data de entrega</strong></p>
                <p>• Condições de Pagamento: <strong className="text-gray-800">Faturado 28 DDL / Conforme Proposta</strong></p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Valor Total da Ordem de Serviço</p>
                <p className="text-2xl font-black text-[#E2661D]">
                  {formatMoney(externalTotals.grandTotal)}
                </p>
              </div>
            </div>

            {/* Termo de Aceite & Assinatura Digital do Cliente */}
            <div className="p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Termo de Conclusão, Entrega e Aceite do Cliente
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Declaro para os devidos fins que os serviços e fornecimentos constantes nesta Ordem de Serviço foram integralmente executados a contento, os testes funcionais foram validados e o equipamento encontra-se operacional.
              </p>

              {order.signature ? (
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="space-y-1 text-xs text-emerald-950">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Assinado Digitalmente
                    </div>
                    <p className="text-sm font-bold text-emerald-900 mt-2">
                      Responsável: {order.signature.signerName}
                    </p>
                    <p className="text-emerald-700">
                      Documento: {order.signature.signerDocument}
                    </p>
                    <p className="text-emerald-600 text-[11px]">
                      Data/Hora: {formatDateTimeBR(order.signature.signedAt)}
                    </p>
                  </div>
                  {order.signature.signatureImageUrl && (
                    <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-xs">
                      <img
                        src={order.signature.signatureImageUrl}
                        alt="Assinatura do Cliente"
                        className="h-20 max-w-[240px] object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-print p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-[#E2661D]" /> Coleta Presencial de Assinatura do Cliente
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-gray-600">Nome do Responsável no Local *</Label>
                      <Input
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="Ex: Carlos Eduardo de Souza"
                        className="h-9 text-xs rounded-xl bg-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-gray-600">CPF ou Documento *</Label>
                      <Input
                        value={signerDoc}
                        onChange={(e) => setSignerDoc(e.target.value)}
                        placeholder="Ex: 123.456.789-00 / RG / Matrícula"
                        className="h-9 text-xs rounded-xl bg-white mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-gray-600 block mb-1">Assine no quadro abaixo:</Label>
                    <div className="bg-white rounded-xl border border-gray-300 p-2 shadow-inner inline-block w-full max-w-md">
                      <SignaturePad onSave={handleSaveSignature} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* ABA 2: OS INTERNA (CUSTOS & LUCRO / DRE COM LANÇAMENTOS DRE)  */}
        {/* ======================================================== */}
        <TabsContent value="interna" className="mt-4 space-y-5">
          {/* Header do DRE Executivo */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-md space-y-5 border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs mb-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Gestão Financeira & Apuração de Lucro Real
                </div>
                <h2 className="text-lg font-black tracking-tight text-white">
                  DRE Operacional da Ordem de Serviço #{order.orderNumber}
                </h2>
                <p className="text-xs text-slate-400">
                  Gestão completa e detalhada de cada custo e despesa: Peças (CMV), Mão de Obra, Frota/KM e Despesas de Campo.
                </p>
              </div>

              {/* Ações Operacionais com GPS */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={executingAction}
                  onClick={() => handleAction('displacement')}
                  className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs font-bold h-8 rounded-xl gap-1.5"
                >
                  <Navigation className="h-3.5 w-3.5 text-blue-400" /> Iniciar Deslocamento
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={executingAction}
                  onClick={() => handleAction('checkin')}
                  className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs font-bold h-8 rounded-xl gap-1.5"
                >
                  <MapPin className="h-3.5 w-3.5 text-amber-400" /> Check-in no Cliente
                </Button>
                <Button
                  size="sm"
                  disabled={executingAction}
                  onClick={() => handleAction('checkout')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 rounded-xl gap-1.5 shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" /> Check-out & Baixa Estoque
                </Button>
              </div>
            </div>

            {/* 4 Cards de KPI no Topo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Faturamento Bruto (Venda)</p>
                <p className="text-xl font-black text-white mt-1">{formatMoney(dre.revenue)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Materiais + Serviços Faturados</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-300">2. Custo Operacional Total</p>
                <p className="text-xl font-black text-rose-400 mt-1">- {formatMoney(dre.totalCost)}</p>
                <p className="text-[11px] text-slate-400 mt-1">CMV + Mão de obra + KM + Despesas</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">3. Lucro Operacional Real</p>
                <p className={`text-xl font-black mt-1 ${dre.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatMoney(dre.netProfit)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Resultado líquido apurado da OS</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">4. Margem Líquida Real</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xl font-black ${dre.marginPercent >= 20 ? 'text-emerald-400' : dre.marginPercent >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                    {dre.marginPercent.toFixed(1)}%
                  </span>
                  <Badge className={`text-[10px] font-bold ${dre.marginPercent >= 20 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                    {dre.marginPercent >= 20 ? 'Rentável' : 'Atenção'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Retorno percentual sobre a receita</p>
              </div>
            </div>
          </div>

          {/* DRE Detalhado Passo a Passo */}
          <Card className="p-6 rounded-2xl border border-gray-200 space-y-4 shadow-xs bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#E2661D]" /> Demonstrativo Consolidado de Resultado do Exercício (DRE)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4 text-left">Linha do DRE Operacional</th>
                    <th className="py-3 px-4 text-left">Composição & Controles</th>
                    <th className="py-3 px-4 text-right">Impacto Financeiro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  <tr className="bg-emerald-50/30">
                    <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-emerald-600 font-black">(+)</span> Receita Bruta Faturada
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      Peças ({formatMoney(externalTotals.materials)}) + Serviços ({formatMoney(externalTotals.services)})
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                      {formatMoney(dre.revenue)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-rose-600 font-black">(-)</span> Custo Real das Peças (CMV Estoque)
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {(order.items || []).length} produto(s) alocado(s) com custo de reposição
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      - {formatMoney(dre.materialsCost)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-rose-600 font-black">(-)</span> Mão de Obra Técnica Real
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {laborLogsList.length > 0 ? `${laborLogsList.length} registro(s) de técnico(s)` : `${order.totalWorkedHours || 0}h trabalhadas`}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      - {formatMoney(dre.laborCost)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-rose-600 font-black">(-)</span> Frota & Deslocamento (Quilometragem)
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {dispLogsList.length > 0 ? `${dispLogsList.length} trecho(s) de frota registrado(s)` : `${order.totalKmTraveled || 0} KM rodados`}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      - {formatMoney(dre.displacementCost)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-rose-600 font-black">(-)</span> Despesas de Campo (Alimentação, Pedágio, etc.)
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {(order.expenses || []).length} despesa(s) operacional(is) lançada(s)
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      - {formatMoney(dre.fieldExpensesCost)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black text-sm">
                  <tr>
                    <td className="py-4 px-4 uppercase tracking-wider text-xs">
                      (=) Resultado Operacional Líquido (Lucro da OS)
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-slate-300">
                      Margem Real: {dre.marginPercent.toFixed(1)}% sobre a receita
                    </td>
                    <td className={`py-4 px-4 text-right text-base ${dre.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatMoney(dre.netProfit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* ======================================================== */}
          {/* LANÇAMENTOS DRE 1: PEÇAS & MATERIAIS (CMV)                     */}
          {/* ======================================================== */}
          <Card className="p-6 rounded-2xl border border-gray-200 space-y-4 shadow-xs bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#E2661D]" /> Peças & Materiais Aplicados (Custo CMV)
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Gerencie os produtos aplicados: adicione do almoxarifado, edite preços de venda e confira o custo real (CMV).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                  Custo CMV: {formatMoney(dre.materialsCost)}
                </span>
                <Button
                  size="sm"
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-8 rounded-xl gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showAddProduct ? "Fechar" : "Incluir Peça"}
                </Button>
              </div>
            </div>

            {/* Formulário de Inclusão de Peça */}
            {showAddProduct && (
              <form onSubmit={handleAddProductItem} className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
                <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-[#E2661D]" /> Adicionar Peça / Material do Estoque
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-[11px] font-bold text-gray-600">Produto / Peça *</Label>
                      <button
                        type="button"
                        onClick={() => setShowQuickProductModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E2661D] hover:text-[#c95716] bg-orange-100 hover:bg-orange-200/80 px-2 py-0.5 rounded-md transition-colors"
                        title="Cadastrar Nova Peça no Estoque sem sair da tela"
                      >
                        <Plus className="h-3 w-3" /> Nova Peça
                      </button>
                    </div>
                    <select
                      value={newProductId}
                      onChange={(e) => {
                        setNewProductId(e.target.value);
                        const prod = productsCatalog.find(p => p.id === e.target.value);
                        if (prod) {
                          setNewProductPrice(String(prod.salePrice || prod.unitPrice || prod.unitCost || 0));
                        }
                      }}
                      className="w-full h-8 text-xs rounded-lg border border-gray-300 bg-white px-2 mt-1"
                    >
                      <option value="">Selecione um produto do catálogo...</option>
                      {productsCatalog.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}) — Custo: {formatMoney(Number(p.unitCost || 0))}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Quantidade *</Label>
                    <Input
                      value={newProductQty}
                      onChange={(e) => setNewProductQty(e.target.value)}
                      placeholder="1"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Preço de Venda Unitário (R$) *</Label>
                    <Input
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="0,00"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddProduct(false)} className="h-8 text-xs">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={savingProduct} className="h-8 text-xs bg-[#E2661D] text-white font-bold">
                    {savingProduct ? "Salvando..." : "Confirmar e Incluir Peça"}
                  </Button>
                </div>
              </form>
            )}

            {/* Tabela Gestão de Peças */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Produto</th>
                    <th className="py-2.5 px-3 text-center">Qtd</th>
                    <th className="py-2.5 px-3 text-right">Custo CMV Unit.</th>
                    <th className="py-2.5 px-3 text-right">Preço Venda Unit.</th>
                    <th className="py-2.5 px-3 text-right">Custo Total</th>
                    <th className="py-2.5 px-3 text-right">Venda Total</th>
                    <th className="py-2.5 px-3 text-right">Lucro Peça</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(!order.items || order.items.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-400 italic">
                        Nenhuma peça incluída na OS. Clique em "+ Incluir Peça" para lançar.
                      </td>
                    </tr>
                  ) : (
                    order.items.map((it: any, idx: number) => {
                      const costUnit = Number(it.product?.unitCost) || 0;
                      const saleUnit = Number(it.unitPrice) || 0;
                      const totalSale = Number(it.totalPrice) || (it.quantity * saleUnit);
                      const totalCost = it.quantity * costUnit;
                      const pieceProfit = totalSale - totalCost;
                      return (
                        <tr key={it.id || idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 font-bold text-gray-800">
                            {it.product?.name || 'Peça'}
                            <span className="block text-[10px] text-gray-400 font-normal">{it.product?.code}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-gray-700">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-rose-600">{formatMoney(costUnit)}</td>
                          <td className="py-2.5 px-3 text-right text-gray-800">{formatMoney(saleUnit)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600">- {formatMoney(totalCost)}</td>
                          <td className="py-2.5 px-3 text-right font-black text-gray-900">{formatMoney(totalSale)}</td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-600">{formatMoney(pieceProfit)}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleDeleteProductItem(it.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Excluir Peça"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ======================================================== */}
          {/* LANÇAMENTOS DRE 2: MÃO DE OBRA TÉCNICA (TÉCNICOS & HORAS)      */}
          {/* ======================================================== */}
          <Card className="p-6 rounded-2xl border border-gray-200 space-y-4 shadow-xs bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#E2661D]" /> Mão de Obra Técnica (Jornada & Equipe)
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Lance turnos, horas trabalhadas e técnicos alocados com taxa horária apurada para o DRE.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                  Custo Mão de Obra: {formatMoney(dre.laborCost)}
                </span>
                <Button
                  size="sm"
                  onClick={() => setShowAddLabor(!showAddLabor)}
                  className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-8 rounded-xl gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showAddLabor ? "Fechar" : "Lançar Mão de Obra"}
                </Button>
              </div>
            </div>

            {/* Formulário de Inclusão de Mão de Obra */}
            {showAddLabor && (
              <form onSubmit={handleAddLaborEntry} className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
                <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-[#E2661D]" /> Adicionar Turno / Horas de Técnico
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-[11px] font-bold text-gray-600">Técnico / Colaborador *</Label>
                      <button
                        type="button"
                        onClick={() => setShowQuickUserModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E2661D] hover:text-[#c95716] bg-orange-100 hover:bg-orange-200/80 px-2 py-0.5 rounded-md transition-colors"
                        title="Cadastrar Novo Técnico / Colaborador sem sair da tela"
                      >
                        <Plus className="h-3 w-3" /> Novo Técnico
                      </button>
                    </div>
                    <select
                      value={newLaborUserId}
                      onChange={(e) => {
                        setNewLaborUserId(e.target.value);
                        const usr = usersCatalog.find(u => u.id === e.target.value);
                        if (usr && usr.hourlyRate) {
                          setNewLaborRate(String(usr.hourlyRate));
                        }
                      }}
                      className="w-full h-8 text-xs rounded-lg border border-gray-300 bg-white px-2 mt-1"
                    >
                      <option value="">Selecione o técnico...</option>
                      {usersCatalog.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.jobTitle || 'Técnico'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Horas Trabalhadas *</Label>
                    <Input
                      value={newLaborHours}
                      onChange={(e) => setNewLaborHours(e.target.value)}
                      placeholder="Ex: 4.5"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Taxa Horária (R$/h) *</Label>
                    <Input
                      value={newLaborRate}
                      onChange={(e) => setNewLaborRate(e.target.value)}
                      placeholder="85.00"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Atividade / Descrição</Label>
                    <Input
                      value={newLaborDesc}
                      onChange={(e) => setNewLaborDesc(e.target.value)}
                      placeholder="Ex: Troca de filtros e teste de carga"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddLabor(false)} className="h-8 text-xs">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={savingLabor} className="h-8 text-xs bg-[#E2661D] text-white font-bold">
                    {savingLabor ? "Salvando..." : "Confirmar e Lançar"}
                  </Button>
                </div>
              </form>
            )}

            {/* Lista Gestão de Mão de Obra */}
            <div className="space-y-2">
              {laborLogsList.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                  <span className="text-gray-500">
                    Acumulador Padrão: <strong>{order.totalWorkedHours || 0} horas</strong> @ {formatMoney(Number(order.hourlyRateSnapshot) || Number(order.assignedCollaborator?.hourlyRate) || 85)}/hora
                  </span>
                  <span className="font-black text-rose-600 text-sm">
                    {formatMoney(dre.laborCost)}
                  </span>
                </div>
              ) : (
                laborLogsList.map((l: any) => {
                  let p: any = {};
                  try { p = JSON.parse(l.notes || '{}'); } catch {}
                  return (
                    <div key={l.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{l.user?.name || 'Técnico'}</span>
                          <span className="text-gray-500 font-medium">({p.hours || 0}h @ {formatMoney(p.hourlyRate || 85)}/h)</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{p.description || 'Atendimento técnico de campo'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-rose-600 text-sm">
                          {formatMoney(Number(p.laborCost || ((p.hours || 0) * (p.hourlyRate || 85))))}
                        </span>
                        <button
                          onClick={() => handleDeleteExecutionLog(l.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir Registro"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* ======================================================== */}
          {/* LANÇAMENTOS DRE 3: FROTA & DESLOCAMENTO (TRECHOS & KM)         */}
          {/* ======================================================== */}
          <Card className="p-6 rounded-2xl border border-gray-200 space-y-4 shadow-xs bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <Car className="h-4 w-4 text-[#E2661D]" /> Frota & Deslocamento (Trechos & KM)
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Lance trechos percorridos, quilometragem e taxa por KM aplicada para apurar os custos de frota no DRE.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                  Custo Deslocamento: {formatMoney(dre.displacementCost)}
                </span>
                <Button
                  size="sm"
                  onClick={() => setShowAddDisp(!showAddDisp)}
                  className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-8 rounded-xl gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showAddDisp ? "Fechar" : "Adicionar Trecho"}
                </Button>
              </div>
            </div>

            {/* Formulário de Inclusão de Trecho */}
            {showAddDisp && (
              <form onSubmit={handleAddDisplacementEntry} className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
                <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-[#E2661D]" /> Adicionar Trecho Percorrido
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Descrição do Trecho / Rota *</Label>
                    <Input
                      value={newDispRoute}
                      onChange={(e) => setNewDispRoute(e.target.value)}
                      placeholder="Ex: Sede SETGEN -> Cliente Distrito Industrial"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">KM Percorrido *</Label>
                    <Input
                      value={newDispKm}
                      onChange={(e) => setNewDispKm(e.target.value)}
                      placeholder="Ex: 60"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Taxa por KM (R$/KM) *</Label>
                    <Input
                      value={newDispRate}
                      onChange={(e) => setNewDispRate(e.target.value)}
                      placeholder="1.85"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddDisp(false)} className="h-8 text-xs">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={savingDisp} className="h-8 text-xs bg-[#E2661D] text-white font-bold">
                    {savingDisp ? "Salvando..." : "Confirmar e Lançar Trecho"}
                  </Button>
                </div>
              </form>
            )}

            {/* Lista Gestão de Deslocamento */}
            <div className="space-y-2">
              {dispLogsList.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                  <span className="text-gray-500">
                    Acumulador Padrão: <strong>{order.totalKmTraveled || 0} KM</strong> @ {formatMoney(Number(order.kmRateSnapshot) || Number(order.assignedCollaborator?.kmRate) || 1.85)}/KM
                  </span>
                  <span className="font-black text-rose-600 text-sm">
                    {formatMoney(dre.displacementCost)}
                  </span>
                </div>
              ) : (
                dispLogsList.map((d: any) => {
                  let p: any = {};
                  try { p = JSON.parse(d.notes || '{}'); } catch {}
                  return (
                    <div key={d.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{p.route || 'Trecho de Campo'}</span>
                          <span className="text-gray-500 font-medium">({d.odometerKm || p.km || 0} KM @ {formatMoney(p.kmRate || 1.85)}/KM)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-rose-600 text-sm">
                          {formatMoney(Number(p.displacementCost || ((d.odometerKm || p.km || 0) * (p.kmRate || 1.85))))}
                        </span>
                        <button
                          onClick={() => handleDeleteExecutionLog(d.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir Trecho"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* ======================================================== */}
          {/* LANÇAMENTOS DRE 4: DESPESAS DE CAMPO (ALIMENTAÇÃO, PEDÁGIO)   */}
          {/* ======================================================== */}
          <Card className="p-6 rounded-2xl border border-gray-200 space-y-4 shadow-xs bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-[#E2661D]" /> Despesas de Campo (Alimentação, Pedágio, Hospedagem)
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Lançamento discriminado de despesas operacionais da equipe com comprovante e categoria.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                  Total Despesas: {formatMoney(dre.fieldExpensesCost)}
                </span>
                <Button
                  size="sm"
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-8 rounded-xl gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showAddExpense ? "Fechar" : "Lançar Despesa"}
                </Button>
              </div>
            </div>

            {/* Formulário de Inclusão de Despesa */}
            {showAddExpense && (
              <form onSubmit={handleAddExpense} className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
                <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-[#E2661D]" /> Lançar Nova Despesa Operacional
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Categoria *</Label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full h-8 text-xs rounded-lg border border-gray-300 bg-white px-2 mt-1"
                    >
                      <option value="Alimentação">Alimentação</option>
                      <option value="Pedágio">Pedágio</option>
                      <option value="Combustível">Combustível</option>
                      <option value="Hospedagem">Hospedagem</option>
                      <option value="Estacionamento">Estacionamento</option>
                      <option value="Locação de Equipamentos">Locação de Equipamentos</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Descrição do Gasto *</Label>
                    <Input
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      placeholder="Ex: Almoço 3 técnicos"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Valor (R$) *</Label>
                    <Input
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0,00"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddExpense(false)} className="h-8 text-xs">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={savingExpense} className="h-8 text-xs bg-[#E2661D] text-white font-bold">
                    {savingExpense ? "Salvando..." : "Confirmar e Lançar"}
                  </Button>
                </div>
              </form>
            )}

            {/* Lista Gestão de Despesas */}
            <div className="space-y-2">
              {(!order.expenses || order.expenses.length === 0) ? (
                <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50/50 rounded-xl">
                  Nenhuma despesa de campo lançada para esta OS. Clique em "+ Lançar Despesa" para cadastrar.
                </p>
              ) : (
                order.expenses.map((exp: any, idx: number) => (
                  <div key={exp.id || idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{exp.description || 'Despesa'}</span>
                        <span className="px-2 py-0.5 bg-orange-100 text-[#E2661D] text-[10px] rounded-md font-bold">
                          {exp.category?.name || 'Gasto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {exp.date ? formatDateBR(exp.date) : 'Data não informada'} · Por: {exp.user?.name || 'Técnico'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-rose-600 text-sm">
                        {formatMoney(Number(exp.amount || 0))}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Excluir Despesa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* ======================================================== */}
          {/* LANÇAMENTOS DRE 5: SERVIÇOS TÉCNICOS FATURADOS                */}
          {/* ======================================================== */}
          <Card className="p-6 rounded-2xl border border-gray-200 space-y-4 shadow-xs bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-[#E2661D]" /> Serviços Técnicos Especializados (Receita)
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Adicione, edite ou remova serviços técnicos cobrados do cliente nesta Ordem de Serviço.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Total Serviços: {formatMoney(externalTotals.services)}
                </span>
                <Button
                  size="sm"
                  onClick={() => setShowAddService(!showAddService)}
                  className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-8 rounded-xl gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showAddService ? "Fechar" : "Incluir Serviço"}
                </Button>
              </div>
            </div>

            {/* Formulário de Inclusão de Serviço */}
            {showAddService && (
              <form onSubmit={handleAddServiceItem} className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
                <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-[#E2661D]" /> Adicionar Serviço Especializado
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-[11px] font-bold text-gray-600">Serviço Especializado *</Label>
                      <button
                        type="button"
                        onClick={() => setShowQuickServiceModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E2661D] hover:text-[#c95716] bg-orange-100 hover:bg-orange-200/80 px-2 py-0.5 rounded-md transition-colors"
                        title="Cadastrar Novo Serviço no Catálogo sem sair da tela"
                      >
                        <Plus className="h-3 w-3" /> Novo Serviço
                      </button>
                    </div>
                    <select
                      value={newServiceId}
                      onChange={(e) => {
                        setNewServiceId(e.target.value);
                        const s = servicesCatalog.find(x => x.id === e.target.value);
                        if (s) {
                          setNewServicePrice(String(s.price || 0));
                        }
                      }}
                      className="w-full h-8 text-xs rounded-lg border border-gray-300 bg-white px-2 mt-1"
                    >
                      <option value="">Selecione um serviço...</option>
                      {servicesCatalog.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title || s.name} — {formatMoney(Number(s.price || 0))}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Quantidade *</Label>
                    <Input
                      value={newServiceQty}
                      onChange={(e) => setNewServiceQty(e.target.value)}
                      placeholder="1"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-gray-600">Valor Unitário (R$) *</Label>
                    <Input
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      placeholder="0,00"
                      className="h-8 text-xs rounded-lg bg-white mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-gray-600">Observação de Escopo</Label>
                  <Input
                    value={newServiceObs}
                    onChange={(e) => setNewServiceObs(e.target.value)}
                    placeholder="Ex: Execução conforme plano de manutenção semestral"
                    className="h-8 text-xs rounded-lg bg-white mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddService(false)} className="h-8 text-xs">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={savingService} className="h-8 text-xs bg-[#E2661D] text-white font-bold">
                    {savingService ? "Salvando..." : "Confirmar e Incluir Serviço"}
                  </Button>
                </div>
              </form>
            )}

            {/* Lista Gestão de Serviços */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Serviço Técnico</th>
                    <th className="py-2.5 px-3 text-center">Qtd</th>
                    <th className="py-2.5 px-3 text-right">Valor Unitário</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(!order.itemServices || order.itemServices.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400 italic">
                        Nenhum serviço técnico registrado na OS. Clique em "+ Incluir Serviço" para lançar.
                      </td>
                    </tr>
                  ) : (
                    order.itemServices.map((svc: any, idx: number) => (
                      <tr key={svc.id || idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-gray-800 text-[13px]">{svc.service?.title || svc.service?.name || 'Serviço Técnico'}</p>
                          {svc.scopeObservation && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{svc.scopeObservation}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-700">
                          {svc.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-600">
                          {formatMoney(Number(svc.unitPrice || 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-gray-900">
                          {formatMoney(Number(svc.quantity || 1) * Number(svc.unitPrice || 0))}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleDeleteServiceItem(svc.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Excluir Serviço"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* ABA 3: CHECKLIST & EXECUÇÃO TÉCNICA - MULTI-CRUD NA TELA */}
        {/* ======================================================== */}
        <TabsContent value="execucao" className="mt-4 space-y-5">
          {/* Header Card do Checklist */}
          <Card className="p-6 rounded-2xl border border-gray-200 shadow-xs bg-white space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500/10 text-[#E2661D] rounded-xl">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight">
                      Checklist Técnico & Procedimentos de Inspeção
                    </h3>
                    <p className="text-xs text-gray-500">
                      Multi-CRUD integrado em tempo real. Adicione, avalie e conclua itens diretamente nesta tela.
                    </p>
                  </div>
                </div>
              </div>

              {/* Controles Globais do Checklist */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncProgressFromChecklist}
                  className="rounded-xl text-xs font-bold gap-1.5 h-9 border-orange-200 text-[#E2661D] hover:bg-orange-50"
                  disabled={!order.checklist || order.checklist.length === 0}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sincronizar Progresso OS
                </Button>

                {order.checklist && order.checklist.length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAllChecklist(true)}
                      className="rounded-xl text-xs font-bold gap-1.5 h-9"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Concluir Todos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAllChecklist(false)}
                      className="rounded-xl text-xs font-bold gap-1.5 h-9"
                    >
                      Desmarcar
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Barra de Progresso e Métricas */}
            {order.checklist && order.checklist.length > 0 && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E2661D]"></span>
                    Conclusão dos Itens Técnicos
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">
                      {order.checklist.filter((i: any) => i.completed).length} de {order.checklist.length} concluídos
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-orange-100 text-[#E2661D]">
                      {Math.round((order.checklist.filter((i: any) => i.completed).length / order.checklist.length) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (order.checklist.filter((i: any) => i.completed).length / order.checklist.length) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Importador Rápido de Template de Checklist */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-orange-50/50 rounded-xl border border-orange-200/60 text-xs">
              <span className="font-bold text-gray-700 shrink-0 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#E2661D]" /> Carregar de Modelo Padrão:
              </span>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-orange-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E2661D]"
              >
                <option value="">Selecione um modelo pré-cadastrado...</option>
                {checklistTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.fields?.length || 0} itens)
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                disabled={!selectedTemplateId || savingChecklist}
                onClick={() => handleApplyChecklistTemplate(selectedTemplateId)}
                className="h-9 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-bold shrink-0"
              >
                Importar Modelo
              </Button>
            </div>

            {/* Linha de Cadastro Rápido de Novo Item no Topo */}
            <form onSubmit={handleAddChecklistItem} className="pt-2 border-t border-gray-200">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Adicionar novo item de checklist (ex: Conferir nível de óleo lubrificante)..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    className="h-10 rounded-xl text-xs border-gray-300"
                  />
                </div>
                <div className="w-full md:w-44">
                  <select
                    value={newChecklistCat}
                    onChange={(e) => setNewChecklistCat(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 text-xs bg-white font-medium"
                  >
                    <option value="Geral">Categoria: Geral</option>
                    <option value="Mecânica">Mecânica</option>
                    <option value="Elétrica">Elétrica</option>
                    <option value="Arrefecimento">Arrefecimento</option>
                    <option value="Combustível">Combustível</option>
                    <option value="Teste de Carga">Teste de Carga</option>
                    <option value="Limpeza">Limpeza</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  disabled={savingChecklist || !newChecklistText.trim()}
                  className="h-10 px-4 rounded-xl bg-[#E2661D] hover:bg-[#d05a18] text-white font-bold gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>
            </form>
          </Card>

          {/* Lista de Itens do Checklist */}
          {order.checklist && order.checklist.length > 0 ? (
            <div className="space-y-2.5">
              {order.checklist.map((item: any, index: number) => {
                const isCompleted = !!item.completed;
                const currentAnswer = item.answer || '';

                return (
                  <div
                    key={item.id ?? index}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/40 border-emerald-200/80'
                        : 'bg-white border-gray-200 shadow-xs hover:border-gray-300'
                    }`}
                  >
                    {/* Checkbox e Título */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleChecklistItem(index)}
                        className={`mt-0.5 p-1 rounded-lg transition-colors ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-400 hover:text-gray-600 border border-gray-300'
                        }`}
                        title={isCompleted ? 'Desmarcar' : 'Concluir'}
                      >
                        {isCompleted ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 uppercase tracking-wider">
                            #{index + 1}
                          </span>
                          {item.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100/70 text-[#E2661D]">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs font-semibold mt-1 ${
                            isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}
                        >
                          {item.label ?? item.item}
                        </p>
                      </div>
                    </div>

                    {/* Avaliação Rápida (Pills de 1 Clique) & Exclusão */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                        {['Conforme', 'Não Conforme', 'Ajustado', 'N/A'].map((pill) => {
                          const isSelected = currentAnswer.toLowerCase() === pill.toLowerCase();
                          let pillStyle = 'text-gray-600 hover:bg-gray-200';
                          if (isSelected) {
                            if (pill === 'Conforme') pillStyle = 'bg-emerald-600 text-white font-bold shadow-xs';
                            else if (pill === 'Não Conforme') pillStyle = 'bg-red-600 text-white font-bold shadow-xs';
                            else if (pill === 'Ajustado') pillStyle = 'bg-amber-600 text-white font-bold shadow-xs';
                            else pillStyle = 'bg-gray-600 text-white font-bold shadow-xs';
                          }

                          return (
                            <button
                              key={pill}
                              type="button"
                              onClick={() => handleSetChecklistItemAnswer(index, pill)}
                              className={`px-2.5 py-1 text-[11px] rounded-lg transition-all ${pillStyle}`}
                            >
                              {pill}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteChecklistItem(index)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Remover item do checklist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="p-10 text-center rounded-2xl border border-dashed border-gray-300 bg-white space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#E2661D] mx-auto flex items-center justify-center">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-800">Nenhum item no checklist ainda</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Adicione itens técnicos acima ou carregue um modelo pré-cadastrado para iniciar a execução da ordem de serviço.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* ABA 4: STATUS & PRAZO - PAINEL DIRETO E PRODUTIVO        */}
        {/* ======================================================== */}
        <TabsContent value="status" className="mt-4 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* CARD 1: CONTROLE DE PRAZOS, SLA & ALOCAÇÃO */}
            <Card className="p-6 rounded-2xl border border-gray-200 shadow-xs bg-white space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500/10 text-[#E2661D] rounded-xl">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight">Prazos de Entrega & SLA</h3>
                    <p className="text-xs text-gray-500">Defina o prazo de atendimento em 1 clique ou escolha a data</p>
                  </div>
                </div>
              </div>

              {/* Status do Prazo em Destaque */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">Prazo Atual Definido</p>
                  <p className="text-base font-black text-gray-900 mt-0.5">
                    {order.deadline ? formatDateBR(order.deadline) : 'Nenhum prazo estabelecido'}
                  </p>
                </div>
                {slaInfo ? (
                  <Badge variant="outline" className={`px-3 py-1.5 text-xs rounded-xl ${slaInfo.badgeClass}`}>
                    <Timer className="h-3.5 w-3.5 mr-1.5" />
                    {slaInfo.label}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="px-3 py-1.5 text-xs rounded-xl bg-gray-100 text-gray-600">
                    Sem SLA definido
                  </Badge>
                )}
              </div>

              {/* Presets Rápidos de 1 Clique */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700">Definir Prazo Rápido (1 Clique):</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={savingDeadline}
                    onClick={() => handleSetDeadlinePreset(3)}
                    className="h-10 rounded-xl text-xs font-bold hover:border-[#E2661D] hover:text-[#E2661D]"
                  >
                    +3 Dias
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={savingDeadline}
                    onClick={() => handleSetDeadlinePreset(7)}
                    className="h-10 rounded-xl text-xs font-bold hover:border-[#E2661D] hover:text-[#E2661D]"
                  >
                    +7 Dias (1 Sem)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={savingDeadline}
                    onClick={() => handleSetDeadlinePreset(15)}
                    className="h-10 rounded-xl text-xs font-bold hover:border-[#E2661D] hover:text-[#E2661D]"
                  >
                    +15 Dias (2 Sem)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={savingDeadline}
                    onClick={() => handleSetDeadlinePreset(30)}
                    className="h-10 rounded-xl text-xs font-bold hover:border-[#E2661D] hover:text-[#E2661D]"
                  >
                    +30 Dias (1 Mês)
                  </Button>
                </div>
              </div>

              {/* Seletor Customizado de Data */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold text-gray-700">Ou Selecionar Data Específica:</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={deadlineInput}
                    onChange={(e) => setDeadlineInput(e.target.value)}
                    className="h-10 rounded-xl text-xs flex-1"
                  />
                  <Button
                    type="button"
                    disabled={savingDeadline || !deadlineInput}
                    onClick={handleSaveCustomDeadline}
                    className="h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4"
                  >
                    Salvar Data
                  </Button>
                </div>
              </div>

              {/* Atribuição de Técnico Responsável */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Técnico Responsável:</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    Atual: {order.assignedCollaborator?.name || 'Não atribuído'}
                  </span>
                </Label>
                <div className="flex gap-2">
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl border border-gray-300 text-xs bg-white font-medium"
                  >
                    <option value="">Selecione um técnico da equipe...</option>
                    {usersCatalog.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingTech || !selectedTechId}
                    onClick={() => handleAssignTechnician(selectedTechId)}
                    className="h-10 px-4 rounded-xl bg-[#E2661D] hover:bg-[#d05a18] text-white text-xs font-bold"
                  >
                    Atribuir
                  </Button>
                </div>
              </div>

              {/* Progresso Técnico 0 - 100% */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <Label className="font-bold text-gray-700">Progresso Técnico da OS:</Label>
                  <span className="font-black text-sm text-[#E2661D]">{quickProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#E2661D] h-2 rounded-full transition-all"
                    style={{ width: `${quickProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-1 pt-1">
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      variant={quickProgress === pct ? 'default' : 'outline'}
                      size="sm"
                      disabled={savingProgress}
                      onClick={() => handleUpdateProgressQuick(pct)}
                      className={`h-8 rounded-lg text-xs font-bold flex-1 ${
                        quickProgress === pct ? 'bg-[#E2661D] hover:bg-[#d05a18]' : ''
                      }`}
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* CARD 2: FLUXO DE STATUS DA OS & AÇÕES IMEDIATAS */}
            <Card className="p-6 rounded-2xl border border-gray-200 shadow-xs bg-white space-y-5 h-fit">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight">Fluxo de Status da OS</h3>
                    <p className="text-xs text-gray-500">Transição direta entre etapas da ordem de serviço</p>
                  </div>
                </div>
              </div>

              {/* Status Atual em Destaque */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-gray-500">Status Atual</p>
                  <p className="text-sm font-black text-gray-900 mt-0.5">
                    {SERVICE_ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                  </p>
                </div>
                <span
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl ${serviceOrderStatusBadgeClass(order.status)}`}
                >
                  {SERVICE_ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                </span>
              </div>

              {/* Linha do Tempo Visual */}
              <div className="py-2">
                <StatusTimeline currentStatus={order.status} />
              </div>

              {/* Ações Diretas de Próximo Passo */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Label className="text-xs font-bold text-gray-700">Avançar para a Próxima Etapa (1 Clique):</Label>

                {order.status === ServiceOrderStatus.AWAITING_MATERIALS && (
                  <Button
                    type="button"
                    disabled={savingStatusTransition}
                    onClick={() => handleDirectStatusTransition(ServiceOrderStatus.IN_PROGRESS)}
                    className="w-full h-12 rounded-xl bg-[#E2661D] hover:bg-[#d05a18] text-white font-bold text-xs gap-2 shadow-xs transition-transform active:scale-[0.99]"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Iniciar Execução da OS (Mudar para "Em Andamento")
                  </Button>
                )}

                {order.status === ServiceOrderStatus.IN_PROGRESS && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      disabled={savingStatusTransition}
                      onClick={() => handleDirectStatusTransition(ServiceOrderStatus.COMPLETED)}
                      className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-xs transition-transform active:scale-[0.99]"
                    >
                      <Check className="h-4 w-4" />
                      Finalizar e Concluir Ordem de Serviço
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={savingStatusTransition}
                      onClick={() => handleDirectStatusTransition(ServiceOrderStatus.AWAITING_MATERIALS)}
                      className="w-full h-10 rounded-xl border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold text-xs gap-2"
                    >
                      Pausar / Retornar para "Aguardando Materiais"
                    </Button>
                  </div>
                )}

                {order.status !== ServiceOrderStatus.COMPLETED &&
                  order.status !== ServiceOrderStatus.CANCELLED && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={savingStatusTransition}
                      onClick={() => {
                        if (window.confirm('Deseja realmente cancelar esta OS?')) {
                          handleDirectStatusTransition(ServiceOrderStatus.CANCELLED);
                        }
                      }}
                      className="w-full h-9 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold"
                    >
                      Cancelar Ordem de Serviço
                    </Button>
                  )}

                {order.status === ServiceOrderStatus.COMPLETED && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <p className="text-xs font-bold text-emerald-800">Esta Ordem de Serviço está CONCLUÍDA.</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      Concluída em {order.completedAt ? formatDateBR(order.completedAt) : formatDateBR(order.updatedAt)}
                    </p>
                  </div>
                )}

                {/* Campo Opcional de Observação */}
                {order.status !== ServiceOrderStatus.COMPLETED && order.status !== ServiceOrderStatus.CANCELLED && (
                  <div className="pt-2">
                    <Input
                      placeholder="Observação da mudança (opcional)..."
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* ABA 5: ART & VISITAS TÉCNICAS - MULTI-CRUD COMPLETO       */}
        {/* ======================================================== */}
        <TabsContent value="art" className="mt-4 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* SEÇÃO 1: MULTI-CRUD DE ART */}
            <Card className="p-6 rounded-2xl border border-gray-200 shadow-xs bg-white space-y-5 h-fit">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight">ART - Responsabilidade Técnica</h3>
                    <p className="text-xs text-gray-500">Anotação e registro formal da equipe técnica com CREA</p>
                  </div>
                </div>
                {order.art && !isEditingArt && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs">
                    ART Ativa
                  </Badge>
                )}
              </div>

              {/* Exibição da ART Existente (Read / Delete / Edit) */}
              {order.art && !isEditingArt ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-gray-500">Número da ART</span>
                      <span className="text-sm font-black text-gray-900">{order.art.number}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200/60 pt-2">
                      <span className="text-[11px] font-bold uppercase text-gray-500">Engenheiro / Resp. Técnico</span>
                      <span className="text-xs font-semibold text-gray-800">{order.art.engineerName}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200/60 pt-2">
                      <span className="text-[11px] font-bold uppercase text-gray-500">Registro CREA</span>
                      <span className="text-xs font-semibold text-gray-800">{order.art.creaNumber}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200/60 pt-2">
                      <span className="text-[11px] font-bold uppercase text-gray-500">Data de Emissão</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDateBR(order.art.issueDate)}</span>
                    </div>
                  </div>

                  {order.art.fileUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openAuthedFile(order.art!.fileUrl!)}
                      className="w-full h-10 rounded-xl font-bold text-xs gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      <FileDown className="h-4 w-4" />
                      Visualizar / Baixar Documento PDF da ART
                    </Button>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setArtNumber(order.art?.number || '');
                        setArtEngineer(order.art?.engineerName || '');
                        setArtCrea(order.art?.creaNumber || '');
                        setArtIssueDate(order.art?.issueDate ? order.art.issueDate.slice(0, 10) : '');
                        setIsEditingArt(true);
                      }}
                      className="flex-1 h-10 rounded-xl font-bold text-xs gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Editar Dados
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={savingArt}
                      onClick={handleDeleteArt}
                      className="h-10 rounded-xl font-bold text-xs gap-1.5 text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir ART
                    </Button>
                  </div>
                </div>
              ) : (
                /* Formulário de Criação / Edição de ART (Create / Update) */
                <form onSubmit={handleSaveArt} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-700">Número da ART *</Label>
                    <Input
                      placeholder="Ex: ART-2026-009876"
                      value={artNumber}
                      onChange={(e) => setArtNumber(e.target.value)}
                      className="h-9 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-700">Engenheiro Responsável *</Label>
                      <Input
                        placeholder="Ex: Eng. Marcelo Rocha"
                        value={artEngineer}
                        onChange={(e) => setArtEngineer(e.target.value)}
                        className="h-9 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-700">Registro CREA *</Label>
                      <Input
                        placeholder="Ex: SP-50607080"
                        value={artCrea}
                        onChange={(e) => setArtCrea(e.target.value)}
                        className="h-9 rounded-xl text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-700">Data de Emissão</Label>
                      <Input
                        type="date"
                        value={artIssueDate}
                        onChange={(e) => setArtIssueDate(e.target.value)}
                        className="h-9 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-700">Arquivo PDF da ART</Label>
                      <Input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setArtFile(e.target.files?.[0])}
                        className="h-9 rounded-xl text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {isEditingArt && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingArt(false)}
                        className="flex-1 h-10 rounded-xl text-xs font-bold"
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={savingArt}
                      className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {order.art ? 'Salvar Alterações' : 'Emitir e Vincular ART'}
                    </Button>
                  </div>
                </form>
              )}
            </Card>

            {/* SEÇÃO 2: MULTI-CRUD DE VISITAS TÉCNICAS */}
            <Card className="p-6 rounded-2xl border border-gray-200 shadow-xs bg-white space-y-5 h-fit">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500/10 text-[#E2661D] rounded-xl">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight">Visitas Técnicas de Campo</h3>
                    <p className="text-xs text-gray-500">Agende, vincule e gerencie vistorias presenciais</p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowAddVisitModal(!showAddVisitModal)}
                  className="rounded-xl font-bold text-xs h-9 bg-[#E2661D] hover:bg-[#d05a18] text-white gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nova Visita
                </Button>
              </div>

              {/* Formulário Inline de Nova Visita Técnica (Create) */}
              {showAddVisitModal && (
                <form
                  onSubmit={handleCreateAndLinkVisit}
                  className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/70 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-[#E2661D]" /> Agendar Visita para esta OS
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddVisitModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-[11px] font-bold text-gray-700">Data e Hora *</Label>
                      <Input
                        type="datetime-local"
                        value={newVisitDate}
                        onChange={(e) => setNewVisitDate(e.target.value)}
                        className="h-8 rounded-lg text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-bold text-gray-700">Tipo da Visita</Label>
                      <select
                        value={newVisitType}
                        onChange={(e) => setNewVisitType(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-gray-300 text-xs bg-white font-medium"
                      >
                        <option value="PREVENTIVE">Manutenção Preventiva</option>
                        <option value="CORRECTIVE">Manutenção Corretiva</option>
                        <option value="EMERGENCY">Atendimento Emergencial</option>
                        <option value="INSPECTION">Inspeção Técnica</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-[11px] font-bold text-gray-700">Técnico Designado</Label>
                      <select
                        value={newVisitTechId}
                        onChange={(e) => setNewVisitTechId(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-gray-300 text-xs bg-white font-medium"
                      >
                        <option value="">Selecione um técnico...</option>
                        {usersCatalog.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-bold text-gray-700">Escopo / Descrição</Label>
                      <Input
                        placeholder="Ex: Troca de filtros e óleo"
                        value={newVisitDesc}
                        onChange={(e) => setNewVisitDesc(e.target.value)}
                        className="h-8 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddVisitModal(false)}
                      className="flex-1 h-8 rounded-lg text-xs font-bold"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={savingNewVisit || !newVisitDate}
                      className="flex-1 h-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold"
                    >
                      {savingNewVisit ? 'Salvando...' : 'Salvar e Vincular'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Lista de Visitas Técnicas Vinculadas (Read / Update / Delete) */}
              {(order.linkedVisits || []).length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200 text-gray-400 text-xs">
                  Nenhuma visita técnica vinculada a esta OS.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {order.linkedVisits!.map((link) => {
                    const v = link.technicalVisit;
                    const isDone = v?.status === 'COMPLETED';

                    return (
                      <div
                        key={link.id}
                        className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-gray-900">
                              {v?.visitDate ? formatDateBR(v.visitDate) : 'Data a definir'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-[#E2661D]">
                              {v?.visitType || 'Atendimento'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {v?.status || 'SCHEDULED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {v?.id ? `ID Visita: ${v.id.slice(0, 8)}...` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          {!isDone && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateVisitStatus(link.technicalVisitId, 'COMPLETED')}
                              className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                              Concluir
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlinkVisit(link.technicalVisitId)}
                            className="h-7 px-2 rounded-lg text-[11px] text-gray-500 hover:text-red-600 hover:bg-red-50"
                            title="Desvincular da OS"
                          >
                            Desvincular
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVisit(link.technicalVisitId)}
                            className="h-7 w-7 p-0 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Excluir Visita"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Seletor de Vinculação Rápida com Visitas Existentes */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <select
                  value={visitToLink}
                  onChange={(e) => setVisitToLink(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-xl border border-gray-300 text-xs bg-white font-medium"
                >
                  <option value="">Vincular visita existente do cliente...</option>
                  {clientVisits
                    .filter((v) => !(order.linkedVisits || []).some((l) => l.technicalVisitId === v.id))
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {formatDateBR(v.visitDate)} — {v.visitType} ({v.status})
                      </option>
                    ))}
                </select>
                <Button
                  size="sm"
                  disabled={!visitToLink || linkingVisit}
                  onClick={handleLinkVisit}
                  className="rounded-xl text-xs h-9 bg-gray-900 hover:bg-gray-800 text-white font-bold px-4"
                >
                  Vincular
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ======================================================== */}
      {/* MODAL 1: CADASTRO RÁPIDO DE PEÇA NO ESTOQUE (+)          */}
      {/* ======================================================== */}
      <Dialog open={showQuickProductModal} onOpenChange={setShowQuickProductModal}>
        <DialogContent className="max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E2661D]">
                <Package className="w-4 h-4" />
              </div>
              <span>Cadastrar Nova Peça no Estoque</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Cadastre a peça ou material para uso imediato nesta Ordem de Serviço sem sair da tela.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCreateProduct} className="space-y-3.5 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700">Nome da Peça / Produto *</Label>
              <Input
                required
                value={quickProdName}
                onChange={e => setQuickProdName(e.target.value)}
                placeholder="Ex: Filtro de Óleo Racor 1000FH"
                className="h-9 text-xs bg-white mt-1"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Código / SKU</Label>
                <Input
                  value={quickProdCode}
                  onChange={e => setQuickProdCode(e.target.value)}
                  placeholder="Ex: FIL-RAC-01"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-700">Unidade</Label>
                <select
                  value={quickProdUnit}
                  onChange={e => setQuickProdUnit(e.target.value)}
                  className="w-full h-9 text-xs rounded-lg border border-gray-300 bg-white px-2 mt-1"
                >
                  <option value="UN">UN (Unidade)</option>
                  <option value="PC">PC (Peça)</option>
                  <option value="JG">JG (Jogo)</option>
                  <option value="LT">LT (Litro)</option>
                  <option value="MT">MT (Metro)</option>
                  <option value="KG">KG (Quilo)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Custo (R$)</Label>
                <Input
                  value={quickProdCost}
                  onChange={e => setQuickProdCost(e.target.value)}
                  placeholder="Ex: 85,00"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-700">Venda (R$)</Label>
                <Input
                  value={quickProdPrice}
                  onChange={e => setQuickProdPrice(e.target.value)}
                  placeholder="Ex: 140,00"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-700">Estoque</Label>
                <Input
                  type="number"
                  value={quickProdStock}
                  onChange={e => setQuickProdStock(e.target.value)}
                  placeholder="10"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickProductModal(false)}
                className="text-xs h-9 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingQuickProd}
                className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs h-9 rounded-xl font-bold gap-1.5"
              >
                {savingQuickProd ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar e Selecionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 2: CADASTRO RÁPIDO DE SERVIÇO (+)                  */}
      {/* ======================================================== */}
      <Dialog open={showQuickServiceModal} onOpenChange={setShowQuickServiceModal}>
        <DialogContent className="max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E2661D]">
                <Wrench className="w-4 h-4" />
              </div>
              <span>Cadastrar Novo Serviço Especializado</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Adicione um novo serviço ao catálogo técnico para faturamento na O.S.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCreateService} className="space-y-3.5 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700">Título do Serviço *</Label>
              <Input
                required
                value={quickServTitle}
                onChange={e => setQuickServTitle(e.target.value)}
                placeholder="Ex: Troca de Filtros e Revisão de 250h"
                className="h-9 text-xs bg-white mt-1"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Código do Serviço</Label>
                <Input
                  value={quickServCode}
                  onChange={e => setQuickServCode(e.target.value)}
                  placeholder="Ex: SRV-REV-250"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-700">Preço Padrão (R$)</Label>
                <Input
                  value={quickServPrice}
                  onChange={e => setQuickServPrice(e.target.value)}
                  placeholder="Ex: 650,00"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">Escopo / Observações Padrão</Label>
              <Input
                value={quickServObs}
                onChange={e => setQuickServObs(e.target.value)}
                placeholder="Ex: Inclui checagem de chicotes, teste com carga e relatório."
                className="h-9 text-xs bg-white mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickServiceModal(false)}
                className="text-xs h-9 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingQuickServ}
                className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs h-9 rounded-xl font-bold gap-1.5"
              >
                {savingQuickServ ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar e Selecionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 3: CADASTRO RÁPIDO DE TÉCNICO / COLABORADOR (+)    */}
      {/* ======================================================== */}
      <Dialog open={showQuickUserModal} onOpenChange={setShowQuickUserModal}>
        <DialogContent className="max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E2661D]">
                <User className="w-4 h-4" />
              </div>
              <span>Cadastrar Novo Técnico / Colaborador</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Cadastre um técnico de campo para alocação direta de horas e cálculo do DRE.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCreateUser} className="space-y-3.5 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700">Nome Completo *</Label>
              <Input
                required
                value={quickUserName}
                onChange={e => setQuickUserName(e.target.value)}
                placeholder="Ex: Marcelo Oliveira"
                className="h-9 text-xs bg-white mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">E-mail Corporativo *</Label>
              <Input
                type="email"
                required
                value={quickUserEmail}
                onChange={e => setQuickUserEmail(e.target.value)}
                placeholder="marcelo@setgen.com.br"
                className="h-9 text-xs bg-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Especialidade / Cargo</Label>
                <Input
                  value={quickUserRole}
                  onChange={e => setQuickUserRole(e.target.value)}
                  placeholder="Ex: Técnico Mecânico"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-700">Taxa Horária (R$/h)</Label>
                <Input
                  value={quickUserRate}
                  onChange={e => setQuickUserRate(e.target.value)}
                  placeholder="Ex: 85,00"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickUserModal(false)}
                className="text-xs h-9 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingQuickUser}
                className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs h-9 rounded-xl font-bold gap-1.5"
              >
                {savingQuickUser ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar e Selecionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
