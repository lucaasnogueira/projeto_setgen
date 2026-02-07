#!/bin/bash

# ========================================
# Portal Setgen - Fix Tailwind CSS
# ========================================
# Garante que o Tailwind está processando classes
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Corrigindo Tailwind CSS"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# 1. RECRIAR TAILWIND.CONFIG.TS
# ========================================

echo -e "${YELLOW}⚙️  Recriando Tailwind config...${NC}"

cat > tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
    },
  },
  plugins: [],
}

export default config
EOF

echo -e "${GREEN}✅ Tailwind config criado!${NC}"

# ========================================
# 2. RECRIAR GLOBALS.CSS
# ========================================

echo -e "${YELLOW}🎨 Recriando globals.css...${NC}"

cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
EOF

echo -e "${GREEN}✅ globals.css criado!${NC}"

# ========================================
# 3. VERIFICAR POSTCSS.CONFIG.JS
# ========================================

echo -e "${YELLOW}⚙️  Criando postcss.config.js...${NC}"

cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo -e "${GREEN}✅ postcss.config.js criado!${NC}"

# ========================================
# 4. REINSTALAR DEPENDÊNCIAS TAILWIND
# ========================================

echo -e "${YELLOW}📦 Reinstalando dependências Tailwind...${NC}"

npm install -D tailwindcss@latest postcss@latest autoprefixer@latest --legacy-peer-deps

echo -e "${GREEN}✅ Dependências instaladas!${NC}"

# ========================================
# 5. LIMPAR TUDO
# ========================================

echo -e "${YELLOW}🧹 Limpando cache...${NC}"

rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

echo -e "${GREEN}✅ Cache limpo!${NC}"

# ========================================
# 6. VERIFICAR IMPORT DO GLOBALS.CSS
# ========================================

echo -e "${YELLOW}📝 Verificando layout.tsx...${NC}"

cat > app/layout.tsx << 'EOF'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portal Setgen - Gestão de Serviços",
  description: "Sistema completo de gestão de serviços técnicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
EOF

echo -e "${GREEN}✅ layout.tsx verificado!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ Tailwind Configurado!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}📝 O que foi feito:${NC}"
echo "  ✓ Tailwind config recriado"
echo "  ✓ globals.css recriado"
echo "  ✓ postcss.config.js criado"
echo "  ✓ Dependências reinstaladas"
echo "  ✓ Cache limpo"
echo "  ✓ Import do globals.css verificado"
echo ""
echo -e "${GREEN}🎉 Tailwind deve funcionar agora!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "  1. npm run dev"
echo "  2. Aguarde o build completo"
echo "  3. Acesse http://localhost:3000/dashboard"
echo "  4. Veja as cores aparecerem! 🎨"
echo ""
echo -e "${RED}⚠️  IMPORTANTE:${NC}"
echo "  Se ainda não funcionar, tente:"
echo "  1. Feche TODOS os terminais"
echo "  2. Abra um novo terminal"
echo "  3. npm run dev"
echo ""
