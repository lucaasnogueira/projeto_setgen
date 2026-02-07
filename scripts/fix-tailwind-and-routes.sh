#!/bin/bash

# ========================================
# Portal Setgen - Correção Tailwind + Proteção de Rotas
# ========================================
# Corrige:
# 1. Erro do Tailwind (border-border)
# 2. Proteção de rotas (redirecionar para login)
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Corrigindo Tailwind + Rotas"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# 1. CORRIGIR GLOBALS.CSS
# ========================================

echo -e "${YELLOW}🎨 Corrigindo globals.css...${NC}"

cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 210 11% 15%;
  --card: 0 0% 100%;
  --card-foreground: 210 11% 15%;
  --popover: 0 0% 100%;
  --popover-foreground: 210 11% 15%;
  --primary: 18 89% 64%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 29% 24%;
  --secondary-foreground: 0 0% 100%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 210 11% 15%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 18 89% 64%;
  --radius: 0.5rem;
}

.dark {
  --background: 210 11% 15%;
  --foreground: 210 40% 98%;
  --card: 210 11% 15%;
  --card-foreground: 210 40% 98%;
  --popover: 210 11% 15%;
  --popover-foreground: 210 40% 98%;
  --primary: 18 89% 64%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 29% 24%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 18 89% 64%;
}

* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-feature-settings: "rlig" 1, "calt" 1;
}
EOF

echo -e "${GREEN}✅ globals.css corrigido!${NC}"

# ========================================
# 2. CRIAR MIDDLEWARE DE AUTENTICAÇÃO
# ========================================

echo -e "${YELLOW}🔐 Criando middleware de autenticação...${NC}"

cat > middleware.ts << 'EOF'
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-storage')?.value;
  const { pathname } = request.nextUrl;

  // Rotas públicas (não requerem autenticação)
  const publicRoutes = ['/auth/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Se está em rota pública e tem token, redireciona para dashboard
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Se não está em rota pública e não tem token, redireciona para login
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
EOF

echo -e "${GREEN}✅ Middleware criado!${NC}"

# ========================================
# 3. CRIAR PÁGINA INICIAL (REDIRECIONA PARA LOGIN)
# ========================================

echo -e "${YELLOW}🏠 Criando página inicial...${NC}"

cat > app/page.tsx << 'EOF'
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function HomePage() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Página inicial criada!${NC}"

# ========================================
# 4. ATUALIZAR AUTH STORE (USAR COOKIE)
# ========================================

echo -e "${YELLOW}💾 Atualizando auth store...${NC}"

cat > store/auth.ts << 'EOF'
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
        // Salvar também em cookie para o middleware
        document.cookie = `auth-storage=${token}; path=/; max-age=86400`; // 24h
      },
      clearAuth: () => {
        set({ user: null, token: null });
        // Limpar cookie
        document.cookie = 'auth-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
EOF

echo -e "${GREEN}✅ Auth store atualizado!${NC}"

# ========================================
# 5. LIMPAR CACHE DO NEXT.JS
# ========================================

echo -e "${YELLOW}🧹 Limpando cache...${NC}"

rm -rf .next

echo -e "${GREEN}✅ Cache limpo!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ Correções Aplicadas!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}📝 O que foi corrigido:${NC}"
echo "  ✓ globals.css (sem @layer base)"
echo "  ✓ Middleware de autenticação"
echo "  ✓ Página inicial (redireciona)"
echo "  ✓ Auth store com cookie"
echo "  ✓ Cache limpo"
echo ""
echo -e "${GREEN}🎉 Agora o sistema vai para LOGIN primeiro!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "  1. npm run dev"
echo "  2. Acesse http://localhost:3000"
echo "  3. Será redirecionado para /auth/login"
echo "  4. Após login, vai para /dashboard"
echo ""
