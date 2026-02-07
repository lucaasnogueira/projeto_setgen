"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { approvalsApi } from '@/lib/api/approvals';
import { ServiceOrder, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { 
  FileText, 
  Calendar, 
  User, 
  Briefcase, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Info,
  Building2,
  Clock,
  ClipboardList
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ApprovalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const data = await ordersApi.getById(params.id as string);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Erro ao carregar detalhes da OS');
      router.push('/approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!order) return;
    setActing(true);
    try {
      await approvalsApi.approve(order.id);
      alert('OS aprovada com sucesso!');
      router.push('/approvals');
    } catch (error) {
      alert('Erro ao aprovar OS');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!order) return;
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;

    setActing(true);
    try {
      await approvalsApi.reject(order.id, reason);
      alert('OS rejeitada');
      router.push('/approvals');
    } catch (error) {
      alert('Erro ao rejeitar OS');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Amarelo/Laranja */}
      <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-yellow-100 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Voltar para lista
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">OS #{order.orderNumber}</h1>
                <p className="text-yellow-100 mt-1 opacity-90 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {order.client?.companyName}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleApprove}
                disabled={acting}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-6 font-bold flex items-center gap-2 shadow-lg"
              >
                <CheckCircle className="h-4 w-4" />
                Aprovar
              </Button>
              <Button 
                onClick={handleReject}
                disabled={acting}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6 font-bold flex items-center gap-2 shadow-lg"
              >
                <XCircle className="h-4 w-4" />
                Rejeitar
              </Button>
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
                <Briefcase className="h-5 w-5 text-orange-600" />
                Escopo do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{order.scope}</p>
            </CardContent>
          </Card>

          {order.checklist && order.checklist.length > 0 && (
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <ClipboardList className="h-5 w-5 text-orange-600" />
                  Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-3">
                  {order.checklist.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className={`p-1 rounded-full ${item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <Info className="h-5 w-5 text-orange-600" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-orange-50 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tipo</p>
                    <p className="text-gray-700 font-medium">{order.type === 'VISIT_REPORT' ? 'Relatório de Visita' : 'Execução'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-orange-50 rounded-lg">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Criador por</p>
                    <p className="text-gray-700 font-medium">{order.createdBy?.name || 'Sistema'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-orange-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Data de Criação</p>
                    <p className="text-gray-700 font-medium">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
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
