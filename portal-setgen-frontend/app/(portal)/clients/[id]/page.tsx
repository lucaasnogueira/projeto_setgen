"use client"

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { clientsApi } from '@/lib/api/clients';
import { equipmentApi } from '@/lib/api/equipment';
import { visitsApi } from '@/lib/api/visits';
import { quotesApi } from '@/lib/api/quotes';
import {
  Client,
  ClientStatus,
  IcmsTaxpayerType,
  UserRole,
  Equipment,
  EquipmentType,
  TechnicalVisit,
  Quote,
} from '@/types';
import { useAuthStore } from '@/store/auth';
import {
  getStatusColor,
  formatDate,
  formatDateTime,
  formatCurrency,
  formatPhone,
  cn,
} from '@/lib/utils';
import {
  Building2,
  MapPin,
  Edit,
  Trash2,
  Users,
  History,
  Zap,
  Box,
  Plus,
  ArrowLeft,
  Wrench,
  FileText,
  ShieldCheck,
  Eye,
  Calendar,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusCard } from "@/components/ui/status-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FieldBlock } from "@/components/ui/field-block";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { QUOTE_STATUS_CONFIG, quoteStatusBadgeClass } from "@/lib/status-config";
import { toast } from "sonner";

const ClientLocationView = dynamic(
  () => import('../components/ClientLocationView').then((m) => m.ClientLocationView),
  { ssr: false, loading: () => <div className="h-72 rounded-2xl bg-muted animate-pulse flex items-center justify-center text-xs text-muted-foreground">Carregando mapa...</div> },
);

const ICMS_LABELS: Record<IcmsTaxpayerType, string> = {
  [IcmsTaxpayerType.CONTRIBUINTE]: 'Contribuinte de ICMS',
  [IcmsTaxpayerType.ISENTO]: 'Isento',
  [IcmsTaxpayerType.NAO_CONTRIBUINTE]: 'Não Contribuinte',
};

const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.GENERATOR]: 'Gerador',
  [EquipmentType.SUBSTATION]: 'Subestação',
  [EquipmentType.OTHER]: 'Outro',
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  [ClientStatus.ACTIVE]: 'Ativo',
  [ClientStatus.INACTIVE]: 'Inativo',
  [ClientStatus.DEFAULTER]: 'Inadimplente',
};

const VISIT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  EN_ROUTE: 'A Caminho',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  RESCHEDULED: 'Reagendada',
};

const VISIT_STATUS_CLASSES: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
  CONFIRMED: 'bg-sky-50 text-sky-700 border-sky-200',
  EN_ROUTE: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  RESCHEDULED: 'bg-purple-50 text-purple-700 border-purple-200',
};

const VISIT_TYPE_LABELS: Record<string, string> = {
  COMMERCIAL: 'Comercial',
  TECHNICAL: 'Técnica',
  MAINTENANCE: 'Manutenção',
};

const VISIT_TYPE_CLASSES: Record<string, string> = {
  COMMERCIAL: 'bg-blue-50 text-blue-700 border-blue-200',
  TECHNICAL: 'bg-purple-50 text-purple-700 border-purple-200',
  MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('visao-geral');

  // Equipamentos
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(true);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [savingEquipment, setSavingEquipment] = useState(false);
  const [newEqType, setNewEqType] = useState<EquipmentType>(EquipmentType.GENERATOR);
  const [newEqBrand, setNewEqBrand] = useState('');
  const [newEqModel, setNewEqModel] = useState('');
  const [newEqSerialNumber, setNewEqSerialNumber] = useState('');
  const [newEqPowerRating, setNewEqPowerRating] = useState('');
  const [newEqInstallLocation, setNewEqInstallLocation] = useState('');
  const [newEqNotes, setNewEqNotes] = useState('');

  // Visitas Técnicas
  const [visits, setVisits] = useState<TechnicalVisit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);

  // Orçamentos
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  const {
    confirmId: confirmDeleteEquipmentId,
    deleting: deletingEquipment,
    requestDelete: requestDeleteEquipment,
    cancelDelete: cancelDeleteEquipment,
    confirmDelete: confirmDeleteEquipment,
  } = useInlineDelete(
    (id) => equipmentApi.delete(id),
    (id) => {
      setEquipments((prev) => prev.filter((e) => e.id !== id));
      toast.success('Equipamento excluído com sucesso!');
    }
  );

  useEffect(() => {
    if (clientId) {
      loadAll();
    }
  }, [clientId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await clientsApi.getOne(clientId);
      setClient(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes do cliente:', error);
      toast.error('Erro ao carregar cliente');
      router.push('/clients');
      return;
    } finally {
      setLoading(false);
    }

    // Carregar em paralelo dados relacionados
    loadEquipments();
    loadVisits();
    loadQuotes();
  };

  const loadEquipments = async () => {
    setLoadingEquipments(true);
    try {
      const data = await equipmentApi.getAll({ clientId });
      setEquipments(data);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    } finally {
      setLoadingEquipments(false);
    }
  };

  const loadVisits = async () => {
    setLoadingVisits(true);
    try {
      const data = await visitsApi.getAll({ clientId });
      setVisits(data);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setLoadingVisits(false);
    }
  };

  const loadQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const data = await quotesApi.getAll({ clientId });
      setQuotes(data);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqBrand.trim() && !newEqModel.trim() && !newEqSerialNumber.trim()) {
      toast.error('Informe ao menos a marca, modelo ou número de série do equipamento.');
      return;
    }

    setSavingEquipment(true);
    try {
      const created = await equipmentApi.create({
        clientId,
        type: newEqType,
        brand: newEqBrand.trim() || undefined,
        model: newEqModel.trim() || undefined,
        serialNumber: newEqSerialNumber.trim() || undefined,
        powerRating: newEqPowerRating.trim() || undefined,
        installLocation: newEqInstallLocation.trim() || undefined,
        notes: newEqNotes.trim() || undefined,
      });
      setEquipments((prev) => [created, ...prev]);
      toast.success('Equipamento cadastrado e vinculado ao cliente com sucesso!');
      setNewEqBrand('');
      setNewEqModel('');
      setNewEqSerialNumber('');
      setNewEqPowerRating('');
      setNewEqInstallLocation('');
      setNewEqNotes('');
      setShowAddEquipmentModal(false);
    } catch (err: any) {
      console.error('Erro ao salvar equipamento:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao salvar equipamento.');
    } finally {
      setSavingEquipment(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) return;

    try {
      await clientsApi.delete(clientId);
      toast.success('Cliente excluído com sucesso!');
      router.push('/clients');
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER || user?.role === UserRole.ADMINISTRATIVE;
  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-xs text-slate-500 font-medium">Carregando dados do cliente...</p>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: 'Início', href: '/dashboard' },
          { label: 'Clientes', href: '/clients' },
          { label: client.companyName || 'Detalhes do Cliente' },
        ]}
        showHome
      />

      {/* 2. Client Header Padrão Setgen */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-start md:items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/50 shadow-xs">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-[#1B2834] truncate">
                {client.companyName}
              </h1>
              <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider', getStatusColor(client.status))}>
                {STATUS_LABELS[client.status] || client.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              {client.tradeName && <span className="font-semibold text-slate-700">{client.tradeName}</span>}
              {client.cnpjCpf && <span>• CNPJ/CPF: {client.cnpjCpf}</span>}
              {client.address?.city && <span>• {client.address.city}/{client.address.state}</span>}
              {client.createdAt && <span>• Cliente desde {formatDate(client.createdAt)}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => router.push('/clients')}
            className="rounded-xl font-semibold gap-2 border-gray-200 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          {canEdit && (
            <Link href={`/clients/${client.id}/edit`}>
              <Button className="rounded-xl font-semibold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs">
                <Edit className="h-4 w-4" />
                Editar Cliente
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
              className="rounded-xl font-semibold gap-2 shadow-xs"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* 3. 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          label="Equipamentos"
          value={equipments.length}
          description="Geradores e subestações"
          icon={Zap}
          variant="orange"
          onClick={() => setActiveTab('equipamentos')}
        />
        <StatusCard
          label="Visitas Técnicas"
          value={visits.length}
          description="Ordens de serviço vinculadas"
          icon={Wrench}
          variant="blue"
          onClick={() => setActiveTab('visitas')}
        />
        <StatusCard
          label="Orçamentos"
          value={quotes.length}
          description="Propostas comerciais"
          icon={FileText}
          variant="purple"
          onClick={() => setActiveTab('orcamentos')}
        />
        <StatusCard
          label="Status Cadastral"
          value={STATUS_LABELS[client.status] || client.status}
          description={client.segment?.name ? `Segmento: ${client.segment.name}` : (client.group?.name ? `Grupo: ${client.group.name}` : 'Cliente Setgen')}
          icon={ShieldCheck}
          variant={client.status === ClientStatus.ACTIVE ? 'emerald' : client.status === ClientStatus.DEFAULTER ? 'amber' : 'red'}
          onClick={() => setActiveTab('visao-geral')}
        />
      </div>

      {/* 4. Tabs Aurora Setgen */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white p-1 rounded-xl border border-gray-200/80 shadow-xs flex flex-wrap h-auto gap-1">
          <TabsTrigger value="visao-geral" className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Building2 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="equipamentos" className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Zap className="h-4 w-4" />
            Equipamentos
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 data-[state=active]:bg-white/20 data-[state=active]:text-white font-bold">
              {equipments.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="visitas" className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Wrench className="h-4 w-4" />
            Visitas Técnicas
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 data-[state=active]:bg-white/20 data-[state=active]:text-white font-bold">
              {visits.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="orcamentos" className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            Orçamentos
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 data-[state=active]:bg-white/20 data-[state=active]:text-white font-bold">
              {quotes.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <History className="h-4 w-4" />
            Histórico & Auditoria
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VISÃO GERAL */}
        <TabsContent value="visao-geral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dados Cadastrais e Fiscais */}
            <Card className="p-6 space-y-4 rounded-2xl border-gray-200/80 shadow-xs">
              <div className="text-[14px] font-bold text-foreground flex items-center gap-2 pb-2 border-b border-gray-100">
                <Building2 className="h-4 w-4 text-primary" />
                Dados Cadastrais e Fiscais
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldBlock label="Razão Social" value={client.companyName} />
                <FieldBlock label="Nome Fantasia" value={client.tradeName || '—'} />
                <FieldBlock label="CNPJ / CPF" value={client.cnpjCpf} />
                <FieldBlock
                  label="Status Cadastral"
                  value={
                    <span className={cn('inline-block text-[11.5px] font-bold px-2.5 py-0.5 rounded-full', getStatusColor(client.status))}>
                      {STATUS_LABELS[client.status] || client.status}
                    </span>
                  }
                />
                <FieldBlock
                  label="Contribuinte ICMS"
                  value={client.icmsTaxpayerType ? ICMS_LABELS[client.icmsTaxpayerType] : '—'}
                />
                <FieldBlock label="Inscrição Estadual" value={client.stateRegistration || '—'} />
                <FieldBlock label="Inscrição Municipal" value={client.municipalRegistration || '—'} />
                <FieldBlock label="Código Externo" value={client.externalCode || '—'} />
              </div>
            </Card>

            {/* Canais de Contato */}
            <Card className="p-6 space-y-4 rounded-2xl border-gray-200/80 shadow-xs">
              <div className="text-[14px] font-bold text-foreground flex items-center gap-2 pb-2 border-b border-gray-100">
                <Users className="h-4 w-4 text-primary" />
                Canais de Contato
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldBlock label="Contato no Local" value={client.onSiteContact || '—'} />
                <FieldBlock label="E-mail Principal" value={client.email || '—'} />
                <FieldBlock label="Telefone Principal" value={client.phone ? formatPhone(client.phone) : '—'} />
                <FieldBlock label="E-mail de Cobrança" value={client.billingEmail || '—'} />
                {!!client.corporatePhones?.length && (
                  <div className="sm:col-span-2">
                    <FieldBlock label="Telefones Corporativos" value={client.corporatePhones.join(', ')} />
                  </div>
                )}
                {!!client.corporateEmails?.length && (
                  <div className="sm:col-span-2">
                    <FieldBlock label="E-mails Corporativos" value={client.corporateEmails.join(', ')} />
                  </div>
                )}
              </div>
            </Card>

            {/* Localização e Endereço */}
            <Card className="p-6 space-y-4 rounded-2xl border-gray-200/80 shadow-xs md:col-span-2">
              <div className="text-[14px] font-bold text-foreground flex items-center gap-2 pb-2 border-b border-gray-100">
                <MapPin className="h-4 w-4 text-primary" />
                Endereço e Localização
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <FieldBlock
                  label="Logradouro"
                  value={
                    client.address?.street
                      ? `${client.address.street}, ${client.address?.number || 'S/N'}`
                      : '—'
                  }
                />
                <FieldBlock label="Complemento" value={client.address?.complement || '—'} />
                <FieldBlock label="Bairro" value={client.address?.neighborhood || '—'} />
                <FieldBlock
                  label="Cidade / UF"
                  value={client.address?.city ? `${client.address.city} - ${client.address.state || ''}` : '—'}
                />
                <FieldBlock label="CEP" value={client.address?.cep || '—'} />
                {client.latitude && client.longitude && (
                  <FieldBlock label="Coordenadas GPS" value={`${client.latitude.toFixed(6)}, ${client.longitude.toFixed(6)}`} />
                )}
              </div>

              <div className="pt-2">
                <ClientLocationView latitude={client.latitude} longitude={client.longitude} />
              </div>
            </Card>

            {/* Classificação, Equipe e Observações */}
            <Card className="p-6 space-y-4 rounded-2xl border-gray-200/80 shadow-xs md:col-span-2">
              <div className="text-[14px] font-bold text-foreground flex items-center gap-2 pb-2 border-b border-gray-100">
                <Layers className="h-4 w-4 text-primary" />
                Classificação, Equipe e Observações
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <FieldBlock label="Grupo" value={client.group?.name || 'Não categorizado'} />
                <FieldBlock label="Segmento" value={client.segment?.name || 'Não categorizado'} />
                <FieldBlock label="Equipe Responsável" value={client.responsibleTeam?.name || 'Não atribuída'} />
                <FieldBlock label="Responsável Interno" value={client.responsibleUser?.name || 'Não atribuído'} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações Gerais</p>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {client.notes || 'Nenhuma observação geral registrada.'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Observações Internas (Restritas)</p>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {client.internalNotes || 'Nenhuma observação interna cadastrada.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: EQUIPAMENTOS */}
        <TabsContent value="equipamentos" className="space-y-4">
          <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-white">
              <div>
                <h3 className="text-sm font-bold text-[#1B2834]">
                  Equipamentos Vinculados ({equipments.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Geradores, subestações e equipamentos operados no cliente
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowAddEquipmentModal(true)}
                  className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  Novo Equipamento
                </Button>
                <Link href={`/equipment/new?clientId=${client.id}`}>
                  <Button variant="outline" className="rounded-xl font-semibold gap-1.5 text-xs border-gray-200">
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    Formulário Completo
                  </Button>
                </Link>
              </div>
            </div>

            {loadingEquipments ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : equipments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Nenhum equipamento vinculado</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Este cliente ainda não possui equipamentos cadastrados. Clique no botão abaixo para adicionar o primeiro gerador ou subestação.
                </p>
                <Button
                  onClick={() => setShowAddEquipmentModal(true)}
                  className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro Equipamento
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {equipments.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => router.push(`/equipment/${eq.id}`)}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#FFF3EC] text-[#E2661D] border border-orange-100">
                        {eq.type === EquipmentType.GENERATOR ? <Zap className="h-5 w-5" /> : <Box className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#1B2834]">
                            {eq.brand || 'Sem marca'} {eq.model || 'Sem modelo'}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {EQUIPMENT_TYPE_LABELS[eq.type]}
                          </span>
                          {eq.powerRating && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
                              ⚡ {eq.powerRating}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                          {eq.serialNumber && <span>S/N: <strong className="text-slate-700">{eq.serialNumber}</strong></span>}
                          {eq.installLocation && <span>• Local: {eq.installLocation}</span>}
                          {eq.createdAt && <span>• Cadastrado em {formatDate(eq.createdAt)}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                      <InlineDeleteAction
                        confirming={confirmDeleteEquipmentId === eq.id}
                        deleting={deletingEquipment}
                        onView={() => router.push(`/equipment/${eq.id}`)}
                        onEdit={() => router.push(`/equipment/${eq.id}/edit`)}
                        onRequestDelete={() => requestDeleteEquipment(eq.id)}
                        onConfirmDelete={() => confirmDeleteEquipment(eq.id)}
                        onCancelDelete={cancelDeleteEquipment}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 3: VISITAS TÉCNICAS */}
        <TabsContent value="visitas" className="space-y-4">
          <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-white">
              <div>
                <h3 className="text-sm font-bold text-[#1B2834]">
                  Visitas Técnicas ({visits.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Histórico de ordens de serviço em campo e manutenções
                </p>
              </div>
              <Button
                onClick={() => router.push(`/visits/new?clientId=${client.id}`)}
                className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Nova Visita
              </Button>
            </div>

            {loadingVisits ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : visits.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Wrench className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Nenhuma visita técnica registrada</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Nenhuma ordem de serviço ou visita preventiva/corretiva foi agendada para este cliente ainda.
                </p>
                <Button
                  onClick={() => router.push(`/visits/new?clientId=${client.id}`)}
                  className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Agendar Primeira Visita
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data da Visita</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Técnico Responsável</TableHead>
                      <TableHead>Descrição / Local</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((v) => (
                      <TableRow
                        key={v.id}
                        className="cursor-pointer hover:bg-slate-50/70"
                        onClick={() => router.push(`/visits/${v.id}`)}
                      >
                        <TableCell className="font-semibold text-xs text-[#1B2834]">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {v.visitDate ? formatDate(v.visitDate) : '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full border', VISIT_TYPE_CLASSES[v.visitType] || 'bg-slate-100 text-slate-700')}>
                            {VISIT_TYPE_LABELS[v.visitType] || v.visitType}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full border', VISIT_STATUS_CLASSES[v.status || 'SCHEDULED'] || 'bg-slate-100 text-slate-700')}>
                            {VISIT_STATUS_LABELS[v.status || 'SCHEDULED'] || v.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {v.technician?.name || 'Não atribuído'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                          {v.description || v.location || '—'}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/visits/${v.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-semibold text-slate-600 hover:text-primary">
                                <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                              </Button>
                            </Link>
                            <Link href={`/visits/${v.id}/edit`}>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-semibold text-slate-600 hover:text-primary">
                                <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 4: ORÇAMENTOS */}
        <TabsContent value="orcamentos" className="space-y-4">
          <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-white">
              <div>
                <h3 className="text-sm font-bold text-[#1B2834]">
                  Orçamentos e Propostas ({quotes.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Propostas comerciais e contratos emitidos para o cliente
                </p>
              </div>
              <Button
                onClick={() => router.push(`/quotes/new?clientId=${client.id}`)}
                className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Novo Orçamento
              </Button>
            </div>

            {loadingQuotes ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : quotes.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Nenhum orçamento cadastrado</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Este cliente ainda não tem propostas comerciais cadastradas. Gere uma proposta agora mesmo.
                </p>
                <Button
                  onClick={() => router.push(`/quotes/new?clientId=${client.id}`)}
                  className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Orçamento
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Escopo / Descrição</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado Em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((q) => {
                      const total = q.quoteLines?.reduce((sum: number, l: any) => sum + (Number(l.totalValue) || 0), 0) ?? 0;
                      const statusCfg = QUOTE_STATUS_CONFIG[q.status];
                      return (
                        <TableRow
                          key={q.id}
                          className="cursor-pointer hover:bg-slate-50/70"
                          onClick={() => router.push(`/quotes/${q.id}`)}
                        >
                          <TableCell className="font-bold text-xs text-[#1B2834]">
                            {q.quoteNumber}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                            {q.scope || q.requestedServices || '—'}
                          </TableCell>
                          <TableCell className="font-bold text-xs text-emerald-700">
                            {formatCurrency(total)}
                          </TableCell>
                          <TableCell>
                            <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1', quoteStatusBadgeClass(q.status))}>
                              {statusCfg?.label || q.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatDate(q.createdAt)}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/quotes/${q.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-semibold text-slate-600 hover:text-primary">
                                  <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                                </Button>
                              </Link>
                              <Link href={`/quotes/${q.id}/edit`}>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-semibold text-slate-600 hover:text-primary">
                                  <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 5: HISTÓRICO & AUDITORIA */}
        <TabsContent value="historico" className="space-y-4">
          <Card className="p-6 rounded-2xl border-gray-200/80 shadow-xs space-y-4">
            <div className="text-[14px] font-bold text-foreground flex items-center gap-2 pb-2 border-b border-gray-100">
              <History className="h-4 w-4 text-primary" />
              Registro de Auditoria e Metadados
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FieldBlock label="Cadastrado em" value={formatDateTime(client.createdAt)} />
              <FieldBlock label="Última Atualização" value={formatDateTime(client.updatedAt)} />
              <FieldBlock label="ID do Cliente (UUID)" value={<code className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">{client.id}</code>} />
              <FieldBlock label="Código Externo" value={client.externalCode || 'Sem código externo'} />
              <FieldBlock label="Status no Sistema" value={STATUS_LABELS[client.status]} />
              <FieldBlock
                label="Resumo de Vínculos"
                value={`${equipments.length} Equipamento(s) • ${visits.length} Visita(s) • ${quotes.length} Orçamento(s)`}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Dialog Inline para Adicionar Equipamento Rápido */}
      <Dialog open={showAddEquipmentModal} onOpenChange={setShowAddEquipmentModal}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B2834] flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Adicionar Equipamento ao Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              O equipamento será automaticamente vinculado a <strong>{client.companyName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEquipment} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipo de Equipamento *</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={newEqType}
                  onChange={(e) => setNewEqType(e.target.value as EquipmentType)}
                >
                  <option value={EquipmentType.GENERATOR}>Gerador</option>
                  <option value={EquipmentType.SUBSTATION}>Subestação</option>
                  <option value={EquipmentType.OTHER}>Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Marca</label>
                <Input
                  placeholder="Ex: Cummins, Stemac, MWM"
                  value={newEqBrand}
                  onChange={(e) => setNewEqBrand(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Modelo</label>
                <Input
                  placeholder="Ex: C150D6, GTA 26"
                  value={newEqModel}
                  onChange={(e) => setNewEqModel(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Número de Série / Chassi</label>
                <Input
                  placeholder="Ex: SN-2024-9872"
                  value={newEqSerialNumber}
                  onChange={(e) => setNewEqSerialNumber(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Potência</label>
                <Input
                  placeholder="Ex: 250 kVA / 200 kW"
                  value={newEqPowerRating}
                  onChange={(e) => setNewEqPowerRating(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Local de Instalação</label>
                <Input
                  placeholder="Ex: Subsolo 1, Casa de Máquinas"
                  value={newEqInstallLocation}
                  onChange={(e) => setNewEqInstallLocation(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Observações Técnicas</label>
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[70px]"
                value={newEqNotes}
                onChange={(e) => setNewEqNotes(e.target.value)}
                placeholder="Detalhes específicos do equipamento, horímetro inicial, etc..."
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddEquipmentModal(false)}
                className="rounded-xl font-semibold border-gray-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingEquipment}
                className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white gap-2"
              >
                {savingEquipment ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Cadastrar Equipamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
