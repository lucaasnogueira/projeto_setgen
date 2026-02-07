#!/bin/bash

# ========================================
# Portal Setgen - Criação de Formulários e Detalhes
# ========================================
# Este script cria:
# - Formulário de Nova OS
# - Detalhes da OS
# - Formulário de Nova OC
# - Formulário de Nova NFe
# - Formulário de Nova Entrega
# - APIs faltantes (purchase-orders, invoices, deliveries)
# ========================================

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Criando Formulários e Detalhes"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# CRIAR APIs FALTANTES
# ========================================

echo -e "${YELLOW}🌐 Criando APIs faltantes...${NC}"

# API de Purchase Orders
cat > lib/api/purchase-orders.ts << 'EOF'
import api from './client';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';

export const purchaseOrdersApi = {
  getAll: async (status?: PurchaseOrderStatus): Promise<PurchaseOrder[]> => {
    const { data } = await api.get('/purchase-orders', {
      params: { status },
    });
    return data;
  },

  getOne: async (id: string): Promise<PurchaseOrder> => {
    const { data } = await api.get(`/purchase-orders/${id}`);
    return data;
  },

  getByServiceOrder: async (serviceOrderId: string): Promise<PurchaseOrder[]> => {
    const { data } = await api.get(`/purchase-orders/service-order/${serviceOrderId}`);
    return data;
  },

  create: async (purchaseOrder: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const { data } = await api.post('/purchase-orders', purchaseOrder);
    return data;
  },

  update: async (id: string, purchaseOrder: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const { data } = await api.patch(`/purchase-orders/${id}`, purchaseOrder);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/purchase-orders/${id}`);
  },

  uploadFile: async (id: string, file: File): Promise<PurchaseOrder> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/purchase-orders/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
EOF

# API de Invoices
cat > lib/api/invoices.ts << 'EOF'
import api from './client';
import type { Invoice, InvoiceStatus } from '@/types';

export const invoicesApi = {
  getAll: async (status?: InvoiceStatus): Promise<Invoice[]> => {
    const { data } = await api.get('/invoices', {
      params: { status },
    });
    return data;
  },

  getOne: async (id: string): Promise<Invoice> => {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
  },

  getByServiceOrder: async (serviceOrderId: string): Promise<Invoice[]> => {
    const { data } = await api.get(`/invoices/service-order/${serviceOrderId}`);
    return data;
  },

  create: async (invoice: Partial<Invoice>): Promise<Invoice> => {
    const { data } = await api.post('/invoices', invoice);
    return data;
  },

  update: async (id: string, invoice: Partial<Invoice>): Promise<Invoice> => {
    const { data } = await api.patch(`/invoices/${id}`, invoice);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },
};
EOF

# API de Deliveries
cat > lib/api/deliveries.ts << 'EOF'
import api from './client';
import type { Delivery } from '@/types';

export const deliveriesApi = {
  getAll: async (): Promise<Delivery[]> => {
    const { data } = await api.get('/deliveries');
    return data;
  },

  getOne: async (id: string): Promise<Delivery> => {
    const { data } = await api.get(`/deliveries/${id}`);
    return data;
  },

  getByServiceOrder: async (serviceOrderId: string): Promise<Delivery> => {
    const { data } = await api.get(`/deliveries/service-order/${serviceOrderId}`);
    return data;
  },

  create: async (delivery: Partial<Delivery>): Promise<Delivery> => {
    const { data } = await api.post('/deliveries', delivery);
    return data;
  },

  update: async (id: string, delivery: Partial<Delivery>): Promise<Delivery> => {
    const { data } = await api.patch(`/deliveries/${id}`, delivery);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/deliveries/${id}`);
  },
};
EOF

echo -e "${GREEN}✅ APIs criadas!${NC}"

# ========================================
# NOVA ORDEM DE SERVIÇO
# ========================================

echo -e "${YELLOW}📝 Criando formulário de Nova OS...${NC}"

mkdir -p app/orders/new

cat > app/orders/new/page.tsx << 'EOF'
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { serviceOrdersApi } from '@/lib/api/service-orders';
import { clientsApi } from '@/lib/api/clients';
import { visitsApi } from '@/lib/api/visits';
import { Client, TechnicalVisit, ServiceOrderType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export default function NewOrderPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [visits, setVisits] = useState<TechnicalVisit[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  const orderType = watch('type');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadVisitsByClient(selectedClientId);
    }
  }, [selectedClientId]);

  const loadClients = async () => {
    try {
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadVisitsByClient = async (clientId: string) => {
    try {
      const data = await visitsApi.getByClient(clientId);
      setVisits(data);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    }
  };

  const onSubmit = async (data: any) => {
    if (!user) return;

    setSaving(true);
    try {
      const orderNumber = `OS-${Date.now()}`;
      
      await serviceOrdersApi.create({
        orderNumber,
        type: data.type as ServiceOrderType,
        clientId: data.clientId,
        technicalVisitId: data.technicalVisitId || null,
        scope: data.scope,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        responsibleIds: [user.id],
        checklist: [],
        attachments: [],
        createdById: user.id,
      });
      
      toast({
        title: "OS criada!",
        description: `Ordem de serviço ${orderNumber} criada com sucesso.`,
      });
      
      router.push('/orders');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar OS",
        description: error.response?.data?.message || "Erro desconhecido",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova Ordem de Serviço</h1>
          <p className="text-gray-500">Cadastre uma nova OS</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Tipo de OS <span className="text-red-500">*</span>
                </Label>
                <select
                  id="type"
                  {...register('type', { required: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="VISIT_REPORT">Relatório de Visita</option>
                  <option value="EXECUTION">Execução</option>
                </select>
                {errors.type && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">
                  Cliente <span className="text-red-500">*</span>
                </Label>
                <select
                  id="clientId"
                  {...register('clientId', { required: true })}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setValue('clientId', e.target.value);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>
            </div>

            {orderType === 'VISIT_REPORT' && selectedClientId && (
              <div className="space-y-2">
                <Label htmlFor="technicalVisitId">Visita Técnica</Label>
                <select
                  id="technicalVisitId"
                  {...register('technicalVisitId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione uma visita (opcional)</option>
                  {visits.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {visit.location} - {new Date(visit.visitDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo de Conclusão</Label>
              <Input
                id="deadline"
                type="date"
                {...register('deadline')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">
                Escopo <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="scope"
                {...register('scope', { required: true })}
                className={`w-full min-h-[150px] rounded-md border ${errors.scope ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm`}
                placeholder="Descreva o escopo completo da ordem de serviço..."
              />
              {errors.scope && (
                <p className="text-xs text-red-500">Campo obrigatório</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button 
            type="submit" 
            className="flex-1"
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Criar Ordem de Serviço'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Formulário de Nova OS criado!${NC}"

# ========================================
# DETALHES DA OS
# ========================================

echo -e "${YELLOW}📄 Criando página de detalhes da OS...${NC}"

mkdir -p app/orders/[id]

cat > app/orders/[id]/page.tsx << 'EOF'
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { serviceOrdersApi } from '@/lib/api/service-orders';
import { ServiceOrder } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, FileText, Calendar, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const data = await serviceOrdersApi.getOne(params.id);
      setOrder(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar OS",
        description: error.response?.data?.message || "Erro desconhecido",
      });
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">OS #{order.orderNumber}</h1>
            <p className="text-gray-500">{order.client?.companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-2 rounded-md text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações da OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tipo</p>
                <p className="font-medium">
                  {order.type === 'VISIT_REPORT' ? 'Relatório de Visita' : 'Execução'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Número da OS</p>
                <p className="font-medium">{order.orderNumber}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Escopo</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.scope}</p>
            </div>

            {order.checklist && order.checklist.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Checklist</h3>
                <div className="space-y-2">
                  {order.checklist.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        readOnly
                        className="h-4 w-4"
                      />
                      <span className={item.completed ? 'line-through text-gray-500' : ''}>
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Criado em</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Última atualização</p>
                  <p className="font-medium">{formatDate(order.updatedAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Conclusão</span>
                    <span className="font-semibold">{order.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>

                {order.deadline && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-1">Prazo</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="font-medium">{formatDate(order.deadline)}</p>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500 mb-1">Criado por</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{order.createdBy?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
              <Button className="w-full" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Atualizar Progresso
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Página de detalhes da OS criada!${NC}"

# Continua na próxima parte...
echo -e "${BLUE}Criando formulários de OC, NFe e Entregas...${NC}"

# ========================================
# NOVA ORDEM DE COMPRA
# ========================================

echo -e "${YELLOW}📝 Criando formulário de Nova OC...${NC}"

mkdir -p app/purchase-orders/new

cat > app/purchase-orders/new/page.tsx << 'EOF'
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { serviceOrdersApi } from '@/lib/api/service-orders';
import { ServiceOrder } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export default function NewPurchaseOrderPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const selectedOrderId = watch('serviceOrderId');
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await serviceOrdersApi.getAll();
      setOrders(data.filter(o => o.status === 'APPROVED'));
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
    }
  };

  const onSubmit = async (data: any) => {
    if (!user || !file) {
      toast({
        variant: "destructive",
        title: "Arquivo obrigatório",
        description: "Por favor, selecione o arquivo da OC",
      });
      return;
    }

    setSaving(true);
    try {
      const po = await purchaseOrdersApi.create({
        serviceOrderId: data.serviceOrderId,
        clientId: selectedOrder?.clientId,
        orderNumber: data.orderNumber,
        value: parseFloat(data.value),
        issueDate: new Date(data.issueDate).toISOString(),
        expiryDate: new Date(data.expiryDate).toISOString(),
        uploadedById: user.id,
        fileUrl: '', // Will be updated after upload
      });

      // Upload file
      await purchaseOrdersApi.uploadFile(po.id, file);
      
      toast({
        title: "OC criada!",
        description: "Ordem de compra cadastrada com sucesso.",
      });
      
      router.push('/purchase-orders');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar OC",
        description: error.response?.data?.message || "Erro desconhecido",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchase-orders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova Ordem de Compra</h1>
          <p className="text-gray-500">Cadastre uma nova OC do cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da OC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceOrderId">
                Ordem de Serviço <span className="text-red-500">*</span>
              </Label>
              <select
                id="serviceOrderId"
                {...register('serviceOrderId', { required: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione uma OS aprovada</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    OS #{order.orderNumber} - {order.client?.companyName}
                  </option>
                ))}
              </select>
              {errors.serviceOrderId && (
                <p className="text-xs text-red-500">Campo obrigatório</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">
                  Número da OC <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="orderNumber"
                  {...register('orderNumber', { required: true })}
                  placeholder="Ex: OC-2024-001"
                />
                {errors.orderNumber && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">
                  Valor (R$) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  {...register('value', { required: true })}
                  placeholder="0.00"
                />
                {errors.value && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">
                  Data de Emissão <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="issueDate"
                  type="date"
                  {...register('issueDate', { required: true })}
                />
                {errors.issueDate && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">
                  Data de Validade <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  {...register('expiryDate', { required: true })}
                />
                {errors.expiryDate && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">
                Arquivo da OC <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {file && (
                  <span className="text-sm text-green-600">
                    ✓ {file.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Formatos aceitos: PDF, JPG, PNG
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button 
            type="submit" 
            className="flex-1"
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Cadastrar OC'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Formulário de Nova OC criado!${NC}"

# ========================================
# NOVA NOTA FISCAL
# ========================================

echo -e "${YELLOW}📝 Criando formulário de Nova NFe...${NC}"

mkdir -p app/invoices/new

cat > app/invoices/new/page.tsx << 'EOF'
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { invoicesApi } from '@/lib/api/invoices';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { PurchaseOrder } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export default function NewInvoicePage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();

  const selectedPOId = watch('purchaseOrderId');
  const selectedPO = purchaseOrders.find(po => po.id === selectedPOId);

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  useEffect(() => {
    if (selectedPO) {
      setValue('value', selectedPO.value);
    }
  }, [selectedPO]);

  const loadPurchaseOrders = async () => {
    try {
      const data = await purchaseOrdersApi.getAll();
      setPurchaseOrders(data.filter(po => po.status === 'APPROVED'));
    } catch (error) {
      console.error('Erro ao carregar OCs:', error);
    }
  };

  const onSubmit = async (data: any) => {
    if (!user) return;

    setSaving(true);
    try {
      await invoicesApi.create({
        serviceOrderId: selectedPO?.serviceOrderId,
        purchaseOrderId: data.purchaseOrderId,
        invoiceNumber: data.invoiceNumber,
        series: data.series,
        value: parseFloat(data.value),
        issueDate: new Date(data.issueDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
        createdById: user.id,
      });
      
      toast({
        title: "NFe criada!",
        description: "Nota fiscal cadastrada com sucesso.",
      });
      
      router.push('/invoices');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar NFe",
        description: error.response?.data?.message || "Erro desconhecido",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova Nota Fiscal</h1>
          <p className="text-gray-500">Emita uma nova NFe</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da NFe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseOrderId">
                Ordem de Compra <span className="text-red-500">*</span>
              </Label>
              <select
                id="purchaseOrderId"
                {...register('purchaseOrderId', { required: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione uma OC aprovada</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.orderNumber} - {po.client?.companyName} - R$ {po.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
              {errors.purchaseOrderId && (
                <p className="text-xs text-red-500">Campo obrigatório</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="invoiceNumber">
                  Número da NFe <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invoiceNumber"
                  {...register('invoiceNumber', { required: true })}
                  placeholder="Ex: 12345"
                />
                {errors.invoiceNumber && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="series">
                  Série <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="series"
                  {...register('series', { required: true })}
                  placeholder="Ex: 1"
                />
                {errors.series && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                Valor (R$) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                {...register('value', { required: true })}
                placeholder="0.00"
              />
              {errors.value && (
                <p className="text-xs text-red-500">Campo obrigatório</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">
                  Data de Emissão <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="issueDate"
                  type="date"
                  {...register('issueDate', { required: true })}
                />
                {errors.issueDate && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">
                  Data de Vencimento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register('dueDate', { required: true })}
                />
                {errors.dueDate && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button 
            type="submit" 
            className="flex-1"
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Emitindo...' : 'Emitir Nota Fiscal'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Formulário de Nova NFe criado!${NC}"

# ========================================
# NOVA ENTREGA
# ========================================

echo -e "${YELLOW}📝 Criando formulário de Nova Entrega...${NC}"

mkdir -p app/deliveries/new

cat > app/deliveries/new/page.tsx << 'EOF'
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { deliveriesApi } from '@/lib/api/deliveries';
import { serviceOrdersApi } from '@/lib/api/service-orders';
import { ServiceOrder, ServiceOrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export default function NewDeliveryPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [checklist, setChecklist] = useState<Array<{ description: string; completed: boolean }>>([
    { description: 'Instalação completa', completed: false },
    { description: 'Testes realizados', completed: false },
    { description: 'Treinamento concluído', completed: false },
  ]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await serviceOrdersApi.getAll(ServiceOrderStatus.COMPLETED);
      setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
    }
  };

  const addCheckItem = () => {
    if (newCheckItem.trim()) {
      setChecklist([...checklist, { description: newCheckItem, completed: false }]);
      setNewCheckItem('');
    }
  };

  const removeCheckItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const toggleCheckItem = (index: number) => {
    setChecklist(checklist.map((item, i) => 
      i === index ? { ...item, completed: !item.completed } : item
    ));
  };

  const onSubmit = async (data: any) => {
    if (!user) return;

    setSaving(true);
    try {
      await deliveriesApi.create({
        serviceOrderId: data.serviceOrderId,
        deliveryDate: new Date(data.deliveryDate).toISOString(),
        deliveredById: user.id,
        receivedBy: data.receivedBy,
        checklist: checklist,
        evidences: [],
        notes: data.notes || null,
      });
      
      toast({
        title: "Entrega registrada!",
        description: "Entrega cadastrada com sucesso.",
      });
      
      router.push('/deliveries');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar entrega",
        description: error.response?.data?.message || "Erro desconhecido",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/deliveries">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova Entrega</h1>
          <p className="text-gray-500">Registre a entrega de um serviço</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceOrderId">
                Ordem de Serviço <span className="text-red-500">*</span>
              </Label>
              <select
                id="serviceOrderId"
                {...register('serviceOrderId', { required: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione uma OS concluída</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    OS #{order.orderNumber} - {order.client?.companyName}
                  </option>
                ))}
              </select>
              {errors.serviceOrderId && (
                <p className="text-xs text-red-500">Campo obrigatório</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">
                  Data de Entrega <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  {...register('deliveryDate', { required: true })}
                />
                {errors.deliveryDate && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedBy">
                  Recebido por <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receivedBy"
                  {...register('receivedBy', { required: true })}
                  placeholder="Nome do responsável"
                />
                {errors.receivedBy && (
                  <p className="text-xs text-red-500">Campo obrigatório</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Checklist de Entrega</h3>
              <div className="space-y-2 mb-3">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleCheckItem(index)}
                      className="h-4 w-4"
                    />
                    <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                      {item.description}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCheckItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar item ao checklist..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCheckItem())}
                />
                <Button type="button" onClick={addCheckItem} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                {...register('notes')}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Observações sobre a entrega..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button 
            type="submit" 
            className="flex-1"
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Registrando...' : 'Registrar Entrega'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Formulário de Nova Entrega criado!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ Todos os formulários criados!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}📝 Arquivos criados:${NC}"
echo ""
echo "APIs:"
echo "  ✓ lib/api/purchase-orders.ts"
echo "  ✓ lib/api/invoices.ts"
echo "  ✓ lib/api/deliveries.ts"
echo ""
echo "Formulários:"
echo "  ✓ app/orders/new/page.tsx"
echo "  ✓ app/orders/[id]/page.tsx"
echo "  ✓ app/purchase-orders/new/page.tsx"
echo "  ✓ app/invoices/new/page.tsx"
echo "  ✓ app/deliveries/new/page.tsx"
echo ""
echo -e "${GREEN}🎉 Sistema completo! Todos os formulários e detalhes foram criados!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximo passo:${NC}"
echo "  Execute: npm run dev"
echo "  Teste todas as funcionalidades!"
echo ""
