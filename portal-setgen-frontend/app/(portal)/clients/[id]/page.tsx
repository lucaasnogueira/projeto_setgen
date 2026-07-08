"use client"

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { clientsApi } from '@/lib/api/clients';
import { equipmentApi } from '@/lib/api/equipment';
import { Client, ClientStatus, IcmsTaxpayerType, UserRole, Equipment, EquipmentType } from '@/types';
import { useAuthStore } from '@/store/auth';
import { getStatusColor, formatDate } from '@/lib/utils';
import {
  Building2,
  MapPin,
  Edit,
  Trash2,
  Info,
  Users,
  History,
  Zap,
  Box,
  Plus,
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import { FieldBlock } from "@/components/ui/field-block";
import { InlineDeleteAction } from "@/components/ui/inline-delete-action";
import { useInlineDelete } from "@/lib/hooks/use-inline-delete";
import Link from 'next/link';

const ClientLocationView = dynamic(
  () => import('../components/ClientLocationView').then((m) => m.ClientLocationView),
  { ssr: false, loading: () => <div className="h-72 rounded-2xl bg-muted animate-pulse" /> },
);

const ICMS_LABELS: Record<IcmsTaxpayerType, string> = {
  [IcmsTaxpayerType.CONTRIBUINTE]: 'Contribuinte de ICMS',
  [IcmsTaxpayerType.ISENTO]: 'Isento',
  [IcmsTaxpayerType.NAO_CONTRIBUINTE]: 'Não Contribuinte',
};

const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.GENERATOR]: "Gerador",
  [EquipmentType.SUBSTATION]: "Subestação",
  [EquipmentType.OTHER]: "Outro",
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  [ClientStatus.ACTIVE]: 'Ativo',
  [ClientStatus.INACTIVE]: 'Inativo',
  [ClientStatus.DEFAULTER]: 'Inadimplente',
};

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(true);
  const {
    confirmId: confirmDeleteEquipmentId,
    deleting: deletingEquipment,
    requestDelete: requestDeleteEquipment,
    cancelDelete: cancelDeleteEquipment,
    confirmDelete: confirmDeleteEquipment,
  } = useInlineDelete(
    (id) => equipmentApi.delete(id),
    (id) => setEquipments((prev) => prev.filter((e) => e.id !== id))
  );

  useEffect(() => {
    if (params.id) {
      loadClient();
      loadEquipments();
    }
  }, [params.id]);

  const loadClient = async () => {
    try {
      const data = await clientsApi.getOne(params.id as string);
      setClient(data);
    } catch (error) {
      console.error('Error loading client:', error);
      alert('Erro ao carregar detalhes do cliente');
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  const loadEquipments = async () => {
    try {
      const data = await equipmentApi.getAll({ clientId: params.id as string });
      setEquipments(data);
    } catch (error) {
      console.error('Error loading equipments:', error);
    } finally {
      setLoadingEquipments(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      await clientsApi.delete(params.id as string);
      alert('Cliente excluído com sucesso!');
      router.push('/clients');
    } catch (error) {
      alert('Erro ao excluir cliente');
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) return null;

  const badges = [
    client.group && { label: client.group.name, cls: 'bg-orange-50 text-orange-700' },
    client.segment && { label: client.segment.name, cls: 'bg-status-blue-bg text-status-blue-fg' },
    client.responsibleTeam && { label: `Equipe: ${client.responsibleTeam.name}`, cls: 'bg-status-purple-bg text-status-purple-fg' },
    client.responsibleUser && { label: `Resp.: ${client.responsibleUser.name}`, cls: 'bg-muted text-text-secondary' },
  ].filter(Boolean) as { label: string; cls: string }[];

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={Building2}
        title={client.companyName}
        badge={{ label: STATUS_LABELS[client.status] || client.status, className: getStatusColor(client.status) }}
        meta={<>{client.cnpjCpf} · cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}</>}
        backLabel="Voltar para lista"
        onBack={() => router.back()}
        actions={
          <>
            <Link href={`/clients/${client.id}/edit`}>
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
          <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
          <TabsTrigger value="localizacao">Localização</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 overflow-hidden p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Contato e Identificação
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FieldBlock label="E-mail" value={client.email} />
                <FieldBlock
                  label="Status"
                  value={
                    <span className={`inline-block text-[11.5px] font-bold px-2.5 py-0.5 rounded-full ${getStatusColor(client.status)}`}>
                      {STATUS_LABELS[client.status] || client.status}
                    </span>
                  }
                />
                <FieldBlock label="Telefone" value={client.phone} />
                <FieldBlock label="CNPJ / CPF" value={client.cnpjCpf} />
                <FieldBlock label="Nome Fantasia" value={client.tradeName} />
                <FieldBlock label="Responsável no Local" value={client.onSiteContact} />
              </div>

              {(client.corporatePhones?.length || client.corporateEmails?.length) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 mt-4 border-t border-border">
                  {!!client.corporatePhones?.length && (
                    <FieldBlock label="Telefones Corporativos" value={client.corporatePhones.join(', ')} />
                  )}
                  {!!client.corporateEmails?.length && (
                    <FieldBlock label="E-mails Corporativos" value={client.corporateEmails.join(', ')} />
                  )}
                </div>
              ) : null}
            </Card>

            <Card className="overflow-hidden p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Resumo
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed pb-4 border-b border-border">
                {client.notes || 'Sem observações cadastradas para este cliente.'}
              </p>

              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 pb-4 border-b border-border">
                  {badges.map((b) => (
                    <span key={b.label} className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${b.cls}`}>
                      {b.label}
                    </span>
                  ))}
                </div>
              )}

              {client.externalCode && (
                <div className="pt-4 pb-4 border-b border-border">
                  <div className="text-[10.5px] font-bold tracking-wider text-text-muted uppercase mb-1">Código externo</div>
                  <div className="text-[14px] font-semibold text-foreground">{client.externalCode}</div>
                </div>
              )}

              <div className="pt-4">
                <div className="text-[10.5px] font-bold tracking-wider text-text-muted uppercase mb-1">Cliente desde</div>
                <div className="text-[14px] font-semibold text-foreground">
                  {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </Card>

            <Card className="md:col-span-2 overflow-hidden p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Dados de Cobrança
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FieldBlock label="Contribuinte do ICMS" value={client.icmsTaxpayerType ? ICMS_LABELS[client.icmsTaxpayerType] : undefined} />
                <FieldBlock label="E-mail de Cobrança" value={client.billingEmail} />
                <FieldBlock label="Inscrição Estadual" value={client.stateRegistration} />
                <FieldBlock label="Inscrição Municipal" value={client.municipalRegistration} />
              </div>
            </Card>

            {client.internalNotes && (
              <Card className="md:col-span-2 overflow-hidden p-6">
                <div className="text-[13.5px] font-bold text-foreground mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Observação Interna
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed">{client.internalNotes}</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="equipamentos" className="mt-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
              <div className="text-[13.5px] font-bold text-foreground">
                {equipments.length} equipamento{equipments.length !== 1 ? 's' : ''} cadastrado{equipments.length !== 1 ? 's' : ''}
              </div>
              <Button
                onClick={() => router.push(`/equipment/new?clientId=${client.id}`)}
                className="rounded-[9px] font-bold gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Equipamento
              </Button>
            </div>

            {loadingEquipments ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : equipments.length === 0 ? (
              <div className="p-12 text-center">
                <Zap className="h-9 w-9 text-border mx-auto mb-3" />
                <p className="text-[13.5px] text-text-secondary">Nenhum equipamento cadastrado para este cliente ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {equipments.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => router.push(`/equipment/${eq.id}`)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 bg-orange-50 text-orange-700">
                        {eq.type === EquipmentType.GENERATOR ? <Zap className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-foreground truncate">{eq.brand || 'Sem marca'} {eq.model}</div>
                        <div className="text-[11.5px] text-text-muted truncate">
                          {EQUIPMENT_TYPE_LABELS[eq.type]}
                          {eq.serialNumber && ` · SN: ${eq.serialNumber}`}
                          {` · cadastrado em ${formatDate(eq.createdAt)}`}
                        </div>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
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

        <TabsContent value="localizacao" className="mt-4">
          <Card className="overflow-hidden p-6">
            <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Localização
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FieldBlock
                label="Logradouro"
                value={
                  <>
                    {client.address?.street}, {client.address?.number}
                    {client.address?.complement && (
                      <span className="block text-[12px] text-text-muted italic font-normal mt-0.5">{client.address.complement}</span>
                    )}
                  </>
                }
              />
              <FieldBlock label="Bairro" value={client.address?.neighborhood} />
              <FieldBlock label="Cidade / Estado" value={`${client.address?.city || ''} - ${client.address?.state || ''}`} />
              <FieldBlock label="CEP" value={client.address?.cep} />
            </div>

            <div className="mt-6">
              <ClientLocationView latitude={client.latitude} longitude={client.longitude} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card className="overflow-hidden p-12 text-center">
            <History className="h-9 w-9 text-border mx-auto mb-3" />
            <p className="text-[13.5px] text-text-secondary">Nenhum registro de atividade para este cliente ainda.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
