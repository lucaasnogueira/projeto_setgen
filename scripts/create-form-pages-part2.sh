#!/bin/bash

# ========================================
# Portal Setgen - Formulários Parte 2
# ========================================
# OS, OC, NFe, Entrega, Produto
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Criando Formulários - Parte 2"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# 3. NOVA ORDEM DE SERVIÇO
# ========================================

echo -e "${YELLOW}📄 Criando formulário de Nova OS...${NC}"

mkdir -p "app/(portal)/orders/new"

cat > "app/(portal)/orders/new/page.tsx" << 'EOF'
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { clientsApi } from '@/lib/api/clients';
import { FileText, Save, X } from 'lucide-react';

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    type: 'VISIT_REPORT',
    scope: '',
    deadline: '',
    observations: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const data = await clientsApi.getAll();
    setClients(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await ordersApi.create(formData);
      alert('OS criada com sucesso!');
      router.push('/orders');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao criar OS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <FileText className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Nova Ordem de Serviço</h1>
            <p className="text-blue-100">Crie uma nova OS</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de OS <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="VISIT_REPORT">Relatório de Visita</option>
                <option value="EXECUTION">Execução de Serviço</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escopo do Serviço <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              rows={6}
              placeholder="Descreva detalhadamente o escopo do serviço a ser realizado..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prazo de Execução
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={3}
              placeholder="Observações adicionais..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
          >
            <X className="h-5 w-5" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Criando...' : 'Criar OS'}
          </button>
        </div>
      </form>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Formulário de OS criado!${NC}"

# ========================================
# 4. NOVA ORDEM DE COMPRA
# ========================================

echo -e "${YELLOW}🛒 Criando formulário de Nova OC...${NC}"

mkdir -p "app/(portal)/purchase-orders/new"

cat > "app/(portal)/purchase-orders/new/page.tsx" << 'EOF'
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { ordersApi } from '@/lib/api/orders';
import { ShoppingCart, Save, X } from 'lucide-react';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    serviceOrderId: '',
    orderNumber: '',
    value: '',
    issueDate: '',
    expiryDate: '',
    notes: '',
  });

  useEffect(() => {
    loadServiceOrders();
  }, []);

  const loadServiceOrders = async () => {
    const data = await ordersApi.getAll();
    setServiceOrders(data.filter(o => o.status === 'APPROVED'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await purchaseOrdersApi.create({
        ...formData,
        value: parseFloat(formData.value),
      });
      alert('OC cadastrada com sucesso!');
      router.push('/purchase-orders');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao cadastrar OC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Nova Ordem de Compra</h1>
            <p className="text-green-100">Registre uma OC do cliente</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OS Aprovada <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.serviceOrderId}
              onChange={(e) => setFormData({ ...formData, serviceOrderId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Selecione uma OS aprovada</option>
              {serviceOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.client?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número da OC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                placeholder="Ex: OC-2024-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Emissão <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validade
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
          >
            <X className="h-5 w-5" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Salvando...' : 'Salvar OC'}
          </button>
        </div>
      </form>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Formulário de OC criado!${NC}"

# ========================================
# 5. NOVA NOTA FISCAL
# ========================================

echo -e "${YELLOW}💰 Criando formulário de Nova NFe...${NC}"

mkdir -p "app/(portal)/invoices/new"

cat > "app/(portal)/invoices/new/page.tsx" << 'EOF'
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api/invoices';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { DollarSign, Save, X } from 'lucide-react';

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    invoiceNumber: '',
    series: '',
    value: '',
    issueDate: '',
    notes: '',
  });

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    const data = await purchaseOrdersApi.getAll();
    setPurchaseOrders(data);
  };

  const handlePOSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const poId = e.target.value;
    setFormData(prev => ({ ...prev, purchaseOrderId: poId }));
    
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setFormData(prev => ({ ...prev, value: po.value?.toString() || '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await invoicesApi.create({
        ...formData,
        value: parseFloat(formData.value),
      });
      alert('NFe emitida com sucesso!');
      router.push('/invoices');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao emitir NFe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <DollarSign className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Nova Nota Fiscal</h1>
            <p className="text-emerald-100">Emita uma NFe</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordem de Compra <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.purchaseOrderId}
              onChange={handlePOSelect}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Selecione uma OC</option>
              {purchaseOrders.map(po => (
                <option key={po.id} value={po.id}>
                  {po.orderNumber} - R$ {po.value}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="000001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Série
              </label>
              <input
                type="text"
                value={formData.series}
                onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                placeholder="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Emissão <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
          >
            <X className="h-5 w-5" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Emitindo...' : 'Emitir NFe'}
          </button>
        </div>
      </form>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Formulário de NFe criado!${NC}"

# ========================================
# 6. NOVA ENTREGA
# ========================================

echo -e "${YELLOW}🚚 Criando formulário de Nova Entrega...${NC}"

mkdir -p "app/(portal)/deliveries/new"

cat > "app/(portal)/deliveries/new/page.tsx" << 'EOF'
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deliveriesApi } from '@/lib/api/deliveries';
import { ordersApi } from '@/lib/api/orders';
import { Truck, Save, X } from 'lucide-react';

export default function NewDeliveryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    serviceOrderId: '',
    deliveryDate: '',
    receivedBy: '',
    notes: '',
  });

  useEffect(() => {
    loadServiceOrders();
  }, []);

  const loadServiceOrders = async () => {
    const data = await ordersApi.getAll();
    setServiceOrders(data.filter(o => o.status === 'COMPLETED'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await deliveriesApi.create(formData);
      alert('Entrega registrada com sucesso!');
      router.push('/deliveries');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao registrar entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Truck className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Nova Entrega</h1>
            <p className="text-indigo-100">Registre uma entrega ao cliente</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OS Concluída <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.serviceOrderId}
              onChange={(e) => setFormData({ ...formData, serviceOrderId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Selecione uma OS</option>
              {serviceOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.client?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Entrega <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recebido por <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.receivedBy}
              onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
              placeholder="Nome de quem recebeu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Observações sobre a entrega..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
          >
            <X className="h-5 w-5" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Salvando...' : 'Registrar Entrega'}
          </button>
        </div>
      </form>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Formulário de Entrega criado!${NC}"

# ========================================
# 7. NOVO PRODUTO (ESTOQUE)
# ========================================

echo -e "${YELLOW}📦 Criando formulário de Novo Produto...${NC}"

mkdir -p "app/(portal)/inventory/new"

cat > "app/(portal)/inventory/new/page.tsx" << 'EOF'
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { inventoryApi } from '@/lib/api/inventory';
import { Package, Save, X } from 'lucide-react';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    unit: 'UN',
    currentStock: '',
    minimumStock: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await inventoryApi.create({
        ...formData,
        currentStock: parseInt(formData.currentStock),
        minimumStock: parseInt(formData.minimumStock),
      });
      alert('Produto cadastrado com sucesso!');
      router.push('/inventory');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao cadastrar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Package className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Novo Produto</h1>
            <p className="text-amber-100">Cadastre um item no estoque</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: PROD-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidade <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="UN">Unidade (UN)</option>
                <option value="PC">Peça (PC)</option>
                <option value="CX">Caixa (CX)</option>
                <option value="KG">Quilograma (KG)</option>
                <option value="M">Metro (M)</option>
                <option value="L">Litro (L)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Produto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Cabo de rede CAT6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Descrição detalhada do produto..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estoque Inicial <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                min="0"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estoque Mínimo <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                min="0"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Alerta quando estoque atingir este valor
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
          >
            <X className="h-5 w-5" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Formulário de Produto criado!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ TODOS OS FORMULÁRIOS CRIADOS!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}Formulários criados:${NC}"
echo "  ✓ Nova OS"
echo "  ✓ Nova OC"
echo "  ✓ Nova NFe"
echo "  ✓ Nova Entrega"
echo "  ✓ Novo Produto"
echo ""
echo -e "${GREEN}🎉 Todos os botões 'Novo' funcionam!${NC}"
echo ""
