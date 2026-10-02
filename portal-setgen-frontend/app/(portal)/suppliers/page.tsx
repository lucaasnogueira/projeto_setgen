"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { suppliersApi } from "@/lib/api/suppliers";
import { Supplier } from "@/types";
import { Plus, Search, Building, CheckCircle, Clock, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => suppliersApi.delete(id),
    (id) => setSuppliers((prev) => prev.filter((s) => s.id !== id))
  );

  useEffect(() => {
    suppliersApi.getAll().then(setSuppliers).catch((e) => console.error(e)).finally(() => setLoading(false));
  }, []);

  const filtered = suppliers.filter((s) => {
    if (!s) return false;
    const term = (searchTerm || '').toLowerCase();
    const name = (s.name || '').toLowerCase();
    const cnpj = s.cnpj || '';
    const contact = (s.contact || '').toLowerCase();
    return name.includes(term) || cnpj.includes(searchTerm) || contact.includes(term);
  });

  const totalActive = suppliers.filter(s => s.active).length;
  const totalInactive = suppliers.filter(s => !s.active).length;
  const totalWithCnpj = suppliers.filter(s => !!s.cnpj).length;

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
        title="Fornecedores"
        subtitle={`${filtered.length} fornecedores e parceiros comerciais cadastrados`}
        actions={
          <Button
            onClick={() => router.push("/suppliers/new")}
            className="rounded-[9px] font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white"
          >
            <Plus className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total Fornecedores" value={suppliers.length} icon={Building} variant="orange" />
        <StatusCard label="Fornecedores Ativos" value={totalActive} icon={CheckCircle} variant="emerald" />
        <StatusCard label="Inativos" value={totalInactive} icon={Clock} variant="slate" />
        <StatusCard label="Com CNPJ Homologado" value={totalWithCnpj} icon={FileText} variant="blue" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por razão social, CNPJ ou contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-[#E2661D]/30"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Fornecedor</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato & Comercial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[96px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty colSpan={5} message="Nenhum fornecedor encontrado" />
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center bg-orange-50 text-[#E2661D] shrink-0 font-bold">
                        <Building className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-foreground">{s.name}</div>
                        {s.contact && <div className="text-[11px] text-muted-foreground">{s.contact}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12.5px] font-mono text-muted-foreground">
                    {s.cnpj || "—"}
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">
                    <div>{s.email || "—"}</div>
                    <div>{s.phone || ""}</div>
                  </TableCell>
                  <TableCell className="text-[12px]">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                      {s.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <InlineDeleteAction
                      confirming={confirmId === s.id}
                      deleting={deleting}
                      onEdit={() => router.push(`/suppliers/${s.id}/edit`)}
                      onRequestDelete={() => requestDelete(s.id)}
                      onConfirmDelete={() => confirmDelete(s.id)}
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
