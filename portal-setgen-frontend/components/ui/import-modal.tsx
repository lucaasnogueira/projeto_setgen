"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityName: string;
  onImport: (items: any[]) => Promise<{
    total: number;
    created?: number;
    updated?: number;
    skipped?: number;
    errors?: string[];
    count?: number;
  }>;
  onSuccess: () => void;
}

export function ImportModal({
  isOpen,
  onClose,
  title,
  entityName,
  onImport,
  onSuccess,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState<string>("");
  const [isAuvoFormat, setIsAuvoFormat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setHeaders([]);
    setSheetName("");
    setIsAuvoFormat(false);
    setResult(null);
    setLoading(false);
    setProgress(0);
    setProgressText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileProcess = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      setResult(null);

      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      setSheetName(firstSheetName);

      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      if (!rawData || rawData.length === 0) {
        toast.error("A planilha selecionada está vazia.");
        return;
      }

      // Linha 0: Cabeçalhos
      const rawHeaders = (rawData[0] || []).map((h) => String(h).trim());
      setHeaders(rawHeaders.filter(Boolean));

      // Verificar se possui linha explicativa típica do Auvo (Linha 1)
      let dataStartIndex = 1;
      let auvoDetected = false;

      if (rawData.length > 1) {
        const row1Str = rawData[1].join(" ").toLowerCase();
        if (
          row1Str.includes("código do cliente") ||
          row1Str.includes("nome do equipamento") ||
          row1Str.includes("apenas para visualização") ||
          row1Str.includes("descrição do serviço") ||
          row1Str.includes("responsável pelo orçamento") ||
          row1Str.includes("no formato dia/mês/ano")
        ) {
          dataStartIndex = 2; // Pula linha descritiva
          auvoDetected = true;
        }
      }

      // Se qualquer cabeçalho contiver palavras típicas do Auvo
      const headerStr = rawHeaders.join(" ").toLowerCase();
      if (
        headerStr.includes("auvo") ||
        headerStr.includes("estoque empresa") ||
        headerStr.includes("cliente/lead") ||
        headerStr.includes("falar com")
      ) {
        auvoDetected = true;
      }
      setIsAuvoFormat(auvoDetected);

      // Converter linhas em objetos { header: value }
      const rows: any[] = [];
      for (let i = dataStartIndex; i < rawData.length; i++) {
        const rowArr = rawData[i];
        if (!rowArr || rowArr.every((c) => c === "" || c === null || c === undefined)) {
          continue;
        }
        const rowObj: Record<string, any> = {};
        rawHeaders.forEach((h, idx) => {
          if (h) {
            rowObj[h] = rowArr[idx] !== undefined ? rowArr[idx] : "";
          }
        });
        rows.push(rowObj);
      }

      setParsedRows(rows);
      toast.success(
        `${rows.length} registros identificados na planilha.${
          auvoDetected ? " (Formato Auvo reconhecido com sucesso)" : ""
        }`
      );
    } catch (err: any) {
      console.error("Erro ao ler planilha:", err);
      toast.error("Falha ao ler arquivo Excel/CSV: " + (err.message || "Formato inválido"));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setProgress(0);
    setProgressText(`Preparando importação de ${parsedRows.length} registros...`);

    const BATCH_SIZE = 40;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const accumulatedErrors: string[] = [];

    const totalRows = parsedRows.length;
    const totalBatches = Math.ceil(totalRows / BATCH_SIZE);

    try {
      for (let b = 0; b < totalBatches; b++) {
        const start = b * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, totalRows);
        const batch = parsedRows.slice(start, end);

        setProgressText(
          `Processando lote ${b + 1} de ${totalBatches} (registros ${start + 1} a ${end} de ${totalRows})...`
        );
        setProgress(Math.round((start / totalRows) * 100));

        try {
          const res = await onImport(batch);
          totalCreated += res.created ?? res.count ?? 0;
          totalUpdated += res.updated ?? 0;
          totalSkipped += res.skipped ?? 0;
          if (res.errors && res.errors.length > 0) {
            accumulatedErrors.push(...res.errors);
          }
        } catch (batchErr: any) {
          console.error(`Erro no lote ${b + 1}:`, batchErr);
          accumulatedErrors.push(
            `Falha no lote ${b + 1} (linhas ${start + 1}-${end}): ${batchErr.message || "Erro no envio do lote"}`
          );
        }

        setProgress(Math.round((end / totalRows) * 100));
      }

      setResult({
        total: totalRows,
        created: totalCreated,
        updated: totalUpdated,
        skipped: totalSkipped,
        errors: accumulatedErrors,
      });

      if (totalCreated > 0 || totalUpdated > 0) {
        toast.success(
          `Importação concluída! ${totalCreated} criados, ${totalUpdated} atualizados.`
        );
        onSuccess();
      } else if (accumulatedErrors.length > 0) {
        toast.error("Ocorreram erros durante a importação. Verifique o relatório.");
      } else {
        toast.info("Nenhum registro precisou ser alterado.");
      }
    } catch (err: any) {
      console.error("Erro na importação:", err);
      toast.error("Erro ao processar importação: " + (err.message || "Erro no servidor"));
    } finally {
      setLoading(false);
      setProgress(100);
      setProgressText("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-[#E2661D] rounded-lg">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Importação direta de planilhas Excel (.xlsx, .xls) ou CSV (Compatível com Auvo e modelos padrão).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Área de Upload */}
          {!file && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#E2661D] bg-slate-50 hover:bg-orange-50/30 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
                }}
              />
              <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200 text-[#E2661D] mb-3">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Clique para selecionar ou arraste o arquivo aqui
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Suporta planilhas exportadas do Auvo ou arquivos .xlsx/.csv
              </p>
            </div>
          )}

          {/* Arquivo Selecionado e Prévia */}
          {file && !result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      {file.name}
                      {isAuvoFormat && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                          Formato Auvo Detectado
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      Aba: <span className="font-medium text-slate-700">{sheetName}</span> •{" "}
                      {parsedRows.length} linhas de dados • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  disabled={loading}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Informação sobre mapeamento */}
              {isAuvoFormat && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Tratamento inteligente ativo:</span> A linha de instruções do Auvo foi omitida automaticamente, os números com vírgula e datas brasileiras foram normalizados e as filiais/documentos serão reconciliados sem bloqueios.
                  </div>
                </div>
              )}

              {/* Prévia das primeiras 3 linhas */}
              {parsedRows.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100/80 px-3 py-2 text-xs font-semibold text-slate-600 flex justify-between items-center">
                    <span>Prévia dos dados identificados (primeiras 3 linhas)</span>
                    <span className="text-[11px] text-slate-400">{headers.length} colunas</span>
                  </div>
                  <div className="overflow-x-auto max-h-48 text-[11px]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {headers.slice(0, 7).map((h, i) => (
                            <th key={i} className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                          {headers.length > 7 && (
                            <th className="text-left px-3 py-2 font-semibold text-slate-400 whitespace-nowrap">
                              +{headers.length - 7} mais
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.slice(0, 3).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {headers.slice(0, 7).map((h, cIdx) => (
                              <td key={cIdx} className="px-3 py-1.5 text-slate-700 whitespace-nowrap max-w-[180px] truncate">
                                {String(row[h] || "-")}
                              </td>
                            ))}
                            {headers.length > 7 && (
                              <td className="px-3 py-1.5 text-slate-400 whitespace-nowrap">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progresso de Envio dos Lotes */}
              {loading && (
                <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-orange-900">
                      <Loader2 className="h-4 w-4 animate-spin text-[#E2661D]" />
                      <span>{progressText || "Importando registros em lotes..."}</span>
                    </div>
                    <span className="font-bold text-[#E2661D]">{progress}%</span>
                  </div>
                  <div className="w-full bg-orange-200/60 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#E2661D] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Os dados estão sendo validados e gravados em blocos contínuos para evitar sobrecargas e garantir máxima estabilidade.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Resultado da Importação */}
          {result && (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Processamento Concluído com Sucesso!
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-slate-400 block">Total Lido</span>
                    <span className="font-bold text-slate-800 text-sm">{result.total}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-slate-400 block">Novos Criados</span>
                    <span className="font-bold text-emerald-600 text-sm">{result.created}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-slate-400 block">Atualizados</span>
                    <span className="font-bold text-blue-600 text-sm">{result.updated}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-slate-400 block">Ignorados</span>
                    <span className="font-bold text-slate-500 text-sm">{result.skipped}</span>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 max-h-36 overflow-y-auto text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Avisos durante a importação ({result.errors.length}):
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                    {result.errors.slice(0, 10).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>...e mais {result.errors.length - 10} avisos</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={loading} className="text-xs">
            {result ? "Fechar" : "Cancelar"}
          </Button>

          {!result ? (
            <Button
              size="sm"
              onClick={handleImportSubmit}
              disabled={parsedRows.length === 0 || loading}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-bold gap-2 px-4 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Importando {parsedRows.length} {entityName}...
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  Confirmar e Importar {parsedRows.length > 0 ? `(${parsedRows.length})` : ""}
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleClose}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

