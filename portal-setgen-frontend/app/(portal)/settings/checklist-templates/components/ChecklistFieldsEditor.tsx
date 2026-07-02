"use client"

import { Plus, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { ChecklistFieldDefinition, ChecklistFieldType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const fieldTypeLabels: Record<ChecklistFieldType, string> = {
  [ChecklistFieldType.TEXT]: "Texto",
  [ChecklistFieldType.NUMBER]: "Número",
  [ChecklistFieldType.PHOTO]: "Foto",
  [ChecklistFieldType.SIGNATURE]: "Assinatura",
  [ChecklistFieldType.BOOLEAN]: "Sim/Não",
  [ChecklistFieldType.MULTIPLE_CHOICE]: "Múltipla Escolha",
};

interface ChecklistFieldsEditorProps {
  value: ChecklistFieldDefinition[];
  onChange: (fields: ChecklistFieldDefinition[]) => void;
}

export function ChecklistFieldsEditor({ value, onChange }: ChecklistFieldsEditorProps) {
  const updateField = (index: number, patch: Partial<ChecklistFieldDefinition>) => {
    const next = [...value];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addField = () => {
    onChange([
      ...value,
      { id: crypto.randomUUID(), type: ChecklistFieldType.TEXT, label: "", required: false },
    ]);
  };

  const removeField = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const updateOption = (fieldIndex: number, optionIndex: number, text: string) => {
    const options = [...(value[fieldIndex].options || [])];
    options[optionIndex] = text;
    updateField(fieldIndex, { options });
  };

  const addOption = (fieldIndex: number) => {
    updateField(fieldIndex, { options: [...(value[fieldIndex].options || []), ""] });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    updateField(fieldIndex, {
      options: (value[fieldIndex].options || []).filter((_, i) => i !== optionIndex),
    });
  };

  return (
    <div className="space-y-4">
      {value.map((field, index) => (
        <div key={field.id} className="p-5 rounded-2xl border bg-gray-50/50 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-1 pt-6">
              <button
                type="button"
                onClick={() => moveField(index, -1)}
                disabled={index === 0}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveField(index, 1)}
                disabled={index === value.length - 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-sm">Rótulo do Campo</Label>
                <Input
                  placeholder="Ex: Equipamento instalado corretamente?"
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  className="h-11 rounded-xl bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">Tipo</Label>
                <Select
                  value={field.type}
                  onValueChange={(v) => updateField(index, { type: v as ChecklistFieldType })}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ChecklistFieldType).map((t) => (
                      <SelectItem key={t} value={t}>{fieldTypeLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                />
                Obrigatório
              </label>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {field.type === ChecklistFieldType.MULTIPLE_CHOICE && (
            <div className="pl-10 space-y-2">
              <Label className="font-bold text-sm">Opções</Label>
              {(field.options || []).map((opt, optIndex) => (
                <div key={optIndex} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(index, optIndex, e.target.value)}
                    placeholder={`Opção ${optIndex + 1}`}
                    className="h-10 rounded-xl bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl shrink-0"
                    onClick={() => removeOption(index, optIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => addOption(index)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar opção
              </Button>
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="rounded-xl text-orange-600 border-orange-200 hover:bg-orange-50"
        onClick={addField}
      >
        <Plus className="h-4 w-4 mr-1" /> Adicionar campo
      </Button>
    </div>
  );
}
