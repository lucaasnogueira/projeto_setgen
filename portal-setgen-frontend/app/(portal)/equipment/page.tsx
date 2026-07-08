"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { equipmentApi } from "@/lib/api/equipment";
import { Equipment, EquipmentType } from "@/types";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Zap, Box } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InlineDeleteAction } from "@/components/ui/inline-delete-action";
import { useInlineDelete } from "@/lib/hooks/use-inline-delete";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";

const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.GENERATOR]: "Gerador",
  [EquipmentType.SUBSTATION]: "Subestação",
  [EquipmentType.OTHER]: "Outro",
};

export default function EquipmentPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => equipmentApi.delete(id),
    (id) => setEquipments((prev) => prev.filter((e) => e.id !== id))
  );

  useEffect(() => {
    loadEquipments();
  }, []);

  const loadEquipments = async () => {
    try {
      const data = await equipmentApi.getAll();
      setEquipments(data);
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = equipments.filter((eq) => {
    const term = searchTerm.toLowerCase();
    return (
      eq.brand?.toLowerCase().includes(term) ||
      eq.model?.toLowerCase().includes(term) ||
      eq.serialNumber?.toLowerCase().includes(term) ||
      eq.client?.companyName?.toLowerCase().includes(term)
    );
  });

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
        title="Equipamentos"
        subtitle={`${filtered.length} equipamentos cadastrados`}
        actions={
          <Button onClick={() => router.push("/equipment/new")} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Novo Equipamento
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Equipamento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Potência</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="w-[96px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty colSpan={7} message="Nenhum equipamento encontrado" />
            ) : (
              filtered.map((eq) => (
                <TableRow
                  key={eq.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/equipment/${eq.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 bg-orange-50 text-orange-700">
                        {eq.type === EquipmentType.GENERATOR ? <Zap className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-foreground truncate">{eq.brand || "Sem marca"} {eq.model}</div>
                        {eq.serialNumber && (
                          <div className="text-[11.5px] text-text-muted truncate">SN: {eq.serialNumber}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">{EQUIPMENT_TYPE_LABELS[eq.type]}</TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">{eq.client?.companyName || "-"}</TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">{eq.powerRating || "-"}</TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">{eq.installLocation || "-"}</TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">{formatDate(eq.createdAt)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <InlineDeleteAction
                      confirming={confirmId === eq.id}
                      deleting={deleting}
                      onView={() => router.push(`/equipment/${eq.id}`)}
                      onEdit={() => router.push(`/equipment/${eq.id}/edit`)}
                      onRequestDelete={() => requestDelete(eq.id)}
                      onConfirmDelete={() => confirmDelete(eq.id)}
                      onCancelDelete={cancelDelete}
                    />
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
