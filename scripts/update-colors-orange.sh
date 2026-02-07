#!/bin/bash

# ========================================
# Portal Setgen - Atualização de Cores
# ========================================
# Este script atualiza TODAS as cores do sistema
# para a paleta corporativa Laranja (#F58B51)
# conforme especificação do design
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Atualizando Paleta de Cores"
echo "   Laranja Corporativo"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# ATUALIZAR TAILWIND CONFIG
# ========================================

echo -e "${YELLOW}🎨 Atualizando Tailwind Config...${NC}"

cat > tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Cores customizadas do Portal Setgen
        orange: {
          50: '#FFF5F0',
          100: '#FFE8DC',
          200: '#FFD1BA',
          300: '#FFB897',
          400: '#FF9E74',
          500: '#F58B51', // Cor principal
          600: '#E67A40',
          700: '#D66A30',
          800: '#B85A28',
          900: '#9A4B21',
        },
        success: {
          DEFAULT: '#2ECC71',
          light: '#A8E6CF',
          dark: '#27AE60',
        },
        warning: {
          DEFAULT: '#F39C12',
          light: '#FFE5B4',
          dark: '#E67E22',
        },
        error: {
          DEFAULT: '#E74C3C',
          light: '#FFCCCC',
          dark: '#C0392B',
        },
        info: {
          DEFAULT: '#3498DB',
          light: '#AED6F1',
          dark: '#2980B9',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
EOF

# ========================================
# ATUALIZAR GLOBALS.CSS
# ========================================

echo -e "${YELLOW}🎨 Atualizando globals.css...${NC}"

cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 210 11% 15%;
    --card: 0 0% 100%;
    --card-foreground: 210 11% 15%;
    --popover: 0 0% 100%;
    --popover-foreground: 210 11% 15%;
    
    /* Laranja como cor primária */
    --primary: 18 89% 64%;
    --primary-foreground: 0 0% 100%;
    
    /* Cinza escuro como secundária */
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
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
EOF

# ========================================
# ATUALIZAR LOGIN PAGE
# ========================================

echo -e "${YELLOW}🔐 Atualizando página de login...${NC}"

cat > app/auth/login/page.tsx << 'EOF'
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LogIn, Eye, EyeOff, Building2, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha e-mail e senha para continuar",
      });
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.login({ email, password });
      setAuth(data.user, data.access_token);
      
      toast({
        title: "Login realizado!",
        description: `Bem-vindo, ${data.user.name}!`,
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.response?.data?.message || "E-mail ou senha inválidos",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Portal Setgen</h1>
          <p className="text-gray-600 text-lg">Sistema de Gestão de Serviços</p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Acesse sua conta
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Entre com suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700">Senha</Label>
                  <button
                    type="button"
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                    onClick={() => toast({ title: "Em breve", description: "Funcionalidade em desenvolvimento" })}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-12 pr-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                  Lembrar-me
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            {/* Informações de Segurança */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="h-4 w-4 text-orange-600" />
                <span>Conexão segura e criptografada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 Portal Setgen. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
EOF

# ========================================
# ATUALIZAR DASHBOARD
# ========================================

echo -e "${YELLOW}📊 Atualizando dashboard...${NC}"

cat > app/dashboard/page.tsx << 'EOF'
"use client"

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { dashboardApi } from '@/lib/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/types';
import {
  Users,
  FileText,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Package,
} from 'lucide-react';
import { formatCurrency, getRoleLabel } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-6">
      {/* Header com Saudação - Laranja */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {greeting()}, {user?.name}! 👋
            </h1>
            <p className="text-orange-100 text-lg">
              Perfil: {user ? getRoleLabel(user.role) : ''}
            </p>
            <p className="text-orange-200 text-sm mt-1">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-6">
              <Activity className="h-16 w-16 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas - Cores Corporativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aprovações Pendentes
            </CardTitle>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats?.pendingApprovals || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Aguardando sua aprovação
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              OS Ativas
            </CardTitle>
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.activeOrders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Concluídas (Mês)
            </CardTitle>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.completedThisMonth || 0}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600 font-medium">
                +12% vs mês anterior
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Faturamento Total
            </CardTitle>
            <div className="bg-emerald-100 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Acumulado no ano
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Estoque Baixo
            </CardTitle>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats?.lowStockItems || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Itens abaixo do estoque mínimo
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              NFe Vencidas
            </CardTitle>
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats?.overdueInvoices || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Requer atenção imediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-800">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'OS #1234 aprovada', time: 'Há 5 minutos', icon: CheckCircle, color: 'text-green-600' },
              { action: 'Nova visita técnica agendada', time: 'Há 15 minutos', icon: Clock, color: 'text-orange-600' },
              { action: 'NFe #5678 emitida', time: 'Há 1 hora', icon: FileText, color: 'text-purple-600' },
              { action: 'OC #9012 recebida', time: 'Há 2 horas', icon: TrendingUp, color: 'text-emerald-600' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`${activity.color}`}>
                  <activity.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-800">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center group">
              <Users className="h-10 w-10 mx-auto mb-2 text-gray-400 group-hover:text-orange-600" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">
                Novo Cliente
              </p>
            </button>
            <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center group">
              <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400 group-hover:text-green-600" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-green-600">
                Nova OS
              </p>
            </button>
            <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center group">
              <Clock className="h-10 w-10 mx-auto mb-2 text-gray-400 group-hover:text-purple-600" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-purple-600">
                Nova Visita
              </p>
            </button>
            <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center group">
              <Package className="h-10 w-10 mx-auto mb-2 text-gray-400 group-hover:text-blue-600" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                Nova NFe
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Cores atualizadas com sucesso!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ Paleta Laranja Aplicada!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}🎨 Mudanças aplicadas:${NC}"
echo "  ✓ Cor primária: Laranja #F58B51"
echo "  ✓ Cor secundária: Cinza escuro #2C3E50"
echo "  ✓ Login com gradiente laranja"
echo "  ✓ Dashboard com header laranja"
echo "  ✓ Cards com bordas coloridas"
echo "  ✓ Botões com gradiente laranja"
echo ""
echo -e "${GREEN}🎉 Reinicie o servidor para ver as mudanças!${NC}"
echo "  npm run dev"
echo ""
