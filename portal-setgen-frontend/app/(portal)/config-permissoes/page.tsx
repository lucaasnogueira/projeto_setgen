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
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#1B2834] flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#E2661D]" />
            Acesso e Permissões
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configurador de Matriz RBAC</p>
        </div>
        <button className="px-5 py-2.5 rounded-lg bg-[#E2661D] text-white text-sm font-bold flex items-center gap-2">
          <Save className="w-4 h-4" /> Salvar Alterações
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 px-2">
        <button 
          onClick={() => setActiveTab("matrix")} 
          className={
            "px-4 py-3 text-sm font-bold border-b-2 " + 
            (activeTab === "matrix" ? "border-[#E2661D] text-[#E2661D]" : "border-transparent text-slate-500")
          }
        >
          <div className="flex items-center gap-2"><Settings className="w-4 h-4"/> Matriz de Papéis</div>
        </button>
        <button 
          onClick={() => setActiveTab("users")} 
          className={
            "px-4 py-3 text-sm font-bold border-b-2 " + 
            (activeTab === "users" ? "border-[#E2661D] text-[#E2661D]" : "border-transparent text-slate-500")
          }
        >
          <div className="flex items-center gap-2"><Users className="w-4 h-4"/> Atribuição por Usuário</div>
        </button>
      </div>

      {activeTab === "matrix" && (
        <div className="flex gap-6">
          <div className="w-64 shrink-0 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Papéis Fixos</h3>
            {ROLES.map(role => (
              <button 
                key={role.id} 
                onClick={() => setSelectedRole(role)} 
                className={
                  "p-3 rounded-xl border text-left transition-all " + 
                  (selectedRole.id === role.id ? "bg-slate-800 border-slate-900 text-white shadow-lg" : "bg-white border-slate-200 text-slate-600")
                }
              >
                <div className="font-bold text-sm">{role.name}</div>
                <div className={
                  "text-[10px] mt-1 " + 
                  (selectedRole.id === role.id ? "text-slate-300" : "text-slate-400")
                }>
                  ID: {role.id}
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-[#1B2834]">Permissões de: {selectedRole.name}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                    <th className="p-4 font-bold uppercase tracking-wider w-1/3">Módulo / Recurso</th>
                    {ACTIONS.map(act => <th key={act.id} className="p-4 font-bold uppercase tracking-wider text-center">{act.name}</th>)}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {MODULES.map((mod) => (
                    <tr key={mod.id} className="border-b border-slate-100">
                      <td className="p-4 font-semibold text-slate-700">{mod.icon} <span className="ml-2">{mod.name}</span></td>
                      {ACTIONS.map(act => {
                        const granted = isGranted(mod.id, act.id);
                        const disabled = selectedRole.id === "ADMIN";
                        return (
                          <td key={act.id} className="p-4 text-center">
                            <button 
                              onClick={() => !disabled && togglePermission(mod.id, act.id)} 
                              disabled={disabled} 
                              className={
                                "w-6 h-6 rounded flex items-center justify-center mx-auto transition-all " + 
                                (granted ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-300 border") + " " +
                                (disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer")
                              }
                            >
                              {granted && <Check className="w-4 h-4" />}
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
          <h2 className="text-lg font-bold text-[#1B2834] mb-6">Atribuir Perfis aos Usuários</h2>
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">Busca e Atribuição</p>
            <p className="text-sm mt-1">Busque um usuário para alterar o perfil.</p>
          </div>
        </div>
      )}
    </div>
  );
}
