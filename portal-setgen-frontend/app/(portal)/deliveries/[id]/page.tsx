"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { deliveriesApi } from '@/lib/api/deliveries';
import { Delivery, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { 
  Truck, 
  Calendar, 
  User, 
  FileText, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Info,
  CheckCircle,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DetailHeader } from "@/components/layout/DetailHeader";
import Link from 'next/link';

export default function DeliveryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadDelivery();
    }
  }, [params.id]);

  const loadDelivery = async () => {
    try {
      const data = await deliveriesApi.getById(params.id as string);
      setDelivery(data);
    } catch (error) {
      console.error('Error loading delivery:', error);
      alert('Erro ao carregar detalhes da baixa de serviço');
      router.push('/deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de baixa?')) return;

    try {
      await deliveriesApi.delete(params.id as string);
      alert('Baixa excluída com sucesso!');
      router.push('/deliveries');
    } catch (error) {
      alert('Erro ao excluir baixa');
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

  if (!delivery) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <DetailHeader
        icon={Truck}
        tone="blue"
        title={`Baixa da OS #${delivery.serviceOrder?.orderNumber}`}
        subtitle={<><User className="h-3.5 w-3.5" />{delivery.serviceOrder?.client?.companyName}</>}
        onBack={() => router.back()}
        backLabel="Voltar para lista"
        actions={
          <>
            <Link href={`/deliveries/${delivery.id}/edit`}>
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
                <Info className="h-5 w-5 text-indigo-600" />
                Informações da Conclusão
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Recebido por</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="h-4 w-4 text-indigo-500" />
                    <span className="font-bold">{delivery.receivedBy}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Data de Conclusão</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">{new Date(delivery.deliveryDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Comentários / Observações</h4>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-gray-700 leading-relaxed italic">
                    {delivery.notes ? `"${delivery.notes}"` : 'Nenhuma observação registrada.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <FileText className="h-5 w-5 text-indigo-600" />
                Vínculo com OS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ordem de Serviço</p>
                <p className="text-gray-700 font-bold text-lg mb-2">#{delivery.serviceOrder?.orderNumber}</p>
                <Link href={`/orders/${delivery.serviceOrderId}`}>
                  <Button variant="outline" className="w-full justify-start gap-2 border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl">
                    <Package className="h-4 w-4" />
                    Ver Detalhes da OS
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

           <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
             <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 text-green-700 border border-green-100">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-bold">Serviço Concluído</span>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Registrado em {new Date(delivery.createdAt).toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
