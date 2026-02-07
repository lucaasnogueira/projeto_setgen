"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { PurchaseOrder, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { 
  ShoppingCart, 
  Calendar, 
  User, 
  FileText, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Info,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function PurchaseOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const data = await purchaseOrdersApi.getById(params.id as string);
      setOrder(data);
    } catch (error) {
      console.error('Error loading purchase order:', error);
      alert('Erro ao carregar detalhes da ordem de compra');
      router.push('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta ordem de compra?')) return;

    try {
      await purchaseOrdersApi.delete(params.id as string);
      alert('Ordem de compra excluída com sucesso!');
      router.push('/purchase-orders');
    } catch (error) {
      alert('Erro ao excluir ordem de compra');
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!order) return null;

  const isExpired = order.expiryDate && new Date(order.expiryDate) < new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Verde */}
      <div className="bg-gradient-to-br from-green-500 via-green-600 to-teal-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-green-100 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Voltar para lista
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
                <ShoppingCart className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Ordem de Compra #{order.orderNumber}</h1>
                <p className="text-green-100 mt-1 opacity-90 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {order.client?.companyName}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href={`/purchase-orders/${order.id}/edit`}>
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
                <Info className="h-5 w-5 text-green-600" />
                Informações da OC
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor</h4>
                  <p className="text-3xl font-black text-green-600">
                    {order.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</h4>
                  <div className={`flex items-center gap-2 font-bold px-3 py-1 rounded-full w-fit ${isExpired ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {isExpired ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    {isExpired ? 'Expirada' : (order.status || 'Ativa')}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Data de Emissão</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{new Date(order.issueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Data de Validade</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{new Date(order.expiryDate).toLocaleDateString('pt-BR')}</span>
                  </div>
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
                <FileText className="h-5 w-5 text-green-600" />
                Vínculos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {order.serviceOrderId && (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Ordem de Serviço</p>
                  <Link href={`/orders/${order.serviceOrderId}`}>
                    <Button variant="outline" className="w-full justify-start gap-2 border-green-100 hover:bg-green-50 hover:text-green-600 rounded-xl">
                      <FileText className="h-4 w-4" />
                      Ver OS #{order.serviceOrder?.orderNumber}
                    </Button>
                  </Link>
                </div>
              )}
              {order.uploadedBy && (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Cadastrado por</p>
                  <div className="flex items-center gap-2 text-gray-700 p-3 rounded-xl bg-gray-50">
                    <User className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{order.uploadedBy.name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

           <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
             <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <Briefcase className="h-5 w-5 text-green-600" />
                Arquivos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {order.fileUrl ? (
                <Button className="w-full bg-green-50 text-green-600 hover:bg-green-100 border-none rounded-xl font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Visualizar Documento
                </Button>
              ) : (
                <p className="text-sm text-gray-400 text-center italic">Nenhum documento anexo.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
