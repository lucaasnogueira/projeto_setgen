"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  LayoutGrid,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  TrendingUp,
  FileText,
  Users,
  Compass,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OperationsPipeline } from "./components/OperationsPipeline";
import { OperationsCalendar } from "./components/OperationsCalendar";

export default function OperationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pipeline" | "calendar">("pipeline");

  return (
    <div className="space-y-5 pb-10">
      {/* Page Header */}
      <PageHeader
        title="Controle de Operações"
        subtitle={
          activeTab === "pipeline"
            ? "Esteira ponta a ponta dos clientes: da visita técnica ao faturamento e pós-venda"
            : "Quadro calendário unificado: escala e visitas técnicas por data e equipe"
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/visits/new")}
              className="rounded-xl font-semibold text-xs gap-1.5 h-9"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              Agendar Visita
            </Button>
            <Button
              onClick={() => router.push("/orders/new")}
              className="rounded-xl font-bold text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white h-9 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova Ordem de Serviço
            </Button>
          </div>
        }
      />

      {/* 4 Status Cards Setgen KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <StatusCard
          label="Processos Ativos"
          value={5}
          icon={Compass}
          variant="orange"
        />
        <StatusCard
          label="Aguardando Follow-up"
          value={2}
          icon={AlertCircle}
          variant="amber"
        />
        <StatusCard
          label="O.S. em Execução"
          value={2}
          icon={Clock}
          variant="blue"
        />
        <StatusCard
          label="Visitas Técnicas no Mês"
          value={7}
          icon={CalendarIcon}
          variant="emerald"
        />
      </div>

      {/* Main Tabs: Pipeline vs Calendar */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "pipeline" | "calendar")}
        className="space-y-4"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <TabsList className="bg-muted/70 p-1 rounded-xl">
            <TabsTrigger
              value="pipeline"
              className="rounded-lg text-xs font-bold gap-2 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground shadow-2xs"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              Esteira de Clientes (Pipeline)
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="rounded-lg text-xs font-bold gap-2 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground shadow-2xs"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              Quadro Calendário de Visitas
            </TabsTrigger>
          </TabsList>

          <span className="text-xs text-text-muted hidden sm:inline-block font-medium">
            Setgen Operações v1.0 • Protótipo Interativo
          </span>
        </div>

        <TabsContent value="pipeline" className="mt-0 focus-visible:outline-none">
          <OperationsPipeline />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0 focus-visible:outline-none">
          <OperationsCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}

