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
  HardHat
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function VisitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [visit, setVisit] = useState<TechnicalVisit | null>(null);
  const [loading, setLoading] = useState(true);

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

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!visit) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Roxo */}
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-100 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Voltar para lista
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
                <ClipboardList className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{visit.client?.companyName}</h1>
                <p className="text-purple-100 mt-1 opacity-90 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(visit.visitDate).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href={`/visits/${visit.id}/edit`}>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm rounded-xl px-6 font-bold flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
              {canDelete && (
                <Button 
                  onClick={handleDelete}
                  className="bg-red-500/20 hover:bg-red-500/40 text-red-100 border-red-500/30 backdrop-blur-sm rounded-xl px-6 font-bold flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

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
        </div>
      </div>
    </div>
  );
}
