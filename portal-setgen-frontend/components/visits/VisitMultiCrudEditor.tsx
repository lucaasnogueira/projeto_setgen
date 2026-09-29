"use client";

// =================================================================
// VisitMultiCrudEditor — Padrão Aurora Setgen
// Sidebar esquerda com abas + Área central scrollável + Rodapé fixo
// Sem wizards quebrados, com Multi-CRUD inline e rascunho
// =================================================================

import React, { useState, useEffect } from "react";
import {
  Calendar, Users, Wrench, ClipboardCheck, MapPin,
  Save, Clock, CheckCircle, Plus, AlertCircle, Building2, Phone, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { visitsApi } from "@/lib/api/visits";
import { clientsApi } from "@/lib/api/clients";
import { usersApi, User } from "@/lib/api/users";
import { equipmentApi } from "@/lib/api/equipment";
import { checklistTemplatesApi } from "@/lib/api/checklist-templates";
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
    } catch {} finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_visit_draft");
    setDraftNotice(false);
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
      })
    );
    alert("Rascunho da visita técnica salvo com sucesso!");
  };

  // Quick-Add Cliente Inline
  const handleQuickAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcName.trim()) {
      alert("Informe o nome do cliente");
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
      alert(`Cliente "${newClient.companyName}" cadastrado com sucesso!`);
    } catch (err: any) {
      alert(`Erro ao cadastrar cliente: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
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
      const payload: Partial<TechnicalVisit> = {
        clientId,
        visitType: type,
        priority,
        visitDate,
        scheduledStart: scheduledStartTime ? `${visitDate}T${scheduledStartTime}:00` : undefined,
        scheduledEnd: scheduledEndTime ? `${visitDate}T${scheduledEndTime}:00` : undefined,
        description: description.trim() || "Visita técnica de atendimento",
        technicianId: technicianId || undefined,
        equipmentId: equipmentId || undefined,
        checklistTemplateId: checklistTemplateId || undefined,
        userReport: notes.trim() || undefined,
        location: location.trim() || "No cliente",
      };

      if (visitId) {
        await visitsApi.update(visitId, payload);
      } else {
        await visitsApi.create(payload);
        localStorage.removeItem("setgen_visit_draft");
      }

      alert(visitId ? "Visita atualizada com sucesso!" : "Visita técnica agendada com sucesso!");
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
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
    <div className="flex flex-col lg:flex-row h-full min-h-screen bg-white">

      {/* ===== SIDEBAR ESQUERDA (PADRÃO CLIENTE) ===== */}
      <aside className="w-full lg:w-64 bg-gray-50/90 border-r border-gray-200 p-5 shrink-0 flex flex-col justify-between text-xs">
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
        </div>
      </aside>

      {/* ===== ÁREA CENTRAL SCROLLÁVEL ===== */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAFB]">

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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

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
                    onChange={e => setClientId(e.target.value)}
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

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Template de Inspeção</Label>
                  <select
                    value={checklistTemplateId}
                    onChange={e => setChecklistTemplateId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 max-w-md"
                  >
                    <option value="">Selecione um checklist padrão...</option>
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
