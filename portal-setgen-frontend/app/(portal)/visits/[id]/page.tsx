"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import {
  ClipboardList,
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
  Info,
  CheckCircle,
  HardHat,
  Navigation,
  LogOut,
  AlertTriangle,
  Tag,
  Hash,
  DollarSign,
  Zap,
  Paperclip,
  FileText
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import Link from 'next/link';

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-muted text-text-secondary',
  MEDIUM: 'bg-status-amber-bg text-status-amber-fg',
  HIGH: 'bg-status-red-bg text-status-red-fg',
};

function InfoRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 p-2 bg-status-purple-bg rounded-lg shrink-0">
        <Icon className="h-4 w-4 text-status-purple-fg" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">{label}</p>
        <div className="text-foreground font-medium text-[13.5px]">{children}</div>
      </div>
    </div>
  );
}

export default function VisitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [visit, setVisit] = useState<TechnicalVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadVisit();
    }
  }, [params.id]);

  const loadVisit = async () => {
    try {
      const data = await visitsApi.getOne(params.id as string);
      setVisit(data);
    } catch (error) {
      console.error('Error loading visit:', error);
      alert('Erro ao carregar detalhes da visita');
      router.push('/visits');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta visita?')) return;

    try {
      await visitsApi.delete(params.id as string);
      alert('Visita excluída com sucesso!');
      router.push('/visits');
    } catch (error) {
      alert('Erro ao excluir visita');
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada neste navegador'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
      });
    });
  };

  const geoErrorMessage = (error: GeolocationPositionError) => {
    if (error.code === error.PERMISSION_DENIED) {
      return 'Permissão de localização negada. Habilite o acesso à localização no navegador.';
    }
    if (error.code === error.TIMEOUT) {
      return 'Tempo esgotado ao obter localização. Tente novamente.';
    }
    return 'Não foi possível obter a localização.';
  };

  const handleCheckin = async () => {
    setGeoError(null);
    setCheckinLoading(true);
    try {
      const position = await getCurrentPosition();
      const updated = await visitsApi.checkin(params.id as string, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setVisit(updated);
    } catch (error: any) {
      setGeoError(
        error instanceof GeolocationPositionError
          ? geoErrorMessage(error)
          : error?.response?.data?.message || error?.message || 'Erro ao fazer checkin',
      );
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleCheckout = async () => {
    setGeoError(null);
    setCheckoutLoading(true);
    try {
      const position = await getCurrentPosition();
      const updated = await visitsApi.checkout(params.id as string, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setVisit(updated);
    } catch (error: any) {
      setGeoError(
        error instanceof GeolocationPositionError
          ? geoErrorMessage(error)
          : error?.response?.data?.message || error?.message || 'Erro ao fazer checkout',
      );
    } finally {
      setCheckoutLoading(false);
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

  if (!visit) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={ClipboardList}
        tone="purple"
        title={visit.client?.companyName || 'Visita técnica'}
        meta={<><Calendar className="h-3.5 w-3.5" />{new Date(visit.visitDate).toLocaleString('pt-BR')}</>}
        backLabel="Voltar para lista"
        onBack={() => router.back()}
        actions={
          <>
            <Link href={`/visits/${visit.id}/edit`}>
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
          {visit.checklist && visit.checklist.length > 0 && (
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          )}
          <TabsTrigger value="checkin">Check-in / Check-out</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 p-6 space-y-5 h-fit">
              <div className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-status-purple-fg" />
                Descrição e Detalhes
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Descrição Técnica</h4>
                <p className="text-[13.5px] text-foreground leading-relaxed whitespace-pre-wrap">{visit.description}</p>
              </div>

              {visit.userReport && (
                <div>
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Relato do Cliente</h4>
                  <p className="text-[13.5px] text-foreground leading-relaxed whitespace-pre-wrap">{visit.userReport}</p>
                </div>
              )}

              {visit.notes && (
                <div>
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Observações Adicionais</h4>
                  <p className="text-[13.5px] text-foreground leading-relaxed whitespace-pre-wrap italic bg-muted/40 p-4 rounded-xl border border-border">
                    "{visit.notes}"
                  </p>
                </div>
              )}

              {!!visit.attachmentsData?.length && (
                <div>
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" /> Evidências e Anexos
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {visit.attachmentsData.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-xl border border-border overflow-hidden hover:border-status-purple-fg transition-colors"
                      >
                        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                          {/^https?:\/\/.+\.(jpe?g|png|gif|webp)(\?|$)/i.test(att.url) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={att.url} alt={att.legend || 'Anexo'} className="h-full w-full object-cover" />
                          ) : (
                            <FileText className="h-6 w-6 text-text-muted" />
                          )}
                        </div>
                        {att.legend && (
                          <p className="text-[11px] text-text-secondary px-2 py-1.5 truncate">{att.legend}</p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <div className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-status-purple-fg" />
                Informações
              </div>

              <InfoRow icon={HardHat} label="Técnico">{visit.technician?.name || 'Não informado'}</InfoRow>
              <InfoRow icon={Clock} label="Tipo de Visita">{visit.visitType}</InfoRow>
              <InfoRow icon={MapPin} label="Localização">{visit.location}</InfoRow>

              {visit.priority && (
                <InfoRow icon={AlertTriangle} label="Prioridade">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${PRIORITY_COLORS[visit.priority]}`}>
                    {PRIORITY_LABELS[visit.priority]}
                  </span>
                </InfoRow>
              )}

              {visit.taskType && (
                <InfoRow icon={Tag} label="Tipo de Tarefa">{visit.taskType.name}</InfoRow>
              )}

              {visit.externalCode && (
                <InfoRow icon={Hash} label="Código Externo">{visit.externalCode}</InfoRow>
              )}

              {visit.actualValue != null && (
                <InfoRow icon={DollarSign} label="Valor da Tarefa">
                  {Number(visit.actualValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </InfoRow>
              )}

              {visit.equipments && visit.equipments.length > 0 && (
                <InfoRow icon={Zap} label="Equipamentos">
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {visit.equipments.map((link) => (
                      <span key={link.id} className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-purple-bg text-status-purple-fg">
                        {link.equipment?.brand} {link.equipment?.model}
                      </span>
                    ))}
                  </div>
                </InfoRow>
              )}
            </Card>
          </div>
        </TabsContent>

        {visit.checklist && visit.checklist.length > 0 && (
          <TabsContent value="checklist" className="mt-4">
            <Card className="p-6 space-y-3">
              {visit.checklist.map((item: any, index: number) => (
                <div key={item.id ?? index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className={`p-1 rounded-full ${item.completed ? 'bg-status-green-bg text-status-green-fg' : 'bg-muted text-text-muted'}`}>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className={`text-[13.5px] ${item.completed ? 'text-text-muted line-through' : 'text-foreground font-medium'}`}>
                      {item.label}
                    </span>
                    {item.answer !== undefined && item.answer !== null && item.answer !== '' && (
                      <p className="text-[11.5px] text-text-muted mt-0.5">Resposta: {String(item.answer)}</p>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </TabsContent>
        )}

        <TabsContent value="checkin" className="mt-4">
          <Card className="p-6 space-y-4 max-w-lg">
            <div className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
              <Navigation className="h-4 w-4 text-status-purple-fg" />
              Checkin / Checkout
            </div>

            {geoError && (
              <p className="text-[13px] text-status-red-fg bg-status-red-bg border border-status-red-fg/20 rounded-lg p-3">
                {geoError}
              </p>
            )}

            {visit.checkinAt ? (
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-status-green-bg rounded-lg">
                  <Navigation className="h-4 w-4 text-status-green-fg" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Checkin</p>
                  <p className="text-foreground font-medium text-[13.5px]">{new Date(visit.checkinAt).toLocaleString('pt-BR')}</p>
                  {visit.checkinDistanceMeters != null && (
                    <p className="text-[11.5px] text-text-muted mt-0.5">{visit.checkinDistanceMeters}m de distância do endereço do cliente</p>
                  )}
                  {visit.checkinImprecise && (
                    <p className="text-[11.5px] text-status-amber-fg font-semibold mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Alta imprecisão do GPS no check-in
                    </p>
                  )}
                  {visit.checkinLat != null && visit.checkinLng != null && (
                    <a
                      href={`https://www.google.com/maps?q=${visit.checkinLat},${visit.checkinLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-status-purple-fg hover:underline"
                    >
                      Ver no mapa
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <Button
                onClick={handleCheckin}
                disabled={checkinLoading}
                className="w-full rounded-[9px] font-bold gap-2"
              >
                <Navigation className="h-4 w-4" />
                {checkinLoading ? 'Obtendo localização...' : 'Fazer Checkin'}
              </Button>
            )}

            {visit.checkinAt && (
              visit.checkoutAt ? (
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-status-red-bg rounded-lg">
                    <LogOut className="h-4 w-4 text-status-red-fg" />
                  </div>
                  <div>
                    <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Checkout</p>
                    <p className="text-foreground font-medium text-[13.5px]">{new Date(visit.checkoutAt).toLocaleString('pt-BR')}</p>
                    {visit.checkoutDistanceMeters != null && (
                      <p className="text-[11.5px] text-text-muted mt-0.5">{visit.checkoutDistanceMeters}m de distância do endereço do cliente</p>
                    )}
                    {visit.checkoutImprecise && (
                      <p className="text-[11.5px] text-status-amber-fg font-semibold mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Alta imprecisão do GPS no check-out
                      </p>
                    )}
                    {visit.checkoutLat != null && visit.checkoutLng != null && (
                      <a
                        href={`https://www.google.com/maps?q=${visit.checkoutLat},${visit.checkoutLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-status-purple-fg hover:underline"
                      >
                        Ver no mapa
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  variant="outline"
                  className="w-full rounded-[9px] font-bold gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {checkoutLoading ? 'Obtendo localização...' : 'Fazer Checkout'}
                </Button>
              )
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
