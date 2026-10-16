"use client";

// =================================================================
// VisitMultiCrudEditor — Padrão Aurora Setgen
// Sidebar esquerda com abas + Área central scrollável + Rodapé fixo
// Sem wizards quebrados, com Multi-CRUD inline e rascunho
// =================================================================

import React, { useState, useEffect } from "react";
import {
  Calendar, Users, Wrench, ClipboardCheck, MapPin,
  Save, Clock, CheckCircle, Plus, AlertCircle, Building2, Phone, Mail,
  Repeat, FileText, X, Loader2, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { visitsApi } from "@/lib/api/visits";
import { clientsApi } from "@/lib/api/clients";
import { usersApi, User } from "@/lib/api/users";
import { equipmentApi } from "@/lib/api/equipment";
import { checklistTemplatesApi } from "@/lib/api/checklist-templates";
import { orderDocumentsApi } from "@/lib/api/order-documents";
import {
  extractClientContracts,
  ClientContractOption,
} from "@/app/(portal)/orders/components/documents/forms/defaults";
import {
  TechnicalVisit,
  VisitType,
  VisitPriority,
  Client,
  Equipment,
  ChecklistTemplate,
} from "@/types";

type VisitTabKey = "geral" | "tecnicos" | "equipamento" | "checklist" | "notas";

interface Props {
  visitId?: string;
  initialData?: Partial<TechnicalVisit>;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function VisitMultiCrudEditor({
  visitId,
  initialData,
  onClose,
  onSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<VisitTabKey>("geral");

  // === 1. Dados Gerais ===
  const [clientId, setClientId] = useState(initialData?.clientId || "");
  const [type, setType] = useState<VisitType>(initialData?.visitType || VisitType.TECHNICAL);
  const [priority, setPriority] = useState<VisitPriority>(initialData?.priority || VisitPriority.MEDIUM);
  const [visitDate, setVisitDate] = useState(
    initialData?.visitDate
      ? new Date(initialData.visitDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [scheduledStartTime, setScheduledStartTime] = useState(
    initialData?.scheduledStart ? new Date(initialData.scheduledStart).toTimeString().substring(0, 5) : "08:00"
  );
  const [scheduledEndTime, setScheduledEndTime] = useState(
    initialData?.scheduledEnd ? new Date(initialData.scheduledEnd).toTimeString().substring(0, 5) : "12:00"
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [location, setLocation] = useState(initialData?.location || "");

  // === Contrato & Recorrência de Visitas ===
  const initTech = (initialData as any)?.technicalData || {};
  const [hasContract, setHasContract] = useState<boolean>(
    initTech.hasContract ?? (initialData?.description?.includes("Contrato") || false)
  );
  const [contractNumber, setContractNumber] = useState<string>(initTech.contractNumber || "");
  const [recurrence, setRecurrence] = useState<string>(
    initTech.recurrence ??
    (initialData?.description?.includes("Bimestral") ? "BIMONTHLY" :
     initialData?.description?.includes("Trimestral") ? "QUARTERLY" :
     initialData?.description?.includes("Semestral") ? "SEMIANNUAL" :
     initialData?.description?.includes("Anual") ? "ANNUAL" :
     initialData?.description?.includes("Mensal") ? "MONTHLY" : "NONE")
  );
  const [recurrenceCount, setRecurrenceCount] = useState<number>(initTech.recurrenceCount || 6);
  const [clientContracts, setClientContracts] = useState<ClientContractOption[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [manualContractInput, setManualContractInput] = useState(false);

  // === 2. Técnicos & Equipe ===
  const [technicianId, setTechnicianId] = useState<string>(initialData?.technicianId || "");

  // === 3. Equipamento ===
  const [equipmentId, setEquipmentId] = useState(initialData?.equipmentId || "");

  // === 4. Checklist ===
  const [checklistTemplateId, setChecklistTemplateId] = useState(initialData?.checklistTemplateId || "");

  // === 5. Notas & Conclusão ===
  const [notes, setNotes] = useState(initialData?.userReport || (initialData as any)?.notes || "");

  // === Catálogos ===
  const [clients, setClients] = useState<Client[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);

  // === UI / Modals / Quick-Adds ===
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [qcName, setQcName] = useState("");
  const [qcCnpj, setQcCnpj] = useState("");
  const [qcEmail, setQcEmail] = useState("");
  const [qcPhone, setQcPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      clientsApi.getAll().catch(() => [] as Client[]),
      usersApi.getSelectable().catch(() => [] as User[]),
      equipmentApi.getAll().catch(() => [] as Equipment[]),
      checklistTemplatesApi.getAll().catch(() => [] as ChecklistTemplate[]),
    ]).then(([c, u, e, t]) => {
      setClients(c);
      setTechnicians(u);
      setEquipments(e);
      setTemplates(t);
    });
  }, []);

  // Filtrar equipamentos quando o cliente muda
  const clientEquipments = equipments.filter(e => !clientId || e.clientId === clientId);

  // Rascunho via localStorage
  useEffect(() => {
    if (!visitId) {
      try {
        const d = JSON.parse(localStorage.getItem("setgen_visit_draft") || "{}");
        if (d.clientId || d.description || d.visitDate) setDraftNotice(true);
      } catch {}
    }
  }, [visitId]);

  const restoreDraft = () => {
    try {
      const d = JSON.parse(localStorage.getItem("setgen_visit_draft") || "{}");
      if (d.clientId) setClientId(d.clientId);
      if (d.type) setType(d.type);
      if (d.priority) setPriority(d.priority);
      if (d.visitDate) setVisitDate(d.visitDate);
      if (d.scheduledStartTime) setScheduledStartTime(d.scheduledStartTime);
      if (d.scheduledEndTime) setScheduledEndTime(d.scheduledEndTime);
      if (d.description) setDescription(d.description);
      if (d.location) setLocation(d.location);
      if (d.technicianId) setTechnicianId(d.technicianId);
      if (d.equipmentId) setEquipmentId(d.equipmentId);
      if (d.checklistTemplateId) setChecklistTemplateId(d.checklistTemplateId);
      if (d.notes) setNotes(d.notes);
      if (d.hasContract !== undefined) setHasContract(d.hasContract);
      if (d.contractNumber) setContractNumber(d.contractNumber);
      if (d.recurrence) setRecurrence(d.recurrence);
      if (d.recurrenceCount) setRecurrenceCount(d.recurrenceCount);
      toast.info("Rascunho da visita restaurado.");
    } catch {} finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_visit_draft");
    setDraftNotice(false);
    toast.info("Rascunho descartado.");
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      "setgen_visit_draft",
      JSON.stringify({
        clientId,
        type,
        priority,
        visitDate,
        scheduledStartTime,
        scheduledEndTime,
        description,
        location,
        technicianId,
        equipmentId,
        checklistTemplateId,
        notes,
        hasContract,
        contractNumber,
        recurrence,
        recurrenceCount,
      })
    );
    toast.success("Rascunho da visita técnica salvo com sucesso!");
  };

  // Carrega e sincroniza contratos do cliente selecionado (Gestão de Documentos + Cadastro)
  useEffect(() => {
    if (!clientId) {
      setClientContracts([]);
      return;
    }
    let isCurrent = true;
    setLoadingContracts(true);
    const cl = clients.find(c => c.id === clientId);

    orderDocumentsApi.getByClient(clientId)
      .then(docs => {
        if (!isCurrent) return;
        const contracts = extractClientContracts(cl, docs);
        setClientContracts(contracts);

        // Se houver contrato do cliente e contractNumber ainda não estiver preenchido, auto-vincula
        if (contracts.length > 0 && !contractNumber) {
          const mainContract = contracts.find(c => c.source === "profile") || contracts[0];
          setContractNumber(mainContract.number);
          setHasContract(true);
          const lower = mainContract.label.toLowerCase();
          if (lower.includes("bimestral")) setRecurrence("BIMONTHLY");
          else if (lower.includes("trimestral")) setRecurrence("QUARTERLY");
          else if (lower.includes("semestral")) setRecurrence("SEMIANNUAL");
          else if (lower.includes("anual")) setRecurrence("ANNUAL");
          else if (lower.includes("mensal")) setRecurrence("MONTHLY");
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        const contracts = extractClientContracts(cl, []);
        setClientContracts(contracts);
        if (contracts.length > 0 && !contractNumber) {
          setContractNumber(contracts[0].number);
          setHasContract(true);
        }
      })
      .finally(() => {
        if (isCurrent) setLoadingContracts(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [clientId, clients]);

  const handleSelectClient = (selectedId: string) => {
    setClientId(selectedId);
    setErrors(prev => ({ ...prev, clientId: "" }));
    setContractNumber("");
    setHasContract(false);
    setRecurrence("NONE");
    setManualContractInput(false);
    const cl = clients.find(c => c.id === selectedId);
    if (cl) {
      if (cl.address && typeof cl.address === "object" && (cl.address as any).street) {
        const a: any = cl.address;
        setLocation(`${a.street}, ${a.number || "S/N"} - ${a.neighborhood || ""}, ${a.city || ""}`);
      }
    }
  };

  // Quick-Add Cliente Inline
  const handleQuickAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcName.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    setQuickSaving(true);
    try {
      const newClient = await clientsApi.create({
        companyName: qcName.trim(),
        cnpjCpf: qcCnpj.trim() || undefined,
        email: qcEmail.trim() || undefined,
        phone: qcPhone.trim() || undefined,
      });
      setClients(prev => [newClient, ...prev]);
      setClientId(newClient.id);
      setShowQuickClient(false);
      setQcName("");
      setQcCnpj("");
      setQcEmail("");
      setQcPhone("");
      toast.success(`Cliente "${newClient.companyName}" cadastrado com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao cadastrar cliente: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setQuickSaving(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!clientId) errs.clientId = "Selecione ou cadastre o cliente";
    if (!visitDate) errs.visitDate = "Informe a data da visita";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      let contractSummary = "";
      if (hasContract) {
        const recurrenceLabels: Record<string, string> = {
          NONE: "Pontual",
          MONTHLY: "Mensal (12x/ano)",
          BIMONTHLY: "Bimestral (6x/ano)",
          QUARTERLY: "Trimestral (4x/ano)",
          SEMIANNUAL: "Semestral (2x/ano)",
          ANNUAL: "Anual (1x/ano)",
        };
        contractSummary = `\n[Contrato: ${contractNumber.trim() || "Ativo"} | Periodicidade: ${recurrenceLabels[recurrence] || recurrence}]`;
      }

      const payload: Partial<TechnicalVisit> = {
        clientId,
        visitType: type,
        priority,
        visitDate,
        scheduledStart: scheduledStartTime ? `${visitDate}T${scheduledStartTime}:00` : undefined,
        scheduledEnd: scheduledEndTime ? `${visitDate}T${scheduledEndTime}:00` : undefined,
        description: (description.trim() || "Visita técnica de atendimento") + contractSummary,
        technicianId: technicianId || undefined,
        equipmentId: equipmentId || undefined,
        checklistTemplateId: checklistTemplateId || undefined,
        userReport: notes.trim() || undefined,
        location: location.trim() || "No cliente",
        technicalData: {
          hasContract,
          contractNumber: contractNumber.trim(),
          recurrence,
          recurrenceCount: recurrence !== "NONE" ? recurrenceCount : undefined,
        } as any,
      };

      if (visitId) {
        await visitsApi.update(visitId, payload);
      } else {
        await visitsApi.create(payload);
        localStorage.removeItem("setgen_visit_draft");
      }

      toast.success(visitId ? "Visita técnica atualizada com sucesso!" : "Visita técnica agendada com sucesso!");
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: VisitTabKey; icon: React.ComponentType<{ className?: string }>; label: string; count?: number }[] = [
    { key: "geral", icon: Calendar, label: "Dados da Visita" },
    { key: "tecnicos", icon: Users, label: "Técnico Responsável", count: technicianId ? 1 : 0 },
    { key: "equipamento", icon: Wrench, label: "Equipamento / Gerador" },
    { key: "checklist", icon: ClipboardCheck, label: "Procedimento & Checklist" },
    { key: "notas", icon: MapPin, label: "Observações & Local" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-white overflow-hidden">

      {/* ===== SIDEBAR ESQUERDA (PADRÃO CLIENTE) ===== */}
      <aside className="w-full lg:w-64 bg-gray-50/90 border-r border-gray-200 p-5 shrink-0 flex flex-col justify-between text-xs overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4 text-orange-600" />
              {visitId ? "Editar Visita" : "Nova Visita Técnica"}
            </span>
            <span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded text-[10px]">
              {visitId ? "EDIÇÃO" : "NOVA"}
            </span>
          </div>

          {/* Abas Verticais */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors text-left ${
                    isActive
                      ? "bg-white text-orange-600 font-semibold shadow-xs border border-gray-200/80"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-orange-600" : "text-gray-400"}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Resumo da Visita */}
        <div className="pt-4 border-t border-gray-200 space-y-2 text-[11px] text-gray-500">
          <div className="flex justify-between">
            <span>Cliente:</span>
            <span className="font-semibold text-gray-800 truncate max-w-[120px]">
              {clients.find(c => c.id === clientId)?.companyName || "Não selecionado"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Data:</span>
            <span className="font-semibold text-gray-800">{visitDate || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Prioridade:</span>
            <span className={`font-bold ${
              priority === VisitPriority.HIGH ? "text-red-600" :
              priority === VisitPriority.MEDIUM ? "text-amber-600" : "text-blue-600"
            }`}>
              {priority === VisitPriority.HIGH ? "Alta" : priority === VisitPriority.MEDIUM ? "Média" : "Baixa"}
            </span>
          </div>
          {hasContract && (
            <div className="flex justify-between pt-1 text-[#E2661D] font-bold">
              <span>Contrato:</span>
              <span className="truncate max-w-[120px]">{contractNumber || "Ativo"}</span>
            </div>
          )}
        </div>
      </aside>

      {/* ===== ÁREA CENTRAL SCROLLÁVEL ===== */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">

        {/* ===== BARRA DE AÇÕES SUPERIOR (HEADER FIXO SEMPRE VISÍVEL) ===== */}
        <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight">
                {tabs.find(t => t.key === activeTab)?.label}
              </h3>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                {activeTab === "geral" ? "Identificação, contrato e horários da visita técnica" :
                 activeTab === "tecnicos" ? "Equipe de campo e responsáveis técnicos" :
                 activeTab === "equipamento" ? "Grupo gerador ou equipamento atendido" :
                 activeTab === "checklist" ? "Procedimento operacional e checklist de 114 itens" :
                 "Instruções de acesso e observações"}
              </p>
            </div>
          </div>

          {/* Lado Direito: Ações Rápidas (Zero necessidade de scroll!) */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              title="Salvar rascunho no navegador"
              className="text-xs h-9 text-gray-600 hover:text-[#E2661D] hover:border-[#E2661D] border-gray-200 rounded-lg gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-[#E2661D]" />
              <span className="hidden sm:inline">Salvar</span> Rascunho
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-9 px-4 rounded-lg shadow-xs gap-1.5 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{visitId ? "Salvar Alterações" : "Agendar Visita"}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Banner de Rascunho */}
        {draftNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800 shrink-0">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Existe um rascunho de agendamento salvo. Deseja restaurá-lo?
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={discardDraft} className="text-amber-800 text-xs h-7">
                Descartar
              </Button>
              <Button size="sm" onClick={restoreDraft} className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7">
                Restaurar
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-[#FAFAFB]">

          {/* ══ ABA 1: DADOS GERAIS ══════════════════════════════ */}
          {activeTab === "geral" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />Identificação da Visita
                  </h4>
                  <span className="text-gray-400 text-xs">Dados principais do agendamento</span>
                </div>

                {/* Cliente com Quick-Add */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="font-semibold text-gray-700">Cliente *</Label>
                    <button
                      type="button"
                      onClick={() => setShowQuickClient(!showQuickClient)}
                      className="text-xs text-orange-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showQuickClient ? "Fechar cadastro rápido" : "Cadastrar Novo Cliente"}
                    </button>
                  </div>

                  {showQuickClient && (
                    <div className="mb-3 p-4 bg-orange-50/60 rounded-xl border border-orange-200 space-y-3">
                      <span className="font-semibold text-xs text-orange-800 block">Novo Cliente Rápido</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Razão Social / Nome Fantasia *"
                          value={qcName}
                          onChange={e => setQcName(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                        <Input
                          placeholder="CNPJ ou CPF"
                          value={qcCnpj}
                          onChange={e => setQcCnpj(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                        <Input
                          placeholder="E-mail de contato"
                          type="email"
                          value={qcEmail}
                          onChange={e => setQcEmail(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                        <Input
                          placeholder="Telefone / Celular"
                          value={qcPhone}
                          onChange={e => setQcPhone(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowQuickClient(false)}
                          className="text-xs h-7"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={quickSaving}
                          onClick={handleQuickAddClient}
                          className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs h-7 font-bold"
                        >
                          {quickSaving ? "Salvando..." : "Salvar e Selecionar"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <select
                    value={clientId}
                    onChange={e => handleSelectClient(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="">Selecione o cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} {c.cnpjCpf ? `(${c.cnpjCpf})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.clientId}</p>}
                </div>

                {/* ══ CONTRATO & RECORRÊNCIA DA VISITA ══ */}
                <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <Repeat className="w-4 h-4 text-[#E2661D]" />
                      Vínculo Contratual & Periodicidade das Visitas
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-orange-200/60 shadow-2xs">
                      <input
                        type="checkbox"
                        checked={hasContract}
                        onChange={e => setHasContract(e.target.checked)}
                        className="rounded border-gray-300 text-[#E2661D] focus:ring-[#E2661D]"
                      />
                      <span>Visita Coberta por Contrato de Manutenção</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    <div>
                      <Label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                        Periodicidade das Visitas
                      </Label>
                      <select
                        value={recurrence}
                        onChange={e => setRecurrence(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#E2661D] font-medium"
                      >
                        <option value="NONE">Visita Única / Chamado Pontual</option>
                        <option value="MONTHLY">Mensal (12 visitas / ano)</option>
                        <option value="BIMONTHLY">Bimestral (6 visitas / ano)</option>
                        <option value="QUARTERLY">Trimestral (4 visitas / ano)</option>
                        <option value="SEMIANNUAL">Semestral (2 visitas / ano)</option>
                        <option value="ANNUAL">Anual (1 visita / ano)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="block font-semibold text-gray-700 text-[11px]">
                          Nº do Contrato Vinculado
                        </Label>
                        <div className="flex items-center gap-1.5">
                          {loadingContracts && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin text-[#E2661D]" />
                              Buscando contratos...
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setManualContractInput(!manualContractInput)}
                            className="text-[10px] font-bold text-[#E2661D] hover:underline"
                          >
                            {manualContractInput ? "Selecionar da lista" : "Digitar código manual"}
                          </button>
                        </div>
                      </div>

                      {manualContractInput ? (
                        <Input
                          type="text"
                          value={contractNumber}
                          onChange={e => {
                            setContractNumber(e.target.value);
                            if (e.target.value.trim()) setHasContract(true);
                          }}
                          placeholder="Ex: CTR-2026/089"
                          className="h-9 text-xs bg-white border-gray-200 focus:border-[#E2661D]"
                        />
                      ) : (
                        <select
                          value={contractNumber}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === "__manual__") {
                              setManualContractInput(true);
                              return;
                            }
                            setContractNumber(val);
                            if (val) {
                              setHasContract(true);
                              const found = clientContracts.find(c => c.number === val);
                              if (found?.label?.toLowerCase().includes("bimestral")) setRecurrence("BIMONTHLY");
                              else if (found?.label?.toLowerCase().includes("trimestral")) setRecurrence("QUARTERLY");
                              else if (found?.label?.toLowerCase().includes("semestral")) setRecurrence("SEMIANNUAL");
                              else if (found?.label?.toLowerCase().includes("anual")) setRecurrence("ANNUAL");
                              else if (found?.label?.toLowerCase().includes("mensal")) setRecurrence("MONTHLY");
                            } else {
                              setHasContract(false)
                              setRecurrence("NONE");
                            }
                          }}
                          className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#E2661D] font-medium text-gray-800"
                        >
                          <option value="">
                            {loadingContracts
                              ? "Carregando contratos do cliente..."
                              : !clientId
                              ? "— Selecione primeiro um cliente acima —"
                              : clientContracts.length === 0
                              ? "— (Em branco / Nenhum contrato cadastrado) —"
                              : "— (Em branco / Nenhum contrato vinculado) —"}
                          </option>
                          {clientContracts.map(c => (
                            <option key={c.id} value={c.number}>
                              {c.label}
                            </option>
                          ))}
                          {contractNumber && !clientContracts.some(c => c.number === contractNumber) && (
                            <option value={contractNumber}>
                              {contractNumber} (Contrato Vinculado)
                            </option>
                          )}
                          <option value="__manual__">✏️ Digitar outro número de contrato...</option>
                        </select>
                      )}

                      {clientId && clientContracts.length === 0 && !loadingContracts && !manualContractInput && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          Este cliente não possui contratos cadastrados na ficha ou em Gestão de Documentos. O campo permanece em branco.
                        </p>
                      )}
                    </div>

                    {recurrence !== "NONE" && (
                      <div>
                        <Label className="block font-semibold text-gray-700 mb-1 text-[11px]">
                          Ciclos de Recorrência
                        </Label>
                        <select
                          value={recurrenceCount}
                          onChange={e => setRecurrenceCount(Number(e.target.value))}
                          className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#E2661D] font-medium"
                        >
                          <option value={3}>3 ocorrências (Trimestre / Semestre)</option>
                          <option value={6}>6 ocorrências (Semestral / 1 ano bimestral)</option>
                          <option value={12}>12 ocorrências (1 ano mensal)</option>
                          <option value={24}>24 ocorrências (2 anos)</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {hasContract && (
                    <p className="text-[11px] text-orange-800 bg-orange-100/70 p-2 rounded-lg leading-relaxed">
                      Esta visita é contratual e vinculada ao plano de manutenção periódica do cliente. Sem cobrança avulsa de taxa de deslocamento para manutenções cobertas.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Tipo de Visita Técnica</Label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value as VisitType)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 font-semibold"
                    >
                      <option value={VisitType.TECHNICAL}>Técnica / Diagnóstica</option>
                      <option value={VisitType.MAINTENANCE}>Manutenção Preventiva / Corretiva</option>
                      <option value={VisitType.COMMERCIAL}>Comercial / Levantamento</option>
                    </select>
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Prioridade</Label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as VisitPriority)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500"
                    >
                      <option value={VisitPriority.LOW}>Baixa</option>
                      <option value={VisitPriority.MEDIUM}>Média (Padrão)</option>
                      <option value={VisitPriority.HIGH}>Alta / Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Data Agendada *</Label>
                    <Input
                      type="date"
                      value={visitDate}
                      onChange={e => setVisitDate(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                    {errors.visitDate && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.visitDate}</p>}
                  </div>
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Horário Previsto Início</Label>
                    <Input
                      type="time"
                      value={scheduledStartTime}
                      onChange={e => setScheduledStartTime(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Horário Previsto Fim</Label>
                    <Input
                      type="time"
                      value={scheduledEndTime}
                      onChange={e => setScheduledEndTime(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Local / Endereço da Visita</Label>
                  <Input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Ex: Unidade Fabril 2 - Sala de Geradores, Av. Industrial 500"
                    className="h-9 text-xs bg-white"
                  />
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Objetivo / Descrição dos Serviços</Label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descreva o motivo da visita, sintomas relatados pelo cliente ou testes necessários..."
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 2: TÉCNICOS & EQUIPE ═════════════════════════ */}
          {activeTab === "tecnicos" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />Técnico Responsável pela Execução
                </h4>
                <p className="text-gray-400 text-xs">Selecione o profissional que fará o atendimento presencial</p>

                <div className="max-w-md">
                  <Label className="block font-semibold text-gray-700 mb-1">Técnico Principal</Label>
                  <select
                    value={technicianId}
                    onChange={e => setTechnicianId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500"
                  >
                    <option value="">Selecione um técnico responsável...</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 3: EQUIPAMENTO / GERADOR ══════════════════════ */}
          {activeTab === "equipamento" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-600" />Gerador ou Equipamento Objeto da Visita
                </h4>
                <p className="text-gray-400 text-xs">
                  {clientId
                    ? `Equipamentos vinculados ao cliente selecionado (${clientEquipments.length} disponíveis)`
                    : "Selecione primeiro o cliente na aba Geral para ver seus equipamentos cadastrados"}
                </p>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Equipamento Alvo</Label>
                  <select
                    value={equipmentId}
                    onChange={e => setEquipmentId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 max-w-md"
                  >
                    <option value="">Nenhum equipamento específico (ou visita geral)...</option>
                    {clientEquipments.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.brand} {eq.model} · {eq.powerRating || "Potência N/D"} · Série: {eq.serialNumber || "S/N"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 4: PROCEDIMENTO & CHECKLIST ════════════════════ */}
          {activeTab === "checklist" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-orange-600" />Checklist Operacional Vinculado
                </h4>
                <p className="text-gray-400 text-xs">Instruções e verificações que o técnico preencherá em campo</p>

                <div className="bg-orange-50/70 border border-orange-200 rounded-lg p-3 text-xs text-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-900 block">Padrão Técnico Setgen (114 Itens)</span>
                  <p className="text-slate-600 leading-relaxed">
                    Esta visita utiliza o Formulário Técnico Oficial de Grupo Gerador da Setgen (114 itens de inspeção e medição). As respostas de campo são preenchidas no <strong>Formulário de Execução</strong>.
                  </p>
                  {visitId && (
                    <a
                      href={`/visits/${visitId}/execution`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E2661D] hover:underline mt-1"
                    >
                      Preencher respostas no Formulário de Execução →
                    </a>
                  )}
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Vincular Outro Modelo Opcional</Label>
                  <select
                    value={checklistTemplateId}
                    onChange={e => setChecklistTemplateId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 max-w-md"
                  >
                    <option value="">Checklist Padrão Grupo Gerador (114 Itens)</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 5: OBSERVAÇÕES & LOCAL ═════════════════════════ */}
          {activeTab === "notas" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />Orientações de Acesso & Observações
                </h4>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Orientações de Segurança / Portaria / Notas</Label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Instruções para entrada na planta, EPIs obrigatórios, contato da portaria..."
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ===== RODAPÉ FIXO (PADRÃO CLIENTE) ===== */}
        <div className="h-14 bg-white border-t border-gray-200 px-6 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSaveDraft}
            className="text-xs text-gray-600 hover:text-orange-600 gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />Salvar Rascunho
          </Button>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-lg h-9 px-4"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs rounded-lg h-9 px-5 gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {saving ? "Salvando..." : visitId ? "Salvar Alterações" : "Agendar Visita"}
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}
