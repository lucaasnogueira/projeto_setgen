"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  FileText,
  Users,
  BarChart3,
  Settings,
  ShoppingCart,
  CreditCard,
  Contact,
  Calendar,
  MessageSquare,
  Mail,
  Bell,
  Shield,
  LayoutGrid,
  Layers,
  Wrench,
  Database,
  Zap,
  Briefcase,
  Wallet,
  Landmark,
  Plus,
  Search,
  Trash2,
  Edit3,
  Power,
  Check,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  Sparkles,
  LucideIcon,
  RefreshCw,
} from "lucide-react";
import { systemModulesApi, SystemModule, CreateSystemModuleDto } from "@/lib/api/system-modules";

const AVAILABLE_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: "Package", icon: Package, label: "Pacote / Caixa" },
  { name: "Truck", icon: Truck, label: "Caminhão / Logística" },
  { name: "FileText", icon: FileText, label: "Documentos / OS" },
  { name: "Users", icon: Users, label: "Usuários / Clientes" },
  { name: "BarChart3", icon: BarChart3, label: "Gráficos / Métricas" },
  { name: "Settings", icon: Settings, label: "Configurações" },
  { name: "ShoppingCart", icon: ShoppingCart, label: "Compras / Carrinho" },
  { name: "CreditCard", icon: CreditCard, label: "Cartão / Faturamento" },
  { name: "Contact", icon: Contact, label: "Contatos / RH" },
  { name: "Calendar", icon: Calendar, label: "Agenda / Calendário" },
  { name: "MessageSquare", icon: MessageSquare, label: "Mensagens / Chat" },
  { name: "Mail", icon: Mail, label: "E-mails" },
  { name: "Bell", icon: Bell, label: "Notificações" },
  { name: "Shield", icon: Shield, label: "Segurança / Permissões" },
  { name: "LayoutGrid", icon: LayoutGrid, label: "Painel / Grade" },
  { name: "Layers", icon: Layers, label: "Camadas / Macro" },
  { name: "Wrench", icon: Wrench, label: "Manutenção / Ferramentas" },
  { name: "Database", icon: Database, label: "Banco / Dados" },
  { name: "Zap", icon: Zap, label: "Energia / Geradores" },
  { name: "Briefcase", icon: Briefcase, label: "Comercial / Propostas" },
  { name: "Wallet", icon: Wallet, label: "Caixa / Reembolsos" },
  { name: "Landmark", icon: Landmark, label: "Fiscal / Tributário" },
];

const ICON_MAP = AVAILABLE_ICONS.reduce<Record<string, LucideIcon>>((acc, item) => {
  acc[item.name] = item.icon;
  return acc;
}, {});

const PRESET_ROUTES = [
  { route: "/dashboard", label: "/dashboard — Painel Executivo" },
  { route: "/quotes", label: "/quotes — Comercial & Propostas" },
  { route: "/orders", label: "/orders — Ordens de Serviço & Campo" },
  { route: "/clients", label: "/clients — Gestão de Clientes" },
  { route: "/inventory", label: "/inventory — Estoque de Peças" },
  { route: "/equipment", label: "/equipment — Equipamentos & Geradores" },
  { route: "/fleet", label: "/fleet — Frotas & Veículos" },
  { route: "/financial", label: "/financial — Financeiro & Caixa" },
  { route: "/procurement", label: "/procurement — Compras & Suprimentos" },
  { route: "/rh/employees", label: "/rh/employees — Recursos Humanos" },
  { route: "/settings/modules", label: "/settings/modules — Gestão de Módulos" },
  { route: "/roles", label: "/roles — Cargos e Permissões" },
];

export default function GestaoModulosPage() {
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formRoute, setFormRoute] = useState("");
  const [formCustomRoute, setFormCustomRoute] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Package");

  const loadModules = async () => {
    try {
      setLoading(true);
      const data = await systemModulesApi.getAll(false);
      setModules(data);
    } catch (err: any) {
      console.error("Erro ao carregar módulos:", err);
      setFeedback({
        type: "error",
        message: "Não foi possível carregar os módulos. Verifique a conexão com a API.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleCancel = () => {
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormRoute("");
    setFormCustomRoute("");
    setSelectedIcon("Package");
  };

  const handleEdit = (mod: SystemModule) => {
    setEditingId(mod.id);
    setFormName(mod.name);
    setFormDescription(mod.description || "");
    setSelectedIcon(mod.icon || "Layers");

    const isPreset = PRESET_ROUTES.some((p) => p.route === mod.route);
    if (isPreset) {
      setFormRoute(mod.route);
      setFormCustomRoute("");
    } else {
      setFormRoute("custom");
      setFormCustomRoute(mod.route);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFeedback({ type: "error", message: "O nome do módulo é obrigatório." });
      return;
    }

    const finalRoute = formRoute === "custom" ? formCustomRoute.trim() : formRoute.trim();
    if (!finalRoute) {
      setFeedback({ type: "error", message: "Selecione ou informe a rota do módulo." });
      return;
    }

    try {
      setSaving(true);
      const payload: CreateSystemModuleDto = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        route: finalRoute.startsWith("/") ? finalRoute : `/${finalRoute}`,
        icon: selectedIcon,
      };

      if (editingId) {
        await systemModulesApi.update(editingId, payload);
        setFeedback({ type: "success", message: `Módulo "${formName}" atualizado com sucesso!` });
      } else {
        await systemModulesApi.create(payload);
        setFeedback({ type: "success", message: `Módulo "${formName}" cadastrado com sucesso!` });
      }

      handleCancel();
      await loadModules();
    } catch (err: any) {
      console.error("Erro ao salvar módulo:", err);
      const msg = err.response?.data?.message || "Ocorreu um erro ao salvar o módulo.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (mod: SystemModule) => {
    try {
      await systemModulesApi.toggleStatus(mod.id);
      setModules((prev) =>
        prev.map((item) => (item.id === mod.id ? { ...item, isActive: !item.isActive } : item))
      );
      setFeedback({
        type: "success",
        message: `Módulo "${mod.name}" ${!mod.isActive ? "ativado" : "desativado"} com sucesso!`,
      });
    } catch (err: any) {
      console.error("Erro ao alternar status:", err);
      setFeedback({ type: "error", message: "Erro ao atualizar status do módulo." });
    }
  };

  const handleDelete = async (mod: SystemModule) => {
    if (!confirm(`Deseja realmente remover o módulo "${mod.name}"?`)) return;

    try {
      await systemModulesApi.delete(mod.id);
      setModules((prev) => prev.filter((item) => item.id !== mod.id));
      if (editingId === mod.id) handleCancel();
      setFeedback({ type: "success", message: `Módulo "${mod.name}" excluído com sucesso.` });
    } catch (err: any) {
      console.error("Erro ao remover módulo:", err);
      const msg = err.response?.data?.message || "Não foi possível remover este módulo.";
      setFeedback({ type: "error", message: msg });
    }
  };

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code.toLowerCase().includes(search.toLowerCase()) ||
        m.route.toLowerCase().includes(search.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && m.isActive) ||
        (statusFilter === "inactive" && !m.isActive);

      return matchSearch && matchStatus;
    });
  }, [modules, search, statusFilter]);

  const IconSelectedComponent = ICON_MAP[selectedIcon] || Package;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-7 pb-16">
      
      {/* ─── Breadcrumb e Cabeçalho Superior ─── */}
      <div className="space-y-1.5">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Configurações</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#E2661D] font-semibold">Gestão de Módulos</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1B2834]">
              Gerenciamento de Módulos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Gerencie os macro-módulos e permissões do sistema
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadModules}
              title="Recarregar catálogo"
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#E2661D]" : ""}`} />
            </button>
            <div className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-[#E2661D] text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{modules.filter((m) => m.isActive).length} Módulos Ativos</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Feedback Toast ─── */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between shadow-xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs text-slate-400 hover:text-slate-700 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Card de Formulário: Cadastrar / Editar Novo Módulo ─── */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm border-l-4 border-l-[#E2661D] overflow-hidden transition-all">
        <div className="p-6 md:p-7">
          
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 text-[#E2661D] flex items-center justify-center">
              <IconSelectedComponent className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1B2834]">
                {editingId ? "Editar Módulo Cadastrado" : "Cadastrar Novo Módulo"}
              </h2>
              {editingId && (
                <p className="text-[11px] text-[#E2661D] font-medium">
                  Alterando dados do módulo selecionado. Clique em &quot;Cancelar&quot; para sair do modo de edição.
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
              
              {/* Coluna Esquerda: Campos de Texto */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Nome do Módulo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nome do Módulo <span className="text-[#E2661D]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Financeiro, Logística, RH"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D] transition-colors"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Descrição
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {formDescription.length}/500 caracteres
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Breve descrição da finalidade deste módulo..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D] transition-colors resize-none"
                  />
                </div>

                {/* Rota do Módulo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Rota do Módulo <span className="text-[#E2661D]">*</span>
                  </label>
                  <select
                    value={formRoute}
                    onChange={(e) => setFormRoute(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 focus:outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D] transition-colors"
                  >
                    <option value="">Selecione uma rota...</option>
                    {PRESET_ROUTES.map((p) => (
                      <option key={p.route} value={p.route}>
                        {p.label}
                      </option>
                    ))}
                    <option value="custom">➕ Outra rota personalizada...</option>
                  </select>

                  {formRoute === "custom" && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        required
                        value={formCustomRoute}
                        onChange={(e) => setFormCustomRoute(e.target.value)}
                        placeholder="Ex: /armazem-geral ou /aereo"
                        className="w-full px-3.5 py-2 rounded-lg border border-[#E2661D]/50 bg-white text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D]"
                      />
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Selecione a página do sistema que este módulo representa.
                  </p>
                </div>

              </div>

              {/* Coluna Direita: Ícone de Identificação */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ícone de Identificação
                  </label>

                  <div className="grid grid-cols-6 gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 max-h-[195px] overflow-y-auto">
                    {AVAILABLE_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = selectedIcon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          title={item.label}
                          onClick={() => setSelectedIcon(item.name)}
                          className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-[#E2661D] text-white shadow-md shadow-orange-500/20 scale-105"
                              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/70"
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2">
                    Selecione um ícone que melhor represente este módulo.
                  </p>
                </div>
              </div>

            </div>

            {/* Rodapé com Botões de Ação */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-[#1C2733] hover:bg-[#263443] text-white text-xs font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingId ? "Atualizar Módulo" : "Salvar Módulo"}</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </section>

      {/* ─── Barra de Filtros e Busca dos Módulos Cadastrados ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, código ou rota..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D]"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Todos ({modules.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              statusFilter === "active"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Ativos ({modules.filter((m) => m.isActive).length})
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              statusFilter === "inactive"
                ? "bg-white text-slate-700 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Inativos ({modules.filter((m) => !m.isActive).length})
          </button>
        </div>

      </div>

      {/* ─── Grid de Módulos (Cards Estilo Aurora) ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#E2661D] border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500">Carregando catálogo de módulos...</p>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#E2661D] flex items-center justify-center mx-auto mb-3">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Nenhum módulo encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Não encontramos módulos correspondentes ao filtro aplicado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map((mod) => {
            const IconComponent = ICON_MAP[mod.icon] || Package;
            const isEditingThis = editingId === mod.id;

            return (
              <div
                key={mod.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-all flex flex-col justify-between hover:shadow-md ${
                  isEditingThis
                    ? "border-[#E2661D] ring-2 ring-[#E2661D]/20 shadow-md"
                    : mod.isActive
                    ? "border-slate-200 hover:border-slate-300"
                    : "border-slate-200 opacity-60 bg-slate-50/40"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        mod.isActive
                          ? "bg-orange-50 text-[#E2661D] border border-orange-100"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(mod)}
                        title={mod.isActive ? "Desativar Módulo" : "Ativar Módulo"}
                        className={`p-1.5 rounded-md transition-colors ${
                          mod.isActive
                            ? "text-emerald-600 hover:bg-emerald-50"
                            : "text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEdit(mod)}
                        title="Editar Informações"
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(mod)}
                        title="Excluir Módulo"
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                        {mod.name}
                      </h3>
                      {!mod.isActive && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {mod.description || "Nenhuma descrição informada."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <Link
                    href={mod.route}
                    title="Acessar módulo"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-orange-50 hover:text-[#E2661D] text-slate-600 font-mono text-[11px] font-medium transition-colors"
                  >
                    <span>{mod.route}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </Link>

                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#E2661D]" />
                    <span>{mod._count?.permissions || 0} atividade(s)</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
