# Portal Setgen - Backend

Sistema de gestão de serviços corporativos desenvolvido com NestJS, Prisma e PostgreSQL.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Executando o Projeto](#executando-o-projeto)
- [API Documentation](#api-documentation)
- [Módulos](#módulos)
- [Perfis de Usuário](#perfis-de-usuário)
- [Banco de Dados](#banco-de-dados)

## 🎯 Sobre o Projeto

O Portal Setgen Backend é uma API REST robusta que centraliza toda a operação da empresa, desde visitas técnicas até faturamento e entrega de serviços, eliminando processos manuais e garantindo rastreabilidade completa.

### Principais Funcionalidades

- ✅ Gestão completa de clientes com consulta automática de CNPJ
- ✅ Controle de visitas técnicas e relatórios
- ✅ Ordens de Serviço (Visita e Execução)
- ✅ Fluxo de autorizações e aprovações
- ✅ Gestão de Ordens de Compra
- ✅ Controle de faturamento e notas fiscais
- ✅ Gestão de entrega e aceite
- ✅ Controle de estoque
- ✅ Relatórios e indicadores operacionais
- ✅ Sistema de auditoria completo

## 🚀 Tecnologias

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo
- **[Prisma 6.19.1](https://www.prisma.io/)** - ORM moderno para TypeScript
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[TypeScript](https://www.typescriptlang.org/)** - Superset JavaScript tipado
- **[JWT](https://jwt.io/)** - Autenticação segura
- **[Swagger](https://swagger.io/)** - Documentação automática da API
- **[Class Validator](https://github.com/typestack/class-validator)** - Validação de dados
- **[Bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Criptografia de senhas

## 📦 Pré-requisitos

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm ou yarn
- Git

## ⚙️ Instalação

```bash
# Clone o repositório
git clone https://github.com/sua-empresa/portal-setgen-backend.git

# Entre no diretório
cd portal-setgen-backend

# Instale as dependências
npm install
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/portal_setgen?schema=public"

# JWT
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
JWT_EXPIRES_IN="24h"

# API
PORT=3000
NODE_ENV="development"

# CNPJ API (ReceitaWS ou similar)
CNPJ_API_URL="https://www.receitaws.com.br/v1/cnpj"
CNPJ_API_TIMEOUT=5000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Cors
CORS_ORIGIN="http://localhost:3001"
```

### 2. Configuração do Banco de Dados

```bash
# Execute as migrations
npx prisma migrate dev

# (Opcional) Seed inicial
npx prisma db seed
```

## 📁 Estrutura do Projeto

```
src/
├── auth/                    # Módulo de autenticação
│   ├── decorators/         # Decorators personalizados
│   ├── guards/             # Guards de autenticação
│   ├── strategies/         # Estratégias JWT
│   └── dto/                # DTOs de autenticação
├── modules/
│   ├── users/              # Gestão de usuários
│   ├── clients/            # Gestão de clientes
│   ├── technical-visits/   # Visitas técnicas
│   ├── service-orders/     # Ordens de serviço
│   ├── authorizations/     # Autorizações e aprovações
│   ├── purchase-orders/    # Ordens de compra
│   ├── invoices/           # Notas fiscais
│   ├── deliveries/         # Entregas e aceites
│   ├── inventory/          # Estoque
│   └── reports/            # Relatórios e indicadores
├── common/
│   ├── decorators/         # Decorators compartilhados
│   ├── filters/            # Exception filters
│   ├── guards/             # Guards compartilhados
│   ├── interceptors/       # Interceptors
│   ├── pipes/              # Pipes de validação
│   └── utils/              # Utilidades
├── prisma/
│   ├── schema.prisma       # Schema do banco
│   ├── migrations/         # Histórico de migrations
│   └── seed.ts             # Seed inicial
├── config/                 # Configurações
├── app.module.ts           # Módulo principal
└── main.ts                 # Entry point
```

## 🏃 Executando o Projeto

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod

# Debug
npm run start:debug
```

A API estará disponível em `http://localhost:3000`

## 📖 API Documentation

Após iniciar o projeto, acesse a documentação Swagger:

```
http://localhost:3000/api/docs
```

### Autenticação

Todas as rotas (exceto login e registro) requerem autenticação JWT via header:

```
Authorization: Bearer {seu-token-jwt}
```

## 🔐 Perfis de Usuário

| Perfil             | Descrição               | Permissões                            |
| ------------------ | ----------------------- | ------------------------------------- |
| **ADMINISTRADOR**  | Acesso total ao sistema | Todas as operações                    |
| **GERENTE**        | Gestão e aprovações     | Aprovações, relatórios, visualizações |
| **ADMINISTRATIVO** | Suporte operacional     | Cadastros, consultas, edições         |
| **ALMOXARIFADO**   | Gestão de estoque       | Controle de estoque, materiais        |
| **TECNICO**        | Operacional de campo    | Visitas técnicas, OS, execução        |

## 🗄️ Banco de Dados

### Principais Entidades

- **User** - Usuários do sistema
- **Client** - Clientes da empresa
- **TechnicalVisit** - Visitas técnicas realizadas
- **ServiceOrder** - Ordens de serviço (visita e execução)
- **Authorization** - Autorizações e aprovações
- **PurchaseOrder** - Ordens de compra dos clientes
- **Invoice** - Notas fiscais emitidas
- **Delivery** - Entregas e aceites
- **InventoryItem** - Itens do estoque
- **AuditLog** - Log de auditoria do sistema

### Comandos Prisma Úteis

```bash
# Gerar client do Prisma
npx prisma generate

# Criar nova migration
npx prisma migrate dev --name nome-da-migration

# Resetar banco (CUIDADO!)
npx prisma migrate reset

# Abrir Prisma Studio (GUI)
npx prisma studio

# Formatar schema
npx prisma format
```

## 🔌 Integração CNPJ

A API possui integração automática para consulta de dados empresariais via CNPJ:

```typescript
// Endpoint
POST /api/clients/cnpj/:cnpj

// Resposta
{
  "cnpj": "00000000000000",
  "razaoSocial": "Empresa Exemplo LTDA",
  "nomeFantasia": "Empresa Exemplo",
  "cep": "00000-000",
  "logradouro": "Rua Exemplo",
  "numero": "123",
  "complemento": "",
  "bairro": "Centro",
  "municipio": "São Paulo",
  "uf": "SP",
  "telefone": "(11) 0000-0000",
  "email": "contato@exemplo.com.br"
}
```

Os dados retornados podem ser editados antes de salvar no sistema.

## 📊 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev          # Inicia em modo watch
npm run start:debug        # Inicia com debugger

# Build
npm run build              # Compila o projeto

# Produção
npm run start:prod         # Inicia versão compilada

# Testes
npm run test               # Executa testes
npm run test:watch         # Testes em modo watch
npm run test:cov           # Testes com coverage
npm run test:e2e           # Testes end-to-end

# Qualidade de Código
npm run lint               # Executa linter
npm run format             # Formata código

# Prisma
npm run prisma:generate    # Gera Prisma client
npm run prisma:migrate     # Executa migrations
npm run prisma:studio      # Abre Prisma Studio
```

## 🔒 Segurança

- ✅ Autenticação JWT com tokens seguros
- ✅ Bcrypt para hash de senhas
- ✅ Validação de dados em todas as rotas
- ✅ Rate limiting (implementado via guards)
- ✅ CORS configurável
- ✅ Helmet para headers de segurança
- ✅ Auditoria completa de ações
- ✅ Controle de acesso baseado em perfis

## 📈 Monitoramento e Logs

O sistema registra automaticamente:

- Todas as operações críticas (criação, edição, exclusão)
- Tentativas de acesso não autorizado
- Erros e exceções
- Mudanças de status em entidades principais

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

## 👥 Equipe

- **Desenvolvimento**: [Sua Equipe]
- **Contato**: desenvolvimento@suaempresa.com.br

## 📞 Suporte

Para dúvidas ou problemas:

- Email: suporte@suaempresa.com.br
- Issues: [GitHub Issues](https://github.com/sua-empresa/portal-setgen-backend/issues)

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2026  
**Status**: Em desenvolvimento ativo 🚀
