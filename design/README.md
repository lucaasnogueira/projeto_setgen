# Design System Aurora — Portal Setgen

Este diretório contém a especificação visual e as telas completas do **Portal Setgen** desenvolvidas no padrão **pen.dev** seguindo a arquitetura canônica do **Design System Aurora** (padronização de CRUD da Orion) integrada com a identidade visual da **Setgen**.

---

## 🎨 Design Tokens

Todos os componentes e telas utilizam as variáveis globais do `.pen`, espelhando a configuração de cores do Tailwind (`tailwind.config.ts` e `globals.css`):

### 1. Cores de Marca & Identidade
| Token | Valor Hex | Descrição |
|---|---|---|
| `$brand-primary` | `#E2661D` | Laranja oficial Setgen |
| `$brand-primary-hover` | `#C85514` | Laranja escurecido para hover e foco |
| `$brand-primary-light` | `#FFF3EC` | Fundo suave para ícones e badges destacados |
| `$brand-navy` | `#1C2733` | Azul marinho escuro para a Sidebar |
| `$brand-navy-hover` | `#263443` | Hover nos itens da navegação |

### 2. Superfícies & Neutros
| Token | Valor Hex | Descrição |
|---|---|---|
| `$bg-app` | `#F3F5F8` | Fundo geral da aplicação (cinza neutro) |
| `$bg-card` | `#FFFFFF` | Superfície de cartões, modais e cabeçalhos |
| `$bg-subtle` | `#F8FAFC` | Fundo de inputs e listagens |
| `$border-subtle` | `#E2E8F0` | Linhas divisórias e bordas leves |
| `$text-primary` | `#1B2834` | Tipografia principal de alta legibilidade |
| `$text-secondary` | `#64748B` | Rótulos, subtítulos e metadados |

### 3. Pares Semânticos de Status (Aurora Badges)
| Status | Fundo (`bg`) | Texto / Ícone (`fg`) | Aplicação |
|---|---|---|---|
| **Sucesso / Ativo** | `$status-success-bg` (`#EAF8F1`) | `$status-success-fg` (`#166534`) | Ativo, Realizado, Disponível |
| **Atenção / Pendente** | `$status-warning-bg` (`#FFF6E5`) | `$status-warning-fg` (`#B45309`) | Prospecção, Em Revisão, Pendente |
| **Perigo / Crítico** | `$status-danger-bg` (`#FFEBE8`) | `$status-danger-fg` (`#DC2626`) | Inativo, Bloqueado, Estoque Crítico |
| **Informativo / Em Rota** | `$status-info-bg` (`#EEF4FD`) | `$status-info-fg` (`#1D4ED8`) | Em Rota, Agendado, Testes |
| **Destaque Especial** | `$status-purple-bg` (`#F4ECFB`) | `$status-purple-fg` (`#6B21A8`) | Perfis Administrador, Frota Especial |

---

## 🖥️ Telas Disponíveis no Canvas (`portal-setgen.pen`)

O canvas infinito está estruturado em 7 seções organizadas geometricamente:

1. **`00 - Design System & Tokens`** (Topo: x: 0, y: 0)
   - Amostras de cores e tokens oficiais.
   - Padrões de tipografia e estados visuais.

2. **`01 - Dashboard Geral`** (x: 0, y: 420)
   - Sidebar vertical Setgen com logotipo e navegação ativa.
   - Topbar com busca global e perfil.
   - StatusCards com métricas diárias (Visitas, Ordens, Armazém, Frota).
   - Grid de duas colunas com listagem rápida de visitas e movimentações industriais.

3. **`02 - Clientes (CRUD Aurora)`** (x: 1520, y: 420)
   - **PageHeader** com título, subtítulo e botão de ação primária "Novo Cliente".
   - **InlineClientForm**: Formulário multi-step de 3 etapas no topo (1. Identificação, 2. Contato & Endereço, 3. Condições Comerciais) com stepper numerado e validações.
   - **FilterBar**: Barra de busca por Razão Social/CNPJ, filtro por segmento e botão limpar.
   - **StatusCards**: Totalizadores clicáveis (Total, Ativos, Prospecção, Inativos).
   - **DataTable**: Tabela com ícones empresariais em destaque, dados cadastrais, badges semânticos e botões de ação ("Ver Detalhes" e "Editar").

4. **`03 - Detalhes do Cliente (Modal Aurora)`** (x: 3040, y: 420)
   - Visão do modal flutuante `ClientDetailsCard` com backdrop escurecido/desfocado.
   - Cabeçalho com dados cadastrais e status pill.
   - Seções categorizadas em cartões cinza e destaque azul informativo.
   - Bloco de auditoria (data de criação e última modificação).
   - Rodapé com ação crítica "Excluir Cliente" e "Editar Cadastro".

5. **`04 - Visitas Comerciais (Aurora CRUD)`** (x: 0, y: 1240)
   - Gestão de rota dos consultores de campo da Setgen.
   - StatusCards de visitas (Total, Realizadas, Em Rota, Reagendadas).
   - Tabela com horários, clientes, município e objetivo técnico da visita.

6. **`05 - Armazém & Estoque (Aurora Industrial)`** (x: 1520, y: 1240)
   - Controle de geradores diesel, cabeamento, quadros QTA e peças de reposição.
   - StatusCards de nível de estoque (Disponíveis, Em Manutenção, Crítico).
   - Tabela com código SKU, categoria, localização de doca e quantidade.

7. **`06 - Usuários & Permissões RH (Aurora CRUD)`** (x: 3040, y: 1240)
   - Gestão de colaboradores internos e controle de permissões.
   - StatusCards de contas, colaboradores ativos, administradores e status de 2FA.
   - Tabela com avatar de iniciais, e-mail corporativo, setor e perfil de acesso.

8. **`07 - Hub de Módulos (/modules)`** (x: 0, y: 2060)
   - Ponto focal de entrada do usuário autenticado.
   - Header corporativo global com logotipo e perfil.
   - Ponto focal de entrada do usuário autenticado pós-login.
   - Header corporativo global com logotipo e identificação do usuário.
   - Título centralizado *"Módulos — Selecione o ambiente operacional para iniciar o trabalho."*
   - Grid de cards minimalistas (Clientes, Ordens de Serviço, Estoque, Compras, Financeiro, Frota) com ícone temático, descrição e link direto `Acessar ➔`.
   - Grid de cards minimalistas com os **6 módulos operacionais reais da Setgen**:
     1. *Ordens de Serviço & Campo* (Preventivas/corretivas, horímetro, QTA, ARTs e checklists)
     2. *Clientes & Usinas / Plantas* (Carteira corporativa e plantas industriais atendidas)
     3. *Estoque de Geradores & Peças* (Grupos geradores por kVA, filtros Racor, cabos e quadros QTA)
     4. *Orçamentos & Propostas* (Dimensionamento de carga em kVA e propostas comerciais)
     5. *Compras & Suprimentos* (Ordens de compra e cotações de peças para geradores)
     6. *Financeiro & Faturamento Fiscal* (Emissão dual NF-e/NFS-e de locação e serviços)

9. **`08 - Workspace Operacional (Abas & Formulários)`** (x: 1520, y: 2060)
   - Header minimalista com **Breadcrumb navegável** (`SETGEN | Módulos / Clientes & Contratos / Carteira de Clientes`).
   - Sidebar retrátil dark moderna com identificação do módulo e menus autorizados.
   - Barra de abas minimalista com underline e botão discreto `[+]` para abrir novos formulários sem perder o estado.
   - Área central com o CRUD da carteira de clientes, métricas inline e tabela minimalista.
9. **`08 - Workspace Operacional (Ordens de Serviço & Campo)`** (x: 1520, y: 2060)
   - Header minimalista com **Breadcrumb navegável** (`SETGEN | Módulos / Ordens de Serviço & Campo / Gestão de O.S.`).
   - Sidebar retrátil dark moderna com identificação do módulo (`O.S. & CAMPO`), menus de O.S., Checklists QTA, Técnicos & NRs e Horímetros.
   - Barra de abas dinâmicas minimalistas com underline (`Ordens de Serviço`, `Nova O.S. Preventiva`, `OS-2026-0842`) e botão `[+]` discreto.
   - Área central com a gestão de O.S. de geradores diesel (Scania, Cummins, MWM, Volvo), potências em kVA, horímetros, checklists de lubrificante 15W40/filtros Racor, e validação de compliance de segurança dos técnicos (ASO, NR-10 e NR-35).

---

## 🚀 Como Visualizar e Gerar

- **No pen.dev / Pencil**: Abra o arquivo `portal-setgen.pen` diretamente no editor visual.
- **Para atualizar ou adicionar telas programaticamente**:
  ```bash
  node design/build_design_system.js
  ```
  O script atualiza o arquivo `portal-setgen.pen` instantaneamente com os novos componentes e cálculos de layout.

