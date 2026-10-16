"use client";

import React, { useState } from "react";
import { ShieldCheck, Users, Search, Save, Check, ShieldAlert, Settings } from "lucide-react";

const ROLES = [
  { id: "ADMIN", name: "Super Admin", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "MANAGER", name: "Gerente Geral", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "ADMINISTRATIVE", name: "Administrativo", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "WAREHOUSE", name: "Almoxarifado", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "TECHNICIAN", name: "Técnico", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "CLIENT", name: "Cliente", color: "bg-orange-100 text-orange-700 border-orange-200" }
];

const MODULES = [
  { id: "os", name: "Ordens de Serviço", icon: "🛠️" },
  { id: "clients", name: "Clientes e Contratos", icon: "🏢" },
  { id: "inventory", name: "Armazém e Estoque", icon: "📦" },
  { id: "finance", name: "Financeiro e Fiscal", icon: "💵" },
  { id: "quotes", name: "Orçamentos", icon: "📝" },
  { id: "config", name: "Configurações", icon: "⚙️" }
];

const ACTIONS = [
  { id: "view", name: "Ler / Ver" },
  { id: "create", name: "Criar" },
  { id: "edit", name: "Editar" },
  { id: "delete", name: "Excluir" },
  { id: "approve", name: "Aprovar" }
];

export default function PermissoesPage() {
  const [activeTab, setActiveTab] = useState("matrix");
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [matrix, setMatrix] = useState<Record<string, boolean>>({});

  const togglePermission = (modId: string, actionId: string) => {
    const key = selectedRole.id + "_" + modId + "_" + actionId;
    setMatrix(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isGranted = (modId: string, actionId: string) => {
    if (selectedRole.id === "ADMIN") return true;
    return !!matrix[selectedRole.id + "_" + modId + "_" + actionId];
  };

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-7xl mx-auto w-full pb-8">
      <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-gray-200/80 flex justify-between items-center">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#1B2834] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#E2661D]" />
            Acesso e Permissões
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Configurador de Matriz RBAC</p>
        </div>
        <button className="h-9 px-4 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-2xs flex items-center gap-2 transition-colors">
          <Save className="w-3.5 h-3.5" /> Salvar Alterações
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 px-2">
        <button 
          onClick={() => setActiveTab("matrix")} 
          className={
            "px-3 py-2 text-xs font-bold border-b-2 " + 
            (activeTab === "matrix" ? "border-[#E2661D] text-[#E2661D]" : "border-transparent text-slate-500 hover:text-slate-700")
          }
        >
          <div className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5"/> Matriz de Papéis</div>
        </button>
        <button 
          onClick={() => setActiveTab("users")} 
          className={
            "px-3 py-2 text-xs font-bold border-b-2 " + 
            (activeTab === "users" ? "border-[#E2661D] text-[#E2661D]" : "border-transparent text-slate-500 hover:text-slate-700")
          }
        >
          <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Atribuição por Usuário</div>
        </button>
      </div>

      {activeTab === "matrix" && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-60 shrink-0 flex flex-col gap-1.5">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Papéis Fixos</h3>
            {ROLES.map(role => (
              <button 
                key={role.id} 
                onClick={() => setSelectedRole(role)} 
                className={
                  "p-2.5 rounded-lg border text-left transition-all " + 
                  (selectedRole.id === role.id ? "bg-slate-800 border-slate-900 text-white shadow-2xs" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300")
                }
              >
                <div className="font-bold text-xs">{role.name}</div>
                <div className={
                  "text-[10px] mt-0.5 " + 
                  (selectedRole.id === role.id ? "text-slate-300" : "text-slate-400")
                }>
                  ID: {role.id}
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-2xs border border-gray-200/80 overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs sm:text-sm font-bold text-[#1B2834]">Permissões de: {selectedRole.name}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider w-1/3">Módulo / Recurso</th>
                    {ACTIONS.map(act => <th key={act.id} className="py-2.5 px-3 font-bold uppercase tracking-wider text-center">{act.name}</th>)}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {MODULES.map((mod) => (
                    <tr key={mod.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{mod.icon} <span className="ml-2">{mod.name}</span></td>
                      {ACTIONS.map(act => {
                        const granted = isGranted(mod.id, act.id);
                        const disabled = selectedRole.id === "ADMIN";
                        return (
                          <td key={act.id} className="py-2.5 px-3 text-center">
                            <button 
                              onClick={() => !disabled && togglePermission(mod.id, act.id)} 
                              disabled={disabled} 
                              className={
                                "w-5 h-5 rounded flex items-center justify-center mx-auto transition-all " + 
                                (granted ? "bg-emerald-500 text-white shadow-2xs" : "bg-slate-100 text-slate-300 border border-slate-200") + " " +
                                (disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer")
                              }
                            >
                              {granted && <Check className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-2xs border border-gray-200/80 min-h-[350px]">
          <h2 className="text-xs sm:text-sm font-bold text-[#1B2834] mb-4">Atribuir Perfis aos Usuários</h2>
          <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 text-xs">Busca e Atribuição</p>
            <p className="text-xs mt-1">Busque um usuário para alterar o perfil.</p>
          </div>
        </div>
      )}
    </div>
  );
}
