"use client";

import React, { useRef, useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Layers,
  Sparkles,
  Search,
  ChevronRight,
  FolderPlus,
  Table as TableIcon,
  LayoutList,
  Check,
} from "lucide-react";
import { ChecklistFieldDefinition, ChecklistFieldType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  exportChecklistTemplateToExcel,
  importChecklistTemplateFromExcel,
  downloadBlankChecklistTemplateExcel,
} from "@/lib/checklist-template-sheet";
import { cn } from "@/lib/utils";

export const FIELD_TYPE_OPTIONS: { type: ChecklistFieldType; label: string; desc: string }[] = [
  {
    type: ChecklistFieldType.CHECKLIST_TRI_STATE,
    label: "Checklist (OK / NÃO / N/A)",
    desc: "Pílulas rápidas com filtro de pendências em caso de 'NÃO'",
  },
  {
    type: ChecklistFieldType.SINGLE_CHOICE,
    label: "Seleção única (Select)",
    desc: "Menu de opções pré-definidas para escolha única",
  },
  {
    type: ChecklistFieldType.MULTIPLE_CHOICE,
    label: "Seleção múltipla",
    desc: "Caixas de seleção para marcar uma ou mais opções",
  },
  {
    type: ChecklistFieldType.NUMBER,
    label: "Número com Unidade",
    desc: "Valor numérico com unidade (ex: kVA, V, A, %, bar)",
  },
  {
    type: ChecklistFieldType.TEXT,
    label: "Texto Livre",
    desc: "Campo de resposta aberta ou descrição técnica",
  },
  {
    type: ChecklistFieldType.DATE,
    label: "Data",
    desc: "Seletor de calendário (dd/mm/aaaa)",
  },
  {
    type: ChecklistFieldType.PHOTO,
    label: "Evidência Fotográfica",
    desc: "Solicita upload de imagem ou foto da câmera",
  },
  {
    type: ChecklistFieldType.SIGNATURE,
    label: "Assinatura Digital",
    desc: "Assinatura canvas com touch / mouse",
  },
  {
    type: ChecklistFieldType.CALCULATED,
    label: "Calculado / Fórmula",
    desc: "Cálculo dinâmico baseado em outros campos",
  },
];

interface ChecklistFieldsEditorProps {
  value: ChecklistFieldDefinition[];
  onChange: (fields: ChecklistFieldDefinition[]) => void;
  templateName?: string;
}

export function ChecklistFieldsEditor({
  value,
  onChange,
  templateName = "Checklist_Personalizado",
}: ChecklistFieldsEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"sections" | "table">("sections");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [newSectionName, setNewSectionName] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);

  // Agrupamento por seção
  const groupedSections = useMemo(() => {
    const map = new Map<string, ChecklistFieldDefinition[]>();

    value.forEach((field) => {
      const sec = field.section?.trim() || "1. Geral";
      if (!map.has(sec)) {
        map.set(sec, []);
      }
      map.get(sec)!.push(field);
    });

    return Array.from(map.entries()).map(([sectionName, fields]) => ({
      sectionName,
      fields,
    }));
  }, [value]);

  // Seções únicas
  const sectionNames = useMemo(() => {
    return groupedSections.map((g) => g.sectionName);
  }, [groupedSections]);

  // Contadores de campos obrigatórios vs opcionais
  const requiredCount = useMemo(() => value.filter((f) => f.required).length, [value]);
  const optionalCount = useMemo(() => value.filter((f) => !f.required).length, [value]);

  // Atualizar campo por ID
  const updateFieldById = (id: string, patch: Partial<ChecklistFieldDefinition>) => {
    onChange(value.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  // Remover campo por ID
  const removeFieldById = (id: string) => {
    onChange(value.filter((f) => f.id !== id));
  };

  // Mover campo na lista global
  const moveFieldById = (id: string, direction: -1 | 1) => {
    const idx = value.findIndex((f) => f.id === id);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= value.length) return;
    const next = [...value];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    onChange(next);
  };

  // Adicionar campo em uma seção específica
  const addFieldToSection = (sectionName?: string) => {
    const targetSection =
      sectionName ||
      (sectionNames.length > 0 ? sectionNames[sectionNames.length - 1] : "1. Geral");
    const newField: ChecklistFieldDefinition = {
      id: crypto.randomUUID(),
      section: targetSection,
      label: "",
      type: ChecklistFieldType.CHECKLIST_TRI_STATE,
      required: false,
      appliesTo: "Todos",
    };
    onChange([...value, newField]);

    // Assegura que a seção fique expandida para o usuário ver
    setExpandedSections((prev) => ({ ...prev, [targetSection]: true }));
  };

  // Adicionar nova seção
  const handleAddNewSection = () => {
    if (!newSectionName.trim()) return;
    addFieldToSection(newSectionName.trim());
    setNewSectionName("");
    setShowAddSection(false);
  };

  // Alternar colapso de uma seção
  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: prev[sectionName] === undefined ? false : !prev[sectionName],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    sectionNames.forEach((s) => (all[s] = true));
    setExpandedSections(all);
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    sectionNames.forEach((s) => (all[s] = false));
    setExpandedSections(all);
  };

  // Opções de selects
  const addOptionToField = (fieldId: string) => {
    const field = value.find((f) => f.id === fieldId);
    if (!field) return;
    updateFieldById(fieldId, {
      options: [...(field.options || []), ""],
    });
  };

  const updateOptionOfField = (fieldId: string, optIdx: number, text: string) => {
    const field = value.find((f) => f.id === fieldId);
    if (!field) return;
    const nextOpts = [...(field.options || [])];
    nextOpts[optIdx] = text;
    updateFieldById(fieldId, { options: nextOpts });
  };

  const removeOptionOfField = (fieldId: string, optIdx: number) => {
    const field = value.find((f) => f.id === fieldId);
    if (!field) return;
    updateFieldById(fieldId, {
      options: (field.options || []).filter((_, i) => i !== optIdx),
    });
  };

  // Importar planilha
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await importChecklistTemplateFromExcel(file);
      if (value.length > 0) {
        const replace = window.confirm(
          `Foram detectados ${result.fields.length} itens na planilha em ${result.detectedSections.length} seções.\n\nDeseja SUBSTITUIR os campos atuais (OK) ou ADICIONAR ao final (Cancelar)?`
        );
        if (replace) {
          onChange(result.fields);
        } else {
          onChange([...value, ...result.fields]);
        }
      } else {
        onChange(result.fields);
      }
      alert(`Importação concluída com sucesso! ${result.fields.length} campos carregados.`);
    } catch (err: any) {
      alert(`Erro ao importar planilha: ${err?.message || "Arquivo inválido"}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    if (value.length === 0) {
      alert("Adicione ao menos um campo antes de exportar.");
      return;
    }
    exportChecklistTemplateToExcel(templateName, value);
  };

  // Filtro de busca
  const filteredValue = useMemo(() => {
    if (!search.trim()) return value;
    const term = search.toLowerCase();
    return value.filter(
      (f) =>
        f.label.toLowerCase().includes(term) ||
        (f.section || "").toLowerCase().includes(term) ||
        (f.unit || "").toLowerCase().includes(term)
    );
  }, [value, search]);

  return (
    <div className="space-y-4">
      {/* Barra de Ações Híbridas (Site & Planilha) */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E2661D]"></span>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900">
              Configuração e Importação de Campos
            </h4>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Cadastre os itens pelo editor visual ou importe uma planilha estruturada (.xlsx / .csv)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="bg-gray-900 hover:bg-black text-white font-medium text-xs h-8 gap-1.5 shadow-2xs rounded-lg"
          >
            <Upload className="h-3.5 w-3.5" />
            {importing ? "Importando..." : "Importar Planilha"}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-white font-medium text-xs h-8 gap-1.5 rounded-lg"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            Exportar (.xlsx)
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={downloadBlankChecklistTemplateExcel}
            variant="ghost"
            className="text-gray-500 hover:text-gray-900 font-medium text-xs h-8 gap-1.5 rounded-lg"
          >
            <Download className="h-3.5 w-3.5" />
            Modelo em Branco
          </Button>
        </div>
      </div>

      {/* Barra de Controle de Visualização, Filtros e Ações */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        {/* Linha Superior: Controles de Exibição à esquerda e Botões de Ação à direita */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Lado Esquerdo: Modo de Exibição e Expansão */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-gray-100 p-0.5 rounded-lg flex items-center border border-gray-200/60">
              <button
                type="button"
                onClick={() => setViewMode("sections")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "sections"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <LayoutList className="h-3.5 w-3.5 text-[#E2661D]" />
                Por Seções
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Tabela Contínua
              </button>
            </div>

            {viewMode === "sections" && (
              <div className="flex items-center gap-1 text-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={expandAll}
                  className="h-7 text-[11px] font-medium text-gray-500 hover:text-gray-900 px-2"
                >
                  Expandir Tudo
                </Button>
                <span className="text-gray-300">|</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={collapseAll}
                  className="h-7 text-[11px] font-medium text-gray-500 hover:text-gray-900 px-2"
                >
                  Recolher Tudo
                </Button>
              </div>
            )}
          </div>

          {/* Lado Direito: Ações Principais (Nova Seção + Adicionar Pergunta) */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowAddSection(!showAddSection)}
              variant="outline"
              className="h-8 text-xs font-semibold gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg flex-1 sm:flex-initial"
            >
              <FolderPlus className="h-3.5 w-3.5 text-[#E2661D]" />
              Nova Seção
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => addFieldToSection()}
              className="h-8 bg-[#E2661D] hover:bg-[#c95717] text-white font-semibold text-xs gap-1.5 shadow-2xs rounded-lg flex-1 sm:flex-initial transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Pergunta
            </Button>
          </div>
        </div>

        {/* Linha Inferior: Campo de Busca com Largura Total */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar pergunta ou seção pelo nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus-visible:ring-[#E2661D]/20 w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Modal / Caixa para criar nova seção */}
      {showAddSection && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 shadow-2xs">
          <Input
            placeholder="Nome da nova seção (Ex: 5. Local de Instalação e QTA)"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            className="h-8 text-xs bg-white rounded-lg flex-1 border-gray-200"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddNewSection}
            className="bg-gray-900 hover:bg-black text-white font-semibold text-xs h-8 rounded-lg shadow-2xs"
          >
            Criar Seção
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowAddSection(false)}
            className="text-gray-500 hover:text-gray-800 text-xs h-8"
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* CONTAINER DE SEÇÕES E CAMPOS (Sem corte de altura) */}
      <div className="space-y-4">
        {value.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-white space-y-3">
            <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto" />
            <h4 className="font-bold text-sm text-gray-900">Nenhum campo cadastrado</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Clique em <strong>"Importar Planilha"</strong> para carregar um modelo pronto ou adicione perguntas manualmente.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => addFieldToSection()}
                className="bg-[#E2661D] hover:bg-[#c95717] text-white font-semibold text-xs h-8 gap-1.5 shadow-2xs rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Pergunta
              </Button>
            </div>
          </div>
        ) : viewMode === "table" ? (
          /* MODO TABELA COMPACTA (Estilo Planilha) */
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 w-44">Seção</th>
                  <th className="p-2.5">Pergunta / Item</th>
                  <th className="p-2.5 w-40">Tipo</th>
                  <th className="p-2.5 w-24">Unidade</th>
                  <th className="p-2.5 w-20 text-center">Obrig.</th>
                  <th className="p-2.5 w-16 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredValue.map((field, idx) => (
                  <tr key={field.id} className="hover:bg-slate-50/80">
                    <td className="p-2 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="p-2">
                      <Input
                        value={field.section || ""}
                        onChange={(e) => updateFieldById(field.id, { section: e.target.value })}
                        className="h-7 text-xs rounded border-slate-200"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={field.label}
                        onChange={(e) => updateFieldById(field.id, { label: e.target.value })}
                        className="h-7 text-xs rounded border-slate-200 font-medium"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={field.type}
                        onChange={(e) => updateFieldById(field.id, { type: e.target.value as ChecklistFieldType })}
                        className="h-7 text-xs rounded border border-slate-200 px-1.5 w-full bg-white font-medium"
                      >
                        {FIELD_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.type} value={opt.type}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <Input
                        placeholder="kVA, V..."
                        value={field.unit || ""}
                        onChange={(e) => updateFieldById(field.id, { unit: e.target.value })}
                        className="h-7 text-xs rounded border-slate-200"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => updateFieldById(field.id, { required: !field.required })}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border inline-flex items-center gap-1 shadow-2xs",
                          field.required
                            ? "bg-orange-50 text-[#E2661D] border-orange-300 hover:bg-orange-100"
                            : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600"
                        )}
                        title={field.required ? "Marcado como Obrigatório (clique para alternar)" : "Marcado como Opcional (clique para alternar)"}
                      >
                        {field.required ? (
                          <>
                            <Sparkles className="w-2.5 h-2.5" /> Sim *
                          </>
                        ) : (
                          "Opcional"
                        )}
                      </button>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeFieldById(field.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* MODO ACORDEÃO POR SEÇÕES (Colapsável para eliminar scroll infinito) */
          groupedSections.map(({ sectionName, fields }) => {
            const isExpanded = expandedSections[sectionName] !== false; // expandido por padrão na 1ª visualização se não configurado
            const filteredFields = search.trim()
              ? fields.filter((f) => f.label.toLowerCase().includes(search.toLowerCase()))
              : fields;

            if (search.trim() && filteredFields.length === 0) return null;

            return (
              <div
                key={sectionName}
                className="bg-white border border-gray-200 rounded-xl shadow-2xs transition-all"
              >
                {/* Cabeçalho Colapsável da Seção */}
                <div
                  onClick={() => toggleSection(sectionName)}
                  className="flex items-center justify-between gap-2 px-3.5 py-3 bg-gray-50 hover:bg-gray-100/70 cursor-pointer border-b border-gray-200 select-none transition-colors rounded-t-xl"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ChevronRight
                      className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                    <strong className="text-xs font-semibold uppercase tracking-wider text-gray-900 truncate">
                      {sectionName}
                    </strong>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200/70 text-gray-700 shrink-0">
                      {fields.length} {fields.length === 1 ? "item" : "itens"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => addFieldToSection(sectionName)}
                      className="h-7 text-xs font-medium text-[#E2661D] hover:bg-orange-50 gap-1 px-2.5 rounded-lg"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar Pergunta
                    </Button>
                  </div>
                </div>

                {/* Conteúdo da Seção */}
                {isExpanded && (
                  <div className="p-3.5 space-y-3 bg-gray-50/30">
                    {filteredFields.map((field, fieldIdx) => {
                      const typeObj = FIELD_TYPE_OPTIONS.find((t) => t.type === field.type);

                      return (
                        <div
                          key={field.id}
                          className={cn(
                            "p-4 rounded-xl border bg-white transition-all space-y-3 shadow-2xs",
                            field.required
                              ? "border-l-4 border-l-[#E2661D] border-gray-200"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          {/* Topo do Card: Número do Item + Status de Exigência + Botões de Ação */}
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-700 font-mono text-[11px] font-bold flex items-center justify-center">
                                {fieldIdx + 1}
                              </span>
                              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                Item do Checklist
                              </span>
                              {field.required ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E2661D] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 shadow-2xs">
                                  <Sparkles className="w-2.5 h-2.5 text-[#E2661D]" />
                                  Obrigatório
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  Opcional
                                </span>
                              )}
                            </div>

                            {/* Botões Mover e Remover no Topo (Dentro do Card) */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveFieldById(field.id, -1)}
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                title="Mover para cima"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveFieldById(field.id, 1)}
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                title="Mover para baixo"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFieldById(field.id)}
                                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                                title="Excluir pergunta"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Inputs: Pergunta e Tipo de Resposta ocupam 100% da largura */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            {/* Rótulo da Pergunta */}
                            <div className="sm:col-span-7 space-y-1">
                              <Label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Pergunta / Item *
                              </Label>
                              <Input
                                placeholder="Digite a pergunta ou verificação técnica..."
                                value={field.label}
                                onChange={(e) =>
                                  updateFieldById(field.id, { label: e.target.value })
                                }
                                className="h-9 text-xs rounded-lg font-medium bg-white border-gray-200 w-full"
                              />
                            </div>

                            {/* Tipo de Campo */}
                            <div className="sm:col-span-5 space-y-1">
                              <Label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Tipo de Resposta
                              </Label>
                              <Select
                                value={field.type}
                                onValueChange={(val) =>
                                  updateFieldById(field.id, {
                                    type: val as ChecklistFieldType,
                                  })
                                }
                              >
                                <SelectTrigger className="h-9 text-xs rounded-lg bg-white border-gray-200 w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-50 max-h-72">
                                  {FIELD_TYPE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.type} value={opt.type} className="text-xs">
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Configurações Adicionais da Pergunta */}
                          <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-gray-100">
                            {/* Unidade (se número) */}
                            {field.type === ChecklistFieldType.NUMBER && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                  Unidade:
                                </span>
                                <Input
                                  placeholder="kVA, V, %"
                                  value={field.unit || ""}
                                  onChange={(e) =>
                                    updateFieldById(field.id, { unit: e.target.value })
                                  }
                                  className="h-6 w-20 text-xs bg-white rounded-md border-gray-200"
                                />
                              </div>
                            )}

                            {/* Aplica a */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                Aplica a:
                              </span>
                              <Input
                                placeholder="Todos"
                                value={field.appliesTo || ""}
                                onChange={(e) =>
                                  updateFieldById(field.id, { appliesTo: e.target.value })
                                }
                                className="h-6 w-24 text-xs bg-white rounded-md border-gray-200"
                              />
                            </div>

                            {/* Seletor Segmentado Diferenciado: Obrigatório vs Opcional */}
                            <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-lg border border-gray-200">
                              <button
                                type="button"
                                onClick={() => updateFieldById(field.id, { required: false })}
                                className={cn(
                                  "px-2.5 py-1 rounded-md text-[11px] transition-all",
                                  !field.required
                                    ? "bg-white text-gray-800 shadow-2xs font-bold"
                                    : "text-gray-500 hover:text-gray-800 font-medium"
                                )}
                              >
                                Opcional
                              </button>
                              <button
                                type="button"
                                onClick={() => updateFieldById(field.id, { required: true })}
                                className={cn(
                                  "px-2.5 py-1 rounded-md text-[11px] transition-all flex items-center gap-1",
                                  field.required
                                    ? "bg-[#E2661D] text-white shadow-2xs font-bold"
                                    : "text-gray-500 hover:text-[#E2661D] font-medium"
                                )}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                Obrigatório *
                              </button>
                            </div>

                            {typeObj && (
                              <span className="text-[10px] text-gray-400">
                                • {typeObj.desc}
                              </span>
                            )}
                          </div>

                          {/* Editor de Opções para Selects */}
                          {(field.type === ChecklistFieldType.SINGLE_CHOICE ||
                            field.type === ChecklistFieldType.MULTIPLE_CHOICE) && (
                            <div className="pt-2 border-t border-gray-100 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                  Alternativas do Seletor:
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addOptionToField(field.id)}
                                  className="h-6 text-[11px] font-medium text-[#E2661D] hover:bg-orange-50 gap-1 px-2 rounded"
                                >
                                  <Plus className="h-3 w-3" />
                                  Adicionar Alternativa
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {field.options && field.options.length > 0 ? (
                                  field.options.map((option, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg pl-2.5 pr-1 py-1 text-xs shadow-2xs"
                                    >
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) =>
                                          updateOptionOfField(field.id, optIdx, e.target.value)
                                        }
                                        placeholder={`Opção ${optIdx + 1}`}
                                        className="text-xs bg-transparent focus:outline-none min-w-[130px] font-medium"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeOptionOfField(field.id, optIdx)}
                                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">
                                    Nenhuma opção cadastrada. Clique em "Adicionar Alternativa".
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Botão no rodapé da seção para adicionar nova pergunta */}
                    <div className="pt-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addFieldToSection(sectionName)}
                        className="w-full h-8 text-xs font-medium text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 hover:border-gray-400 hover:bg-white gap-1.5 rounded-lg transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#E2661D]" />
                        Adicionar nova pergunta nesta seção
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Rodapé de Ações Rápidas */}
        {value.length > 0 && viewMode === "sections" && (
          <div className="pt-3 pb-1 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAddSection(true)}
              className="h-8 text-xs font-semibold gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <FolderPlus className="h-3.5 w-3.5 text-[#E2661D]" />
              Nova Seção
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => addFieldToSection()}
              className="h-8 bg-gray-900 hover:bg-black text-white font-semibold text-xs gap-1.5 shadow-2xs rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Pergunta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
