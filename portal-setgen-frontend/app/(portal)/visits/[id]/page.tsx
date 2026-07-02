"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import {
  ClipboardList,
  Calendar,
  User,
  MapPin,
  Clock,
  Edit,
  Trash2,
  ArrowLeft,
  Info,
  CheckCircle,
  HardHat,
  Navigation,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DetailHeader } from "@/components/layout/DetailHeader";
import Link from 'next/link';

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
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <DetailHeader
        icon={ClipboardList}
        tone="purple"
        title={visit.client?.companyName || 'Visita técnica'}
        subtitle={<><Calendar className="h-3.5 w-3.5" />{new Date(visit.visitDate).toLocaleString('pt-BR')}</>}
        onBack={() => router.back()}
        backLabel="Voltar para lista"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Info className="h-5 w-5 text-purple-600" />
                Descrição e Detalhes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Objetivo</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{visit.description}</p>
              </div>

              {visit.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Observações Adicionais</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                    "{visit.notes}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-purple-50 rounded-lg">
                    <HardHat className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Técnico</p>
                    <p className="text-gray-700 font-medium">{visit.technician?.name || 'Não informado'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-purple-50 rounded-lg">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tipo de Visita</p>
                    <p className="text-gray-700 font-medium">{visit.visitType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-purple-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Localização</p>
                    <p className="text-gray-700 font-medium">{visit.location}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <Navigation className="h-5 w-5 text-purple-600" />
                Checkin / Checkout
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {geoError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  {geoError}
                </p>
              )}

              {visit.checkinAt ? (
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-green-50 rounded-lg">
                    <Navigation className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Checkin</p>
                    <p className="text-gray-700 font-medium">{new Date(visit.checkinAt).toLocaleString('pt-BR')}</p>
                    {visit.checkinLat != null && visit.checkinLng != null && (
                      <a
                        href={`https://www.google.com/maps?q=${visit.checkinLat},${visit.checkinLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:underline"
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
                    <div className="mt-1 p-2 bg-red-50 rounded-lg">
                      <LogOut className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Checkout</p>
                      <p className="text-gray-700 font-medium">{new Date(visit.checkoutAt).toLocaleString('pt-BR')}</p>
                      {visit.checkoutLat != null && visit.checkoutLng != null && (
                        <a
                          href={`https://www.google.com/maps?q=${visit.checkoutLat},${visit.checkoutLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:underline"
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
