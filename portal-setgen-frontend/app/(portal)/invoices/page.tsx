"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/types';
import { fiscalApi } from '@/lib/api/fiscal';
import { FiscalDetailsModal } from './components/FiscalDetailsModal';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, Building2, Search, X, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusCard } from '@/components/ui/status-card';
import { Card } from '@/components/ui/card';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const router = useRouter();

  // Estados de Filtro
  const [status, setStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  const loadInvoices = useCallback(() => {
    setLoading(true);
    const filters: any = {};
    if (status !== 'ALL') filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    fiscalApi.getAll(filters)
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, [status, startDate, endDate]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = clientSearch
    ? invoices.filter(inv => {
        const clientName = inv.client?.companyName || inv.client?.tradeName || '';
        return clientName.toLowerCase().includes(clientSearch.toLowerCase()) ||
               inv.invoiceNumber?.toLowerCase().includes(clientSearch.toLowerCase()) ||
               inv.chaveAcesso?.includes(clientSearch);
      })
    : invoices;

  const clearFilters = () => {
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
    setClientSearch('');
  };

  const totalAutorizadas = invoices.filter(i => i.status === 'AUTORIZADA').length;
  const totalProcessando = invoices.filter(i => i.status === 'PROCESSANDO').length;
  const totalRejeitadas = invoices.filter(i => i.status === 'REJEITADA' || i.status === 'CANCELADA').length;

  if (loading && invoices.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E2661D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Faturamento & Notas Fiscais"
        subtitle={`${filteredInvoices.length} notas fiscais de mercadoria emitidas e integradas à SEFAZ-AM`}
        actions={
          <Button
            onClick={() => router.push('/invoices/new')}
            className="rounded-[9px] font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white"
          >
            <Plus className="h-4 w-4" />
            Emitir Nova Nota
          </Button>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total de Notas" value={invoices.length} icon={FileText} variant="orange" />
        <StatusCard label="NF-e Autorizadas" value={totalAutorizadas} icon={CheckCircle} variant="emerald" />
        <StatusCard label="Em Processamento" value={totalProcessando} icon={Clock} variant="blue" />
        <StatusCard label="Rejeitadas / Canceladas" value={totalRejeitadas} icon={AlertCircle} variant="red" />
      </div>

      {/* Barra de Filtros Full Width */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[240px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por cliente, número ou chave de acesso..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-[#E2661D]/30"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
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

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Input
                type="date"
                className="w-[140px] h-9 text-xs"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span>até</span>
              <Input
                type="date"
                className="w-[140px] h-9 text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {(status !== 'ALL' || startDate || endDate || clientSearch) && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabela de Notas */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600">Documento / Chave</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600">Destinatário</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600">Valor Total</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600">Emissão</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600">Status / SEFAZ</th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center opacity-60">
                      <FileText className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="font-bold text-sm text-gray-700">Nenhuma nota fiscal encontrada</p>
                      <p className="text-xs text-gray-400">Tente ajustar seus filtros de busca</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50 text-[#E2661D] font-bold shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="max-w-[200px]">
                          <p className="font-bold text-gray-900 text-xs font-mono">#{invoice.invoiceNumber}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">
                            {invoice.chaveAcesso || 'Sem chave gerada'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-xs font-semibold text-gray-900">
                        {invoice.client?.tradeName || invoice.client?.companyName || 'Cliente sem nome'}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-gray-900 text-xs">
                        {invoice.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">
                      {new Date(invoice.issueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`
                          ${invoice.status === 'AUTORIZADA' ? 'bg-emerald-50 text-emerald-700' :
                            invoice.status === 'REJEITADA' ? 'bg-red-50 text-red-700' :
                            invoice.status === 'PROCESSANDO' ? 'bg-blue-50 text-blue-700 animate-pulse' :
                            invoice.status === 'CANCELADA' ? 'bg-gray-100 text-gray-700' :
                            'bg-gray-100 text-gray-600'
                          }
                          font-bold text-[11px] px-2.5 py-0.5 rounded-full inline-block
                        `}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
