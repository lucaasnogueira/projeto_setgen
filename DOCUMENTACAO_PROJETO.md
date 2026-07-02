# Documentação do Projeto - Portal Setgen

## Visão Geral

O Portal Setgen é um sistema web para gestão operacional, administrativa, financeira, fiscal e de recursos humanos da empresa. O projeto é dividido em dois módulos principais:

- `portal-setgen-api`: API REST em NestJS, responsável pelas regras de negócio, autenticação, banco de dados, integrações e arquivos.
- `portal-setgen-frontend`: aplicação web em Next.js, responsável pela interface do usuário e consumo da API.

## Estrutura Geral

```text
Projeto Setgen/
+-- certs/
+-- portal-setgen-api/
|   +-- prisma/
|   +-- src/
|   +-- test/
|   +-- uploads/
|   +-- xsds/
|   +-- .env.example
|   +-- package.json
+-- portal-setgen-frontend/
    +-- app/
    +-- components/
    +-- constants/
    +-- hooks/
    +-- lib/
    +-- public/
    +-- store/
    +-- types/
    +-- package.json
```

## Tecnologias

### Backend

- Node.js
- TypeScript
- NestJS 11
- Prisma 6
- PostgreSQL
- JWT com Passport
- Swagger/OpenAPI
- Bcrypt
- Class Validator / Class Transformer
- Multer para upload de arquivos
- Axios para integrações HTTP
- XML, XMLDSIG e certificado A1 para módulo fiscal
- Jest para testes
- ESLint e Prettier

### Frontend

- Node.js
- TypeScript
- Next.js 16
- React 19
- Tailwind CSS
- Axios
- Zustand
- React Hook Form
- Zod
- Radix UI
- Lucide React
- Chart.js, React Chart.js 2 e Recharts
- XLSX
- ESLint

## Requisitos

### Obrigatórios

- Node.js 18 ou superior, preferencialmente versão LTS atual.
- npm.
- PostgreSQL 14 ou superior.
- Banco PostgreSQL criado e acessível pela API.
- Variáveis de ambiente configuradas.

### Opcionais / Por módulo

- Certificado digital A1 `.pfx` para funcionalidades fiscais.
- Pasta `certs/` com o certificado fiscal quando o módulo fiscal for utilizado.
- Pasta `uploads/` com permissão de escrita para anexos e arquivos enviados.

## Backend - `portal-setgen-api`

### Responsabilidades

O backend expõe uma API REST para:

- Autenticação e autorização por JWT.
- Gestão de usuários, papéis e permissões.
- Gestão de clientes.
- Visitas técnicas.
- Ordens de serviço.
- Aprovações.
- Ordens de compra.
- Entregas.
- Estoque.
- Faturamento e notas fiscais.
- Dashboard e relatórios.
- Despesas, categorias financeiras, orçamentos e fluxo de caixa.
- Funcionários e documentos de RH.
- Módulo fiscal com emissão/controle de notas e webhooks.
- Upload e disponibilização de arquivos pela rota `/uploads`.

### Módulos identificados

- `auth`
- `users`
- `access-control`
- `clients`
- `visits`
- `service-orders`
- `approvals`
- `purchase-orders`
- `invoices`
- `deliveries`
- `dashboard`
- `inventory`
- `reports`
- `expenses`
- `expense-categories`
- `financial-reports`
- `budgets`
- `recurring-expenses`
- `employees`
- `fiscal`
- `prisma`
- `common`

### Principais rotas base

A API não possui prefixo global configurado; as rotas partem diretamente da raiz do host.

- `/auth`
- `/users`
- `/permissions`
- `/roles`
- `/clients`
- `/visits`
- `/service-orders`
- `/approvals`
- `/purchase-orders`
- `/invoices`
- `/deliveries`
- `/dashboard`
- `/inventory`
- `/reports`
- `/expenses`
- `/expense-categories`
- `/employees`
- `/fiscal`
- `/uploads`

### Swagger

Com o backend rodando, a documentação interativa da API fica disponível em:

```text
http://localhost:3001/api/docs
```

### Banco de dados

O projeto usa Prisma com PostgreSQL. O schema fica em:

```text
portal-setgen-api/prisma/schema.prisma
```

Entidades principais identificadas:

- `User`
- `Permission`
- `Role`
- `RolePermission`
- `UserPermission`
- `Client`
- `TechnicalVisit`
- `ServiceOrder`
- `ExpenseCategory`
- `Expense`
- `CostCenter`
- `Budget`
- `RecurringExpense`
- `BankAccount`
- `CashFlow`
- `ExpenseAttachment`
- `Approval`
- `PurchaseOrder`
- `Invoice`
- `Delivery`
- `Product`
- `ServiceOrderProduct`
- `StockMovement`
- `AuditLog`
- `Employee`
- `EmployeeMovement`
- `ASO`
- `EmployeeDocument`
- `NotaFiscal`
- `ImpostoRetido`
- `EventoSefaz`
- `WebhookDispatch`

### Variáveis de ambiente do backend

Arquivo de referência:

```text
portal-setgen-api/.env.example
```

Variáveis:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/db_name?schema=public"
JWT_SECRET="generate-a-secure-random-secret-key"
JWT_EXPIRATION="8h"
PORT=3001
NODE_ENV=development
CNPJ_API_URL="https://brasilapi.com.br/api/cnpj/v1"
MAX_FILE_SIZE=5242880
UPLOAD_PATH="./uploads"
CORS_ORIGIN="http://localhost:3000"
CERT_PFX_PATH="./certs/certificado.pfx"
CERT_PFX_PASSWORD=""
WEBHOOK_PORTAL_URL="http://localhost:3000/api/webhooks/fiscal"
```

Observação: use uma chave forte em `JWT_SECRET` e não reutilize as credenciais de desenvolvimento em produção.

### Instalação do backend

```bash
cd portal-setgen-api
npm install
```

### Configuração do banco

```bash
cd portal-setgen-api
npx prisma generate
npx prisma migrate dev
```

### Seed inicial

```bash
cd portal-setgen-api
npm run prisma:seed
```

O seed cria usuários iniciais de desenvolvimento:

- `admin@setgen.com` / `admin123`
- `gerente@setgen.com` / `gerente123`
- `tecnico@setgen.com` / `tecnico123`

Essas credenciais devem ser alteradas ou removidas em ambientes reais.

### Execução do backend

Desenvolvimento:

```bash
cd portal-setgen-api
npm run start:dev
```

Produção:

```bash
cd portal-setgen-api
npm run build
npm run start:prod
```

Por padrão, a API roda em:

```text
http://localhost:3001
```

### Scripts do backend

- `npm run start`: inicia a aplicação NestJS.
- `npm run start:dev`: inicia em modo desenvolvimento com watch.
- `npm run start:debug`: inicia em modo debug.
- `npm run build`: compila o projeto.
- `npm run start:prod`: executa `dist/main`.
- `npm run prisma:generate`: gera o Prisma Client.
- `npm run prisma:migrate`: executa migrations em desenvolvimento.
- `npm run prisma:studio`: abre o Prisma Studio.
- `npm run prisma:seed`: executa o seed.
- `npm run lint`: executa ESLint com correção.
- `npm run format`: formata arquivos TypeScript.
- `npm run test`: executa testes unitários.
- `npm run test:e2e`: executa testes end-to-end.
- `npm run test:cov`: executa testes com cobertura.

## Frontend - `portal-setgen-frontend`

### Responsabilidades

O frontend fornece a interface web para operação do portal, incluindo:

- Login.
- Dashboard.
- Clientes.
- Visitas técnicas.
- Ordens de serviço.
- Aprovações.
- Ordens de compra.
- Entregas.
- Estoque.
- Notas fiscais.
- Financeiro e despesas.
- Relatórios.
- RH e funcionários.
- Usuários.
- Papéis/permissões.
- Perfil do usuário.
- Webhook fiscal via rota interna Next.js.

### Rotas/páginas identificadas

- `/auth/login`
- `/dashboard`
- `/clients`
- `/clients/new`
- `/clients/[id]`
- `/clients/[id]/edit`
- `/visits`
- `/visits/new`
- `/visits/[id]`
- `/visits/[id]/edit`
- `/orders`
- `/orders/new`
- `/orders/[id]`
- `/orders/[id]/edit`
- `/approvals`
- `/approvals/new`
- `/approvals/[id]`
- `/purchase-orders`
- `/purchase-orders/new`
- `/purchase-orders/[id]`
- `/purchase-orders/[id]/edit`
- `/deliveries`
- `/deliveries/new`
- `/deliveries/[id]`
- `/deliveries/[id]/edit`
- `/inventory`
- `/inventory/new`
- `/inventory/[id]`
- `/inventory/[id]/edit`
- `/invoices`
- `/invoices/new`
- `/invoices/emit-dual`
- `/invoices/[id]`
- `/invoices/[id]/edit`
- `/financial`
- `/financial/expenses`
- `/financial/expenses/new`
- `/financial/expenses/[id]`
- `/reports`
- `/rh/employees`
- `/rh/employees/new`
- `/rh/employees/[id]`
- `/users`
- `/users/new`
- `/users/[id]`
- `/roles`
- `/profile`
- `/api/webhooks/fiscal`

### Autenticação no frontend

O frontend usa token armazenado no navegador e envia o header:

```text
Authorization: Bearer <token>
```

Há uma camada de proteção de rotas em:

```text
portal-setgen-frontend/proxy.ts
```

Rotas públicas identificadas:

- `/auth/login`

Usuários sem autenticação são redirecionados para `/auth/login`.

### Variáveis de ambiente do frontend

O frontend usa:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_NAME="Portal Setgen"
```

Arquivo local encontrado:

```text
portal-setgen-frontend/.env.local
```

### Instalação do frontend

```bash
cd portal-setgen-frontend
npm install
```

### Execução do frontend

Desenvolvimento:

```bash
cd portal-setgen-frontend
npm run dev
```

Produção:

```bash
cd portal-setgen-frontend
npm run build
npm run start
```

Por padrão, o Next.js roda em:

```text
http://localhost:3000
```

### Scripts do frontend

- `npm run dev`: inicia o servidor de desenvolvimento.
- `npm run build`: gera build de produção.
- `npm run start`: inicia a aplicação em produção.
- `npm run lint`: executa ESLint.

## Como rodar o projeto localmente

### 1. Preparar o banco PostgreSQL

Crie um banco PostgreSQL para o projeto, por exemplo:

```text
portal_setgen
```

### 2. Configurar o backend

```bash
cd portal-setgen-api
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

Edite o `.env` antes de rodar as migrations, principalmente:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `CERT_PFX_PATH`, se usar fiscal
- `CERT_PFX_PASSWORD`, se usar fiscal

### 3. Configurar o frontend

```bash
cd portal-setgen-frontend
npm install
npm run dev
```

Confirme que `NEXT_PUBLIC_API_URL` aponta para a API:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 4. Acessar

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Swagger: `http://localhost:3001/api/docs`

## Integrações

### Consulta de CNPJ

O backend possui configuração para integração com a BrasilAPI:

```env
CNPJ_API_URL="https://brasilapi.com.br/api/cnpj/v1"
```

### Módulo fiscal

O projeto possui dependências e estrutura para funcionalidades fiscais com:

- Certificado A1 `.pfx`.
- Assinatura XMLDSIG.
- XML/XSD.
- NF-e/NFS-e ou fluxo fiscal relacionado.
- Webhooks para retorno de eventos fiscais.

Variáveis relacionadas:

```env
CERT_PFX_PATH="./certs/certificado.pfx"
CERT_PFX_PASSWORD=""
WEBHOOK_PORTAL_URL="http://localhost:3000/api/webhooks/fiscal"
```

### Uploads

Arquivos enviados ficam configurados para:

```env
UPLOAD_PATH="./uploads"
```

O backend também serve arquivos estáticos pela rota:

```text
/uploads
```

## Segurança

- Todas as rotas protegidas devem receber token JWT no header `Authorization`.
- O backend usa `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted` e `transform`.
- CORS é restrito via `CORS_ORIGIN`.
- Senhas são armazenadas com hash via Bcrypt.
- Há controle de papéis e permissões.
- Há limitação de requisições com `@nestjs/throttler`.
- Credenciais do seed são apenas para desenvolvimento.
- Certificados e senhas fiscais não devem ser versionados.

## Testes e qualidade

### Backend

```bash
cd portal-setgen-api
npm run test
npm run test:e2e
npm run test:cov
npm run lint
npm run format
```

### Frontend

```bash
cd portal-setgen-frontend
npm run lint
npm run build
```

## Observações importantes

- Existem arquivos gerados/localmente no projeto, como `node_modules`, `.next`, `dist` e `uploads`; eles não devem ser considerados documentação de código-fonte.
- O backend usa porta `3001` por padrão.
- O frontend usa porta `3000` por padrão.
- O Swagger está habilitado em `/api/docs`.
- O projeto contém README específico no backend, mas o README do frontend ainda é o padrão do Create Next App.
- Alguns textos existentes no README do backend aparecem com caracteres corrompidos, sugerindo problema anterior de encoding.

## Checklist para ambiente novo

- Instalar Node.js.
- Instalar PostgreSQL.
- Criar banco.
- Configurar `portal-setgen-api/.env`.
- Configurar `portal-setgen-frontend/.env.local`.
- Rodar `npm install` nos dois módulos.
- Rodar Prisma generate/migrate/seed no backend.
- Subir backend em `localhost:3001`.
- Subir frontend em `localhost:3000`.
- Acessar Swagger e validar login.
