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
import { DetailHeader } from "@/components/layout/DetailHeader";
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) return null;

  const isExpired = order.expiryDate && new Date(order.expiryDate) < new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <DetailHeader
        icon={ShoppingCart}
        tone="green"
        title={`Ordem de Compra #${order.orderNumber}`}
        subtitle={<><Briefcase className="h-3.5 w-3.5" />{order.client?.companyName}</>}
        onBack={() => router.back()}
        backLabel="Voltar para lista"
        actions={
          <>
            <Link href={`/purchase-orders/${order.id}/edit`}>
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
