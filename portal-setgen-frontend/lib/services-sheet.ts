import * as XLSX from "xlsx";
import { ServiceItem } from "@/lib/api/services";

/**
 * Normaliza o nome da chave/coluna da planilha para identificação universal
 */
function normalizeHeaderKey(key: string): string {
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Lê arquivo (XLSX, XLS ou CSV) e retorna lista consolidada de serviços
 */
export async function parseExcelToServices(file: File): Promise<Partial<ServiceItem>[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    return parseCsvTextToServices(text);
  }

  // Arquivos binários Excel (.xlsx, .xls)
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  return groupSheetRowsToServices(rawRows);
}

/**
 * Parser nativo de CSV com suporte a vírgula, ponto-e-vírgula e aspas
 */
export function parseCsvTextToServices(csvText: string): Partial<ServiceItem>[] {
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
    if (rawLine.startsWith("•") || rawLine.toUpperCase().includes("COMO EDITAR")) continue;

    const values = parseLine(lines[i]);
    const rowObj: any = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] ?? "";
    });
    rows.push(rowObj);
  }

  return groupSheetRowsToServices(rows);
}

/**
 * Converte linhas genéricas de planilha no formato de serviços da Setgen
 */
export function groupSheetRowsToServices(rawRows: any[]): Partial<ServiceItem>[] {
  const result: Partial<ServiceItem>[] = [];
  const usedCodes = new Set<string>();

  rawRows.forEach((row, index) => {
    let title = "";
    let category = "Serviços Gerais";
    let unit = "sv";
    let price = 0;
    let observation = "";
    let externalCode = "";

    Object.keys(row).forEach((k) => {
      const norm = normalizeHeaderKey(k);
      const val = row[k];

      if (norm.includes("descricaodoservico") || norm === "servico" || norm === "titulo" || norm === "nome" || norm === "descricao") {
        title = String(val || "").trim();
      } else if (norm === "categoria" || norm === "grupodeservico") {
        category = String(val || "").trim() || category;
      } else if (norm === "unidade" || norm === "unid" || norm === "un") {
        unit = String(val || "").trim() || unit;
      } else if (norm.includes("valordereferencia") || norm.includes("valordereferenciar") || norm === "valor" || norm === "preco" || norm.includes("precovenda")) {
        let pStr = String(val || "").replace("R$", "").replace(/\s/g, "");
        if (pStr.includes(",") && pStr.includes(".")) {
          pStr = pStr.replace(/\./g, "").replace(",", ".");
        } else if (pStr.includes(",")) {
          pStr = pStr.replace(",", ".");
        }
        price = parseFloat(pStr) || 0;
      } else if (norm.includes("observacao") || norm.includes("observacoes") || norm === "obs") {
        observation = String(val || "").trim();
      } else if (norm === "id" || norm === "codigo" || norm === "code" || norm === "referencia") {
        externalCode = String(val || "").trim();
      }
    });

    if (!title) return;

    // Normaliza código e garante unicidade absoluta na importação
    let finalCode = "";
    if (externalCode && /^\d+$/.test(externalCode)) {
      finalCode = `SRV-${String(externalCode).padStart(3, "0")}`;
    } else if (externalCode) {
      finalCode = externalCode;
    }

    if (!finalCode || usedCodes.has(finalCode)) {
      let candidateNum = index + 1;
      finalCode = `SRV-${String(candidateNum).padStart(3, "0")}`;
      while (usedCodes.has(finalCode)) {
        candidateNum++;
        finalCode = `SRV-${String(candidateNum).padStart(3, "0")}`;
      }
    }

    usedCodes.add(finalCode);

    result.push({
      externalCode: finalCode,
      title,
      category,
      unit,
      price: isNaN(price) ? 0 : price,
      defaultObservation: observation,
      active: true,
    });
  });

  return result;
}

/**
 * Exporta catálogo de serviços para arquivo Excel (.xlsx) formatado
 */
export function exportServicesToExcel(services: ServiceItem[], filename = "catalogo_servicos_setgen.xlsx") {
  const rows = services.map((s, index) => ({
    "Código": s.externalCode || `SRV-${String(index + 1).padStart(3, "0")}`,
    "Descrição do Serviço": s.title,
    "Categoria": s.category || "Serviços Gerais",
    "Unidade": s.unit || "sv",
    "Valor de Referência (R$)": Number(s.price || 0),
    "Observações Técnicas": s.defaultObservation || "",
    "Status": s.active !== false ? "Ativo" : "Inativo",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Largura das colunas para visualização agradável
  worksheet["!cols"] = [
    { wch: 12 }, // Código
    { wch: 65 }, // Descrição do Serviço
    { wch: 30 }, // Categoria
    { wch: 10 }, // Unidade
    { wch: 22 }, // Valor de Referência (R$)
    { wch: 45 }, // Observações Técnicas
    { wch: 12 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Catálogo de Serviços");

  XLSX.writeFile(workbook, filename);
}

