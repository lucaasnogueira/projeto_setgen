#!/bin/bash

# ========================================
# Portal Setgen - Criar Todas as APIs
# ========================================
# Cria TODAS as APIs necessárias
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Criando Todas as APIs"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# Garantir que a pasta existe
mkdir -p lib/api

# ========================================
# ORDERS API
# ========================================

echo -e "${YELLOW}📄 Criando API de Orders...${NC}"

cat > lib/api/orders.ts << 'EOF'
import api from './client';
import { ServiceOrder } from '@/types';

export const ordersApi = {
  async getAll(): Promise<ServiceOrder[]> {
    try {
      const { data } = await api.get('/service-orders');
      return data;
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
      return [];
    }
  },

  async getById(id: string): Promise<ServiceOrder> {
    const { data } = await api.get(`/service-orders/${id}`);
    return data;
  },

  async create(orderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    const { data } = await api.post('/service-orders', orderData);
    return data;
  },

  async update(id: string, orderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    const { data } = await api.patch(`/service-orders/${id}`, orderData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/service-orders/${id}`);
  },
};
EOF

echo -e "${GREEN}✅ Orders API criada!${NC}"

# ========================================
# APPROVALS API
# ========================================

echo -e "${YELLOW}✅ Criando API de Approvals...${NC}"

cat > lib/api/approvals.ts << 'EOF'
import api from './client';
import { ServiceOrder } from '@/types';

export const approvalsApi = {
  async getPending(): Promise<ServiceOrder[]> {
    try {
      const { data } = await api.get('/service-orders', {
        params: { status: 'PENDING_APPROVAL' }
      });
      return data;
    } catch (error) {
      console.error('Erro ao buscar aprovações:', error);
      return [];
    }
  },

  async approve(id: string): Promise<ServiceOrder> {
    const { data } = await api.post(`/service-orders/${id}/approve`);
    return data;
  },

  async reject(id: string, reason: string): Promise<ServiceOrder> {
    const { data } = await api.post(`/service-orders/${id}/reject`, { reason });
    return data;
  },
};
EOF

echo -e "${GREEN}✅ Approvals API criada!${NC}"

# ========================================
# PURCHASE ORDERS API
# ========================================

echo -e "${YELLOW}🛒 Criando API de Purchase Orders...${NC}"

cat > lib/api/purchase-orders.ts << 'EOF'
import api from './client';
import { PurchaseOrder } from '@/types';

export const purchaseOrdersApi = {
  async getAll(): Promise<PurchaseOrder[]> {
    try {
      const { data } = await api.get('/purchase-orders');
      return data;
    } catch (error) {
      console.error('Erro ao buscar ordens de compra:', error);
      return [];
    }
  },

  async getById(id: string): Promise<PurchaseOrder> {
    const { data } = await api.get(`/purchase-orders/${id}`);
    return data;
  },

  async create(orderData: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const { data } = await api.post('/purchase-orders', orderData);
    return data;
  },

  async update(id: string, orderData: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const { data } = await api.patch(`/purchase-orders/${id}`, orderData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/purchase-orders/${id}`);
  },
};
EOF

echo -e "${GREEN}✅ Purchase Orders API criada!${NC}"

# ========================================
# INVOICES API
# ========================================

echo -e "${YELLOW}💰 Criando API de Invoices...${NC}"

cat > lib/api/invoices.ts << 'EOF'
import api from './client';
import { Invoice } from '@/types';

export const invoicesApi = {
  async getAll(): Promise<Invoice[]> {
    try {
      const { data } = await api.get('/invoices');
      return data;
    } catch (error) {
      console.error('Erro ao buscar notas fiscais:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Invoice> {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
  },

  async create(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const { data } = await api.post('/invoices', invoiceData);
    return data;
  },

  async update(id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const { data } = await api.patch(`/invoices/${id}`, invoiceData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },
};
EOF

echo -e "${GREEN}✅ Invoices API criada!${NC}"

# ========================================
# DELIVERIES API
# ========================================

echo -e "${YELLOW}🚚 Criando API de Deliveries...${NC}"

cat > lib/api/deliveries.ts << 'EOF'
import api from './client';
import { Delivery } from '@/types';

export const deliveriesApi = {
  async getAll(): Promise<Delivery[]> {
    try {
      const { data } = await api.get('/deliveries');
      return data;
    } catch (error) {
      console.error('Erro ao buscar entregas:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Delivery> {
    const { data } = await api.get(`/deliveries/${id}`);
    return data;
  },

  async create(deliveryData: Partial<Delivery>): Promise<Delivery> {
    const { data } = await api.post('/deliveries', deliveryData);
    return data;
  },

  async update(id: string, deliveryData: Partial<Delivery>): Promise<Delivery> {
    const { data } = await api.patch(`/deliveries/${id}`, deliveryData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/deliveries/${id}`);
  },
};
EOF

echo -e "${GREEN}✅ Deliveries API criada!${NC}"

# ========================================
# INVENTORY API
# ========================================

echo -e "${YELLOW}📦 Criando API de Inventory...${NC}"

cat > lib/api/inventory.ts << 'EOF'
import api from './client';
import { InventoryItem } from '@/types';

export const inventoryApi = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const { data } = await api.get('/inventory');
      return data;
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      return [];
    }
  },

  async getById(id: string): Promise<InventoryItem> {
    const { data } = await api.get(`/inventory/${id}`);
    return data;
  },

  async create(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data } = await api.post('/inventory', itemData);
    return data;
  },

  async update(id: string, itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data } = await api.patch(`/inventory/${id}`, itemData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/inventory/${id}`);
  },

  async adjustStock(id: string, quantity: number, type: 'IN' | 'OUT'): Promise<InventoryItem> {
    const { data } = await api.post(`/inventory/${id}/adjust`, { quantity, type });
    return data;
  },
};
EOF

echo -e "${GREEN}✅ Inventory API criada!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ TODAS AS APIs CRIADAS!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}APIs criadas:${NC}"
echo "  ✓ lib/api/orders.ts"
echo "  ✓ lib/api/approvals.ts"
echo "  ✓ lib/api/purchase-orders.ts"
echo "  ✓ lib/api/invoices.ts"
echo "  ✓ lib/api/deliveries.ts"
echo "  ✓ lib/api/inventory.ts"
echo ""
echo -e "${GREEN}🎉 Erro de importação resolvido!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximo passo:${NC}"
echo "  O servidor deve recarregar automaticamente"
echo "  Se não, reinicie: npm run dev"
echo ""
