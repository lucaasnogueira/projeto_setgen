"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Building,
  Search,
  Plus,
  Check,
  ChevronDown,
  X,
  Loader2,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { suppliersApi } from "@/lib/api/suppliers";
import { Supplier } from "@/types";
import { toast } from "sonner";

interface SupplierComboboxProps {
  suppliers: Supplier[];
  selectedSupplierId?: string;
  onSelectSupplier: (supplierId: string) => void;
  onSupplierCreated?: (newSupplier: Supplier) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  placeholder?: string;
}

export function SupplierCombobox({
  suppliers,
  selectedSupplierId,
  onSelectSupplier,
  onSupplierCreated,
  allowEmpty = true,
  emptyLabel = "A definir / Em cotação aberta",
  placeholder = "Selecione ou busque um fornecedor...",
}: SupplierComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  // Formulário de Criação Rápida
  const [newName, setNewName] = useState("");
  const [newCnpj, setNewCnpj] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsQuickCreateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Foco no input de busca ao abrir
  useEffect(() => {
    if (isOpen && !isQuickCreateOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, isQuickCreateOpen]);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const term = searchTerm.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.cnpj?.toLowerCase().includes(term) ||
        s.contact?.toLowerCase().includes(term)
    );
  }, [suppliers, searchTerm]);

  const handleSelect = (id: string) => {
    onSelectSupplier(id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError("O nome do fornecedor é obrigatório.");
      return;
    }

    setIsSaving(true);
    setCreateError(null);
    try {
      const created = await suppliersApi.create({
        name: newName.trim(),
        cnpj: newCnpj.trim() || undefined,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        active: true,
      });

      toast.success(`Fornecedor "${created.name}" cadastrado com sucesso!`);
      if (onSupplierCreated) {
        onSupplierCreated(created);
      }
      onSelectSupplier(created.id);

      // Reset
      setNewName("");
      setNewCnpj("");
      setNewPhone("");
      setNewEmail("");
      setIsQuickCreateOpen(false);
      setIsOpen(false);
    } catch (err: any) {
      console.error("Erro ao cadastrar fornecedor rápido:", err);
      setCreateError(
        err.response?.data?.message || "Erro ao salvar o novo fornecedor."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Botão Gatilho (Trigger) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsQuickCreateOpen(false);
        }}
        className="w-full text-xs h-9 px-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-[#E2661D]/30 transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          <Building className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className={`truncate ${selectedSupplier ? "font-bold text-gray-900" : "text-gray-500"}`}>
            {selectedSupplier
              ? `${selectedSupplier.name} ${selectedSupplier.cnpj ? `(${selectedSupplier.cnpj})` : ""}`
              : emptyLabel}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-1" />
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[300px] max-w-md bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {!isQuickCreateOpen ? (
            <>
              {/* Barra de Pesquisa */}
              <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                <Search className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-1" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Pesquisar fornecedor por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Botão de Adicionar Novo Fornecedor */}
              <div className="p-1.5 border-b border-gray-100 bg-orange-50/40">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(true)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#E2661D] hover:bg-orange-100/60 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Cadastrar Novo Fornecedor</span>
                  </div>
                  <span className="text-[10px] text-orange-600 font-normal">
                    Adicionar agora
                  </span>
                </button>
              </div>

              {/* Lista de Resultados */}
              <div className="max-h-56 overflow-y-auto p-1 divide-y divide-gray-50">
                {allowEmpty && (
                  <button
                    type="button"
                    onClick={() => handleSelect("")}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      !selectedSupplierId
                        ? "bg-gray-100 text-gray-900 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{emptyLabel}</span>
                    {!selectedSupplierId && <Check className="h-3.5 w-3.5 text-[#E2661D]" />}
                  </button>
                )}

                {filteredSuppliers.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    <p>Nenhum fornecedor encontrado.</p>
                    <button
                      type="button"
                      onClick={() => setIsQuickCreateOpen(true)}
                      className="text-[#E2661D] font-bold mt-1 text-[11px] hover:underline"
                    >
                      Deseja cadastrar "{searchTerm}" agora?
                    </button>
                  </div>
                ) : (
                  filteredSuppliers.map((s) => {
                    const isSelected = s.id === selectedSupplierId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelect(s.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          isSelected
                            ? "bg-orange-50 text-[#E2661D] font-bold"
                            : "text-gray-800 hover:bg-gray-50"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-semibold">{s.name}</p>
                          {s.cnpj && (
                            <p className="text-[10.5px] text-gray-400 font-mono">
                              CNPJ: {s.cnpj}
                            </p>
                          )}
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#E2661D] shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Formulário Rápido de Criação de Fornecedor */
            <form onSubmit={handleCreateSupplier} className="p-3.5 space-y-3 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                  <Building className="h-4 w-4 text-[#E2661D]" />
                  <span>Novo Fornecedor Rápido</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {createError && (
                <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-[11px]">
                  {createError}
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-gray-700">
                  Nome / Razão Social *
                </Label>
                <Input
                  autoFocus
                  required
                  placeholder="Ex: Comercial Elétrica Ltda"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-xs h-8 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-gray-600">
                    CNPJ (Opcional)
                  </Label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={newCnpj}
                    onChange={(e) => setNewCnpj(e.target.value)}
                    className="text-xs h-8 rounded-lg font-mono text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-gray-600">
                    Telefone / WhatsApp
                  </Label>
                  <Input
                    placeholder="(92) 90000-0000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="text-xs h-8 rounded-lg text-[11px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-600">
                  E-mail Comercial (Opcional)
                </Label>
                <Input
                  type="email"
                  placeholder="vendas@fornecedor.com.br"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="text-xs h-8 rounded-lg text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="h-7 text-xs rounded-lg"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="h-7 text-xs font-bold bg-[#E2661D] hover:bg-[#c95716] text-white rounded-lg gap-1 shadow-xs"
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  Salvar e Selecionar
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

