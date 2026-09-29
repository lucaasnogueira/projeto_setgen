const fs = require('fs');
const path = require('path');

let nextId = 1000;
function uid(prefix = 'n') {
  return `${prefix}_${(nextId++).toString(36)}`;
}

// Variables & Design Tokens
const variables = {
  "brand-primary": { type: "color", value: "#E2661D" },
  "brand-primary-hover": { type: "color", value: "#C85514" },
  "brand-primary-light": { type: "color", value: "#FFF3EC" },
  "brand-navy": { type: "color", value: "#1C2733" },
  "brand-navy-hover": { type: "color", value: "#263443" },
  "brand-navy-border": { type: "color", value: "#2B3B4C" },
  "bg-app": { type: "color", value: "#F3F5F8" },
  "bg-card": { type: "color", value: "#FFFFFF" },
  "bg-subtle": { type: "color", value: "#F8FAFC" },
  "bg-hover": { type: "color", value: "#F1F5F9" },
  "border-subtle": { type: "color", value: "#E2E8F0" },
  "border-default": { type: "color", value: "#CBD5E1" },
  "text-primary": { type: "color", value: "#1B2834" },
  "text-secondary": { type: "color", value: "#64748B" },
  "text-muted": { type: "color", value: "#94A3B8" },
  "text-on-primary": { type: "color", value: "#FFFFFF" },
  "status-success-bg": { type: "color", value: "#EAF8F1" },
  "status-success-fg": { type: "color", value: "#166534" },
  "status-warning-bg": { type: "color", value: "#FFF6E5" },
  "status-warning-fg": { type: "color", value: "#B45309" },
  "status-danger-bg": { type: "color", value: "#FFEBE8" },
  "status-danger-fg": { type: "color", value: "#DC2626" },
  "status-info-bg": { type: "color", value: "#EEF4FD" },
  "status-info-fg": { type: "color", value: "#1D4ED8" },
  "status-purple-bg": { type: "color", value: "#F4ECFB" },
  "status-purple-fg": { type: "color", value: "#6B21A8" },
  "status-neutral-bg": { type: "color", value: "#F1F5F9" },
  "status-neutral-fg": { type: "color", value: "#475569" },
  "font-sans": { type: "string", value: "Inter" }
};

// Helpers for Nodes
function createText(content, opts = {}) {
  return {
    type: "text",
    id: uid('txt'),
    name: opts.name || "Text",
    content: String(content),
    fontFamily: opts.fontFamily || "$font-sans",
    fontSize: opts.fontSize || 13,
    fontWeight: opts.fontWeight || "normal",
    fill: opts.fill || "$text-primary",
    textGrowth: opts.textGrowth || "auto",
    ...(opts.width ? { width: opts.width } : {}),
    ...(opts.height ? { height: opts.height } : {})
  };
}

function createIcon(iconName, opts = {}) {
  return {
    type: "icon",
    id: uid('ico'),
    name: opts.name || `Icon - ${iconName}`,
    library: "lucide",
    icon: iconName,
    width: opts.width || 18,
    height: opts.height || 18,
    fill: opts.fill || "$text-secondary"
  };
}

function createFrame(name, opts = {}, children = []) {
  return {
    type: "frame",
    id: uid('frm'),
    name,
    layout: opts.layout || "horizontal",
    ...(opts.x !== undefined ? { x: opts.x } : {}),
    ...(opts.y !== undefined ? { y: opts.y } : {}),
    ...(opts.width ? { width: opts.width } : {}),
    ...(opts.height ? { height: opts.height } : {}),
    ...(opts.fill ? { fill: opts.fill } : {}),
    ...(opts.stroke ? { stroke: opts.stroke } : {}),
    ...(opts.strokeWidth ? { strokeWidth: opts.strokeWidth } : {}),
    ...(opts.cornerRadius ? { cornerRadius: opts.cornerRadius } : {}),
    ...(opts.padding ? { padding: opts.padding } : {}),
    ...(opts.gap ? { gap: opts.gap } : {}),
    ...(opts.justifyContent ? { justifyContent: opts.justifyContent } : {}),
    ...(opts.alignItems ? { alignItems: opts.alignItems } : {}),
    ...(opts.clip ? { clip: opts.clip } : {}),
    children
  };
}

// Sidebar Component Builder
function buildSidebar(activeMenuName, height = 980) {
  const menuItems = [
    { name: "Dashboard", icon: "layout-dashboard" },
    { name: "Clientes", icon: "users" },
    { name: "Visitas", icon: "calendar-check" },
    { name: "Armazém", icon: "warehouse" },
    { name: "Estoque", icon: "boxes" },
    { name: "Pedidos", icon: "shopping-cart" },
    { name: "Compras", icon: "shopping-bag" },
    { name: "Financeiro", icon: "dollar-sign" },
    { name: "Frota", icon: "truck" },
    { name: "Usuários", icon: "user-cog" },
    { name: "Configurações", icon: "settings" }
  ];

  const logoIcon = createFrame("Logo Icon", {
    width: 36,
    height: 36,
    cornerRadius: 8,
    fill: "$brand-primary",
    justifyContent: "center",
    alignItems: "center"
  }, [
    createIcon("zap", { width: 20, height: 20, fill: "#FFFFFF" })
  ]);

  const logoGroup = createFrame("Brand Logo", {
    alignItems: "center",
    gap: 12,
    padding: [4, 8, 4, 8]
  }, [
    logoIcon,
    createText("SETGEN", { fontSize: 20, fontWeight: "bold", fill: "#FFFFFF" }),
    createText("PORTAL", { fontSize: 10, fontWeight: "bold", fill: "$brand-primary" })
  ]);

  const navChildren = menuItems.map(item => {
    const isActive = item.name === activeMenuName;
    return createFrame(`Nav - ${item.name}`, {
      width: "fill_container",
      height: 40,
      cornerRadius: 8,
      fill: isActive ? "$brand-primary" : "#00000000",
      padding: [8, 12, 8, 12],
      alignItems: "center",
      gap: 12
    }, [
      createIcon(item.icon, { width: 18, height: 18, fill: isActive ? "#FFFFFF" : "#94A3B8" }),
      createText(item.name, { fontSize: 14, fontWeight: isActive ? "bold" : "normal", fill: isActive ? "#FFFFFF" : "#CBD5E1" })
    ]);
  });

  const navMenu = createFrame("Navigation Menu", {
    width: "fill_container",
    height: "fill_container",
    layout: "vertical",
    gap: 4
  }, navChildren);

  const avatar = createFrame("Avatar", {
    width: 34,
    height: 34,
    cornerRadius: 9999,
    fill: "$brand-primary",
    justifyContent: "center",
    alignItems: "center"
  }, [
    createText("LS", { fontSize: 13, fontWeight: "bold", fill: "#FFFFFF" })
  ]);

  const userInfo = createFrame("User Info", {
    width: "fill_container",
    layout: "vertical",
    gap: 2
  }, [
    createText("Lucas Silva", { fontSize: 13, fontWeight: "bold", fill: "#FFFFFF" }),
    createText("Administrador", { fontSize: 11, fill: "#94A3B8" })
  ]);

  const userProfile = createFrame("User Profile", {
    width: "fill_container",
    height: 54,
    cornerRadius: 8,
    fill: "$brand-navy-hover",
    padding: [8, 12, 8, 12],
    alignItems: "center",
    gap: 10
  }, [avatar, userInfo]);

  return createFrame("Sidebar", {
    width: 260,
    height: height,
    fill: "$brand-navy",
    layout: "vertical",
    padding: [24, 16, 24, 16],
    gap: 24
  }, [logoGroup, navMenu, userProfile]);
}

// Topbar Builder
function buildTopbar(breadcrumbText = "Portal Setgen  /  Visão Geral") {
  const leftSide = createText(breadcrumbText, { fontSize: 13, fill: "$text-secondary" });

  const searchBox = createFrame("Search Box", {
    width: 320,
    height: 38,
    cornerRadius: 8,
    fill: "$bg-subtle",
    padding: [6, 12, 6, 12],
    alignItems: "center",
    gap: 10
  }, [
    createIcon("search", { width: 16, height: 16, fill: "$text-secondary" }),
    createText("Buscar em todo o sistema...", { fontSize: 12, fill: "$text-muted" })
  ]);

  const notifBell = createFrame("Bell", {
    width: 38,
    height: 38,
    cornerRadius: 8,
    fill: "$bg-subtle",
    justifyContent: "center",
    alignItems: "center"
  }, [
    createIcon("bell", { width: 18, height: 18, fill: "$text-secondary" })
  ]);

  const rightSide = createFrame("Right Actions", {
    alignItems: "center",
    gap: 16
  }, [searchBox, notifBell]);

  return createFrame("Topbar", {
    width: "fill_container",
    height: 68,
    fill: "$bg-card",
    padding: [0, 32, 0, 32],
    justifyContent: "space_between",
    alignItems: "center"
  }, [leftSide, rightSide]);
}

// Aurora PageHeader Builder
function buildPageHeader(title, subtitle, actionBtnLabel = "Novo Registro") {
  const titles = createFrame("Titles", {
    layout: "vertical",
    gap: 4
  }, [
    createText(title, { fontSize: 24, fontWeight: "bold", fill: "$text-primary" }),
    createText(subtitle, { fontSize: 14, fill: "$text-secondary" })
  ]);

  const btn = createFrame("Action Button", {
    height: 42,
    cornerRadius: 8,
    fill: "$brand-primary",
    padding: [10, 18, 10, 18],
    alignItems: "center",
    gap: 8
  }, [
    createIcon("plus", { width: 16, height: 16, fill: "#FFFFFF" }),
    createText(actionBtnLabel, { fontSize: 13, fontWeight: "bold", fill: "#FFFFFF" })
  ]);

  return createFrame("Page Header", {
    width: "fill_container",
    justifyContent: "space_between",
    alignItems: "center"
  }, [titles, btn]);
}

// Aurora StatusCards Builder
function buildStatusCards(cardsData) {
  const cards = cardsData.map(c => {
    const left = createFrame("Left Info", {
      layout: "vertical",
      gap: 4
    }, [
      createText(c.label, { fontSize: 12, fontWeight: "bold", fill: "$text-secondary" }),
      createText(c.count, { fontSize: 22, fontWeight: "bold", fill: "$text-primary" })
    ]);

    const pill = createFrame("Pill", {
      width: 36,
      height: 36,
      cornerRadius: 8,
      fill: c.bg,
      justifyContent: "center",
      alignItems: "center"
    }, [
      createIcon(c.icon, { width: 18, height: 18, fill: c.fg })
    ]);

    return createFrame(`StatusCard - ${c.label}`, {
      width: "fill_container",
      height: 76,
      cornerRadius: 10,
      fill: "$bg-card",
      padding: [14, 18, 14, 18],
      justifyContent: "space_between",
      alignItems: "center"
    }, [left, pill]);
  });

  return createFrame("StatusCards Row", {
    width: "fill_container",
    gap: 16
  }, cards);
}

// Aurora FilterBar Builder
function buildFilterBar(placeholder, filterDropdownLabel = "Status: Todos") {
  const searchBox = createFrame("Search Input", {
    width: 380,
    height: 40,
    cornerRadius: 8,
    fill: "$bg-subtle",
    padding: [8, 12, 8, 12],
    alignItems: "center",
    gap: 10
  }, [
    createIcon("search", { width: 16, height: 16, fill: "$text-secondary" }),
    createText(placeholder, { fontSize: 13, fill: "$text-muted" })
  ]);

  const dropdownBtn = createFrame("Dropdown", {
    height: 38,
    cornerRadius: 8,
    fill: "$bg-subtle",
    padding: [8, 14, 8, 14],
    alignItems: "center",
    gap: 8
  }, [
    createText(filterDropdownLabel, { fontSize: 12, fill: "$text-primary" }),
    createIcon("chevron-down", { width: 14, height: 14, fill: "$text-secondary" })
  ]);

  const clearBtn = createFrame("Clear Button", {
    height: 38,
    cornerRadius: 8,
    fill: "$bg-subtle",
    padding: [8, 12, 8, 12],
    alignItems: "center",
    gap: 6
  }, [
    createIcon("x", { width: 14, height: 14, fill: "$text-secondary" }),
    createText("Limpar", { fontSize: 12, fill: "$text-secondary" })
  ]);

  const right = createFrame("Right Filters", {
    alignItems: "center",
    gap: 12
  }, [dropdownBtn, clearBtn]);

  return createFrame("Filter Bar", {
    width: "fill_container",
    height: 60,
    cornerRadius: 10,
    fill: "$bg-card",
    padding: [10, 18, 10, 18],
    justifyContent: "space_between",
    alignItems: "center"
  }, [searchBox, right]);
}

// -------------------------------------------------------------
// SCREEN 0: Tokens & Design System Components Showcase
// -------------------------------------------------------------
function buildDesignSystemShowcase() {
  const paletteTokens = [
    { name: "Brand Primary", hex: "#E2661D", code: "$brand-primary" },
    { name: "Brand Navy", hex: "#1C2733", code: "$brand-navy" },
    { name: "Success Green", hex: "#166534", code: "$status-success-fg" },
    { name: "Warning Amber", hex: "#B45309", code: "$status-warning-fg" },
    { name: "Danger Red", hex: "#DC2626", code: "$status-danger-fg" },
    { name: "Info Blue", hex: "#1D4ED8", code: "$status-info-fg" },
    { name: "Background App", hex: "#F3F5F8", code: "$bg-app" },
    { name: "Card Surface", hex: "#FFFFFF", code: "$bg-card" }
  ];

  const colorCards = paletteTokens.map(tok => {
    const swatch = createFrame("Swatch", {
      width: "fill_container",
      height: 60,
      cornerRadius: 6,
      fill: tok.code
    });
    const info = createFrame("Info", {
      layout: "vertical",
      gap: 2
    }, [
      createText(tok.name, { fontSize: 12, fontWeight: "bold", fill: "$text-primary" }),
      createText(tok.code, { fontSize: 11, fill: "$text-secondary" }),
      createText(tok.hex, { fontSize: 10, fill: "$text-muted" })
    ]);
    return createFrame(`Color - ${tok.name}`, {
      width: 140,
      cornerRadius: 8,
      fill: "$bg-card",
      padding: 10,
      layout: "vertical",
      gap: 8,
      stroke: "$border-subtle",
      strokeWidth: 1
    }, [swatch, info]);
  });

  const colorsRow = createFrame("Palette Row", {
    width: "fill_container",
    gap: 12
  }, colorCards);

  const titleGroup = createFrame("DS Title", {
    layout: "vertical",
    gap: 4
  }, [
    createText("AURORA DESIGN SYSTEM — SETGEN PORTAL", { fontSize: 22, fontWeight: "bold", fill: "$brand-navy" }),
    createText("Tokens oficiais, padrões de CRUD multi-step, cartões semânticos e diretrizes de interface.", { fontSize: 14, fill: "$text-secondary" })
  ]);

  return createFrame("00 - Design System & Tokens", {
    x: 0,
    y: 0,
    width: 2900,
    height: 380,
    fill: "$bg-subtle",
    layout: "vertical",
    padding: [32, 40, 32, 40],
    gap: 20,
    clip: true
  }, [titleGroup, colorsRow]);
}

// -------------------------------------------------------------
// SCREEN 4: Visitas Comerciais (/visits)
// -------------------------------------------------------------
function buildVisitsScreen() {
  const sidebar = buildSidebar("Visitas", 1080);
  const topbar = buildTopbar("Comercial  /  Agenda e Roteiros de Visitas");

  const header = buildPageHeader(
    "Visitas Comerciais & Rotas",
    "Agendamento de consultores técnicos, check-in em clientes e relatórios de campo.",
    "Nova Visita"
  );

  const statusCards = buildStatusCards([
    { label: "Total no Mês", count: "148", bg: "$status-neutral-bg", fg: "$status-neutral-fg", icon: "layers" },
    { label: "Visitas Realizadas", count: "112", bg: "$status-success-bg", fg: "$status-success-fg", icon: "check-circle-2" },
    { label: "Agendadas / Rota", count: "32", bg: "$status-info-bg", fg: "$status-info-fg", icon: "calendar-check" },
    { label: "Reagendadas / Pend.", count: "4", bg: "$status-warning-bg", fg: "$status-warning-fg", icon: "clock" }
  ]);

  const filterBar = buildFilterBar("Buscar por Cliente, Vendedor ou Município...", "Vendedor: Todos");

  // Visits Table
  const tableCard = createFrame("Visits DataTable Card", {
    width: "fill_container",
    cornerRadius: 12,
    fill: "$bg-card",
    padding: [16, 20, 16, 20],
    layout: "vertical",
    gap: 8
  });

  const thead = createFrame("Thead", {
    width: "fill_container",
    height: 36,
    alignItems: "center",
    padding: [0, 8, 0, 8]
  }, [
    createText("HORÁRIO / DATA", { width: 140, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("CLIENTE & LOCALIDADE", { width: 360, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("CONSULTOR TÉCNICO", { width: 200, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("OBJETIVO DA VISITA", { width: 180, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("STATUS", { width: 120, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("AÇÕES", { width: 100, fontSize: 11, fontWeight: "bold", fill: "$text-muted" })
  ]);

  const visitsData = [
    { time: "Hoje • 14:00", client: "Hospital Samaritano S/A", loc: "Higienópolis - São Paulo / SP", rep: "Carlos Mendes", obj: "Dimensionamento Gerador", st: "Em Rota", bg: "$status-info-bg", fg: "$status-info-fg" },
    { time: "Hoje • 15:30", client: "Metalúrgica Alvorada", loc: "Distrito Industrial - Campinas / SP", rep: "Mariana Souza", obj: "Renovação Contrato", st: "Agendada", bg: "$status-neutral-bg", fg: "$status-neutral-fg" },
    { time: "Hoje • 16:45", client: "Supermercados Estrela", loc: "Ponta da Praia - Santos / SP", rep: "João Pedro", obj: "Manutenção Preventiva", st: "Realizada", bg: "$status-success-bg", fg: "$status-success-fg" },
    { time: "Amanhã • 09:00", client: "Data Center AlphaTech", loc: "Alphaville - Barueri / SP", rep: "Carlos Mendes", obj: "Instalação QTA", st: "Confirmada", bg: "$status-success-bg", fg: "$status-success-fg" }
  ];

  const rows = visitsData.map(v => {
    return createFrame(`Row - ${v.client}`, {
      width: "fill_container",
      height: 60,
      cornerRadius: 8,
      fill: "$bg-subtle",
      padding: [10, 8, 10, 8],
      alignItems: "center"
    }, [
      createText(v.time, { width: 140, fontSize: 12, fontWeight: "bold", fill: "$text-primary" }),
      createFrame("Client Col", {
        width: 360,
        layout: "vertical",
        gap: 2
      }, [
        createText(v.client, { fontSize: 13, fontWeight: "bold", fill: "$text-primary" }),
        createText(v.loc, { fontSize: 11, fill: "$text-secondary" })
      ]),
      createText(v.rep, { width: 200, fontSize: 13, fill: "$text-primary" }),
      createText(v.obj, { width: 180, fontSize: 12, fill: "$text-secondary" }),
      createFrame("Status Box", {
        width: 120,
        alignItems: "center"
      }, [
        createFrame("Badge", {
          cornerRadius: 9999,
          fill: v.bg,
          padding: [3, 10, 3, 10],
          alignItems: "center"
        }, [
          createText(v.st, { fontSize: 10, fontWeight: "bold", fill: v.fg })
        ])
      ]),
      createFrame("Action Box", {
        width: 100,
        alignItems: "center",
        gap: 8
      }, [
        createFrame("Ver", {
          width: 30,
          height: 30,
          cornerRadius: 6,
          fill: "$bg-card",
          justifyContent: "center",
          alignItems: "center"
        }, [
          createIcon("file-text", { width: 15, height: 15, fill: "$brand-primary" })
        ]),
        createFrame("Editar", {
          width: 30,
          height: 30,
          cornerRadius: 6,
          fill: "$bg-card",
          justifyContent: "center",
          alignItems: "center"
        }, [
          createIcon("pencil", { width: 15, height: 15, fill: "$text-secondary" })
        ])
      ])
    ]);
  });

  tableCard.children = [thead, ...rows];

  const bodyArea = createFrame("Body Area", {
    width: "fill_container",
    height: 1012,
    layout: "vertical",
    padding: [24, 32, 24, 32],
    gap: 18
  }, [header, statusCards, filterBar, tableCard]);

  const mainArea = createFrame("Main Area", {
    width: 1180,
    height: 1080,
    fill: "$bg-app",
    layout: "vertical"
  }, [topbar, bodyArea]);

  return createFrame("04 - Visitas Comerciais (Aurora CRUD)", {
    x: 0,
    y: 1240,
    width: 1440,
    height: 1080,
    fill: "$bg-app",
    clip: true
  }, [sidebar, mainArea]);
}

// -------------------------------------------------------------
// SCREEN 5: Armazém & Estoque (/warehouse)
// -------------------------------------------------------------
function buildWarehouseScreen() {
  const sidebar = buildSidebar("Armazém", 1080);
  const topbar = buildTopbar("Operações  /  Gestão de Armazém e Ativos");

  const header = buildPageHeader(
    "Armazém Central Setgen",
    "Controle de geradores, peças sobressalentes, expedição e docas de carga.",
    "Nova Movimentação"
  );

  const statusCards = buildStatusCards([
    { label: "Itens em Estoque", count: "842", bg: "$status-neutral-bg", fg: "$status-neutral-fg", icon: "boxes" },
    { label: "Disponíveis / Pronto", count: "614", bg: "$status-success-bg", fg: "$status-success-fg", icon: "check-circle-2" },
    { label: "Em Manutenção / Testes", count: "186", bg: "$status-warning-bg", fg: "$status-warning-fg", icon: "clock" },
    { label: "Crítico / Reposição", count: "42", bg: "$status-danger-bg", fg: "$status-danger-fg", icon: "triangle-alert" }
  ]);

  const filterBar = buildFilterBar("Buscar por Código SKU, Gerador ou Posição...", "Categoria: Geradores Diesel");

  // Warehouse Table
  const tableCard = createFrame("Warehouse DataTable Card", {
    width: "fill_container",
    cornerRadius: 12,
    fill: "$bg-card",
    padding: [16, 20, 16, 20],
    layout: "vertical",
    gap: 8
  });

  const thead = createFrame("Thead", {
    width: "fill_container",
    height: 36,
    alignItems: "center",
    padding: [0, 8, 0, 8]
  }, [
    createText("ATIVO / CÓDIGO SKU", { width: 340, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("CATEGORIA", { width: 180, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("LOCALIZAÇÃO", { width: 160, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("QTD EM ESTOQUE", { width: 140, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("STATUS OPERACIONAL", { width: 150, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("AÇÕES", { width: 100, fontSize: 11, fontWeight: "bold", fill: "$text-muted" })
  ]);

  const itemsData = [
    { sku: "GER-150-D", name: "Gerador Cummins 150 kVA Silenciado", cat: "Geradores a Diesel", loc: "Doca 02 • Setor A", qty: "8 unid", st: "Disponível", bg: "$status-success-bg", fg: "$status-success-fg" },
    { sku: "GER-250-S", name: "Gerador Scania 250 kVA Cabinadado", cat: "Geradores a Diesel", loc: "Doca 01 • Setor A", qty: "3 unid", st: "Em Revisão", bg: "$status-warning-bg", fg: "$status-warning-fg" },
    { sku: "CAB-95MM", name: "Cabo de Cobre Flexível 95mm² (Lance 25m)", cat: "Cabos e Conectores", loc: "Prateleira B-12", qty: "42 lances", st: "Disponível", bg: "$status-success-bg", fg: "$status-success-fg" },
    { sku: "QTA-400A", name: "Quadro de Transferência Automática 400A", cat: "Quadros de Comando", loc: "Bancada Testes 03", qty: "1 unid", st: "Crítico", bg: "$status-danger-bg", fg: "$status-danger-fg" }
  ];

  const rows = itemsData.map(item => {
    return createFrame(`Row - ${item.sku}`, {
      width: "fill_container",
      height: 60,
      cornerRadius: 8,
      fill: "$bg-subtle",
      padding: [10, 8, 10, 8],
      alignItems: "center"
    }, [
      createFrame("Asset Col", {
        width: 340,
        alignItems: "center",
        gap: 12
      }, [
        createFrame("Icon Box", {
          width: 36,
          height: 36,
          cornerRadius: 8,
          fill: "$brand-primary-light",
          justifyContent: "center",
          alignItems: "center"
        }, [
          createIcon("box", { width: 18, height: 18, fill: "$brand-primary" })
        ]),
        createFrame("Text Box", {
          layout: "vertical",
          gap: 2
        }, [
          createText(item.name, { fontSize: 13, fontWeight: "bold", fill: "$text-primary" }),
          createText(`SKU: ${item.sku}`, { fontSize: 11, fill: "$text-secondary" })
        ])
      ]),
      createText(item.cat, { width: 180, fontSize: 12, fill: "$text-primary" }),
      createText(item.loc, { width: 160, fontSize: 12, fill: "$text-secondary" }),
      createText(item.qty, { width: 140, fontSize: 13, fontWeight: "bold", fill: "$text-primary" }),
      createFrame("Status Box", {
        width: 150,
        alignItems: "center"
      }, [
        createFrame("Badge", {
          cornerRadius: 9999,
          fill: item.bg,
          padding: [3, 10, 3, 10],
          alignItems: "center"
        }, [
          createText(item.st, { fontSize: 10, fontWeight: "bold", fill: item.fg })
        ])
      ]),
      createFrame("Action Box", {
        width: 100,
        alignItems: "center",
        gap: 8
      }, [
        createFrame("Ver", {
          width: 30,
          height: 30,
          cornerRadius: 6,
          fill: "$bg-card",
          justifyContent: "center",
          alignItems: "center"
        }, [
          createIcon("file-text", { width: 15, height: 15, fill: "$brand-primary" })
        ]),
        createFrame("Editar", {
          width: 30,
          height: 30,
          cornerRadius: 6,
          fill: "$bg-card",
          justifyContent: "center",
          alignItems: "center"
        }, [
          createIcon("pencil", { width: 15, height: 15, fill: "$text-secondary" })
        ])
      ])
    ]);
  });

  tableCard.children = [thead, ...rows];

  const bodyArea = createFrame("Body Area", {
    width: "fill_container",
    height: 1012,
    layout: "vertical",
    padding: [24, 32, 24, 32],
    gap: 18
  }, [header, statusCards, filterBar, tableCard]);

  const mainArea = createFrame("Main Area", {
    width: 1180,
    height: 1080,
    fill: "$bg-app",
    layout: "vertical"
  }, [topbar, bodyArea]);

  return createFrame("05 - Armazém & Estoque (Aurora Industrial)", {
    x: 1520,
    y: 1240,
    width: 1440,
    height: 1080,
    fill: "$bg-app",
    clip: true
  }, [sidebar, mainArea]);
}

// -------------------------------------------------------------
// SCREEN 6: Usuários & Permissões RH (/users)
// -------------------------------------------------------------
function buildUsersScreen() {
  const sidebar = buildSidebar("Usuários", 1080);
  const topbar = buildTopbar("Administração  /  Usuários e Gestão de Acessos");

  const header = buildPageHeader(
    "Usuários & Controle de Acessos",
    "Gestão de colaboradores internos, perfis de permissão (Roles) e segurança 2FA.",
    "Convidar Usuário"
  );

  const statusCards = buildStatusCards([
    { label: "Total de Contas", count: "64", bg: "$status-neutral-bg", fg: "$status-neutral-fg", icon: "user-cog" },
    { label: "Acessos Ativos", count: "58", bg: "$status-success-bg", fg: "$status-success-fg", icon: "check-circle-2" },
    { label: "Administradores", count: "6", bg: "$status-purple-bg", fg: "$status-purple-fg", icon: "shield-check" },
    { label: "Aguardando 2FA", count: "3", bg: "$status-warning-bg", fg: "$status-warning-fg", icon: "clock" }
  ]);

  const filterBar = buildFilterBar("Buscar por Nome, E-mail ou Departamento...", "Perfil: Todos");

  // Users Table
  const tableCard = createFrame("Users DataTable Card", {
    width: "fill_container",
    cornerRadius: 12,
    fill: "$bg-card",
    padding: [16, 20, 16, 20],
    layout: "vertical",
    gap: 8
  });

  const thead = createFrame("Thead", {
    width: "fill_container",
    height: 36,
    alignItems: "center",
    padding: [0, 8, 0, 8]
  }, [
    createText("USUÁRIO / COLABORADOR", { width: 340, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("DEPARTAMENTO", { width: 180, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("PERFIL DE ACESSO", { width: 180, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("AUTENTICAÇÃO 2FA", { width: 150, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("STATUS", { width: 120, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
    createText("AÇÕES", { width: 100, fontSize: 11, fontWeight: "bold", fill: "$text-muted" })
  ]);

  const usersData = [
    { name: "Lucas Silva", email: "lucas.silva@setgen.com.br", dep: "Tecnologia / TI", role: "Super Administrador", auth2fa: "Ativado", st: "Ativo", bg: "$status-success-bg", fg: "$status-success-fg" },
    { name: "Carlos Mendes", email: "carlos.mendes@setgen.com.br", dep: "Comercial / Vendas", role: "Consultor Técnico", auth2fa: "Ativado", st: "Ativo", bg: "$status-success-bg", fg: "$status-success-fg" },
    { name: "Mariana Souza", email: "mariana.souza@setgen.com.br", dep: "Operações / Armazém", role: "Gestora de Frota", auth2fa: "Pendente", st: "Ativo", bg: "$status-warning-bg", fg: "$status-warning-fg" },
    { name: "Roberto Dias", email: "roberto.dias@setgen.com.br", dep: "Financeiro / Faturamento", role: "Analista Financeiro", auth2fa: "Ativado", st: "Bloqueado", bg: "$status-danger-bg", fg: "$status-danger-fg" }
  ];

  const rows = usersData.map(u => {
    const initials = u.name.split(' ').map(n => n[0]).join('');
    return createFrame(`Row - ${u.name}`, {
      width: "fill_container",
      height: 60,
      cornerRadius: 8,
      fill: "$bg-subtle",
      padding: [10, 8, 10, 8],
      alignItems: "center"
    }, [
      createFrame("User Col", {
        width: 340,
        alignItems: "center",
        gap: 12
      }, [
        createFrame("Avatar Box", {
          width: 36,
          height: 36,
          cornerRadius: 9999,
          fill: "$brand-navy",
          justifyContent: "center",
          alignItems: "center"
        }, [
          createText(initials, { fontSize: 12, fontWeight: "bold", fill: "#FFFFFF" })
        ]),
        createFrame("Text Box", {
          layout: "vertical",
          gap: 2
        }, [
          createText(u.name, { fontSize: 13, fontWeight: "bold", fill: "$text-primary" }),
          createText(u.email, { fontSize: 11, fill: "$text-secondary" })
        ])
      ]),
      createText(u.dep, { width: 180, fontSize: 12, fill: "$text-primary" }),
      createFrame("Role Box", {
        width: 180,
        alignItems: "center"
      }, [
        createFrame("Role Badge", {
          cornerRadius: 6,
          fill: "$status-neutral-bg",
          padding: [3, 8, 3, 8],
          alignItems: "center"
        }, [
          createText(u.role, { fontSize: 11, fontWeight: "bold", fill: "$brand-navy" })
        ])
      ]),
      createText(u.auth2fa, { width: 150, fontSize: 12, fill: u.auth2fa === 'Ativado' ? "$status-success-fg" : "$status-warning-fg" }),
      createFrame("Status Box", {
        width: 120,
        alignItems: "center"
      }, [
        createFrame("Badge", {
          cornerRadius: 9999,
          fill: u.bg,
          padding: [3, 10, 3, 10],
          alignItems: "center"
        }, [
          createText(u.st, { fontSize: 10, fontWeight: "bold", fill: u.fg })
        ])
      ]),
      createFrame("Action Box", {
        width: 100,
        alignItems: "center",
        gap: 8
      }, [
        createFrame("Ver", {
          width: 30,
          height: 30,
          cornerRadius: 6,
          fill: "$bg-card",
          justifyContent: "center",
          alignItems: "center"
        }, [
          createIcon("file-text", { width: 15, height: 15, fill: "$brand-primary" })
        ]),
        createFrame("Editar", {
          width: 30,
          height: 30,
          cornerRadius: 6,
          fill: "$bg-card",
          justifyContent: "center",
          alignItems: "center"
        }, [
          createIcon("pencil", { width: 15, height: 15, fill: "$text-secondary" })
        ])
      ])
    ]);
  });

  tableCard.children = [thead, ...rows];

  const bodyArea = createFrame("Body Area", {
    width: "fill_container",
    height: 1012,
    layout: "vertical",
    padding: [24, 32, 24, 32],
    gap: 18
  }, [header, statusCards, filterBar, tableCard]);

  const mainArea = createFrame("Main Area", {
    width: 1180,
    height: 1080,
    fill: "$bg-app",
    layout: "vertical"
  }, [topbar, bodyArea]);

  return createFrame("06 - Usuários & Permissões RH (Aurora CRUD)", {
    x: 3040,
    y: 1240,
    width: 1440,
    height: 1080,
    fill: "$bg-app",
    clip: true
  }, [sidebar, mainArea]);
}

// -------------------------------------------------------------
// BUILD FULL DOCUMENT WITH EXISTING SCREENS 1, 2, 3 + 0, 4, 5, 6
// -------------------------------------------------------------
function main() {
  const targetPenPath = path.join(__dirname, 'portal-setgen.pen');
  let existingChildren = [];

  // Re-read existing document if present to preserve screens 1, 2, 3 or rebuild everything cleanly
  // Let's build all screens into a complete master document
  const dsShowcase = buildDesignSystemShowcase();
  const visitsScreen = buildVisitsScreen();
  const warehouseScreen = buildWarehouseScreen();
  const usersScreen = buildUsersScreen();

  // Read the active pen file from pencil if we have screen 1, 2, 3
  let screen1 = null;
  let screen2 = null;
  let screen3 = null;

  // Let's generate Screen 1 (Dashboard)
  screen1 = (function buildDashboard() {
    const sidebar = buildSidebar("Dashboard", 980);
    const topbar = buildTopbar("Portal Setgen  /  Painel Operacional");
    const header = buildPageHeader("Painel Geral Setgen", "Visão consolidada de operações, visitas comerciais, armazém e frota.", "Nova Operação");
    const kpiCards = buildStatusCards([
      { label: "Visitas Hoje", count: "24", bg: "$status-info-bg", fg: "$status-info-fg", icon: "calendar-check" },
      { label: "Ordens Ativas", count: "142", bg: "$status-success-bg", fg: "$status-success-fg", icon: "shopping-cart" },
      { label: "Alertas Armazém", count: "3", bg: "$status-warning-bg", fg: "$status-warning-fg", icon: "triangle-alert" },
      { label: "Frota em Rota", count: "18", bg: "$status-purple-bg", fg: "$status-purple-fg", icon: "truck" }
    ]);

    // Grid row
    const col1 = createFrame("Col Visitas", {
      width: "fill_container",
      height: 520,
      cornerRadius: 12,
      fill: "$bg-card",
      padding: [20, 24, 20, 24],
      layout: "vertical",
      gap: 16
    }, [
      createFrame("Header", {
        width: "fill_container",
        justifyContent: "space_between",
        alignItems: "center"
      }, [
        createText("Próximas Visitas Comerciais", { fontSize: 16, fontWeight: "bold", fill: "$text-primary" }),
        createText("Ver Agenda Completa →", { fontSize: 12, fontWeight: "bold", fill: "$brand-primary" })
      ]),
      ...[
        { client: "Hospital Samaritano S/A", time: "14:00", rep: "Carlos Mendes", status: "Em Rota", bg: "$status-info-bg", fg: "$status-info-fg" },
        { client: "Indústria Metalúrgica Sul", time: "15:30", rep: "Mariana Souza", status: "Agendada", bg: "$status-neutral-bg", fg: "$status-neutral-fg" },
        { client: "Supermercados Estrela", time: "16:45", rep: "João Pedro", status: "Confirmada", bg: "$status-success-bg", fg: "$status-success-fg" },
        { client: "Construtora Horizonte", time: "17:30", rep: "Carlos Mendes", status: "Agendada", bg: "$status-neutral-bg", fg: "$status-neutral-fg" }
      ].map(v => createFrame("Visit Item", {
        width: "fill_container",
        cornerRadius: 8,
        fill: "$bg-subtle",
        padding: [14, 16, 14, 16],
        justifyContent: "space_between",
        alignItems: "center"
      }, [
        createFrame("Left Info", { alignItems: "center", gap: 12 }, [
          createFrame("Time Box", { width: 54, height: 38, cornerRadius: 6, fill: "$bg-card", justifyContent: "center", alignItems: "center" }, [
            createText(v.time, { fontSize: 12, fontWeight: "bold", fill: "$text-primary" })
          ]),
          createFrame("Details", { layout: "vertical", gap: 2 }, [
            createText(v.client, { fontSize: 13, fontWeight: "bold", fill: "$text-primary" }),
            createText(`Representante: ${v.rep}`, { fontSize: 11, fill: "$text-secondary" })
          ])
        ]),
        createFrame("Badge", { cornerRadius: 9999, fill: v.bg, padding: [4, 12, 4, 12], alignItems: "center" }, [
          createText(v.status, { fontSize: 10, fontWeight: "bold", fill: v.fg })
        ])
      ]))
    ]);

    const col2 = createFrame("Col Armazém", {
      width: "fill_container",
      height: 520,
      cornerRadius: 12,
      fill: "$bg-card",
      padding: [20, 24, 20, 24],
      layout: "vertical",
      gap: 16
    }, [
      createFrame("Header", {
        width: "fill_container",
        justifyContent: "space_between",
        alignItems: "center"
      }, [
        createText("Movimentações de Armazém", { fontSize: 16, fontWeight: "bold", fill: "$text-primary" }),
        createText("Gerenciar Armazém →", { fontSize: 12, fontWeight: "bold", fill: "$brand-primary" })
      ]),
      ...[
        { code: "ARM-8941", item: "Gerador Diesel 150kVA", type: "Expedição", loc: "Doca 02", status: "Em Preparação", bg: "$status-warning-bg", fg: "$status-warning-fg" },
        { code: "ARM-8940", item: "Cabo de Alta Tensão 50m", type: "Entrada", loc: "Prateleira B-14", status: "Recebido", bg: "$status-success-bg", fg: "$status-success-fg" },
        { code: "ARM-8939", item: "Painel de Distribuição QTA", type: "Inspeção", loc: "Bancada 01", status: "Em Testes", bg: "$status-info-bg", fg: "$status-info-fg" },
        { code: "ARM-8938", item: "Bateria Estacionária 12V", type: "Expedição", loc: "Doca 01", status: "Pronto", bg: "$status-success-bg", fg: "$status-success-fg" }
      ].map(w => createFrame("Wh Item", {
        width: "fill_container",
        cornerRadius: 8,
        fill: "$bg-subtle",
        padding: [14, 16, 14, 16],
        justifyContent: "space_between",
        alignItems: "center"
      }, [
        createFrame("Left Info", { alignItems: "center", gap: 12 }, [
          createFrame("Code Box", { width: 44, height: 38, cornerRadius: 6, fill: "$brand-primary-light", justifyContent: "center", alignItems: "center" }, [
            createIcon("box", { width: 18, height: 18, fill: "$brand-primary" })
          ]),
          createFrame("Details", { layout: "vertical", gap: 2 }, [
            createText(w.item, { fontSize: 13, fontWeight: "bold", fill: "$text-primary" }),
            createText(`${w.code} • ${w.loc} (${w.type})`, { fontSize: 11, fill: "$text-secondary" })
          ])
        ]),
        createFrame("Badge", { cornerRadius: 9999, fill: w.bg, padding: [4, 12, 4, 12], alignItems: "center" }, [
          createText(w.status, { fontSize: 10, fontWeight: "bold", fill: w.fg })
        ])
      ]))
    ]);

    const grid = createFrame("Grid", { width: "fill_container", height: 520, gap: 20 }, [col1, col2]);

    const bodyArea = createFrame("Body Area", {
      width: "fill_container",
      height: 912,
      layout: "vertical",
      padding: [24, 32, 24, 32],
      gap: 20
    }, [header, kpiCards, grid]);

    const mainArea = createFrame("Main Area", {
      width: 1180,
      height: 980,
      fill: "$bg-app",
      layout: "vertical"
    }, [topbar, bodyArea]);

    return createFrame("01 - Dashboard Geral", {
      x: 0,
      y: 420,
      width: 1440,
      height: 980,
      fill: "$bg-app",
      clip: true
    }, [sidebar, mainArea]);
  })();

  // Screen 2: Clientes CRUD com Inline Form de 3 Etapas
  screen2 = (function buildClientesCRUD() {
    const sidebar = buildSidebar("Clientes", 1180);
    const topbar = buildTopbar("Comercial  /  Clientes e Contratos");
    const header = buildPageHeader("Clientes & Parceiros", "Gestão cadastral, contratos ativos, limite de crédito e histórico de pedidos.", "Novo Cliente");

    // Stepper 3 Steps
    const steps = [
      { num: "1", title: "Identificação", active: true },
      { num: "2", title: "Contato & Endereço", active: false },
      { num: "3", title: "Condições Comerciais", active: false }
    ].map(s => createFrame(`Step ${s.num}`, { alignItems: "center", gap: 8 }, [
      createFrame("Num", { width: 24, height: 24, cornerRadius: 9999, fill: s.active ? "$brand-primary" : "$bg-card", justifyContent: "center", alignItems: "center" }, [
        createText(s.num, { fontSize: 11, fontWeight: "bold", fill: s.active ? "#FFFFFF" : "$text-secondary" })
      ]),
      createText(s.title, { fontSize: 13, fontWeight: s.active ? "bold" : "normal", fill: s.active ? "$brand-primary" : "$text-secondary" })
    ]));

    const stepperBar = createFrame("Stepper Bar", {
      width: "fill_container",
      height: 48,
      cornerRadius: 8,
      fill: "$bg-subtle",
      padding: [8, 16, 8, 16],
      justifyContent: "space_between",
      alignItems: "center"
    }, steps);

    const inputCols = [
      { label: "Razão Social *", val: "Hospital Samaritano de São Paulo S/A" },
      { label: "Nome Fantasia", val: "Samaritano Saúde" },
      { label: "CNPJ *", val: "60.448.243/0001-56" }
    ].map(f => createFrame("Col", { width: "fill_container", layout: "vertical", gap: 8 }, [
      createText(f.label, { fontSize: 12, fontWeight: "bold", fill: "$text-primary" }),
      createFrame("Input", { width: "fill_container", height: 42, cornerRadius: 8, fill: "$bg-subtle", padding: [8, 12, 8, 12], alignItems: "center" }, [
        createText(f.val, { fontSize: 13, fill: "$text-primary" })
      ])
    ]));

    const inputsGrid = createFrame("Inputs Grid", { width: "fill_container", gap: 16 }, inputCols);

    const formFooter = createFrame("Form Navigation", {
      width: "fill_container",
      justifyContent: "space_between",
      alignItems: "center",
      padding: [8, 0, 0, 0]
    }, [
      createFrame("Btn Voltar", { height: 38, cornerRadius: 8, fill: "$bg-subtle", padding: [8, 16, 8, 16], alignItems: "center" }, [
        createText("← Cancelar", { fontSize: 12, fontWeight: "bold", fill: "$text-secondary" })
      ]),
      createFrame("Btn Proximo", { height: 38, cornerRadius: 8, fill: "$brand-primary", padding: [8, 20, 8, 20], alignItems: "center" }, [
        createText("Próxima Etapa: Contato & Endereço →", { fontSize: 12, fontWeight: "bold", fill: "#FFFFFF" })
      ])
    ]);

    const inlineForm = createFrame("InlineClientForm (Aurora Multi-Step)", {
      width: "fill_container",
      cornerRadius: 12,
      fill: "$bg-card",
      padding: [20, 24, 20, 24],
      layout: "vertical",
      gap: 16,
      stroke: "$brand-primary-light",
      strokeWidth: 2
    }, [
      createFrame("Form Header", { width: "fill_container", justifyContent: "space_between", alignItems: "center" }, [
        createFrame("Title Group", { alignItems: "center", gap: 12 }, [
          createFrame("Icon", { width: 36, height: 36, cornerRadius: 8, fill: "$brand-primary-light", justifyContent: "center", alignItems: "center" }, [
            createIcon("building-2", { width: 20, height: 20, fill: "$brand-primary" })
          ]),
          createFrame("Text", { layout: "vertical", gap: 2 }, [
            createText("Novo Registro de Cliente", { fontSize: 16, fontWeight: "bold", fill: "$text-primary" }),
            createText("Etapa 1 de 3: Identificação e Dados Principais", { fontSize: 12, fill: "$text-secondary" })
          ])
        ]),
        createFrame("Close Button", { width: 32, height: 32, cornerRadius: 9999, fill: "$bg-subtle", justifyContent: "center", alignItems: "center" }, [
          createIcon("x", { width: 16, height: 16, fill: "$text-secondary" })
        ])
      ]),
      stepperBar,
      inputsGrid,
      formFooter
    ]);

    const statusCards = buildStatusCards([
      { label: "Todos os Clientes", count: "328", bg: "$status-neutral-bg", fg: "$status-neutral-fg", icon: "layers" },
      { label: "Clientes Ativos", count: "294", bg: "$status-success-bg", fg: "$status-success-fg", icon: "check-circle-2" },
      { label: "Em Prospecção", count: "22", bg: "$status-warning-bg", fg: "$status-warning-fg", icon: "clock" },
      { label: "Inativos / Bloqueados", count: "12", bg: "$status-danger-bg", fg: "$status-danger-fg", icon: "ban" }
    ]);

    const filterBar = buildFilterBar("Buscar por Razão Social, CNPJ ou Nome Fantasia...", "Segmento: Todos");

    // Table
    const tableCard = createFrame("DataTable Card", {
      width: "fill_container",
      cornerRadius: 12,
      fill: "$bg-card",
      padding: [16, 20, 16, 20],
      layout: "vertical",
      gap: 8
    });

    const thead = createFrame("Table Header", {
      width: "fill_container",
      height: 38,
      alignItems: "center",
      padding: [0, 8, 0, 8]
    }, [
      createText("CLIENTE / CNPJ", { width: 380, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
      createText("SEGMENTO", { width: 180, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
      createText("CIDADE / UF", { width: 180, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
      createText("STATUS", { width: 140, fontSize: 11, fontWeight: "bold", fill: "$text-muted" }),
      createText("AÇÕES", { width: 140, fontSize: 11, fontWeight: "bold", fill: "$text-muted" })
    ]);

    const clientRows = [
      { name: "Hospital Samaritano S/A", cnpj: "60.448.243/0001-56", seg: "Saúde / Hospitalar", city: "São Paulo - SP", status: "Ativo", bg: "$status-success-bg", fg: "$status-success-fg" },
      { name: "Indústria Metalúrgica Alvorada", cnpj: "18.234.918/0001-22", seg: "Indústria Pesada", city: "Campinas - SP", status: "Ativo", bg: "$status-success-bg", fg: "$status-success-fg" },
      { name: "Rede Supermercados Estrela", cnpj: "44.912.830/0002-19", seg: "Varejo Alimentício", city: "Santos - SP", status: "Prospecção", bg: "$status-warning-bg", fg: "$status-warning-fg" },
      { name: "Construtora Horizonte Verde", cnpj: "05.119.482/0001-70", seg: "Construção Civil", city: "Ribeirão Preto - SP", status: "Inativo", bg: "$status-danger-bg", fg: "$status-danger-fg" }
    ].map(rowData => createFrame(`Row - ${rowData.name}`, {
      width: "fill_container",
      height: 64,
      cornerRadius: 8,
      fill: "$bg-subtle",
      padding: [10, 8, 10, 8],
      alignItems: "center"
    }, [
      createFrame("Col 1", { width: 380, alignItems: "center", gap: 12 }, [
        createFrame("Icon Box", { width: 38, height: 38, cornerRadius: 8, fill: "$brand-primary-light", justifyContent: "center", alignItems: "center" }, [
          createIcon("building-2", { width: 18, height: 18, fill: "$brand-primary" })
        ]),
        createFrame("Text", { layout: "vertical", gap: 2 }, [
          createText(rowData.name, { fontSize: 13, fontWeight: "bold", fill: "$text-primary" }),
          createText(`CNPJ: ${rowData.cnpj}`, { fontSize: 11, fill: "$text-secondary" })
        ])
      ]),
      createText(rowData.seg, { width: 180, fontSize: 13, fill: "$text-primary" }),
      createText(rowData.city, { width: 180, fontSize: 13, fill: "$text-secondary" }),
      createFrame("Col 4 Status", { width: 140, alignItems: "center" }, [
        createFrame("Badge", { cornerRadius: 9999, fill: rowData.bg, padding: [4, 12, 4, 12], alignItems: "center" }, [
          createText(rowData.status, { fontSize: 11, fontWeight: "bold", fill: rowData.fg })
        ])
      ]),
      createFrame("Col 5 Actions", { width: 140, alignItems: "center", gap: 8 }, [
        createFrame("Ver Detalhes", { width: 32, height: 32, cornerRadius: 6, fill: "$bg-card", justifyContent: "center", alignItems: "center" }, [
          createIcon("file-text", { width: 16, height: 16, fill: "$brand-primary" })
        ]),
        createFrame("Editar", { width: 32, height: 32, cornerRadius: 6, fill: "$bg-card", justifyContent: "center", alignItems: "center" }, [
          createIcon("pencil", { width: 16, height: 16, fill: "$text-secondary" })
        ])
      ])
    ]));

    tableCard.children = [thead, ...clientRows];

    const bodyArea = createFrame("Body Content", {
      width: "fill_container",
      height: 1112,
      layout: "vertical",
      padding: [24, 32, 24, 32],
      gap: 18
    }, [header, inlineForm, statusCards, filterBar, tableCard]);

    const mainArea = createFrame("Main Area", {
      width: 1180,
      height: 1180,
      fill: "$bg-app",
      layout: "vertical"
    }, [topbar, bodyArea]);

    return createFrame("02 - Clientes (CRUD Aurora)", {
      x: 1520,
      y: 420,
      width: 1440,
      height: 1180,
      fill: "$bg-app",
      clip: true
    }, [sidebar, mainArea]);
  })();

  // Screen 3: Detalhes do Cliente DetailsCard (Modal)
  screen3 = (function buildDetailsCardScreen() {
    const modal = createFrame("ClientDetailsCard Modal", {
      width: 760,
      cornerRadius: 16,
      fill: "$bg-card",
      layout: "vertical",
      clip: true,
      stroke: "$border-subtle",
      strokeWidth: 1
    }, [
      // Header
      createFrame("Modal Header", {
        width: "fill_container",
        height: 84,
        fill: "$bg-subtle",
        padding: [20, 28, 20, 28],
        justifyContent: "space_between",
        alignItems: "center",
        stroke: "$border-subtle",
        strokeWidth: 1
      }, [
        createFrame("Title Group", { alignItems: "center", gap: 16 }, [
          createFrame("Icon Box", { width: 44, height: 44, cornerRadius: 10, fill: "$brand-primary-light", justifyContent: "center", alignItems: "center" }, [
            createIcon("building-2", { width: 22, height: 22, fill: "$brand-primary" })
          ]),
          createFrame("Titles", { layout: "vertical", gap: 4 }, [
            createFrame("Row 1", { alignItems: "center", gap: 10 }, [
              createText("Hospital Samaritano S/A", { fontSize: 18, fontWeight: "bold", fill: "$text-primary" }),
              createFrame("Status", { cornerRadius: 9999, fill: "$status-success-bg", padding: [2, 10, 2, 10], alignItems: "center" }, [
                createText("ATIVO", { fontSize: 10, fontWeight: "bold", fill: "$status-success-fg" })
              ])
            ]),
            createText("CNPJ: 60.448.243/0001-56 • I.E: 109.845.221.110 • Cliente desde 2023", { fontSize: 12, fill: "$text-secondary" })
          ])
        ]),
        createFrame("Close Button", { width: 36, height: 36, cornerRadius: 9999, fill: "$bg-card", justifyContent: "center", alignItems: "center" }, [
          createIcon("x", { width: 18, height: 18, fill: "$text-secondary" })
        ])
      ]),

      // Body
      createFrame("Modal Body", {
        width: "fill_container",
        padding: [24, 28, 24, 28],
        layout: "vertical",
        gap: 16
      }, [
        // Seção Contatos
        createFrame("Seção Contato", { width: "fill_container", cornerRadius: 10, fill: "$bg-subtle", padding: [16, 20, 16, 20], layout: "vertical", gap: 12 }, [
          createText("CONTATOS & RESPONSÁVEIS", { fontSize: 11, fontWeight: "bold", fill: "$text-secondary" }),
          createFrame("Grid Info", { width: "fill_container", gap: 24 }, [
            { label: "E-mail Principal", val: "financeiro@samaritano.com.br" },
            { label: "Telefone Central", val: "(11) 3821-5000" },
            { label: "Representante Setgen", val: "Carlos Mendes (Comercial)" }
          ].map(inf => createFrame("Info Col", { width: "fill_container", layout: "vertical", gap: 4 }, [
            createText(inf.label, { fontSize: 11, fill: "$text-secondary" }),
            createText(inf.val, { fontSize: 13, fontWeight: "bold", fill: "$text-primary" })
          ])))
        ]),

        // Seção Endereço
        createFrame("Seção Endereço", { width: "fill_container", cornerRadius: 10, fill: "$bg-subtle", padding: [16, 20, 16, 20], layout: "vertical", gap: 12 }, [
          createText("ENDEREÇO DA UNIDADE & ENTREGA DE GERADORES", { fontSize: 11, fontWeight: "bold", fill: "$text-secondary" }),
          createFrame("Grid Info", { width: "fill_container", gap: 24 }, [
            { label: "Logradouro / Bairro", val: "Rua Conselheiro Brotero, 1486 - Higienópolis" },
            { label: "Cidade / CEP", val: "São Paulo - SP • CEP: 01232-010" },
            { label: "Doca de Carga", val: "Acesso 02 - Doca de Geradores" }
          ].map(inf => createFrame("Info Col", { width: "fill_container", layout: "vertical", gap: 4 }, [
            createText(inf.label, { fontSize: 11, fill: "$text-secondary" }),
            createText(inf.val, { fontSize: 13, fontWeight: "bold", fill: "$text-primary" })
          ])))
        ]),

        // Seção Destaque Comercial
        createFrame("Seção Condições", { width: "fill_container", cornerRadius: 10, fill: "$status-info-bg", padding: [16, 20, 16, 20], justifyContent: "space_between", alignItems: "center" }, [
          createFrame("Left", { layout: "vertical", gap: 4 }, [
            createText("Condição Comercial: Tabela Corporativa Saúde", { fontSize: 13, fontWeight: "bold", fill: "$status-info-fg" }),
            createText("Faturamento 30 DDL • Locação prioritária de geradores de backup", { fontSize: 12, fill: "$status-info-fg" })
          ]),
          createFrame("Limit Box", { layout: "vertical", alignItems: "end", gap: 2 }, [
            createText("Limite Aprovado", { fontSize: 11, fill: "$status-info-fg" }),
            createText("R$ 350.000,00", { fontSize: 18, fontWeight: "bold", fill: "$status-info-fg" })
          ])
        ]),

        // Auditoria
        createFrame("Auditoria", { width: "fill_container", padding: [8, 4, 8, 4], justifyContent: "space_between", alignItems: "center" }, [
          createText("Criado em 14/03/2023 por Carlos Mendes • Última alteração em 20/09/2026 por Lucas Silva", { fontSize: 11, fill: "$text-muted" })
        ])
      ]),

      // Footer
      createFrame("Modal Footer", {
        width: "fill_container",
        height: 72,
        fill: "$bg-subtle",
        padding: [16, 28, 16, 28],
        justifyContent: "space_between",
        alignItems: "center",
        stroke: "$border-subtle",
        strokeWidth: 1
      }, [
        createFrame("Excluir Registro", { height: 40, cornerRadius: 8, fill: "$status-danger-bg", padding: [8, 16, 8, 16], alignItems: "center", gap: 8 }, [
          createIcon("trash-2", { width: 16, height: 16, fill: "$status-danger-fg" }),
          createText("Excluir Cliente", { fontSize: 12, fontWeight: "bold", fill: "$status-danger-fg" })
        ]),
        createFrame("Right Buttons", { alignItems: "center", gap: 12 }, [
          createFrame("Fechar", { height: 40, cornerRadius: 8, fill: "$bg-card", padding: [8, 18, 8, 18], alignItems: "center" }, [
            createText("Fechar", { fontSize: 13, fontWeight: "bold", fill: "$text-secondary" })
          ]),
          createFrame("Editar Cadastro", { height: 40, cornerRadius: 8, fill: "$brand-primary", padding: [8, 20, 8, 20], alignItems: "center", gap: 8 }, [
            createIcon("pencil", { width: 16, height: 16, fill: "#FFFFFF" }),
            createText("Editar Cadastro", { fontSize: 13, fontWeight: "bold", fill: "#FFFFFF" })
          ])
        ])
      ])
    ]);

    const backdrop = createFrame("Backdrop Blur Overlay", {
      width: 1440,
      height: 980,
      fill: "#0B131ECC",
      justifyContent: "center",
      alignItems: "center"
    }, [modal]);

    return createFrame("03 - Detalhes do Cliente (Modal Aurora)", {
      x: 3040,
      y: 420,
      width: 1440,
      height: 980,
      fill: "$bg-app",
      clip: true
    }, [backdrop]);
  })();

  const modulesHubScreen = (() => {
    // 1. Header Corporativo Navy
    const logoBlock = createFrame("Logo Block", { layout: "horizontal", gap: 12, alignItems: "center" }, [
      createFrame("Logo Icon", { width: 32, height: 32, cornerRadius: 8, fill: "$brand-primary", justifyContent: "center", alignItems: "center" }, [
        createIcon("zap", { width: 18, height: 18, fill: "#FFFFFF" })
      ]),
      createText("SETGEN", { fontSize: 16, fontWeight: "bold", fill: "#FFFFFF" })
    ]);

    const userBlock = createFrame("User Block", { layout: "horizontal", gap: 12, alignItems: "center" }, [
      createText("Lucas Silva", { fontSize: 13, fontWeight: "bold", fill: "#FFFFFF" }),
      createFrame("Logout Btn", { width: 32, height: 32, cornerRadius: 16, fill: "#263443", justifyContent: "center", alignItems: "center" }, [
        createIcon("log-out", { width: 14, height: 14, fill: "#94A3B8" })
      ])
    ]);

    const topHeader = createFrame("Header Global", {
      width: 1440,
      height: 56,
      fill: "$brand-navy",
      layout: "horizontal",
      justifyContent: "space-between",
      alignItems: "center",
      padding: [0, 48, 0, 48]
    }, [logoBlock, userBlock]);

    // 2. Apresentação / Título direto (Sem faixa abaixo do navbar, centralizado)
    const titleBlock = createFrame("Title Block", { layout: "vertical", gap: 4, width: 1344, alignItems: "center" }, [
      createText("Módulos", { fontSize: 24, fontWeight: "bold", fill: "$text-primary" }),
      createText("Selecione o ambiente operacional para iniciar o trabalho.", { fontSize: 13, fill: "$text-secondary" })
    ]);

    // Helper para criar ModuleCard no Canvas
    function createModulePenCard(title, desc, iconName) {
      const iconBox = createFrame("Icon Box", {
        width: 56,
        height: 56,
        cornerRadius: 12,
        fill: "$brand-primary-light",
        justifyContent: "center",
        alignItems: "center"
      }, [
        createIcon(iconName, { width: 28, height: 28, fill: "$brand-primary" })
      ]);

      const texts = createFrame("Texts", { layout: "vertical", gap: 6 }, [
        createText(title, { fontSize: 16, fontWeight: "bold", fill: "$text-primary" }),
        createText(desc, { fontSize: 12, fill: "$text-secondary", width: 360 })
      ]);

      const footer = createFrame("Card Footer", {
        width: 380,
        layout: "horizontal",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: [12, 0, 0, 0],
        stroke: "$border-subtle",
        strokeWidth: 1
      }, [
        createText("Acessar ➔", { fontSize: 12, fontWeight: "bold", fill: "$brand-primary" })
      ]);

      return createFrame(`Card - ${title}`, {
        width: 426,
        height: 230,
        cornerRadius: 16,
        fill: "#FFFFFF",
        stroke: "$border-subtle",
        strokeWidth: 1,
        padding: [24, 24, 20, 24],
        layout: "vertical",
        justifyContent: "space-between"
      }, [
        createFrame("Top Content", { layout: "vertical", gap: 16 }, [iconBox, texts]),
        footer
      ]);
    }

    const row1 = createFrame("Row 1", { layout: "horizontal", gap: 24 }, [
      createModulePenCard("Ordens de Serviço & Campo", "Manutenções preventivas e corretivas em geradores, horímetro, QTA, ARTs e checklists.", "wrench"),
      createModulePenCard("Clientes & Usinas / Plantas", "Carteira ativa corporativa, plantas industriais com geradores alocados e contratos.", "building-2"),
      createModulePenCard("Estoque de Geradores & Peças", "Grupos geradores diesel por kVA, quadros QTA, cabeamento de força e peças de reposição.", "package")
    ]);

    const row2 = createFrame("Row 2", { layout: "horizontal", gap: 24 }, [
      createModulePenCard("Orçamentos & Propostas", "Dimensionamento de carga em kVA, propostas comerciais e conversão em O.S. aprovada.", "calculator"),
      createModulePenCard("Compras & Suprimentos", "Ordens de compra para fornecedores, cotações de peças e insumos de manutenção.", "shopping-cart"),
      createModulePenCard("Financeiro & Faturamento Fiscal", "Emissão dual NF-e/NFS-e de locação e serviços, despesas de técnicos e fluxo de caixa.", "receipt")
    ]);

    const grid = createFrame("Modules Grid", { layout: "vertical", gap: 24 }, [row1, row2]);

    const bodyContent = createFrame("Body Content", {
      layout: "vertical",
      gap: 24,
      padding: [32, 48, 32, 48]
    }, [titleBlock, grid]);

    return createFrame("07 - Hub de Módulos (/modules)", {
      x: 0,
      y: 2060,
      width: 1440,
      height: 980,
      fill: "$bg-app",
      layout: "vertical",
      clip: true
    }, [topHeader, bodyContent]);
  })();

  const moduleSelectionScreen = (() => {
    // 1. Header do Módulo Minimalista (Clean White h-11 = 44px) com Breadcrumb Integrado
    const leftHeader = createFrame("Left Header", { layout: "horizontal", gap: 10, alignItems: "center" }, [
      createFrame("Logo Icon", { width: 22, height: 22, cornerRadius: 4, fill: "$brand-primary", justifyContent: "center", alignItems: "center" }, [
        createText("S", { fontSize: 11, fontWeight: "bold", fill: "#FFFFFF" })
      ]),
      createText("SETGEN", { fontSize: 12, fontWeight: "bold", fill: "$text-primary" }),
      createText("|", { fontSize: 12, fill: "$border-default" }),
      // Breadcrumb navegável
      createFrame("Breadcrumb", { layout: "horizontal", gap: 6, alignItems: "center" }, [
        createText("Módulos", { fontSize: 12, fill: "$text-secondary" }),
        createIcon("chevron-right", { width: 12, height: 12, fill: "$text-muted" }),
        createText("Ordens de Serviço & Campo", { fontSize: 12, fill: "$text-secondary" }),
        createIcon("chevron-right", { width: 12, height: 12, fill: "$text-muted" }),
        createText("Gestão de O.S.", { fontSize: 12, fontWeight: "bold", fill: "$text-primary" })
      ])
    ]);

    const rightHeader = createFrame("Right Header", { layout: "horizontal", gap: 12, alignItems: "center" }, [
      createText("Lucas Silva", { fontSize: 12, fill: "$text-secondary" }),
      createFrame("Logout Btn", { width: 26, height: 26, cornerRadius: 4, fill: "#F1F5F9", justifyContent: "center", alignItems: "center" }, [
        createIcon("log-out", { width: 12, height: 12, fill: "#64748B" })
      ])
    ]);

    const moduleHeader = createFrame("Module Header", {
      width: 1440,
      height: 44,
      fill: "#FFFFFF",
      stroke: "$border-subtle",
      strokeWidth: 1,
      layout: "horizontal",
      justifyContent: "space_between",
      alignItems: "center",
      padding: [0, 20, 0, 20]
    }, [leftHeader, rightHeader]);

    // 2. Sidebar Dark Minimalista para O.S. & Campo
    const sidebarLogo = createFrame("Sidebar Header", {
      width: 176,
      layout: "horizontal",
      gap: 8,
      alignItems: "center",
      padding: [8, 0, 8, 0]
    }, [
      createFrame("Dot", { width: 6, height: 6, cornerRadius: 3, fill: "$brand-primary" }),
      createText("O.S. & CAMPO", { fontSize: 11, fontWeight: "bold", fill: "#94A3B8" })
    ]);

    const navHome = createFrame("Nav Home", {
      width: 176,
      layout: "horizontal",
      gap: 10,
      alignItems: "center",
      padding: [7, 10, 7, 10],
      cornerRadius: 6
    }, [
      createIcon("home", { width: 14, height: 14, fill: "#64748B" }),
      createText("Módulos", { fontSize: 12, fill: "#94A3B8" })
    ]);

    const navActiveItem = createFrame("Active Item", {
      width: 176,
      layout: "horizontal",
      gap: 10,
      alignItems: "center",
      padding: [7, 10, 7, 10],
      cornerRadius: 6,
      fill: "#1E293B"
    }, [
      createIcon("wrench", { width: 14, height: 14, fill: "$brand-primary" }),
      createText("Ordens de Serviço", { fontSize: 12, fontWeight: "bold", fill: "#FFFFFF" })
    ]);

    const navChecklists = createFrame("Nav Checklists", {
      width: 176,
      layout: "horizontal",
      gap: 10,
      alignItems: "center",
      padding: [7, 10, 7, 10],
      cornerRadius: 6
    }, [
      createIcon("check-square", { width: 14, height: 14, fill: "#64748B" }),
      createText("Checklists & QTA", { fontSize: 12, fill: "#94A3B8" })
    ]);

    const navTechs = createFrame("Nav Techs", {
      width: 176,
      layout: "horizontal",
      gap: 10,
      alignItems: "center",
      padding: [7, 10, 7, 10],
      cornerRadius: 6
    }, [
      createIcon("shield-check", { width: 14, height: 14, fill: "#64748B" }),
      createText("Técnicos & NRs", { fontSize: 12, fill: "#94A3B8" })
    ]);

    const navHorimeters = createFrame("Nav Horimeters", {
      width: 176,
      layout: "horizontal",
      gap: 10,
      alignItems: "center",
      padding: [7, 10, 7, 10],
      cornerRadius: 6
    }, [
      createIcon("gauge", { width: 14, height: 14, fill: "#64748B" }),
      createText("Horímetros & Óleo", { fontSize: 12, fill: "#94A3B8" })
    ]);

    const sidebarFooter = createFrame("Sidebar Footer", {
      width: 176,
      padding: [8, 4, 8, 4],
      stroke: "#1E293B",
      strokeWidth: 1
    }, [
      createText("Lucas Silva • Coordenação", { fontSize: 11, fill: "#64748B" })
    ]);

    const moduleSidebar = createFrame("Module Sidebar", {
      width: 208,
      height: 936,
      fill: "#0C111D",
      stroke: "#1E293B",
      strokeWidth: 1,
      layout: "vertical",
      justifyContent: "space_between",
      padding: [14, 16, 14, 16]
    }, [
      createFrame("Top Nav", { layout: "vertical", gap: 10 }, [sidebarLogo, navHome, navActiveItem, navChecklists, navTechs, navHorimeters]),
      sidebarFooter
    ]);

    // 3. Barra de Abas Minimalista (Underline Tabs + Botão [+] Discreto)
    const tab1 = createFrame("Tab - OS List", {
      height: 40,
      padding: [0, 14, 0, 14],
      layout: "horizontal",
      gap: 8,
      alignItems: "center",
      stroke: "$brand-primary",
      strokeWidth: 2
    }, [
      createIcon("wrench", { width: 13, height: 13, fill: "$brand-primary" }),
      createText("Ordens de Serviço", { fontSize: 12, fontWeight: "bold", fill: "$text-primary" }),
      createText("28", { fontSize: 10, fill: "$text-secondary" })
    ]);

    const tab2 = createFrame("Tab - Nova OS", {
      height: 40,
      padding: [0, 12, 0, 12],
      layout: "horizontal",
      gap: 6,
      alignItems: "center"
    }, [
      createIcon("file-plus-2", { width: 13, height: 13, fill: "#64748B" }),
      createText("Nova O.S. Preventiva", { fontSize: 12, fill: "$text-secondary" }),
      createIcon("x", { width: 10, height: 10, fill: "#94A3B8" })
    ]);

    const tab3 = createFrame("Tab - Detalhe OS", {
      height: 40,
      padding: [0, 12, 0, 12],
      layout: "horizontal",
      gap: 6,
      alignItems: "center"
    }, [
      createIcon("file-text", { width: 13, height: 13, fill: "#16A34A" }),
      createText("OS-2026-0842 (Vale 500kVA)", { fontSize: 12, fill: "$text-secondary" }),
      createIcon("x", { width: 10, height: 10, fill: "#94A3B8" })
    ]);

    const tabsList = createFrame("Tabs List", { layout: "horizontal", gap: 2, alignItems: "center" }, [
      tab1,
      tab2,
      tab3
    ]);

    const addFormButton = createFrame("Botao [+]", {
      width: 26,
      height: 26,
      cornerRadius: 6,
      fill: "#FFFFFF",
      stroke: "#CBD5E1",
      strokeWidth: 1,
      justifyContent: "center",
      alignItems: "center"
    }, [
      createIcon("plus", { width: 12, height: 12, fill: "#64748B" })
    ]);

    const tabsBar = createFrame("Tabs Bar", {
      width: 1232,
      height: 40,
      fill: "#FFFFFF",
      stroke: "$border-subtle",
      strokeWidth: 1,
      layout: "horizontal",
      justifyContent: "space_between",
      alignItems: "center",
      padding: [0, 20, 0, 20]
    }, [tabsList, addFormButton]);

    // 4. Área de Trabalho Minimalista de O.S. de Geradores
    const crudTitle = createText("Ordens de Serviço de Geradores", { fontSize: 16, fontWeight: "bold", fill: "$text-primary" });
    const crudSummary = createText("28 ativas • 14 em andamento • 8 aguardando peças • 6 startups / QTA", { fontSize: 12, fill: "$text-secondary" });

    const btnExport = createFrame("Btn Export", {
      height: 32,
      padding: [0, 12, 0, 12],
      cornerRadius: 6,
      fill: "#FFFFFF",
      stroke: "$border-default",
      strokeWidth: 1,
      alignItems: "center"
    }, [
      createText("Exportar Relatório", { fontSize: 12, fill: "$text-secondary" })
    ]);

    const btnNew = createFrame("Btn New OS", {
      height: 32,
      padding: [0, 12, 0, 12],
      cornerRadius: 6,
      fill: "$text-primary",
      alignItems: "center",
      gap: 6
    }, [
      createIcon("plus", { width: 12, height: 12, fill: "#FFFFFF" }),
      createText("Nova O.S.", { fontSize: 12, fontWeight: "bold", fill: "#FFFFFF" })
    ]);

    const crudActions = createFrame("Crud Actions", { layout: "horizontal", gap: 8 }, [btnExport, btnNew]);

    const crudHeader = createFrame("CRUD Header Row", {
      width: 1168,
      layout: "horizontal",
      justifyContent: "space_between",
      alignItems: "center"
    }, [
      createFrame("Title Group", { layout: "vertical", gap: 2 }, [crudTitle, crudSummary]),
      crudActions
    ]);

    const searchBar = createFrame("Search Bar", {
      width: 1168,
      height: 36,
      cornerRadius: 6,
      fill: "#FFFFFF",
      stroke: "$border-default",
      strokeWidth: 1,
      padding: [0, 12, 0, 12],
      layout: "horizontal",
      gap: 8,
      alignItems: "center"
    }, [
      createIcon("search", { width: 14, height: 14, fill: "$text-muted" }),
      createText("Buscar por O.S., Cliente, Usina ou Prefixo do Gerador...", { fontSize: 12, fill: "$text-muted" })
    ]);

    // Linha de Tabela Minimalista Helper para O.S.
    function createOsRow(osNum, date, client, plant, genKva, scope, horimeter, tech, status, statusColor) {
      return createFrame(`Row - ${osNum}`, {
        width: 1168,
        height: 52,
        layout: "horizontal",
        alignItems: "center",
        padding: [0, 16, 0, 16],
        stroke: "$border-subtle",
        strokeWidth: 1,
        fill: "#FFFFFF"
      }, [
        createFrame("Col OS", { width: 150, layout: "vertical", gap: 1 }, [
          createText(osNum, { fontSize: 12, fontWeight: "bold", fill: "$text-primary" }),
          createText(date, { fontSize: 10, fill: "$text-muted" })
        ]),
        createFrame("Col Client", { width: 220, layout: "vertical", gap: 1 }, [
          createText(client, { fontSize: 12, fontWeight: "bold", fill: "$text-primary" }),
          createText(plant, { fontSize: 10, fill: "$text-muted" })
        ]),
        createFrame("Col Gen", { width: 200, layout: "vertical", gap: 1 }, [
          createText(genKva, { fontSize: 12, fontWeight: "bold", fill: "$text-secondary" }),
          createText(horimeter, { fontSize: 10, fill: "$text-muted" })
        ]),
        createText(scope, { width: 220, fontSize: 11, fill: "$text-secondary" }),
        createFrame("Col Tech", { width: 150, layout: "vertical", gap: 1 }, [
          createText(tech, { fontSize: 11, fontWeight: "bold", fill: "$text-secondary" }),
          createText("NR-10 / NR-35 OK", { fontSize: 9, fill: "#16A34A" })
        ]),
        createFrame("Col Status", { width: 130, layout: "horizontal", gap: 6, alignItems: "center" }, [
          createFrame("Dot", { width: 6, height: 6, cornerRadius: 3, fill: statusColor }),
          createText(status, { fontSize: 11, fontWeight: "bold", fill: statusColor })
        ]),
        createFrame("Col Action", { width: 98, layout: "horizontal", justifyContent: "flex-end" }, [
          createText("Abrir ↗", { fontSize: 11, fontWeight: "bold", fill: "$text-secondary" })
        ])
      ]);
    }

    const tableHeader = createFrame("Table Header", {
      width: 1168,
      height: 36,
      fill: "#F8FAFC",
      layout: "horizontal",
      alignItems: "center",
      padding: [0, 16, 0, 16],
      stroke: "$border-subtle",
      strokeWidth: 1
    }, [
      createText("O.S. / DATA", { width: 150, fontSize: 10, fontWeight: "bold", fill: "$text-muted" }),
      createText("CLIENTE / PLANTA", { width: 220, fontSize: 10, fontWeight: "bold", fill: "$text-muted" }),
      createText("GERADOR / HORAS", { width: 200, fontSize: 10, fontWeight: "bold", fill: "$text-muted" }),
      createText("ESCOPO TÉCNICO", { width: 220, fontSize: 10, fontWeight: "bold", fill: "$text-muted" }),
      createText("TÉCNICO LÍDER", { width: 150, fontSize: 10, fontWeight: "bold", fill: "$text-muted" }),
      createText("STATUS", { width: 130, fontSize: 10, fontWeight: "bold", fill: "$text-muted" }),
      createFrame("Header Action", { width: 98, layout: "horizontal", justifyContent: "flex-end" }, [
        createText("AÇÃO", { fontSize: 10, fontWeight: "bold", fill: "$text-muted" })
      ])
    ]);

    const crudTable = createFrame("CRUD Table", {
      width: 1168,
      cornerRadius: 8,
      stroke: "$border-subtle",
      strokeWidth: 1,
      clip: true,
      layout: "vertical"
    }, [
      tableHeader,
      createOsRow("OS-2026-0842", "23/09/2026", "Vale do Ipiranga S/A", "Usina Congonhas", "Scania DC13 • 500 kVA", "Preventiva 500h (Óleo + Racor)", "Horímetro: 4.820h", "Marcos Ribeiro", "Em Andamento", "#16A34A"),
      createOsRow("OS-2026-0843", "22/09/2026", "Hospital Santa Clara", "Bloco Cirúrgico", "Cummins QSL9 • 250 kVA", "Comutação QTA & Carga", "Horímetro: 1.150h", "Rafael Souza", "Concluída", "#2563EB"),
      createOsRow("OS-2026-0844", "21/09/2026", "Arena Mineirão", "Backup Standby", "MWM 12V • 750 kVA", "Troca Bomba d'Água", "Horímetro: 3.200h", "Marcos Ribeiro", "Aguardando Peças", "#D97706"),
      createOsRow("OS-2026-0845", "20/09/2026", "Cerâmica Barro Forte", "Fornos Contínuos", "Volvo Penta • 300 kVA", "Startup & USCA DSE 7320", "Horímetro: 12h", "Carlos Eduardo", "Em Andamento", "#16A34A")
    ]);

    const activeContent = createFrame("Active Content", {
      width: 1232,
      height: 896,
      fill: "$bg-subtle",
      padding: [24, 32, 24, 32],
      layout: "vertical",
      gap: 16
    }, [crudHeader, searchBar, crudTable]);

    const workspaceArea = createFrame("Workspace Area", {
      width: 1232,
      height: 936,
      layout: "vertical"
    }, [tabsBar, activeContent]);

    const moduleShellBody = createFrame("Module Shell Body", {
      width: 1440,
      height: 936,
      layout: "horizontal"
    }, [moduleSidebar, workspaceArea]);

    return createFrame("08 - Workspace Operacional (Ordens de Serviço & Campo)", {
      x: 1520,
      y: 2060,
      width: 1440,
      height: 980,
      fill: "$bg-app",
      layout: "vertical",
      clip: true
    }, [moduleHeader, moduleShellBody]);
  })();

  const penDoc = {
    version: "2.18",
    version: "2.13",
    themes: {},
    variables: variables,
    children: [
      dsShowcase,
      screen1,
      screen2,
      screen3,
      visitsScreen,
      warehouseScreen,
      usersScreen,
      modulesHubScreen,
      moduleSelectionScreen
    ]
  };

  fs.writeFileSync(targetPenPath, JSON.stringify(penDoc, null, 2), 'utf-8');
  console.log(`Successfully generated ${penDoc.children.length} frames in ${targetPenPath}`);
}

main();

