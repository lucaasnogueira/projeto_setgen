"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { inventoryApi } from '@/lib/api/inventory';
import { Product, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { 
  Package, 
  Hash, 
  Tag, 
  Layers, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  AlertTriangle,
  History,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      const data = await inventoryApi.getById(params.id as string);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Erro ao carregar detalhes do produto');
      router.push('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      await inventoryApi.delete(params.id as string);
      alert('Produto excluído com sucesso!');
      router.push('/inventory');
    } catch (error) {
      alert('Erro ao excluir produto');
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!product) return null;

  const isLowStock = product.currentStock <= product.minStock;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Âmbar */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-amber-100 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Voltar para lista
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
                <Package className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                <p className="text-amber-100 mt-1 opacity-90 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Código: {product.code}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href={`/inventory/${product.id}/edit`}>
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
          {/* Detalhes do Produto */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Info className="h-5 w-5 text-amber-600" />
                Especificações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Unidade</h4>
                  <p className="text-gray-700 font-medium">{product.unit || 'UN'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Descrição</h4>
                <p className="text-gray-700 leading-relaxed">
                  {product.description || 'Nenhuma descrição detalhada informada.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Alerta de Estoque Mínimo */}
          {isLowStock && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800">Alerta de Estoque Baixo</h3>
                <p className="text-amber-700 text-sm">
                  Este produto atingiu o nível de estoque mínimo ({product.minStock} {product.unit}). 
                  Considere realizar um novo pedido de compra.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <Layers className="h-5 w-5 text-amber-600" />
                Nível de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className={`text-6xl font-black mb-2 ${isLowStock ? 'text-red-500' : 'text-amber-600'}`}>
                {product.currentStock}
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-6">
                {product.unit} em estoque
              </p>
              
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Estoque Mínimo</span>
                  <span className="font-bold text-gray-700">{product.minStock} {product.unit}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${isLowStock ? 'bg-red-500' : 'bg-amber-500'}`} 
                    style={{ width: `${Math.min(100, (product.currentStock / (product.minStock * 2)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
             <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <History className="h-5 w-5 text-amber-600" />
                Histórico Rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">Entradas (Mês)</span>
                  </div>
                  <span className="font-bold text-gray-800">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">Saídas (Mês)</span>
                  </div>
                  <span className="font-bold text-gray-800">-</span>
                </div>
              </div>
              <Button className="w-full mt-6 bg-amber-50 text-amber-600 hover:bg-amber-100 border-none rounded-xl font-bold">
                Ajustar Estoque
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
