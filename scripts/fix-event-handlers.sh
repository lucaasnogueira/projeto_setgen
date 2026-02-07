#!/bin/bash

# ========================================
# Portal Setgen - Correção de Event Handlers
# ========================================
# Corrige erro de event handlers em Server Components
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Corrigindo Event Handlers"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# CORRIGIR PÁGINA 404
# ========================================

echo -e "${YELLOW}🔧 Corrigindo página 404...${NC}"

cat > app/not-found.tsx << 'EOF'
"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-orange-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Página não encontrada
          </h2>
          <p className="text-gray-600 text-lg">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              <Home className="h-5 w-5" />
              Ir para Dashboard
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline" 
            className="gap-2 border-orange-600 text-orange-600 hover:bg-orange-50"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Página 404 corrigida!${NC}"

# ========================================
# LIMPAR CACHE
# ========================================

echo -e "${YELLOW}🧹 Limpando cache...${NC}"

rm -rf .next

echo -e "${GREEN}✅ Cache limpo!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ Erro Corrigido!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}💡 Próximo passo:${NC}"
echo "  npm run dev"
echo ""
