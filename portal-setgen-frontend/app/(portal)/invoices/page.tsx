"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/types';
import { fiscalApi } from '@/lib/api/fiscal';
import { invoicesApi } from '@/lib/api/invoices';
import { FiscalDetailsModal } from './components/FiscalDetailsModal';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, FileText, Calendar, Building2, Search, Filter, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';
import Link from 'next/link';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const router = useRouter();

  // Estados de Filtro
  const [typeTab, setTypeTab] = useState('ALL'); // ALL, NFE, NFSE
  const [status, setStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  const loadInvoices = useCallback(() => {
    setLoading(true);
    const filters: any = {};
    if (typeTab !== 'ALL') filters.tipo = typeTab;
    if (status !== 'ALL') filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    // clientSearch filtrado no frontend por enquanto para performance ou via backend se payload crescer
    
    fiscalApi.getAll(filters)
      .then(setInvoices)
      .catch(() => {
        invoicesApi.getAll().then(setInvoices);
      })
      .finally(() => setLoading(false));
  }, [typeTab, status, startDate, endDate]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = clientSearch 
    ? invoices.filter(inv => {
        const clientName = inv.purchaseOrder?.client?.companyName || inv.serviceOrder?.client?.companyName || '';
        return clientName.toLowerCase().includes(clientSearch.toLowerCase()) || 
               inv.invoiceNumber?.toLowerCase().includes(clientSearch.toLowerCase()) ||
               inv.chaveAcesso?.includes(clientSearch);
      })
    : invoices;

  const clearFilters = () => {
    setTypeTab('ALL');
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
    setClientSearch('');
  };

  if (loading && invoices.length === 0) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Faturamento Central"
        subtitle="Gestão dual de notas e integração SEFAZ-AM/ADN"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Filtros e Ações */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-[14px] border border-border p-4 flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar por cliente, número ou chave..." 
                  className="pl-10"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="AUTORIZADA">Autorizada</SelectItem>
                <SelectItem value="REJEITADA">Rejeitada</SelectItem>
                <SelectItem value="PROCESSANDO">Processando</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                className="w-[150px]" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-gray-400">até</span>
              <Input 
                type="date" 
                className="w-[150px]" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {(status !== 'ALL' || startDate || endDate || clientSearch || typeTab !== 'ALL') && (
              <button 
                onClick={clearFilters}
                className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>

          <Tabs value={typeTab} onValueChange={setTypeTab} className="w-full">
            <TabsList className="bg-white border shadow-sm w-full justify-start p-1 h-12">
              <TabsTrigger value="ALL" className="px-8 font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Todas</TabsTrigger>
              <TabsTrigger value="NFE" className="px-8 font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Mercadorias (NF-e)</TabsTrigger>
              <TabsTrigger value="NFSE" className="px-8 font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Serviços (NFS-e)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col gap-2">
          <Link href="/invoices/emit-dual" className="w-full">
            <button className="w-full h-full min-h-[50px] bg-primary text-white rounded-[10px] hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg font-bold transition-all active:scale-95">
              <Plus className="h-5 w-5" />
              Emitir Nota Dual 2026
            </button>
          </Link>
          <Link href="/invoices/new" className="w-full">
            <button className="w-full min-h-[40px] border border-primary/30 text-primary bg-primary/5 rounded-[10px] hover:bg-primary/10 flex items-center justify-center gap-2 font-medium transition-colors">
              <Plus className="h-4 w-4" />
              Lançamento Manual
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b">
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Documento</th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Valores</th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Emissão</th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Status / SEFAZ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <div className="bg-emerald-50 p-6 rounded-full mb-4">
                        <FileText className="h-12 w-12 text-emerald-600" />
                      </div>
                      <p className="text-gray-500 font-bold text-lg">Nenhuma nota fiscal encontrada</p>
                      <p className="text-gray-400 text-sm">Tente ajustar seus filtros de busca</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(invoice => (
                  <tr 
                    key={invoice.id} 
                    className="group hover:bg-emerald-50/30 transition-all cursor-pointer"
                    onClick={() => {
                      if (invoice.chaveAcesso) {
                        setSelectedInvoice(invoice);
                      } else {
                        router.push(`/invoices/${invoice.id}`);
                      }
                    }}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${invoice.tipo === 'NFE' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'}`}>
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="max-w-[220px]">
                          <p className="font-black text-gray-900 leading-none mb-1 text-lg">#{invoice.invoiceNumber}</p>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${invoice.tipo === 'NFE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              {invoice.tipo}
                            </span>
                            <p className="text-[10px] text-gray-400 font-mono truncate">
                              {invoice.chaveAcesso || 'Lote manual'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
                           <Building2 className="h-4 w-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 leading-tight">
                          {invoice.purchaseOrder?.client?.companyName || invoice.serviceOrder?.client?.companyName || 'Avulso'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div>
                        <p className="font-black text-gray-900 text-lg">
                          {invoice.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        {invoice.splitPayment && (
                          <div className="flex items-center gap-1 mt-0.5">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                             <p className="text-[10px] text-emerald-600 font-black">Split Ativo</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm text-gray-700 font-bold">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(invoice.issueDate).toLocaleDateString('pt-BR')}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1">Série: {invoice.serie || '001'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge 
                        className={`
                          ${invoice.status === 'AUTORIZADA' ? 'bg-green-500 text-white' : 
                            invoice.status === 'REJEITADA' ? 'bg-red-500 text-white' :
                            invoice.status === 'PROCESSANDO' ? 'bg-blue-500 text-white animate-pulse' :
                            invoice.status === 'CANCELADA' ? 'bg-gray-800 text-white' :
                            'bg-gray-200 text-gray-600'
                          } 
                          font-black text-[11px] px-4 py-1.5 rounded-xl border-none shadow-sm uppercase tracking-tighter
                        `}
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FiscalDetailsModal 
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        taxData={selectedInvoice?.impostos?.[0]}
        splitPayment={selectedInvoice?.splitPayment}
        valorBruto={selectedInvoice?.value || 0}
      />
    </div>
  );
}
