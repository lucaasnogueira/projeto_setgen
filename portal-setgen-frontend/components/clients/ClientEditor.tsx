"use client";

// =================================================================
// ClientMultiCrudEditor — Padrão Aurora Setgen
// Multi-CRUD com criação inline (+), abas e ações sem scroll
// =================================================================

import React, { useState, useEffect } from "react";
import {
  Building2, Phone, MapPin, Users, StickyNote, Save, Clock,
  Search, Loader2, Plus, X, CheckCircle, UserCheck, Contact,
  FolderTree, Target, Hash, Store, Receipt, Landmark, Mail,
  PhoneCall, MailCheck, Navigation, Home, Layers, Lock, ShieldAlert,
  Percent, FileText, Sparkles, Globe, CreditCard, ArrowLeft,
  ChevronRight, AlertCircle, Info, Shield, UserCog, UserRound,
  Zap, Trash2, Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { clientsApi } from "@/lib/api/clients";
import { usersApi, User } from "@/lib/api/users";
import { teamsApi } from "@/lib/api/teams";
import { clientTaxonomiesApi } from "@/lib/api/client-taxonomies";
import { equipmentApi } from "@/lib/api/equipment";
import { Client, ClientStatus, ClientTaxonomyKind, IcmsTaxpayerType, Team, ClientTaxonomy, Equipment, EquipmentType } from "@/types";
import { fetchCep } from "@/lib/api/cep";
import { toast } from "sonner";

type TabKey = "dados" | "contato" | "detalhes" | "equipamentos" | "notas";

interface Props {
  clientId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function ClientMultiCrudEditor({ clientId, onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("dados");

  // === Dados Cadastrais ===
  const [cnpjCpf, setCnpjCpf] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [externalCode, setExternalCode] = useState("");
  const [status, setStatus] = useState<ClientStatus>(ClientStatus.ACTIVE);

  // === Contato ===
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [corporatePhones, setCorporatePhones] = useState<string[]>([]);
  const [corporateEmails, setCorporateEmails] = useState<string[]>([]);

  // === Endereço ===
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // === Detalhes ===
  const [onSiteContact, setOnSiteContact] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");
  const [responsibleTeamId, setResponsibleTeamId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [icmsTaxpayerType, setIcmsTaxpayerType] = useState<IcmsTaxpayerType | "">("");
  const [stateRegistration, setStateRegistration] = useState("");
  const [municipalRegistration, setMunicipalRegistration] = useState("");

  // === Notas ===
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // === State de UI ===
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<ClientTaxonomy[]>([]);
  const [segments, setSegments] = useState<ClientTaxonomy[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // === Equipamentos (Multi-CRUD / Staged para novos clientes) ===
  const [clientEquipments, setClientEquipments] = useState<Equipment[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [stagedEquipments, setStagedEquipments] = useState<{
    tempId: string;
    type: EquipmentType;
    brand: string;
    model: string;
    serialNumber: string;
    powerRating: string;
    installLocation: string;
    notes: string;
  }[]>([]);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [savingEquipment, setSavingEquipment] = useState(false);
  const [newEqType, setNewEqType] = useState<EquipmentType>(EquipmentType.GENERATOR);
  const [newEqBrand, setNewEqBrand] = useState("");
  const [newEqModel, setNewEqModel] = useState("");
  const [newEqSerialNumber, setNewEqSerialNumber] = useState("");
  const [newEqPowerRating, setNewEqPowerRating] = useState("");
  const [newEqInstallLocation, setNewEqInstallLocation] = useState("");
  const [newEqNotes, setNewEqNotes] = useState("");

  // === Modal de Multi-CRUD (Criação Rápida com "+") ===
  type QuickModalType = "user" | "team" | "group" | "segment" | null;
  const [quickModal, setQuickModal] = useState<QuickModalType>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickRole, setQuickRole] = useState<User["role"]>("TECHNICIAN");
  const [quickDescription, setQuickDescription] = useState("");

  // Carregar dados auxiliares
  useEffect(() => {
    Promise.all([
      usersApi.getSelectable().catch(() => [] as User[]),
      teamsApi.getAll(true).catch(() => [] as Team[]),
      clientTaxonomiesApi.getAll(ClientTaxonomyKind.GROUP, true).catch(() => [] as ClientTaxonomy[]),
      clientTaxonomiesApi.getAll(ClientTaxonomyKind.SEGMENT, true).catch(() => [] as ClientTaxonomy[]),
    ]).then(([u, t, g, s]) => {
      setUsers(u); setTeams(t); setGroups(g); setSegments(s);
    }).catch(console.error);
  }, []);

  // Carregar cliente existente ou checar rascunho
  useEffect(() => {
    if (clientId) {
      setLoading(true);
      setLoadingEquipments(true);
      equipmentApi
        .getAll({ clientId })
        .then(setClientEquipments)
        .catch(console.error)
        .finally(() => setLoadingEquipments(false));
      clientsApi.getOne(clientId).then(c => {
        setCnpjCpf(c.cnpjCpf || "");
        setCompanyName(c.companyName || "");
        setTradeName(c.tradeName || "");
        setExternalCode(c.externalCode || "");
        setStatus(c.status || ClientStatus.ACTIVE);
        setEmail(c.email || "");
        setPhone(c.phone || "");
        setBillingEmail(c.billingEmail || "");
        setCorporatePhones(c.corporatePhones || []);
        setCorporateEmails(c.corporateEmails || []);
        if (c.address) {
          setCep(c.address.cep || "");
          setStreet(c.address.street || "");
          setNumber(c.address.number || "");
          setComplement(c.address.complement || "");
          setNeighborhood(c.address.neighborhood || "");
          setCity(c.address.city || "");
          setState(c.address.state || "");
        }
        setOnSiteContact(c.onSiteContact || "");
        setResponsibleUserId(c.responsibleUserId || "");
        setResponsibleTeamId(c.responsibleTeamId || "");
        setGroupId(c.groupId || "");
        setSegmentId(c.segmentId || "");
        setIcmsTaxpayerType((c.icmsTaxpayerType as IcmsTaxpayerType) || "");
        setStateRegistration(c.stateRegistration || "");
        setMunicipalRegistration(c.municipalRegistration || "");
        setNotes(c.notes || "");
        setInternalNotes(c.internalNotes || "");
      }).catch(console.error).finally(() => setLoading(false));
    } else {
      try {
        const d = JSON.parse(localStorage.getItem("setgen_client_draft") || "{}");
        if (d.companyName || d.cnpjCpf) setDraftNotice(true);
      } catch {}
    }
  }, [clientId]);

  const restoreDraft = () => {
    try {
      const d = JSON.parse(localStorage.getItem("setgen_client_draft") || "{}");
      if (d.cnpjCpf) setCnpjCpf(d.cnpjCpf);
      if (d.companyName) setCompanyName(d.companyName);
      if (d.tradeName) setTradeName(d.tradeName);
      if (d.externalCode) setExternalCode(d.externalCode);
      if (d.status) setStatus(d.status);
      if (d.email) setEmail(d.email);
      if (d.phone) setPhone(d.phone);
      if (d.billingEmail) setBillingEmail(d.billingEmail);
      if (d.corporatePhones) setCorporatePhones(d.corporatePhones);
      if (d.corporateEmails) setCorporateEmails(d.corporateEmails);
      if (d.cep) setCep(d.cep);
      if (d.street) setStreet(d.street);
      if (d.number) setNumber(d.number);
      if (d.complement) setComplement(d.complement);
      if (d.neighborhood) setNeighborhood(d.neighborhood);
      if (d.city) setCity(d.city);
      if (d.state) setState(d.state);
      if (d.onSiteContact) setOnSiteContact(d.onSiteContact);
      if (d.responsibleUserId) setResponsibleUserId(d.responsibleUserId);
      if (d.responsibleTeamId) setResponsibleTeamId(d.responsibleTeamId);
      if (d.groupId) setGroupId(d.groupId);
      if (d.segmentId) setSegmentId(d.segmentId);
      if (d.notes) setNotes(d.notes);
      if (d.internalNotes) setInternalNotes(d.internalNotes);
      if (d.icmsTaxpayerType) setIcmsTaxpayerType(d.icmsTaxpayerType);
      if (d.stateRegistration) setStateRegistration(d.stateRegistration);
      if (d.municipalRegistration) setMunicipalRegistration(d.municipalRegistration);
      toast.success("Rascunho restaurado com sucesso!");
    } catch {
      toast.error("Não foi possível restaurar o rascunho.");
    } finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_client_draft");
    setDraftNotice(false);
    toast.info("Rascunho descartado.");
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("setgen_client_draft", JSON.stringify({
        cnpjCpf, companyName, tradeName, externalCode, status, email, phone, billingEmail,
        corporatePhones, corporateEmails, cep, street, number, complement, neighborhood, city, state,
        onSiteContact, responsibleUserId, responsibleTeamId, groupId, segmentId, notes, internalNotes,
        icmsTaxpayerType, stateRegistration, municipalRegistration,
      }));
      toast.success("Rascunho salvo no navegador!");
    } catch {
      toast.error("Não foi possível salvar o rascunho.");
    }
  };

  const handleCNPJLookup = async () => {
    const clean = cnpjCpf.replace(/\D/g, "");
    if (clean.length !== 14) {
      toast.error("Informe um CNPJ válido com 14 dígitos para consultar.");
      return;
    }
    setLookupLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) {
        toast.error("CNPJ não encontrado na Receita Federal.");
        return;
      }
      const d = await res.json();
      if (d.razao_social) setCompanyName(d.razao_social);
      if (d.nome_fantasia) setTradeName(d.nome_fantasia);
      if (d.email) setEmail(d.email);
      if (d.ddd_telefone_1) setPhone(d.ddd_telefone_1);
      if (d.cep) { setCep(d.cep); handleCepLookup(d.cep); }
      if (d.logradouro) setStreet(d.logradouro);
      if (d.numero) setNumber(d.numero);
      if (d.complemento) setComplement(d.complemento);
      if (d.bairro) setNeighborhood(d.bairro);
      if (d.municipio) setCity(d.municipio);
      if (d.uf) setState(d.uf.toUpperCase());
      toast.success("Dados preenchidos via Receita Federal!");
    } catch {
      toast.error("Erro ao consultar CNPJ. Preencha os campos manualmente.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCepLookup = async (v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const addr = await fetchCep(clean);
      if (addr) {
        setStreet(addr.logradouro || "");
        setNeighborhood(addr.bairro || "");
        setCity(addr.localidade || "");
        setState(addr.uf?.toUpperCase() || "");
        toast.success("Endereço localizado via CEP!");
      }
    } catch {
      // Silencioso se o CEP não for encontrado
    } finally {
      setCepLoading(false);
    }
  };

  // Multi-CRUD: Criação Rápida com "+"
  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }

    setQuickLoading(true);
    try {
      if (quickModal === "team") {
        const newTeam = await teamsApi.create({
          name: quickName.trim(),
        });
        const freshTeams = await teamsApi.getAll(true).catch(() => []);
        setTeams(freshTeams);
        setResponsibleTeamId(newTeam.id);
        toast.success(`Equipe "${newTeam.name}" criada e selecionada!`);
      } else if (quickModal === "group") {
        const newGroup = await clientTaxonomiesApi.create({
          kind: ClientTaxonomyKind.GROUP,
          name: quickName.trim(),
        });
        const freshGroups = await clientTaxonomiesApi.getAll(ClientTaxonomyKind.GROUP, true).catch(() => []);
        setGroups(freshGroups);
        setGroupId(newGroup.id);
        toast.success(`Grupo "${newGroup.name}" criado e selecionado!`);
      } else if (quickModal === "segment") {
        const newSegment = await clientTaxonomiesApi.create({
          kind: ClientTaxonomyKind.SEGMENT,
          name: quickName.trim(),
        });
        const freshSegments = await clientTaxonomiesApi.getAll(ClientTaxonomyKind.SEGMENT, true).catch(() => []);
        setSegments(freshSegments);
        setSegmentId(newSegment.id);
        toast.success(`Segmento "${newSegment.name}" criado e selecionado!`);
      } else if (quickModal === "user") {
        if (!quickEmail.trim() || !quickEmail.includes("@")) {
          toast.error("Informe um e-mail válido para o colaborador.");
          setQuickLoading(false);
          return;
        }
        const newUser = await usersApi.create({
          name: quickName.trim(),
          email: quickEmail.trim(),
          role: quickRole,
          password: "SetgenTempPass@123",
        });
        const freshUsers = await usersApi.getSelectable().catch(() => []);
        setUsers(freshUsers);
        setResponsibleUserId(newUser.id);
        toast.success(`Colaborador "${newUser.name}" cadastrado e selecionado!`);
      }

      setQuickModal(null);
      setQuickName("");
      setQuickEmail("");
      setQuickDescription("");
      setQuickRole("TECHNICIAN");
    } catch (err: any) {
      console.error("Erro no cadastro rápido:", err);
      const msg = err?.response?.data?.message || err?.message || "Erro ao criar registro.";
      toast.error(msg);
    } finally {
      setQuickLoading(false);
    }
  };

  // Funções de CRUD de Equipamentos Inline/Staged
  const handleAddEquipment = async () => {
    if (!newEqBrand.trim() && !newEqModel.trim() && !newEqSerialNumber.trim()) {
      toast.error("Informe ao menos a marca, modelo ou número de série do equipamento.");
      return;
    }

    if (clientId) {
      setSavingEquipment(true);
      try {
        const created = await equipmentApi.create({
          clientId,
          type: newEqType,
          brand: newEqBrand.trim() || undefined,
          model: newEqModel.trim() || undefined,
          serialNumber: newEqSerialNumber.trim() || undefined,
          powerRating: newEqPowerRating.trim() || undefined,
          installLocation: newEqInstallLocation.trim() || undefined,
          notes: newEqNotes.trim() || undefined,
        });
        setClientEquipments((prev) => [created, ...prev]);
        toast.success("Equipamento cadastrado e vinculado ao cliente!");
        resetNewEqForm();
        setShowAddEquipmentModal(false);
      } catch (err: any) {
        toast.error(`Erro ao salvar equipamento: ${err?.message || "Tente novamente."}`);
      } finally {
        setSavingEquipment(false);
      }
    } else {
      const item = {
        tempId: Date.now().toString(),
        type: newEqType,
        brand: newEqBrand.trim(),
        model: newEqModel.trim(),
        serialNumber: newEqSerialNumber.trim(),
        powerRating: newEqPowerRating.trim(),
        installLocation: newEqInstallLocation.trim(),
        notes: newEqNotes.trim(),
      };
      setStagedEquipments((prev) => [item, ...prev]);
      toast.success("Equipamento adicionado à lista do cliente!");
      resetNewEqForm();
      setShowAddEquipmentModal(false);
    }
  };

  const resetNewEqForm = () => {
    setNewEqType(EquipmentType.GENERATOR);
    setNewEqBrand("");
    setNewEqModel("");
    setNewEqSerialNumber("");
    setNewEqPowerRating("");
    setNewEqInstallLocation("");
    setNewEqNotes("");
  };

  const handleDeleteEquipment = async (id: string) => {
    if (clientId) {
      try {
        await equipmentApi.delete(id);
        setClientEquipments((prev) => prev.filter((e) => e.id !== id));
        toast.success("Equipamento excluído com sucesso!");
      } catch {
        toast.error("Erro ao excluir equipamento.");
      }
    } else {
      setStagedEquipments((prev) => prev.filter((e) => e.tempId !== id));
      toast.success("Equipamento removido da lista.");
    }
  };

  const openQuickModal = (type: QuickModalType) => {
    setQuickName("");
    setQuickEmail("");
    setQuickDescription("");
    setQuickRole("TECHNICIAN");
    setQuickModal(type);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!companyName.trim() || companyName.trim().length < 3) {
      e.companyName = "Razão Social obrigatória (mín. 3 caracteres)";
    }
    if (!cnpjCpf.replace(/\D/g, "")) {
      e.cnpjCpf = "CPF/CNPJ obrigatório";
    }
    if (!email.trim() || !email.includes("@")) {
      e.email = "E-mail comercial válido é obrigatório";
    }
    if (!phone.replace(/\D/g, "") || phone.replace(/\D/g, "").length < 10) {
      e.phone = "Telefone com DDD obrigatório (mín. 10 dígitos)";
    }
    if (!cep.replace(/\D/g, "") || cep.replace(/\D/g, "").length !== 8) {
      e.cep = "CEP válido com 8 dígitos é obrigatório";
    }
    if (!street.trim()) e.street = "Logradouro / Rua é obrigatório";
    if (!number.trim()) e.number = "Número é obrigatório (use S/N se não houver)";
    if (!neighborhood.trim()) e.neighborhood = "Bairro é obrigatório";
    if (!city.trim()) e.city = "Cidade é obrigatória";
    if (!state.trim() || state.trim().length !== 2) e.state = "UF (2 letras) obrigatória";

    setErrors(e);

    if (e.companyName || e.cnpjCpf) {
      setActiveTab("dados");
    } else if (e.email || e.phone || e.cep || e.street || e.number || e.neighborhood || e.city || e.state) {
      setActiveTab("contato");
    }

    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Por favor, preencha todos os campos obrigatórios marcados com asterisco (*).");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        cnpjCpf: cnpjCpf.replace(/\D/g, ""),
        companyName: companyName.trim(),
        tradeName: tradeName.trim() || undefined,
        externalCode: externalCode.trim() || undefined,
        status,
        email: email.trim(),
        phone: phone.replace(/\D/g, ""),
        billingEmail: billingEmail.trim() || undefined,
        corporatePhones: corporatePhones.filter(p => p.trim()),
        corporateEmails: corporateEmails.filter(e => e.trim()),
        address: {
          cep: cep.replace(/\D/g, ""),
          street: street.trim(),
          number: number.trim(),
          complement: complement.trim() || undefined,
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
        },
        onSiteContact: onSiteContact.trim() || undefined,
        responsibleUserId: responsibleUserId || undefined,
        responsibleTeamId: responsibleTeamId || undefined,
        groupId: groupId || undefined,
        segmentId: segmentId || undefined,
        icmsTaxpayerType: icmsTaxpayerType || undefined,
        stateRegistration: stateRegistration.trim() || undefined,
        municipalRegistration: municipalRegistration.trim() || undefined,
        notes: notes.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
      };

      if (clientId) {
        await clientsApi.update(clientId, payload);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const newClient = await clientsApi.create(payload);
        if (stagedEquipments.length > 0) {
          try {
            await Promise.all(
              stagedEquipments.map((eq) =>
                equipmentApi.create({
                  clientId: newClient.id,
                  type: eq.type,
                  brand: eq.brand || undefined,
                  model: eq.model || undefined,
                  serialNumber: eq.serialNumber || undefined,
                  powerRating: eq.powerRating || undefined,
                  installLocation: eq.installLocation || undefined,
                  notes: eq.notes || undefined,
                })
              )
            );
            toast.success(`Cliente cadastrado com ${stagedEquipments.length} equipamento(s) vinculado(s)!`);
          } catch (eqErr) {
            console.error("Erro ao salvar equipamentos:", eqErr);
            toast.warning("Cliente cadastrado, mas houve erro ao salvar alguns equipamentos.");
          }
        } else {
          toast.success("Cliente cadastrado com sucesso!");
        }
        localStorage.removeItem("setgen_client_draft");
      }

      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Tente novamente.";
      toast.error(`Erro ao salvar: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: TabKey; icon: React.ComponentType<{ className?: string }>; label: string; desc: string }[] = [
    { key: "dados", icon: Building2, label: "Dados Cadastrais", desc: "Razão social, CNPJ e dados fiscais" },
    { key: "contato", icon: Phone, label: "Contato & Endereço", desc: "Telefones, e-mails e localização física" },
    { key: "detalhes", icon: Users, label: "Detalhes & Responsáveis", desc: "Atribuição interna, equipe e contato no local" },
    { key: "equipamentos", icon: Zap, label: "Equipamentos", desc: "Geradores e máquinas vinculadas" },
    { key: "notas", icon: StickyNote, label: "Observações", desc: "Notas internas e instruções de atendimento" },
  ];

  const Err = ({ field }: { field: string }) => errors[field]
    ? <p className="text-[11px] text-red-500 mt-1 font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3 shrink-0" />{errors[field]}</p>
    : null;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#E2661D] border-t-transparent animate-spin" />
      <p className="text-xs text-slate-500 font-medium">Carregando dados do cliente...</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ===== PAINEL LATERAL (ESQUERDA) ===== */}
      <aside className="w-full lg:w-64 bg-gray-50/95 border-r border-gray-200 p-5 shrink-0 flex flex-col justify-between text-xs">
        <div className="space-y-4">
          
          {/* Identificação do Modo */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E2661D]">
                <Building2 className="w-4 h-4" />
              </div>
              {clientId ? "Editar Cliente" : "Novo Cliente"}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              status === ClientStatus.ACTIVE
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : status === ClientStatus.INACTIVE
                ? "bg-gray-100 text-gray-600 border border-gray-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}>
              {status === ClientStatus.ACTIVE ? "Ativo" : status === ClientStatus.INACTIVE ? "Inativo" : "Inadimplente"}
            </span>
          </div>

          {/* Aviso de Rascunho Disponível */}
          {draftNotice && !clientId && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-2 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Rascunho Local</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-snug">
                Você tem dados salvos de uma sessão anterior no seu navegador.
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[10.5px] font-bold transition-colors"
                >
                  Restaurar
                </button>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="px-2.5 py-1 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/50 rounded-md text-[10.5px] font-medium transition-colors"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          {/* Navegação por abas na sidebar */}
          <nav className="space-y-1">
            {tabs.map(({ key, icon: Icon, label }) => {
              const isActive = activeTab === key;
              const hasError =
                (key === "dados" && (errors.companyName || errors.cnpjCpf)) ||
                (key === "contato" && (errors.email || errors.phone || errors.cep || errors.street || errors.number || errors.neighborhood || errors.city || errors.state));

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    isActive
                      ? "bg-[#FFF3EC] text-[#E2661D] border border-orange-200/80 shadow-xs"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#E2661D]" : "text-gray-400"}`} />
                  <span className="truncate">{label}</span>
                  {hasError && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 shrink-0" title="Contém erros" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status do Cliente */}
          <div className="pt-3 border-t border-gray-200">
            <Label className="flex items-center gap-1.5 text-[11px] text-gray-600 mb-1.5 font-bold">
              <Shield className="w-3.5 h-3.5 text-[#E2661D]" />
              Status Cadastral
            </Label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ClientStatus)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 outline-none focus:border-[#E2661D]"
            >
              <option value={ClientStatus.ACTIVE}>Ativo</option>
              <option value={ClientStatus.INACTIVE}>Inativo</option>
              <option value={ClientStatus.DEFAULTER}>Inadimplente</option>
            </select>
          </div>
        </div>

        </aside>

      {/* ===== ÁREA CENTRAL ===== */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">

        {/* ===== BARRA DE AÇÕES SUPERIOR (HEADER FIXO SEMPRE VISÍVEL) ===== */}
        <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
          
          {/* Lado Esquerdo: Identificação da Aba & Breadcrumb */}
          <div className="flex items-center gap-3">
            {tabs.filter(t => t.key === activeTab).map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{label}</h3>
                  <p className="text-[11px] text-gray-400 hidden sm:block">{desc}</p>
                </div>
              </div>
            ))}
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
                  <span>{clientId ? "Salvar Alterações" : "Cadastrar Cliente"}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ===== CONTEÚDO SCROLLÁVEL ===== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs bg-[#FAFAFB]">

          {/* ============================================================== */}
          {/* === ABA 1: DADOS CADASTRAIS === */}
          {/* ============================================================== */}
          {activeTab === "dados" && (
            <div className="space-y-5">
              
              {/* Card 1: Identificação Legal */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Identificação Legal</h4>
                    <p className="text-[11px] text-gray-400">Dados oficiais e fiscais da pessoa jurídica ou física</p>
                  </div>
                </div>

                {/* CPF / CNPJ + Consulta automática */}
                <div>
                  <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#E2661D]" />
                    CPF / CNPJ <span className="text-[#E2661D]">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={cnpjCpf}
                        onChange={e => setCnpjCpf(e.target.value)}
                        placeholder="00.000.000/0000-00 ou 000.000.000-00"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCNPJLookup}
                      disabled={lookupLoading}
                      className="h-10 px-3.5 border-orange-200 text-[#E2661D] hover:bg-orange-50 text-xs font-semibold gap-1.5 whitespace-nowrap"
                    >
                      {lookupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      {lookupLoading ? "Consultando..." : "Consultar CNPJ"}
                    </Button>
                  </div>
                  <Err field="cnpjCpf" />
                </div>

                {/* Razão Social e Nome Fantasia */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#E2661D]" />
                      Razão Social <span className="text-[#E2661D]">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="Razão Social completa da empresa"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                    <Err field="companyName" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Store className="w-3.5 h-3.5 text-[#E2661D]" />
                      Nome Fantasia
                    </Label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={tradeName}
                        onChange={e => setTradeName(e.target.value)}
                        placeholder="Nome comercial conhecido"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                  </div>
                </div>

                {/* Código Externo */}
                <div>
                  <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#E2661D]" />
                    Código Externo / ERP
                  </Label>
                  <div className="relative max-w-xs">
                    <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      value={externalCode}
                      onChange={e => setExternalCode(e.target.value)}
                      placeholder="ID no Protheus, SAP, ContaAzul..."
                      className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Dados Fiscais */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Dados Fiscais & Tributários</h4>
                    <p className="text-[11px] text-gray-400">Informações necessárias para faturamento e emissão de NF-e / NFS-e</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Percent className="w-3.5 h-3.5 text-[#E2661D]" />
                      Contribuinte do ICMS
                    </Label>
                    <div className="relative">
                      <Percent className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={icmsTaxpayerType}
                        onChange={e => setIcmsTaxpayerType(e.target.value as IcmsTaxpayerType | "")}
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#E2661D] text-gray-700"
                      >
                        <option value="">Selecione o enquadramento...</option>
                        <option value={IcmsTaxpayerType.CONTRIBUINTE}>Contribuinte de ICMS</option>
                        <option value={IcmsTaxpayerType.ISENTO}>Isento de Inscrição</option>
                        <option value={IcmsTaxpayerType.NAO_CONTRIBUINTE}>Não Contribuinte</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#E2661D]" />
                      Inscrição Estadual (IE)
                    </Label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={stateRegistration}
                        onChange={e => setStateRegistration(e.target.value)}
                        placeholder="Inscrição Estadual ou ISENTO"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Landmark className="w-3.5 h-3.5 text-[#E2661D]" />
                      Inscrição Municipal (IM)
                    </Label>
                    <div className="relative">
                      <Landmark className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={municipalRegistration}
                        onChange={e => setMunicipalRegistration(e.target.value)}
                        placeholder="Inscrição Municipal (NFS-e)"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* === ABA 2: CONTATO & ENDEREÇO === */}
          {/* ============================================================== */}
          {activeTab === "contato" && (
            <div className="space-y-5">
              
              {/* Contato Principal */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Contatos Principais</h4>
                    <p className="text-[11px] text-gray-400">Canais oficiais de comunicação para agendamentos e propostas</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#E2661D]" />
                      E-mail Comercial <span className="text-[#E2661D]">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="contato@empresa.com"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                    <Err field="email" />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#E2661D]" />
                      Telefone Principal <span className="text-[#E2661D]">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                    <Err field="phone" />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#E2661D]" />
                      E-mail de Cobrança / Financeiro
                    </Label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type="email"
                        value={billingEmail}
                        onChange={e => setBillingEmail(e.target.value)}
                        placeholder="financeiro@empresa.com"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contatos Corporativos Adicionais */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Contatos Corporativos Adicionais</h4>
                    <p className="text-[11px] text-gray-400">Ramais, departamentos específicos ou diretores</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Telefones adicionais */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700">
                      <PhoneCall className="w-3.5 h-3.5 text-[#E2661D]" />
                      Telefones Corporativos / Ramais
                    </Label>
                    {corporatePhones.map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <Input
                            value={p}
                            onChange={e => {
                              const u = [...corporatePhones];
                              u[i] = e.target.value;
                              setCorporatePhones(u);
                            }}
                            placeholder="(11) 3333-4444 ou Ramal 204"
                            className="h-9 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCorporatePhones(corporatePhones.filter((_, j) => j !== i))}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover telefone"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCorporatePhones([...corporatePhones, ""])}
                      className="flex items-center gap-1.5 text-[#E2661D] hover:text-[#c95716] font-semibold text-xs pt-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar outro telefone</span>
                    </button>
                  </div>

                  {/* E-mails adicionais */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700">
                      <MailCheck className="w-3.5 h-3.5 text-[#E2661D]" />
                      E-mails Corporativos Adicionais
                    </Label>
                    {corporateEmails.map((e, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <Input
                            type="email"
                            value={e}
                            onChange={ev => {
                              const u = [...corporateEmails];
                              u[i] = ev.target.value;
                              setCorporateEmails(u);
                            }}
                            placeholder="departamento@empresa.com"
                            className="h-9 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCorporateEmails(corporateEmails.filter((_, j) => j !== i))}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover e-mail"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCorporateEmails([...corporateEmails, ""])}
                      className="flex items-center gap-1.5 text-[#E2661D] hover:text-[#c95716] font-semibold text-xs pt-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar outro e-mail</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Endereço do Cliente */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Endereço Principal</h4>
                    <p className="text-[11px] text-gray-400">Localização física para deslocamento de técnicos e entrega de geradores</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-1">
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#E2661D]" />
                      CEP <span className="text-[#E2661D]">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={cep}
                        onChange={e => {
                          setCep(e.target.value);
                          handleCepLookup(e.target.value);
                        }}
                        placeholder="00000-000"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                      {cepLoading && (
                        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#E2661D]" />
                      )}
                    </div>
                    <Err field="cep" />
                  </div>

                  <div className="md:col-span-4">
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Navigation className="w-3.5 h-3.5 text-[#E2661D]" />
                      Logradouro / Rua <span className="text-[#E2661D]">*</span>
                    </Label>
                    <div className="relative">
                      <Navigation className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        placeholder="Rua, Avenida, Estrada..."
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                    <Err field="street" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#E2661D]" />
                      Número <span className="text-[#E2661D]">*</span>
                    </Label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={number}
                        onChange={e => setNumber(e.target.value)}
                        placeholder="Ex: 123 ou S/N"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                    <Err field="number" />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Home className="w-3.5 h-3.5 text-[#E2661D]" />
                      Bairro <span className="text-[#E2661D]">*</span>
                    </Label>
                    <div className="relative">
                      <Home className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={neighborhood}
                        onChange={e => setNeighborhood(e.target.value)}
                        placeholder="Bairro"
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                    <Err field="neighborhood" />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#E2661D]" />
                      Complemento
                    </Label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={complement}
                        onChange={e => setComplement(e.target.value)}
                        placeholder="Sala 2, Galpão B..."
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#E2661D]" />
                      UF <span className="text-[#E2661D]">*</span>
                    </Label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={state}
                        onChange={e => setState(e.target.value.toUpperCase())}
                        placeholder="SP"
                        maxLength={2}
                        className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D] uppercase"
                      />
                    </div>
                    <Err field="state" />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#E2661D]" />
                    Cidade <span className="text-[#E2661D]">*</span>
                  </Label>
                  <div className="relative max-w-sm">
                    <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Nome da cidade"
                      className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                    />
                  </div>
                  <Err field="city" />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* === ABA 3: DETALHES & RESPONSÁVEIS (MULTI-CRUD COM "+") === */}
          {/* ============================================================== */}
          {activeTab === "detalhes" && (
            <div className="space-y-5">
              
              {/* Card 1: Responsáveis Internos & Atribuição */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      Responsáveis Internos & Atribuição
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Defina o colaborador e a equipe responsáveis pelo atendimento técnico e comercial
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Colaborador Responsável com botão "+" */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <UserCheck className="w-3.5 h-3.5 text-[#E2661D]" />
                        Colaborador Responsável
                      </Label>
                      <button
                        type="button"
                        onClick={() => openQuickModal("user")}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E2661D] hover:text-[#c95716] transition-colors"
                        title="Cadastrar novo colaborador rapidamente"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Colaborador</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={responsibleUserId}
                          onChange={e => setResponsibleUserId(e.target.value)}
                          className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D] transition-colors text-gray-700"
                        >
                          <option value="">Nenhum colaborador atribuído</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openQuickModal("user")}
                        className="h-10 w-10 shrink-0 border-orange-200 text-[#E2661D] hover:bg-orange-50 hover:border-[#E2661D] transition-colors"
                        title="Cadastrar novo colaborador (+)"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-[10.5px] text-gray-400 mt-1">
                      Técnico de referência ou gestor operacional da conta
                    </p>
                  </div>

                  {/* Equipe Responsável com botão "+" */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <Users className="w-3.5 h-3.5 text-[#E2661D]" />
                        Equipe Responsável
                      </Label>
                      <button
                        type="button"
                        onClick={() => openQuickModal("team")}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E2661D] hover:text-[#c95716] transition-colors"
                        title="Cadastrar nova equipe rapidamente"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nova Equipe</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={responsibleTeamId}
                          onChange={e => setResponsibleTeamId(e.target.value)}
                          className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D] transition-colors text-gray-700"
                        >
                          <option value="">Nenhuma equipe atribuída</option>
                          {teams.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openQuickModal("team")}
                        className="h-10 w-10 shrink-0 border-orange-200 text-[#E2661D] hover:bg-orange-50 hover:border-[#E2661D] transition-colors"
                        title="Cadastrar nova equipe (+)"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-[10.5px] text-gray-400 mt-1">
                      Equipe de plantão ou squad de campo encarregado
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Contato no Local / Operacional */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                    <Contact className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      Contato no Local & Operacional
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Pessoa física que receberá os técnicos no endereço de atendimento
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                    <Contact className="w-3.5 h-3.5 text-[#E2661D]" />
                    Contato no Local (Falar com)
                  </Label>
                  <div className="relative max-w-lg">
                    <Contact className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      value={onSiteContact}
                      onChange={e => setOnSiteContact(e.target.value)}
                      placeholder="Ex: Eng. Roberto Lima / Síndico Carlos / Portaria Central"
                      className="h-10 text-xs bg-white pl-9 border-gray-200 focus:border-[#E2661D]"
                    />
                  </div>
                  <p className="text-[10.5px] text-gray-400 mt-1.5">
                    Nome e cargo da pessoa que atende a equipe técnica na chegada ao local da instalação
                  </p>
                </div>
              </div>

              {/* Card 3: Classificação & Segmentação Comercial com botões "+" */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      Classificação & Segmentação Comercial
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Agrupe para relatórios, tabelas de preço diferenciadas e indicadores estratégicos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Grupo de Clientes com botão "+" */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <FolderTree className="w-3.5 h-3.5 text-[#E2661D]" />
                        Grupo de Clientes
                      </Label>
                      <button
                        type="button"
                        onClick={() => openQuickModal("group")}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E2661D] hover:text-[#c95716] transition-colors"
                        title="Cadastrar novo grupo rapidamente"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Grupo</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FolderTree className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={groupId}
                          onChange={e => setGroupId(e.target.value)}
                          className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D] transition-colors text-gray-700"
                        >
                          <option value="">Nenhum grupo atribuído</option>
                          {groups.map(g => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openQuickModal("group")}
                        className="h-10 w-10 shrink-0 border-orange-200 text-[#E2661D] hover:bg-orange-50 hover:border-[#E2661D] transition-colors"
                        title="Cadastrar novo grupo (+)"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-[10.5px] text-gray-400 mt-1">
                      Ex: Grandes Contas, Franquias, Governo
                    </p>
                  </div>

                  {/* Segmento com botão "+" */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <Target className="w-3.5 h-3.5 text-[#E2661D]" />
                        Segmento de Atuação
                      </Label>
                      <button
                        type="button"
                        onClick={() => openQuickModal("segment")}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E2661D] hover:text-[#c95716] transition-colors"
                        title="Cadastrar novo segmento rapidamente"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Segmento</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Target className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={segmentId}
                          onChange={e => setSegmentId(e.target.value)}
                          className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D] transition-colors text-gray-700"
                        >
                          <option value="">Nenhum segmento atribuído</option>
                          {segments.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openQuickModal("segment")}
                        className="h-10 w-10 shrink-0 border-orange-200 text-[#E2661D] hover:bg-orange-50 hover:border-[#E2661D] transition-colors"
                        title="Cadastrar novo segmento (+)"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-[10.5px] text-gray-400 mt-1">
                      Ex: Hospitalar, Condomínio, Indústria, Eventos
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* === ABA 4: EQUIPAMENTOS DO CLIENTE === */}
          {/* ============================================================== */}
          {activeTab === "equipamentos" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Equipamentos & Geradores do Cliente</h4>
                      <p className="text-[11px] text-gray-400">
                        {clientId
                          ? "Equipamentos registrados e vinculados a este cliente."
                          : "Adicione os equipamentos deste cliente. Eles serão criados e vinculados automaticamente ao salvar o cadastro."}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      resetNewEqForm();
                      setShowAddEquipmentModal(true);
                    }}
                    className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-semibold h-8 px-3 rounded-lg flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Equipamento</span>
                  </Button>
                </div>

                {loadingEquipments ? (
                  <div className="flex items-center justify-center py-10 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#E2661D]" />
                    <span className="text-xs text-gray-500">Carregando equipamentos...</span>
                  </div>
                ) : (clientId ? clientEquipments.length === 0 : stagedEquipments.length === 0) ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                    <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-600">Nenhum equipamento vinculado a este cliente</p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                      Clique no botão acima para adicionar grupos geradores, subestações ou painéis de comando deste cliente.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetNewEqForm();
                        setShowAddEquipmentModal(true);
                      }}
                      className="mt-4 text-xs border-orange-200 text-[#E2661D] hover:bg-orange-50 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Vincular Primeiro Equipamento
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(clientId ? clientEquipments : stagedEquipments).map((eq: any) => {
                      const idKey = clientId ? eq.id : eq.tempId;
                      return (
                        <div
                          key={idKey}
                          className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-orange-200 transition-all shadow-xs flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-[#E2661D] border border-orange-100">
                                  {eq.type === EquipmentType.GENERATOR
                                    ? "Grupo Gerador"
                                    : eq.type === EquipmentType.SUBSTATION
                                    ? "Subestação"
                                    : "Outro"}
                                </span>
                                <h5 className="font-bold text-gray-900 text-xs mt-1">
                                  {[eq.brand, eq.model].filter(Boolean).join(" - ") || "Equipamento Sem Identificação"}
                                </h5>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteEquipment(idKey)}
                                className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                title="Remover equipamento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-600">
                              {eq.powerRating && (
                                <div>
                                  <span className="text-gray-400">Potência:</span>{" "}
                                  <span className="font-semibold">{eq.powerRating}</span>
                                </div>
                              )}
                              {eq.serialNumber && (
                                <div>
                                  <span className="text-gray-400">Nº Série:</span>{" "}
                                  <span className="font-mono text-[10.5px] font-semibold">{eq.serialNumber}</span>
                                </div>
                              )}
                              {eq.installLocation && (
                                <div className="col-span-2">
                                  <span className="text-gray-400">Local:</span>{" "}
                                  <span className="font-medium text-gray-700">{eq.installLocation}</span>
                                </div>
                              )}
                              {eq.notes && (
                                <div className="col-span-2 text-gray-500 text-[10px] italic bg-gray-50 p-1.5 rounded">
                                  {eq.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* === ABA 5: OBSERVAÇÕES & NOTAS === */}
          {/* ============================================================== */}
          {activeTab === "notas" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#E2661D]">
                    <StickyNote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Observações & Anotações Internas</h4>
                    <p className="text-[11px] text-gray-400">Histórico de relacionamento e orientações de campo</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#E2661D]" />
                      Observação Operacional (Visível à equipe técnica)
                    </Label>
                    <textarea
                      rows={6}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Instruções sobre o acesso ao local, restrições de horário, EPIs necessários..."
                      className="w-full p-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D] resize-none transition-colors"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Nota Interna (Privada / Confidencial)
                    </Label>
                    <textarea
                      rows={6}
                      value={internalNotes}
                      onChange={e => setInternalNotes(e.target.value)}
                      placeholder="Anotações comerciais restritas, histórico de negociação de tarifas ou avisos da diretoria..."
                      className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ===== BARRA DE AÇÕES INFERIOR (STICKY / FIXA NO RODAPÉ) ===== */}
        <div className="sticky bottom-0 z-20 h-14 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSaveDraft}
            className="text-xs text-gray-600 hover:text-[#E2661D] hover:bg-orange-50/60 rounded-lg gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-[#E2661D]" />
            <span>Salvar como Rascunho</span>
          </Button>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-lg border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-9 px-5 rounded-lg shadow-xs gap-1.5 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{clientId ? "Salvar Alterações" : "Cadastrar Cliente"}</span>
                </>
              )}
            </Button>
          </div>
        </div>

      </main>

      {/* ===== MODAL DE CADASTRO RÁPIDO (MULTI-CRUD "+") ===== */}
      <Dialog open={!!quickModal} onOpenChange={(open) => !open && setQuickModal(null)}>
        <DialogContent className="max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
          <DialogHeader className="space-y-1 pb-3 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E2661D]">
                <Plus className="w-4 h-4" />
              </div>
              <span>
                {quickModal === "user" && "Cadastrar Novo Colaborador"}
                {quickModal === "team" && "Cadastrar Nova Equipe"}
                {quickModal === "group" && "Cadastrar Novo Grupo de Clientes"}
                {quickModal === "segment" && "Cadastrar Novo Segmento"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {quickModal === "user" && "Adicione um colaborador rapidamente para atribuir como responsável."}
              {quickModal === "team" && "Crie uma nova equipe de atendimento ou manutenção em campo."}
              {quickModal === "group" && "Crie um grupo para categorizar e filtrar este e outros clientes."}
              {quickModal === "segment" && "Defina um segmento de atuação para métricas e relatórios."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCreate} className="space-y-4 pt-2">
            <div>
              <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                Nome <span className="text-[#E2661D]">*</span>
              </Label>
              <Input
                required
                value={quickName}
                onChange={e => setQuickName(e.target.value)}
                placeholder={
                  quickModal === "user" ? "Ex: Carlos Silva" :
                  quickModal === "team" ? "Ex: Equipe Alfa - Geradores" :
                  quickModal === "group" ? "Ex: Grandes Contas Industriais" :
                  "Ex: Hospitalar / Saúde"
                }
                className="h-10 text-xs bg-white border-gray-200 focus:border-[#E2661D]"
                autoFocus
              />
            </div>

            {quickModal === "user" && (
              <>
                <div>
                  <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                    E-mail <span className="text-[#E2661D]">*</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    value={quickEmail}
                    onChange={e => setQuickEmail(e.target.value)}
                    placeholder="carlos@setgen.com.br"
                    className="h-10 text-xs bg-white border-gray-200 focus:border-[#E2661D]"
                  />
                </div>
                <div>
                  <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Perfil / Função
                  </Label>
                  <select
                    value={quickRole}
                    onChange={e => setQuickRole(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#E2661D]"
                  >
                    <option value="TECHNICIAN">Técnico Operacional</option>
                    <option value="ADMINISTRATIVE">Administrativo</option>
                    <option value="MANAGER">Gerente / Supervisor</option>
                  </select>
                </div>
              </>
            )}

            {(quickModal === "group" || quickModal === "segment") && (
              <div>
                <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Descrição (Opcional)
                </Label>
                <Input
                  value={quickDescription}
                  onChange={e => setQuickDescription(e.target.value)}
                  placeholder="Breve descrição da finalidade..."
                  className="h-10 text-xs bg-white border-gray-200 focus:border-[#E2661D]"
                />
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickModal(null)}
                className="h-9 px-4 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={quickLoading}
                className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-9 px-4 shadow-xs gap-1.5"
              >
                {quickLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Criando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Salvar e Selecionar</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* ===== MODAL ADICIONAR EQUIPAMENTO AO CLIENTE ===== */}
      <Dialog open={showAddEquipmentModal} onOpenChange={setShowAddEquipmentModal}>
        <DialogContent className="max-w-xl bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
          <DialogHeader className="space-y-1 pb-3 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E2661D]">
                <Zap className="w-4 h-4" />
              </div>
              <span>Vincular Novo Equipamento ao Cliente</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Preencha os dados técnicos do gerador ou máquina que pertence a este cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Tipo de Equipamento <span className="text-[#E2661D]">*</span>
                </Label>
                <select
                  value={newEqType}
                  onChange={(e) => setNewEqType(e.target.value as EquipmentType)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-[#E2661D]"
                >
                  <option value={EquipmentType.GENERATOR}>Grupo Gerador</option>
                  <option value={EquipmentType.SUBSTATION}>Subestação / Cabine Primária</option>
                  <option value={EquipmentType.OTHER}>Outro / Acessório / QTA</option>
                </select>
              </div>

              <div>
                <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Potência Nominal (kVA / HP / kW)
                </Label>
                <Input
                  value={newEqPowerRating}
                  onChange={(e) => setNewEqPowerRating(e.target.value)}
                  placeholder="Ex: 150 kVA, 250 kVA, 75 cv"
                  className="h-10 text-xs bg-white border-gray-200 focus:border-[#E2661D]"
                />
              </div>

              <div>
                <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Marca / Fabricante <span className="text-[#E2661D]">*</span>
                </Label>
                <Input
                  value={newEqBrand}
                  onChange={(e) => setNewEqBrand(e.target.value)}
                  placeholder="Ex: Cummins, Scania, STEMAC, Caterpillar"
                  className="h-10 text-xs bg-white border-gray-200 focus:border-[#E2661D]"
                />
              </div>

              <div>
                <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Modelo
                </Label>
                <Input
                  value={newEqModel}
                  onChange={(e) => setNewEqModel(e.target.value)}
                  placeholder="Ex: C150 D6, QSB7-G5, GTA-250"
                  className="h-10 text-xs bg-white border-gray-200 focus:border-[#E2661D]"
                />
              </div>

              <div>
                <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Número de Série (Chassi)
                </Label>
                <Input
                  value={newEqSerialNumber}
                  onChange={(e) => setNewEqSerialNumber(e.target.value)}
                  placeholder="Ex: CUM-2024-88910"
                  className="h-10 text-xs font-mono bg-white border-gray-200 focus:border-[#E2661D]"
                />
              </div>

              <div>
                <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Local / Tag de Instalação no Cliente
                </Label>
                <Input
                  value={newEqInstallLocation}
                  onChange={(e) => setNewEqInstallLocation(e.target.value)}
                  placeholder="Ex: Subsolo 2 - Sala de Máquinas Bloco B"
                  className="h-10 text-xs bg-white border-gray-200 focus:border-[#E2661D]"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Observações Técnicas do Equipamento
                </Label>
                <Input
                  value={newEqNotes}
                  onChange={(e) => setNewEqNotes(e.target.value)}
                  placeholder="Ex: Horímetro atual 1.450h, tanque 500L, QTA automático"
                  className="h-10 text-xs bg-white border-gray-200 focus:border-[#E2661D]"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddEquipmentModal(false)}
                className="h-9 px-4 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={savingEquipment}
                onClick={handleAddEquipment}
                className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-9 px-4 shadow-xs gap-1.5"
              >
                {savingEquipment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar à Lista</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
