import * as XLSX from "xlsx";
import { Product } from "@/types";

export interface SheetRow {
  ID?: number | string;
  Produto: string;
  Unidade: string;
  Categoria?: string;
  Código?: string;
  "Margem % (vazio = padrão)"?: number | string;
  "Venda fixa (R$)"?: number | string;
  Fornecedor?: string;
  "Preço de custo (R$)"?: number | string;
  "Data da cotação"?: string;
  "Usar (x)"?: string;
  Observações?: string;
  "Venda atual (só consulta)"?: number | string;
}

/**
 * Normaliza o nome da chave/coluna da planilha para identificação universal
 * Substitui $ por s para que colunas com (R$) terminem em 'rs' (ex: "Preço de custo (R$)" -> "precodecustors")
 */
export function normalizeHeaderKey(key: string): string {
  if (!key) return "";
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\$/g, "s")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Converte qualquer valor monetário ou número para float puro
 * Trata formatos: 12.5, "12,50", "R$ 1.250,50", " 150,00 ", 225
 */
export function parseCurrencyOrNumber(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;

  let str = String(val).trim();
  if (!str) return null;

  // Remove caracteres de moeda e aspas
  str = str.replace(/[R$\s"']/gi, "").trim();
  if (!str) return null;

  // Formato brasileiro com separador de milhar e decimal: 1.250,50
  if (str.includes(".") && str.includes(",")) {
    if (str.indexOf(".") < str.indexOf(",")) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }

  const num = parseFloat(str);
  return !isNaN(num) ? num : null;
}

/**
 * Converte datas de planilha (incluindo números seriais de data do Excel como 46296) para YYYY-MM-DD
 */
export function parseQuotationDate(rawDate: any): string {
  if (!rawDate) return new Date().toISOString().split("T")[0];

  // Serial number do Excel (ex: 46296 para 01/10/2026)
  if (
    typeof rawDate === "number" ||
    (!isNaN(Number(rawDate)) && Number(rawDate) > 30000 && Number(rawDate) < 65000)
  ) {
    const serial = Number(rawDate);
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }

  const str = String(rawDate).trim();
  // Formato DD/MM/AAAA ou DD/MM/AA
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      let year = parts[2];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }
  }

  // Já em formato ISO
  if (str.length >= 10 && str.match(/^\d{4}-\d{2}-\d{2}/)) {
    return str.slice(0, 10);
  }

  return new Date().toISOString().split("T")[0];
}

function findValueByAliases(normRow: Record<string, any>, aliases: string[]): any {
  for (const alias of aliases) {
    if (normRow[alias] !== undefined && normRow[alias] !== "") {
      return normRow[alias];
    }
  }
  return undefined;
}

/**
 * Lê arquivo (XLSX, XLS ou CSV) e retorna lista consolidada de produtos
 */
export async function parseExcelToProducts(file: File): Promise<any[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    return parseCsvTextToProducts(text);
  }

  // Arquivos binários Excel (.xlsx, .xls)
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true });

  return groupSheetRowsToProducts(rawRows);
}

/**
 * Parser nativo de CSV com suporte a vírgula, ponto-e-vírgula e aspas
 */
export function parseCsvTextToProducts(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Detecta se o delimitador é ponto-e-vírgula ou vírgula
  const firstLine = lines[0];
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;
    // Ignorar instruções de rodapé
    if (rawLine.startsWith("•") || rawLine.toUpperCase().includes("COMO EDITAR")) continue;

    const values = parseLine(lines[i]);
    const rowObj: any = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] ?? "";
    });
    rows.push(rowObj);
  }

  return groupSheetRowsToProducts(rows);
}

/**
 * Agrupa linhas que possuem o mesmo ID ou Produto (múltiplos fornecedores por produto)
 */
export function groupSheetRowsToProducts(rawRows: any[]): any[] {
  const map = new Map<string, any>();

  const costAliases = [
    "precodecustors",
    "precodecustor",
    "precodecusto",
    "precocustors",
    "precocustor",
    "precocusto",
    "valordecustors",
    "valordecusto",
    "valorcustors",
    "valorcusto",
    "vlrcustors",
    "vlrcusto",
    "custors",
    "custor",
    "custo",
    "custounitario",
    "custounit",
    "precocustounitario",
    "precounitario",
    "valorunitario",
    "precor",
    "precors",
    "preco",
    "valorr",
    "valorrs",
    "valor",
  ];

  const saleAliases = [
    "vendafixars",
    "vendafixar",
    "vendafixa",
    "precodevendars",
    "precodevendar",
    "precodevenda",
    "precovendars",
    "precovendar",
    "precovenda",
    "valordevendars",
    "valordevenda",
    "valorvendars",
    "valorvenda",
    "vlrvendars",
    "vlrvenda",
    "vendars",
    "vendar",
    "venda",
    "vendaatualsoconsulta",
    "vendaatual",
    "precoatual",
    "precovendaatual",
    "pvenda",
    "precofixo",
  ];

  const marginAliases = [
    "margemvaziopadrao",
    "margempadrao",
    "margem",
    "markup",
    "margemlucro",
    "margempercentual",
    "margemporc",
  ];

  const currentStockAliases = [
    "estoqueatual",
    "estoque",
    "qtdatual",
    "qtd",
    "quantidade",
    "quantidadeatual",
    "saldo",
    "saldoatual",
    "saldoestoque",
  ];

  const minStockAliases = [
    "estoqueminimo",
    "estoquemin",
    "estminimo",
    "estmin",
    "minimo",
    "qtdminima",
    "quantidademinima",
    "alertaestoque",
  ];

  const supplierAliases = [
    "fornecedor",
    "fabricante",
    "marca",
    "distribuidor",
    "loja",
    "referenciafornecedor",
  ];

  const dateAliases = [
    "datadacotacao",
    "datacotacao",
    "data",
    "datadecotacao",
    "atualizadoem",
    "dataatualizacao",
  ];

  const codeAliases = [
    "codigo",
    "cod",
    "codproduto",
    "codigoproduto",
    "referencia",
    "ref",
    "sku",
    "partnumber",
    "barcode",
    "codigobarras",
  ];

  for (const row of rawRows) {
    // Normaliza mapa de chaves
    const normRow: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      normRow[normalizeHeaderKey(k)] = v;
    }

    // Identifica valores pelas chaves normalizadas
    const rawId = normRow["id"] || "";
    const name = (
      normRow["produto"] ||
      normRow["nome"] ||
      normRow["nomedescricao"] ||
      normRow["descricao"] ||
      ""
    ).toString().trim();

    // Ignora linhas sem nome ou que sejam instruções de rodapé
    if (!name || name.startsWith("•") || name.toUpperCase().includes("COMO EDITAR")) {
      continue;
    }

    const groupKey = rawId ? `ID_${rawId}` : `NAME_${name.toLowerCase()}`;
    const unit = (normRow["unidade"] || normRow["un"] || "un").toString().trim().toLowerCase();
    const category = (normRow["categoria"] || normRow["grupo"] || "").toString().trim();
    const code = (findValueByAliases(normRow, codeAliases) || "").toString().trim();

    const rawMargin = findValueByAliases(normRow, marginAliases);
    const parsedMargin = parseCurrencyOrNumber(rawMargin);
    const marginPercent = parsedMargin !== null && !isNaN(parsedMargin) ? parsedMargin : 30;

    const rawCost = findValueByAliases(normRow, costAliases);
    const costPrice = parseCurrencyOrNumber(rawCost) ?? 0;

    const rawFixed = findValueByAliases(normRow, saleAliases);
    const fixedSalePrice = parseCurrencyOrNumber(rawFixed);

    const currentStock = parseCurrencyOrNumber(findValueByAliases(normRow, currentStockAliases)) ?? 0;
    const minStock = parseCurrencyOrNumber(findValueByAliases(normRow, minStockAliases)) ?? 0;

    const notes = (normRow["observacoes"] || normRow["obs"] || normRow["notes"] || "").toString().trim();
    const supplier = (findValueByAliases(normRow, supplierAliases) || "").toString().trim();
    const quotationDate = parseQuotationDate(findValueByAliases(normRow, dateAliases));

    const rawUsar = (findValueByAliases(normRow, ["usarx", "usar", "principal", "padrao", "ativo"]) || "").toString().trim().toLowerCase();
    const isUsed = rawUsar === "x" || rawUsar === "true" || rawUsar === "1" || rawUsar === "sim" || rawUsar === "s";

    if (!map.has(groupKey)) {
      const initialUnitCost = costPrice > 0 ? costPrice : (fixedSalePrice && fixedSalePrice > 0 ? fixedSalePrice : null);
      const initialSalePrice = fixedSalePrice && fixedSalePrice > 0
        ? fixedSalePrice
        : (costPrice > 0 ? Number((costPrice * (1 + marginPercent / 100)).toFixed(2)) : null);

      map.set(groupKey, {
        sheetId: rawId && !isNaN(Number(rawId)) ? parseInt(String(rawId), 10) : undefined,
        name,
        unit: unit || "un",
        category: category || undefined,
        code: code || undefined,
        minStock,
        currentStock,
        marginPercent,
        fixedSalePrice: fixedSalePrice && fixedSalePrice > 0 ? fixedSalePrice : null,
        unitCost: initialUnitCost,
        salePrice: initialSalePrice,
        notes: notes || undefined,
        supplierQuotations: [] as any[],
      });
    }

    const prod = map.get(groupKey);

    if (supplier || costPrice > 0) {
      prod.supplierQuotations.push({
        supplier: supplier || "Referência mercado",
        costPrice: costPrice > 0 ? costPrice : 0,
        quotationDate,
        isUsed: isUsed || prod.supplierQuotations.length === 0,
      });
    }

    // Se encontramos um custo válido nessa linha e o produto ainda não tinha unitCost
    if (costPrice > 0) {
      if (!prod.unitCost || isUsed) {
        prod.unitCost = costPrice;
        if (!prod.fixedSalePrice) {
          prod.salePrice = Number((costPrice * (1 + prod.marginPercent / 100)).toFixed(2));
        }
      }
    }

    // Se encontramos um preço de venda fixo nessa linha
    if (fixedSalePrice && fixedSalePrice > 0) {
      prod.fixedSalePrice = fixedSalePrice;
      prod.salePrice = fixedSalePrice;
      if (!prod.unitCost) {
        prod.unitCost = Number((fixedSalePrice / (1 + prod.marginPercent / 100)).toFixed(2));
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Exporta os produtos para planilha Excel (.xlsx) fidedigna com as 13 colunas
 */
export function exportProductsToExcel(products: Product[], filename = "almoxarifado_estoque_setgen.xlsx") {
  const rows: SheetRow[] = [];

  for (const p of products) {
    const quotations = p.supplierQuotations || [];
    const baseSale = p.salePrice ? Number(p.salePrice) : undefined;

    if (quotations.length > 0) {
      quotations.forEach((q, idx) => {
        rows.push({
          ID: p.sheetId || p.code || p.id.slice(0, 8),
          Produto: p.name,
          Unidade: p.unit,
          Categoria: p.category || "",
          Código: p.code || "",
          "Margem % (vazio = padrão)": p.marginPercent ?? 30,
          "Venda fixa (R$)": p.fixedSalePrice ? Number(p.fixedSalePrice) : "",
          Fornecedor: q.supplier || "",
          "Preço de custo (R$)": q.costPrice !== undefined ? Number(q.costPrice) : "",
          "Data da cotação": q.quotationDate ? String(q.quotationDate).split("T")[0] : "",
          "Usar (x)": q.isUsed ? "x" : "",
          Observações: idx === 0 ? p.notes || "" : "",
          "Venda atual (só consulta)": baseSale ?? "",
        });
      });
    } else {
      // Produto sem cotações explícitas
      rows.push({
        ID: p.sheetId || p.code || p.id.slice(0, 8),
        Produto: p.name,
        Unidade: p.unit,
        Categoria: p.category || "",
        Código: p.code || "",
        "Margem % (vazio = padrão)": p.marginPercent ?? 30,
        "Venda fixa (R$)": p.fixedSalePrice ? Number(p.fixedSalePrice) : "",
        Fornecedor: "Referência mercado Manaus",
        "Preço de custo (R$)": p.unitCost ? Number(p.unitCost) : "",
        "Data da cotação": p.updatedAt ? String(p.updatedAt).split("T")[0] : "",
        "Usar (x)": "x",
        Observações: p.notes || "",
        "Venda atual (só consulta)": baseSale ?? "",
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Almoxarifado");

  // Download do arquivo
  XLSX.writeFile(workbook, filename);
}
