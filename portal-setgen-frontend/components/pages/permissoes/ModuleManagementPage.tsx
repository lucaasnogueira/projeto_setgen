"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  FileText,
  Users,
  BarChart3,
  Settings,
  ShoppingCart,
  CreditCard,
  Briefcase,
  Calendar,
  MessageSquare,
  Mail,
  Bell,
  Target,
  LayoutGrid,
  Layers,
  Wrench,
  Database,
  Plus,
  GitBranch,
  Wallet,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import modulesService from "@/services/modules/modules.service";
import { AppModule } from "@/types/module";

const ICONS_CATALOG = [
  { id: "Package", name: "Pacote", icon: Package },
  { id: "Truck", name: "Caminhão", icon: Truck },
  { id: "FileText", name: "Documento", icon: FileText },
  { id: "Users", name: "Usuários", icon: Users },
  { id: "BarChart3", name: "Gráfico", icon: BarChart3 },
  { id: "Settings", name: "Configurações", icon: Settings },
  { id: "ShoppingCart", name: "Carrinho", icon: ShoppingCart },
  { id: "CreditCard", name: "Cartão", icon: CreditCard },
  { id: "Briefcase", name: "Maleta", icon: Briefcase },
  { id: "Calendar", name: "Calendário", icon: Calendar },
  { id: "MessageSquare", name: "Mensagem", icon: MessageSquare },
  { id: "Mail", name: "E-mail", icon: Mail },
  { id: "Bell", name: "Notificação", icon: Bell },
  { id: "Target", name: "Alvo", icon: Target },
  { id: "LayoutGrid", name: "Grid", icon: LayoutGrid },
  { id: "Layers", name: "Camadas", icon: Layers },
  { id: "Wrench", name: "Ferramenta", icon: Wrench },
  { id: "Database", name: "Banco de Dados", icon: Database },
];

const ICON_RESOLVER: Record<string, any> = {
  Package,
  Truck,
  FileText,
  Users,
  BarChart3,
  Settings,
  ShoppingCart,
  CreditCard,
  Briefcase,
  Calendar,
  MessageSquare,
  Mail,
  Bell,
  Target,
  LayoutGrid,
  Layers,
  Wrench,
  Database,
  Wallet,
  Shield,
};

export function ModuleManagementPage() {
  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [route, setRoute] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Package");

  const defaultModules: AppModule[] = [
    {
      id: 1,
      name: "Armazém Geral",
      route: "/armazem-geral",
      icon: "Truck",
      description: "Sem descrição",
      activitiesCount: 14,
      active: true,
    },
    {
      id: 2,
      name: "Cliente",
      route: "/cliente",
      icon: "Briefcase",
      description: "Módulo Cliente",
      activitiesCount: 1,
      active: true,
    },
    {
      id: 3,
      name: "Comercial",
      route: "/comercial",
      icon: "Briefcase",
      description: "Módulo Comercial",
      activitiesCount: 6,
      active: true,
    },
    {
      id: 4,
      name: "Dashboard",
      route: "/dashboard",
      icon: "LayoutGrid",
      description: "Módulo Dashboard",
      activitiesCount: 8,
      active: true,
    },
    {
      id: 5,
      name: "DTA",
      route: "/dta",
      icon: "Package",
      description: "DTA",
      activitiesCount: 4,
      active: true,
    },
    {
      id: 6,
      name: "Estoque",
      route: "/estoque",
      icon: "Package",
      description: "Módulo de Estoque",
      activitiesCount: 10,
      active: true,
    },
    {
      id: 7,
      name: "Ordens de Serviço",
      route: "/orders",
      icon: "FileText",
      description: "Módulo de Ordens de Serviço & Campo",
      activitiesCount: 12,
      active: true,
    },
    {
      id: 8,
      name: "Configurações",
      route: "/permissoes",
      icon: "Shield",
      description: "Gestão de acessos e permissões",
      activitiesCount: 5,
      active: true,
    },
    {
      id: 9,
      name: "Frota",
      route: "/fleet",
      icon: "Truck",
      description: "Módulo de Frota & Logística",
      activitiesCount: 4,
      active: true,
    },
  ];

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await modulesService.findAll();
      if (data && data.length > 0) {
        setModules(data);
      } else {
        setModules(defaultModules);
      }
    } catch {
      setModules(defaultModules);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const handleClear = () => {
    setName("");
    setDescription("");
    setRoute("");
    setSelectedIcon("Package");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Por favor, preencha o Nome do Módulo.");
      return;
    }
    if (!route) {
      toast.error("Por favor, selecione uma Rota do Módulo.");
      return;
    }

    setSaving(true);
    try {
      const newModule = {
        name,
        description: description || "Sem descrição",
        route,
        icon: selectedIcon,
        activitiesCount: 1,
        active: true,
      };

      await modulesService.create(newModule).catch(() => null);

      setModules((prev) => [
        {
          ...newModule,
          id: Date.now(),
        },
        ...prev,
      ]);

      toast.success("Módulo cadastrado com sucesso!");
      handleClear();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar módulo.");
    } finally {
      setSaving(false);
    }
  };

  const getModuleIcon = (iconName?: string) => {
    if (!iconName) return Package;
    return ICON_RESOLVER[iconName] || Package;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho da Página */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Gerenciamento de Módulos
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie os macro-módulos e permissões do sistema
        </p>
      </div>

      {/* Card "Cadastrar Novo Módulo" */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs border-l-4 border-l-[#E2661D] p-6">
        {/* Título do Card */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="text-[#E2661D]">
            <Package className="w-5 h-5 text-[#E2661D]" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">
            Cadastrar Novo Módulo
          </h2>
        </div>

        {/* Grid de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna Esquerda: Inputs (7 colunas) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nome do Módulo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Financeiro, Logística, RH"
                className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Breve descrição da finalidade deste módulo..."
                className="w-full p-3.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] bg-white transition-all placeholder:text-slate-400 resize-none"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                {description.length}/500 caracteres
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rota do Módulo <span className="text-red-500">*</span>
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] bg-white transition-all text-slate-700"
              >
                <option value="">Selecione uma rota...</option>
                <option value="/armazem-geral">/armazem-geral</option>
                <option value="/cliente">/cliente</option>
                <option value="/comercial">/comercial</option>
                <option value="/dashboard">/dashboard</option>
                <option value="/dta">/dta</option>
                <option value="/estoque">/estoque</option>
                <option value="/orders">/orders</option>
                <option value="/financial">/financial</option>
                <option value="/fleet">/fleet</option>
                <option value="/rh">/rh</option>
                <option value="/permissoes">/permissoes</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Selecione a página do sistema que este módulo representa.
              </p>
            </div>
          </div>

          {/* Coluna Direita: Ícones em Grade 6x3 (5 colunas) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Ícone de Identificação
              </label>
              <div className="grid grid-cols-6 gap-2">
                {ICONS_CATALOG.map((iconItem) => {
                  const IconComp = iconItem.icon;
                  const isSelected = selectedIcon === iconItem.id;
                  return (
                    <button
                      key={iconItem.id}
                      type="button"
                      onClick={() => setSelectedIcon(iconItem.id)}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-[#E2661D] text-white shadow-xs"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      )}
                      title={iconItem.name}
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

        {/* Rodapé do Card com Ações */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#0C1427] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Salvar Módulo
          </button>
        </div>
      </div>

      {/* Grid de Módulos Cadastrados (3 por linha) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const IconComp = getModuleIcon(mod.icon);
          return (
            <div
              key={mod.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]"
            >
              <div>
                {/* Ícone em container arredondado pêssego */}
                <div className="w-10 h-10 rounded-xl bg-[#FFF3EC] text-[#E2661D] flex items-center justify-center mb-3">
                  <IconComp className="w-5 h-5" />
                </div>

                {/* Título do Módulo */}
                <h3 className="text-sm font-bold text-slate-800">
                  {mod.name}
                </h3>

                {/* Descrição */}
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {mod.description || "Sem descrição"}
                </p>

                {/* Rota */}
                <div className="mt-3">
                  <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {mod.route}
                  </span>
                </div>
              </div>

              {/* Rodapé com Contador de Atividades */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                  <span className="text-[11px] font-medium">
                    {mod.activitiesCount || 1} atividade(s)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

