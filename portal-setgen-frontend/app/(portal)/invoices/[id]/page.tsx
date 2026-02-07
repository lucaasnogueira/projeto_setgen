"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { invoicesApi } from '@/lib/api/invoices';
import { Invoice, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Info,
  Hash,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadInvoice();
    }
  }, [params.id]);

  const loadInvoice = async () => {
    try {
      const data = await invoicesApi.getById(params.id as string);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('Erro ao carregar detalhes da nota fiscal');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta nota fiscal?')) return;

    try {
      await invoicesApi.delete(params.id as string);
      alert('Nota fiscal excluída com sucesso!');
      router.push('/invoices');
    } catch (error) {
      alert('Erro ao excluir nota fiscal');
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Esmeralda */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-emerald-100 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Voltar para lista
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
                <DollarSign className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Nota Fiscal #{invoice.invoiceNumber}</h1>
                <p className="text-emerald-100 mt-1 opacity-90 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Série: {invoice.series || '1'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href={`/invoices/${invoice.id}/edit`}>
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
                <Info className="h-5 w-5 text-emerald-600" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Total</h4>
                  <p className="text-3xl font-black text-emerald-600">
                    {invoice.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status de Emissão</h4>
                  <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 px-3 py-1 rounded-full w-fit">
                    <CheckCircle className="h-4 w-4" />
                    Emitida
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Data de Emissão</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{new Date(invoice.issueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Data de Vencimento</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</span>
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
                <FileText className="h-5 w-5 text-emerald-600" />
                Vínculos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {invoice.purchaseOrderId && (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Ordem de Compra</p>
                  <Link href={`/purchase-orders/${invoice.purchaseOrderId}`}>
                    <Button variant="outline" className="w-full justify-start gap-2 border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl">
                      <FileText className="h-4 w-4" />
                      Ver OC vinculada
                    </Button>
                  </Link>
                </div>
              )}
              {invoice.serviceOrderId && (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Ordem de Serviço</p>
                  <Link href={`/orders/${invoice.serviceOrderId}`}>
                    <Button variant="outline" className="w-full justify-start gap-2 border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl">
                      <FileText className="h-4 w-4" />
                      Ver OS vinculada
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

           <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
             <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <AlertCircle className="h-5 w-5 text-emerald-600" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none rounded-xl font-bold">
                Imprimir NFe (DANFE)
              </Button>
              <Button className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none rounded-xl font-bold">
                Enviar por E-mail
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
