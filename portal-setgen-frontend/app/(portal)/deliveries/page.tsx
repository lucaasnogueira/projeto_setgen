"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deliveriesApi } from '@/lib/api/deliveries';
import { Truck, Plus, CheckCircle, Calendar, FileText } from 'lucide-react';
import { Delivery } from '@/types';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    deliveriesApi.getAll()
      .then(setDeliveries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Baixa de Serviços</h1>
            <p className="text-indigo-100">Registre a conclusão e aceite de serviços</p>
          </div>
          <Truck className="h-16 w-16 opacity-50" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <Link href="/deliveries/new">
          <button className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 flex items-center gap-2 shadow-lg">
            <Plus className="h-4 w-4" />
            Registrar Baixa
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {deliveries.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl shadow-lg p-12 text-center">
            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhuma baixa de serviço registrada</p>
          </div>
        ) : (
          deliveries.map(delivery => (
            <div 
              key={delivery.id} 
              className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-indigo-500 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => router.push(`/deliveries/${delivery.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Baixa #{delivery.id.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-500">OS: {delivery.serviceOrder?.orderNumber}</p>
                  </div>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {delivery.serviceOrder?.client?.companyName}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(delivery.deliveryDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {delivery.notes && (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {delivery.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
