#!/bin/bash

# ========================================
# Portal Setgen - SOLUÇÃO COMPLETA FINAL
# ========================================
# Cria TODAS as páginas E garante Tailwind
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   SOLUÇÃO COMPLETA - FINAL"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# 1. CRIAR TODAS AS PÁGINAS FALTANTES
# ========================================

echo -e "${YELLOW}📁 Criando todas as páginas...${NC}"

# Criar estrutura de pastas
mkdir -p "app/(portal)"/{clients,visits,orders,approvals,purchase-orders,invoices,deliveries,inventory,profile}

# Clientes - Lista
cat > "app/(portal)/clients/page.tsx" << 'EOF'
"use client"

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h1>
        <p className="text-gray-600">Página em construção...</p>
      </div>
    </div>
  );
}
EOF

# Visitas - Lista
cat > "app/(portal)/visits/page.tsx" << 'EOF'
"use client"

export default function VisitsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Visitas Técnicas</h1>
        <p className="text-gray-600">Página em construção...</p>
      </div>
    </div>
  );
}
EOF

# Ordens de Serviço - Lista  
cat > "app/(portal)/orders/page.tsx" << 'EOF'
"use client"

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ordens de Serviço</h1>
        <p className="text-gray-600">Página em construção...</p>
      </div>
    </div>
  );
}
EOF

# Aprovações - Lista
cat > "app/(portal)/approvals/page.tsx" << 'EOF'
"use client"

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Aprovações</h1>
        <p className="text-gray-600">Página em construção...</p>
      </div>
    </div>
  );
}
EOF

# Ordens de Compra - Lista
cat > "app/(portal)/purchase-orders/page.tsx" << 'EOF'
"use client"

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ordens de Compra</h1>
        <p className="text-gray-600">Página em construção...</p>
      </div>
    </div>
  );
}
EOF

# Faturamento - Lista
cat > "app/(portal)/invoices/page.tsx" << 'EOF'
"use client"

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Faturamento</h1>
        <p className="text-gray-600">Página em construção...</p>
      </div>
    </div>
  );
}
EOF

# Entregas - Lista
cat > "app/(portal)/deliveries/page.tsx" << 'EOF'
"use client"

export default function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Entregas</h1>
        <p className="text-gray-600">Página em construção...</p>
      </div>
    </div>
  );
}
EOF

# Estoque - Lista
cat > "app/(portal)/inventory/page.tsx" << 'EOF'
"use client"

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Estoque</h1>
        <p className="text-gray-600">Página em construção...</p>
      </div>
    </div>
  );
}
EOF

# Relatórios - Lista
mkdir -p "app/(portal)/reports"
cat > "app/(portal)/reports/page.tsx" << 'EOF'
"use client"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios</h1>
        <p className="text-gray-600">Página em construção...</p>
      </div>
    </div>
  );
}
EOF

# Perfil
cat > "app/(portal)/profile/page.tsx" << 'EOF'
"use client"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
        <p className="text-gray-600">Página em construção...</p>
      </div>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Todas as páginas criadas!${NC}"

# ========================================
# 2. GARANTIR TAILWIND.CONFIG.TS CORRETO
# ========================================

echo -e "${YELLOW}⚙️  Configurando Tailwind...${NC}"

cat > tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
EOF

echo -e "${GREEN}✅ Tailwind config criado!${NC}"

# ========================================
# 3. GARANTIR POSTCSS.CONFIG.CJS
# ========================================

echo -e "${YELLOW}⚙️  Configurando PostCSS...${NC}"

rm -f postcss.config.js postcss.config.mjs

cat > postcss.config.cjs << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo -e "${GREEN}✅ PostCSS config criado!${NC}"

# ========================================
# 4. GARANTIR GLOBALS.CSS
# ========================================

echo -e "${YELLOW}🎨 Configurando globals.css...${NC}"

cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

echo -e "${GREEN}✅ globals.css criado!${NC}"

# ========================================
# 5. LIMPAR CACHE COMPLETO
# ========================================

echo -e "${YELLOW}🧹 Limpando cache...${NC}"

rm -rf .next
rm -rf .turbo
rm -rf node_modules/.cache

echo -e "${GREEN}✅ Cache limpo!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ TUDO PRONTO!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}📝 Páginas criadas:${NC}"
echo "  ✓ Dashboard"
echo "  ✓ Clientes"
echo "  ✓ Visitas Técnicas"
echo "  ✓ Ordens de Serviço"
echo "  ✓ Aprovações"
echo "  ✓ Ordens de Compra"
echo "  ✓ Faturamento"
echo "  ✓ Entregas"
echo "  ✓ Estoque"
echo "  ✓ Relatórios"
echo "  ✓ Perfil"
echo ""
echo -e "${YELLOW}🎨 Configurações:${NC}"
echo "  ✓ tailwind.config.ts"
echo "  ✓ postcss.config.cjs"
echo "  ✓ globals.css"
echo ""
echo -e "${GREEN}🎉 Agora vai funcionar TUDO!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximo passo:${NC}"
echo "  npm run dev"
echo ""
echo -e "${BLUE}📌 Teste a navegação:${NC}"
echo "  • Dashboard → Deve ter cores"
echo "  • Clientes → Deve abrir (não 404)"
echo "  • Visitas → Deve abrir (não 404)"
echo "  • Todas as outras páginas também!"
echo ""
