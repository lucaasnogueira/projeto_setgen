"use client"

import { useState, useEffect } from 'react';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { ShoppingCart, Plus, Eye, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    purchaseOrdersApi.getAll()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ordens de Compra</h1>
            <p className="text-green-100">Gerencie as OC dos clientes</p>
          </div>
          <ShoppingCart className="h-16 w-16 opacity-50" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <Link href="/purchase-orders/new">
          <button className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center gap-2 shadow-lg">
            <Plus className="h-4 w-4" />
            Nova Ordem de Compra
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {orders.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl shadow-lg p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhuma OC cadastrada</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">OC {order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">{order.serviceOrder?.client?.name}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  R$ {order.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(order.issueDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <Link href={`/purchase-orders/${order.id}`}>
                <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2 w-full justify-center">
                  <Eye className="h-4 w-4" />
                  Visualizar
                </button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
