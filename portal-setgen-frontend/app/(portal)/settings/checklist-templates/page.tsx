"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checklistTemplatesApi } from "@/lib/api/checklist-templates";
import { ChecklistTemplate, ServiceOrderType } from "@/types";
import { Plus, Edit, Trash2, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from "@/components/ui/table";

const typeLabels: Record<ServiceOrderType, string> = {
  [ServiceOrderType.VISIT_REPORT]: "Relatório de Visita",
  [ServiceOrderType.EXECUTION]: "Execução de Serviço",
};

export default function ChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await checklistTemplatesApi.getAll();
      setTemplates(data);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este template?")) return;
    try {
      await checklistTemplatesApi.delete(id);
      loadTemplates();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao excluir template");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates de Checklist"
        subtitle={`${templates.length} templates cadastrados`}
        actions={
          <Button onClick={() => router.push("/settings/checklist-templates/new")} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Novo Template
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Aplica-se a</TableHead>
              <TableHead>Campos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableEmpty colSpan={5} message="Nenhum template cadastrado" />
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-[9px] bg-orange-100 flex items-center justify-center shrink-0">
                        <ClipboardCheck className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="text-[13px] font-bold text-foreground">{template.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {template.serviceOrderType ? typeLabels[template.serviceOrderType] : "Qualquer tipo"}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {template.fields.length} campo(s)
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.active ? "default" : "secondary"}>
                      {template.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/settings/checklist-templates/${template.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
