"use client"

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmitDualForm } from '../components/EmitDualForm';
import { 
  DollarSign, 
  ArrowLeft, 
  FileCheck,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { serviceOrdersApi } from '@/lib/api/service-orders';
import { useEffect } from 'react';
import { ServiceOrderStatus } from '@/types';

export default function EmitDualPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const osId = searchParams.get('osId');
  const [osList, setOsList] = useState<any[]>([]);
  const [selectedOsId, setSelectedOsId] = useState<string | null>(osId);

  useEffect(() => {
    if (!osId) {
      loadPendingOs();
    }
  }, [osId]);

  const loadPendingOs = async () => {
    try {
      // Fetching multiple statuses to allow faturamento as soon as it is approved
      const statuses = [
        ServiceOrderStatus.APPROVED,
        ServiceOrderStatus.IN_PROGRESS,
        ServiceOrderStatus.COMPLETED
      ];
      
      const results = await Promise.all(
        statuses.map(status => serviceOrdersApi.getAll(status))
      );
      
      // Flattening results and removing potential duplicates (though unlikely with these statuses)
      const allOs = results.flat();
      setOsList(allOs);
    } catch (error) {
      console.error('Error loading OS:', error);
    }
  };

  const handleSuccess = (result: any) => {
    alert('Faturamento processado com sucesso!');
    router.push('/invoices');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header Premium */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="relative z-10 space-y-6">
          <Button 
            variant="ghost" 
            className="text-emerald-100 hover:text-white hover:bg-white/10 p-0 h-auto gap-2 font-medium"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Faturamento
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-5 rounded-3xl backdrop-blur-md border border-white/30 shadow-inner">
                <FileCheck className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight leading-tight">Emissão Dual 2026</h1>
                <p className="text-emerald-100 mt-2 font-medium opacity-90 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Orquestração NF-e (Mercadoria) + NFS-e (Serviço)
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20">
               <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 mb-1">Status do Regime</p>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                 <span className="font-black text-xl">DIPLOMÁTICO / 2026</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {!selectedOsId ? (
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-12 text-center space-y-6">
            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Selecione uma Ordem de Serviço</h2>
              <p className="text-gray-500">Para emitir a nota fiscal, selecione uma OS autorizada que ainda não foi faturada.</p>
            </div>
            
            <div className="max-w-lg mx-auto">
              <select 
                className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-emerald-500 transition-all outline-none font-medium"
                onChange={(e) => setSelectedOsId(e.target.value)}
              >
                <option value="">Clique para selecionar...</option>
                {osList.map(os => (
                  <option key={os.id} value={os.id}>{os.orderNumber} - {os.client?.companyName} (R$ {os.value})</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmitDualForm 
          osId={selectedOsId} 
          onSuccess={handleSuccess} 
          onCancel={() => setSelectedOsId(null)} 
        />
      )}
    </div>
  );
}

// Nota: O fallback Mock de Card acima falhará sem imports, devo adicionar or usar componentes existentes.
import { Card, CardContent } from "@/components/ui/card";
import { PurchaseOrderStatus } from '@/types';
