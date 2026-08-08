"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { visitsApi } from '@/lib/api/visits';
import { ServiceOrder, UserRole, ServiceOrderStatus, ServiceOrderAuditLogEntry, TechnicalVisit } from '@/types';
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
  X
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import Link from 'next/link';
import { StatusTimeline } from '../components/StatusTimeline';
import { StatusManager } from '../components/StatusManager';
import { ArtCard } from '../components/ArtCard';
import { SERVICE_ORDER_STATUS_CONFIG, QUOTE_STATUS_CONFIG, serviceOrderStatusBadgeClass } from '@/lib/status-config';

const PUBLIC_QUOTE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function InfoRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 p-2 bg-primary/10 rounded-lg shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">{label}</p>
        <div className="text-foreground font-medium text-[13.5px]">{children}</div>
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLog, setAuditLog] = useState<ServiceOrderAuditLogEntry[]>([]);
  const [clientVisits, setClientVisits] = useState<TechnicalVisit[]>([]);
  const [visitToLink, setVisitToLink] = useState('');
  const [linkingVisit, setLinkingVisit] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const data = await ordersApi.getById(params.id as string);
      setOrder(data);
      const history = await ordersApi.getAuditLog(params.id as string);
      setAuditLog(history);
      if (data.clientId) {
        visitsApi.getAll({ clientId: data.clientId }).then(setClientVisits).catch(() => setClientVisits([]));
      }
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Erro ao carregar detalhes da OS');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkVisit = async () => {
    if (!visitToLink || !order) return;
    setLinkingVisit(true);
    try {
      await ordersApi.linkVisit(order.id, visitToLink);
      const data = await ordersApi.getById(order.id);
      setOrder(data);
      setVisitToLink('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao vincular visita');
    } finally {
      setLinkingVisit(false);
    }
  };

  const handleUnlinkVisit = async (visitId: string) => {
    if (!order) return;
    try {
      await ordersApi.unlinkVisit(order.id, visitId);
      setOrder({ ...order, linkedVisits: (order.linkedVisits || []).filter((v) => v.technicalVisitId !== visitId) });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao desvincular visita');
    }
  };

  const handleStatusChange = async (newStatus: ServiceOrderStatus, comments?: string) => {
    try {
      const updatedOrder = await ordersApi.updateStatus(params.id as string, newStatus, comments);
      setOrder(updatedOrder);
      const history = await ordersApi.getAuditLog(params.id as string);
      setAuditLog(history);
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta OS?')) return;

    try {
      await ordersApi.delete(params.id as string);
      alert('OS excluída com sucesso!');
      router.push('/orders');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir OS');
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

  if (!order) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={FileText}
        tone="blue"
        title={`OS #${order.orderNumber}`}
        badge={{ label: SERVICE_ORDER_STATUS_CONFIG[order.status].label, className: serviceOrderStatusBadgeClass(order.status) }}
        meta={<>{order.client?.companyName}</>}
        backLabel="Voltar para lista"
        onBack={() => router.back()}
        actions={
          <>
            <a href={`${PUBLIC_QUOTE_BASE_URL}/public/quotes/${order.quoteId}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-[9px] font-bold gap-2">
                <ExternalLink className="h-4 w-4" />
                Visualizar Orçamento
              </Button>
            </a>
            <Link href={`/orders/${order.id}/edit`}>
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

      {order.quote && (
        <Link href={`/quotes/${order.quote.id}`}>
          <Card className="p-4 flex items-center gap-3 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[13px] text-text-secondary">
              Gerada a partir do orçamento <span className="font-bold text-foreground">#{order.quote.quoteNumber}</span>
              {order.quote.quoteLines && order.quote.quoteLines.length > 0 && (
                <> · {order.quote.quoteLines.reduce((s, l) => s + Number(l.totalValue), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</>
              )}
            </p>
          </Card>
        </Link>
      )}

      <Tabs defaultValue="execucao">
        <TabsList>
          <TabsTrigger value="execucao">Execução</TabsTrigger>
          <TabsTrigger value="status">Status & Prazo</TabsTrigger>
          <TabsTrigger value="art">ART & Visitas</TabsTrigger>
          {auditLog.length > 0 && <TabsTrigger value="historico">Histórico</TabsTrigger>}
        </TabsList>

        <TabsContent value="execucao" className="mt-4 space-y-4">
          {order.quote?.scope && (
            <Card className="p-6 space-y-2">
              <div className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Escopo Aprovado
              </div>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap p-4 rounded-xl bg-muted/40 border border-border text-[13.5px]">
                {order.quote.scope}
              </p>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="p-6 pb-0 text-[13.5px] font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Materiais e Produtos Utilizados
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead className="bg-muted/40 border-y border-border">
                  <tr>
                    <th className="text-left py-3 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wider">Produto</th>
                    <th className="text-right py-3 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wider">Qtd</th>
                    <th className="text-right py-3 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wider">V. Unit</th>
                    <th className="text-right py-3 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(!order.items || order.items.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-text-muted italic text-[13px]">
                        Nenhum material registrado para esta OS.
                      </td>
                    </tr>
                  ) : (
                    order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Tag className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-[13px]">{item.product?.name}</p>
                              <p className="text-[11.5px] text-text-muted">{item.product?.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-right font-medium text-text-secondary text-[13px]">
                          {item.quantity} {item.product?.unit}
                        </td>
                        <td className="py-3.5 px-6 text-right text-text-secondary text-[13px]">
                          {Number(item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3.5 px-6 text-right font-bold text-primary text-[13px]">
                          {Number(item.totalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {order.items && order.items.length > 0 && (
                  <tfoot className="bg-primary/5">
                    <tr>
                      <td colSpan={3} className="py-4 px-6 text-right font-bold text-text-secondary text-[13px]">Custo Total de Materiais:</td>
                      <td className="py-4 px-6 text-right text-[17px] font-black text-primary">
                        {order.items.reduce((acc, i) => acc + Number(i.totalPrice), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>

          {order.checklist && order.checklist.length > 0 && (
            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Checklist de Execução
              </div>
              <div className="space-y-3">
                {order.checklist.map((item: any, index: number) => (
                  <div key={item.id ?? index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                    <div className={`p-1 rounded-full ${item.completed ? 'bg-status-green-bg text-status-green-fg' : 'bg-muted text-text-muted'}`}>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <span className={`text-[13px] ${item.completed ? 'text-text-muted line-through' : 'text-foreground font-medium'}`}>
                        {item.label ?? item.item}
                      </span>
                      {item.answer !== undefined && item.answer !== null && item.answer !== '' && (
                        <p className="text-[11.5px] text-text-muted mt-0.5">Resposta: {String(item.answer)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="status" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 space-y-5 h-fit">
              <div className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Informações Gerais
              </div>

              <div className="space-y-4">
                <InfoRow icon={Clock} label="Prazo">
                  {order.deadline ? new Date(order.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                </InfoRow>
                <InfoRow icon={User} label="Criado por">{order.createdBy?.name || 'Sistema'}</InfoRow>
                <InfoRow icon={Calendar} label="Data de Criação">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</InfoRow>
                {order.responsibleIds && order.responsibleIds.length > 0 && (
                  <InfoRow icon={User} label="Equipe Responsável">{order.responsibleIds.length} técnico(s)</InfoRow>
                )}
                {order.requiredResources?.team && order.requiredResources.team.length > 0 && (
                  <InfoRow icon={Wrench} label="Ferramentas">{order.requiredResources.team.join(', ')}</InfoRow>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-text-muted font-bold uppercase">Progresso</p>
                  <p className="text-[13px] font-bold text-primary">{order.progress || 0}%</p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${order.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-6">
                <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Linha do Tempo
                </div>
                <StatusTimeline currentStatus={order.status} />
              </Card>

              {user && (
                <StatusManager
                  currentStatus={order.status}
                  userRole={user.role}
                  onStatusChange={handleStatusChange}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="art" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ArtCard
              serviceOrderId={order.id}
              art={order.art}
              onIssued={(art) => setOrder({ ...order, art })}
            />

            <Card className="p-6 space-y-4">
              <div className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Visitas Vinculadas
              </div>

              {(order.linkedVisits || []).length === 0 ? (
                <p className="text-[13px] text-text-muted italic">Nenhuma visita adicional vinculada.</p>
              ) : (
                <div className="space-y-2">
                  {order.linkedVisits!.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                      <div className="text-[13px]">
                        <p className="font-semibold text-foreground">
                          {link.technicalVisit?.visitDate ? new Date(link.technicalVisit.visitDate).toLocaleDateString('pt-BR') : '-'}
                        </p>
                        <p className="text-[11.5px] text-text-muted">{link.technicalVisit?.status}</p>
                      </div>
                      <button
                        onClick={() => handleUnlinkVisit(link.technicalVisitId)}
                        className="text-text-muted hover:text-status-red-fg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-border">
                <select
                  value={visitToLink}
                  onChange={(e) => setVisitToLink(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl border border-border text-[13px] bg-background"
                >
                  <option value="">Selecione uma visita do cliente</option>
                  {clientVisits
                    .filter((v) => !(order.linkedVisits || []).some((l) => l.technicalVisitId === v.id))
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {new Date(v.visitDate).toLocaleDateString('pt-BR')} — {v.visitType}
                      </option>
                    ))}
                </select>
                <Button size="sm" disabled={!visitToLink || linkingVisit} onClick={handleLinkVisit} className="rounded-xl">
                  Vincular
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {auditLog.length > 0 && (
          <TabsContent value="historico" className="mt-4">
            <Card className="p-6 space-y-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl border border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-bold text-foreground">
                        {entry.changes?.from && entry.changes?.to
                          ? `${SERVICE_ORDER_STATUS_CONFIG[entry.changes.from as ServiceOrderStatus]?.label || entry.changes.from} → ${SERVICE_ORDER_STATUS_CONFIG[entry.changes.to as ServiceOrderStatus]?.label || entry.changes.to}`
                          : entry.action}
                      </span>
                    </div>
                    {entry.changes?.comments && (
                      <p className="text-[13px] text-text-secondary italic mt-1">{entry.changes.comments}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[11.5px] text-text-muted">
                      <User className="h-3 w-3" />
                      {entry.user?.name || 'Sistema'}
                      <span>·</span>
                      <Calendar className="h-3 w-3" />
                      {new Date(entry.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
