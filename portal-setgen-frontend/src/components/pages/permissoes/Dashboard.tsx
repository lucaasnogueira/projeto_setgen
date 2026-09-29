"use client";

import React, { useEffect, useState } from "react";
import { Users, Key, Shield, Layers, ArrowRight, UserCheck, AlertTriangle, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import api from "@/services/api";

export function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalModules: 0,
    totalPermissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersRes, modulesRes] = await Promise.allSettled([
          api.get("/users"),
          api.get("/access-control/me/modules"),
        ]);

        const users = usersRes.status === "fulfilled" ? usersRes.value.data : [];
        const rawUsers = Array.isArray(users) ? users : users.data || [];
        const modules = modulesRes.status === "fulfilled" ? modulesRes.value.data : { modules: [] };
        const rawModules = Array.isArray(modules) ? modules : modules.modules || [];

        setStats({
          totalUsers: rawUsers.length,
          activeUsers: rawUsers.filter((u: any) => u.active !== false && u.isActive !== false).length,
          totalModules: rawModules.length || 8,
          totalPermissions: 36,
        });
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Total de Usuários</span>
            <div className="text-2xl font-bold text-foreground mt-0.5">{loading ? "..." : stats.totalUsers}</div>
            <span className="text-[10px] text-muted-foreground">Cadastrados no portal</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-card border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Usuários Ativos</span>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">{loading ? "..." : stats.activeUsers}</div>
            <span className="text-[10px] text-muted-foreground">Com acesso liberado</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-card border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Módulos no Catálogo</span>
            <div className="text-2xl font-bold text-primary mt-0.5">{loading ? "..." : stats.totalModules}</div>
            <span className="text-[10px] text-muted-foreground">Ambientes operacionais</span>
          </div>
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Layers className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-card border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Permissões Mapeadas</span>
            <div className="text-2xl font-bold text-purple-600 mt-0.5">{loading ? "..." : stats.totalPermissions}</div>
            <span className="text-[10px] text-muted-foreground">Flags e ações atômicas</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600">
            <Key className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Seções de Acesso Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 bg-card border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Gestão e Cadastro de Usuários</h3>
              <p className="text-xs text-muted-foreground">
                Criação de usuários locais, vinculação com Active Directory, troca de perfis e bloqueio.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Administre contas corporativas, redefina senhas com envio de e-mail seguro e audite sessões ativas com revogação forçada de tokens.
          </p>
          <Link href="/permissoes/usuario" className="inline-block">
            <Button size="sm" className="rounded-xl text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white">
              Ir para Usuários <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 space-y-4 bg-card border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Matriz Interativa de Acessos</h3>
              <p className="text-xs text-muted-foreground">
                Controle hierárquico em 4 níveis (Grupo ➔ Módulo ➔ Atividade ➔ Ações).
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Selecione colaboradores em tempo real, ligue/desligue módulos inteiros, clone permissões entre usuários ou aplique templates de cargo em lote.
          </p>
          <Link href="/permissoes/gestao" className="inline-block">
            <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
              Abrir Matriz de Permissões <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;

