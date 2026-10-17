"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { equipmentApi } from "@/lib/api/equipment";
import { Equipment, EquipmentType } from "@/types";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Zap, Box, Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { TablePagination } from "@/components/ui/pagination";
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
import { ImportExportDropdown } from "@/components/ui/import-export-dropdown";

const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.GENERATOR]: "Gerador",
  [EquipmentType.SUBSTATION]: "Subestação",
  [EquipmentType.OTHER]: "Outro",
};

export default function EquipmentPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
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

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return equipments.filter((eq) => {
      return (
        eq.brand?.toLowerCase().includes(term) ||
        eq.model?.toLowerCase().includes(term) ||
        eq.serialNumber?.toLowerCase().includes(term) ||
        eq.client?.companyName?.toLowerCase().includes(term)
      );
    });
  }, [equipments, searchTerm]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedEquipments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalGenerators = equipments.filter(e => e.type === EquipmentType.GENERATOR).length;
  const totalSubstations = equipments.filter(e => e.type === EquipmentType.SUBSTATION).length;
  const totalOther = equipments.filter(e => e.type === EquipmentType.OTHER).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E2661D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Equipamentos"
        subtitle={`${filtered.length} geradores e equipamentos industriais monitorados`}
        actions={
          <div className="flex items-center gap-2">
            <ImportExportDropdown
              title="Equipamentos"
              entityName="Equipamentos"
              data={filtered.map((e) => ({
                "Nome": e.name || "",
                "Descrição / Modelo": e.model || e.notes || "",
                "Identificador": e.identifier || "",
                "Cliente": e.client ? (e.client.tradeName || e.client.companyName) : "Setgen Interno",
                "Tipo": EQUIPMENT_TYPE_LABELS[e.type] || "Outro",
                "Categoria": e.category || "",
                "Status": e.active ? "Ativo" : "Inativo",
              }))}
              exportFilename="equipamentos_setgen"
              templateColumns={[
                "Nome",
                "Descrição",
                "Identificador",
                "Cliente",
                "Categoria",
                "Status",
                "Início da garantia",
                "Fim da garantia"
              ]}
              templateSampleRow={{
                "Nome": "01. GERCUM01",
                "Descrição": "CUMMINS NTG6 / GERADOR: WEG 300KVA",
                "Identificador": "EQP-001",
                "Cliente": "SUPER TERMINAIS / CNPJ: 04.335.535/0002-55",
                "Categoria": "GERADOR",
                "Status": "Ativo",
                "Início da garantia": "01/01/2026",
                "Fim da garantia": "01/01/2027"
              }}
              onImport={equipmentApi.bulkImport}
              onSuccess={loadEquipments}
            />
            <Button
              onClick={() => router.push("/equipment/new")}
              className="rounded-[9px] font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white"
            >
              <Plus className="h-4 w-4" />
              Novo Equipamento
            </Button>
          </div>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
        <StatusCard label="Total de Equipamentos" value={equipments.length} icon={Zap} variant="orange" />
        <StatusCard label="Grupos Geradores" value={totalGenerators} icon={Zap} variant="amber" />
        <StatusCard label="Subestações / QTA" value={totalSubstations} icon={Building2} variant="blue" />
        <StatusCard label="Outros / Especiais" value={totalOther} icon={Box} variant="slate" />
      </div>

      <Card className="overflow-hidden border border-gray-200/75 shadow-2xs">
        <div className="flex items-center justify-between gap-2.5 px-4 py-3 border-b border-border">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo, série, cliente..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#E2661D]/30"
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
              paginatedEquipments.map((eq) => (
                <TableRow
                  key={eq.id}
                  className="cursor-pointer hover:bg-gray-50/50"
                  onClick={() => router.push(`/equipment/${eq.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 bg-orange-50 text-[#E2661D] font-bold">
                        {eq.type === EquipmentType.GENERATOR ? <Zap className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-foreground truncate">{eq.brand || "Sem marca"} {eq.model}</div>
                        {eq.serialNumber && (
                          <div className="text-[11.5px] font-mono text-muted-foreground truncate">SN: {eq.serialNumber}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">{EQUIPMENT_TYPE_LABELS[eq.type]}</TableCell>
                  <TableCell className="text-[12.5px] text-foreground font-medium">{eq.client?.companyName || "—"}</TableCell>
                  <TableCell className="text-[12.5px] font-semibold text-orange-600">{eq.powerRating || "—"}</TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">{eq.installLocation || "—"}</TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">{formatDate(eq.createdAt)}</TableCell>
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

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          itemLabel="equipamentos"
        />
      </Card>
    </div>
  );
}
