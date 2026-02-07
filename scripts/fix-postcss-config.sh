#!/bin/bash

# ========================================
# Portal Setgen - Fix PostCSS Config
# ========================================
# Corrige erro de ES Module vs CommonJS
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Corrigindo PostCSS Config"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# SOLUÇÃO 1: Renomear para .cjs
# ========================================

echo -e "${YELLOW}🔧 Criando postcss.config.cjs...${NC}"

# Remove arquivo antigo se existir
rm -f postcss.config.js

# Cria novo arquivo .cjs (CommonJS)
cat > postcss.config.cjs << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo -e "${GREEN}✅ postcss.config.cjs criado!${NC}"

# ========================================
# LIMPAR CACHE
# ========================================

echo -e "${YELLOW}🧹 Limpando cache...${NC}"

rm -rf .next

echo -e "${GREEN}✅ Cache limpo!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ PostCSS Corrigido!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}🎯 O que foi feito:${NC}"
echo "  ✓ postcss.config.js → postcss.config.cjs"
echo "  ✓ Agora usa CommonJS corretamente"
echo "  ✓ Cache limpo"
echo ""
echo -e "${GREEN}🎉 Tailwind vai funcionar agora!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximo passo:${NC}"
echo "  npm run dev"
echo ""
