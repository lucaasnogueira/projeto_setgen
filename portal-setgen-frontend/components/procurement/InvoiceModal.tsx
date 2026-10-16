"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  UploadCloud,
  FileCheck,
  ExternalLink,
  Loader2,
  AlertCircle,
  Hash,
  KeyRound,
  FileEdit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { procurementOrdersApi } from "@/lib/api/procurement-orders";
import { ProcurementOrder } from "@/types";
import { openAuthedFile } from "@/lib/utils/auth-file";
import { toast } from "sonner";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ProcurementOrder | null;
  onSuccess: (updatedOrder: ProcurementOrder) => void;
}

export function InvoiceModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: InvoiceModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAccessKey, setInvoiceAccessKey] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (order && isOpen) {
      setInvoiceNumber(order.invoiceNumber || "");
      setInvoiceAccessKey(order.invoiceAccessKey || "");
      setNotes(order.notes || "");
      setSelectedFile(null);
      setErrorMessage(null);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limite de 20MB
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage("O arquivo selecionado excede o limite de 20MB.");
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleOpenFile = async () => {
    if (!order.invoiceUrl) return;
    try {
      await openAuthedFile(order.invoiceUrl);
    } catch (err) {
      toast.error("Erro ao abrir arquivo da nota fiscal.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      let updated = order;

      // 1. Atualizar campos textuais de NF
      const dataPayload: any = {
        invoiceNumber: invoiceNumber.trim() || undefined,
        invoiceAccessKey: invoiceAccessKey.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      updated = await procurementOrdersApi.update(order.id, dataPayload);

      // 2. Se houver arquivo selecionado, fazer upload
      if (selectedFile) {
        updated = await procurementOrdersApi.uploadInvoice(order.id, selectedFile);
      }

      toast.success("Dados da Nota Fiscal salvos com sucesso!");
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar dados da NF:", err);
      setErrorMessage(
        err.response?.data?.message || "Ocorreu um erro ao salvar a Nota Fiscal."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E2661D] shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                  Pedido #{order.id.slice(0, 8)}
                </span>
                {order.supplier && (
                  <span className="text-[10px] font-medium text-gray-500">
                    • {order.supplier.name}
                  </span>
                )}
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-gray-900">
                Nota Fiscal do Pedido de Compra
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Arquivo atual (se houver) */}
          {order.invoiceUrl && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-emerald-950 truncate">
                    Documento Anexo Atual
                  </p>
                  <p className="text-[11px] text-emerald-700 truncate font-mono">
                    {order.invoiceUrl.split("/").pop()}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenFile}
                className="h-8 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100/70 rounded-lg shrink-0 gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Visualizar
              </Button>
            </div>
          )}

          {/* Número da NF */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-gray-400" />
              Número da Nota Fiscal (NF-e)
            </Label>
            <Input
              type="text"
              placeholder="Ex: 000.123.456 ou 12345"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="text-xs h-9 rounded-lg border-gray-200 font-mono"
            />
          </div>

          {/* Chave de Acesso */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-gray-400" />
              Chave de Acesso da NF-e (44 dígitos)
            </Label>
            <Input
              type="text"
              maxLength={54}
              placeholder="Ex: 3524 0100 0000 0000 0000 5500 1000 1234 5610 0000 0000"
              value={invoiceAccessKey}
              onChange={(e) => setInvoiceAccessKey(e.target.value)}
              className="text-xs h-9 rounded-lg border-gray-200 font-mono text-[11px]"
            />
          </div>

          {/* Upload do Arquivo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <UploadCloud className="h-3.5 w-3.5 text-gray-400" />
              {order.invoiceUrl ? "Substituir Arquivo da NF (PDF, XML ou Imagem)" : "Anexar Arquivo da NF (PDF, XML ou Imagem)"}
            </Label>
            <div className="border-2 border-dashed border-gray-200 hover:border-[#E2661D] rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-orange-50/20 relative">
              <input
                type="file"
                accept=".pdf,.xml,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center gap-1">
                <UploadCloud className="h-6 w-6 text-gray-400" />
                {selectedFile ? (
                  <p className="text-xs font-bold text-gray-900 mt-1">
                    Selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-gray-700">
                      Clique para escolher ou arraste o arquivo aqui
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Formatos suportados: PDF, XML, PNG, JPG (até 20MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <FileEdit className="h-3.5 w-3.5 text-gray-400" />
              Observações / Informações Fiscais
            </Label>
            <textarea
              rows={2}
              placeholder="Ex: Frete FOB pago pelo fornecedor; condições de pagamento 28 DDL..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#E2661D]/30"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="h-9 text-xs rounded-xl border-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-9 text-xs font-bold bg-[#E2661D] hover:bg-[#c95716] text-white rounded-xl gap-2 shadow-xs"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar Nota Fiscal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

