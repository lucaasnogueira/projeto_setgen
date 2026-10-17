"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Upload,
  Download,
  FileDown,
  ChevronDown,
} from "lucide-react";
import { ImportModal } from "@/components/ui/import-modal";
import { toast } from "sonner";

export interface ImportExportDropdownProps {
  title: string;
  entityName: string;
  data: any[];
  exportFilename?: string;
  templateColumns: string[];
  templateSampleRow?: Record<string, any>;
  onImport: (items: any[]) => Promise<{
    total: number;
    created?: number;
    updated?: number;
    skipped?: number;
    errors?: string[];
    count?: number;
  }>;
  onSuccess: () => void;
  className?: string;
}

export function ImportExportDropdown({
  title,
  entityName,
  data,
  exportFilename = "exportacao",
  templateColumns,
  templateSampleRow,
  onImport,
  onSuccess,
  className,
}: ImportExportDropdownProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // 1. Exportar listagem atual para Excel
  const handleExportData = () => {
    try {
      if (!data || data.length === 0) {
        toast.warning("Não há registros para exportar no momento.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, entityName.slice(0, 31));

      const filename = `${exportFilename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`${data.length} registros exportados em ${filename}`);
    } catch (err: any) {
      console.error("Erro ao exportar:", err);
      toast.error("Erro ao gerar arquivo Excel: " + (err.message || "Erro desconhecido"));
    }
  };

  // 2. Baixar modelo em branco com as colunas certas
  const handleDownloadTemplate = () => {
    try {
      const templateData = templateSampleRow ? [templateSampleRow] : [{}];
      const worksheet = XLSX.utils.json_to_sheet(templateData, {
        header: templateColumns,
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo_Importacao");

      const filename = `modelo_importacao_${exportFilename}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Modelo baixado: ${filename}`);
    } catch (err: any) {
      console.error("Erro ao gerar modelo:", err);
      toast.error("Erro ao baixar modelo.");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-9 px-2.5 sm:px-3 text-xs gap-1.5 rounded-[9px] border-slate-200 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 shadow-2xs font-medium transition-all ${className || ""}`}
            title="Importar ou exportar planilhas"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#E2661D]" />
            <span className="hidden sm:inline">Importar / Exportar</span>
            <span className="sm:hidden">Planilhas</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl p-1 shadow-lg border-slate-200 text-xs">
          <DropdownMenuLabel className="text-[11px] font-semibold text-slate-400 px-2.5 py-1">
            Opções de Planilha ({title})
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-2 cursor-pointer rounded-lg hover:bg-orange-50 hover:text-[#E2661D] font-medium"
          >
            <Upload className="h-3.5 w-3.5 text-[#E2661D]" />
            <div className="flex flex-col">
              <span>Importar Planilha...</span>
              <span className="text-[10px] text-slate-400 font-normal">Suporta Auvo e Excel padrão</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 border-slate-100" />

          <DropdownMenuItem
            onClick={handleExportData}
            className="flex items-center gap-2 px-2.5 py-2 cursor-pointer rounded-lg hover:bg-slate-50 font-medium text-slate-700"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" />
            <div className="flex flex-col">
              <span>Exportar Listagem Atual</span>
              <span className="text-[10px] text-slate-400 font-normal">Gera .xlsx com filtros atuais</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-2.5 py-2 cursor-pointer rounded-lg hover:bg-slate-50 font-medium text-slate-700"
          >
            <FileDown className="h-3.5 w-3.5 text-emerald-600" />
            <div className="flex flex-col">
              <span>Baixar Modelo (.xlsx)</span>
              <span className="text-[10px] text-slate-400 font-normal">Planilha pronta para preencher</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Importar ${title}`}
        entityName={entityName}
        onImport={onImport}
        onSuccess={onSuccess}
      />
    </>
  );
}

