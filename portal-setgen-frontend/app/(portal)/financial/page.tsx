"use client";

import React, { useEffect, useState } from "react";
import { expensesApi } from "@/lib/api/expenses";
import { DashboardData } from "@/types/financial";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusCard } from "@/components/ui/status-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpensesByCategory } from "@/components/financial/ExpensesByCategory";
import { CashFlowChart } from "@/components/financial/CashFlowChart";
import {
  Calendar as CalendarIcon, RefreshCw, Plus, DollarSign,
  CreditCard, Clock, Wallet, FolderTree, ArrowRight, TrendingUp
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});

const currency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function FinancialDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth, selectedYear]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const dashboardData = await expensesApi.getDashboardData(
        Number(selectedYear),
        Number(selectedMonth)
      );
      setData(dashboardData);
    } catch (error) {
      console.error("Erro ao carregar dashboard financeiro:", error);
      toast.error("Não foi possível carregar os dados financeiros do período.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Padrão Aurora Setgen */}
      <PageHeader
        title="Gestão Financeira & DRE"
        subtitle="Visão consolidada de receitas, despesas operacionais e fluxo de caixa"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor de Período Limpo */}
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-gray-200 shadow-xs">
              <CalendarIcon className="h-4 w-4 text-[#E2661D]" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[120px] h-8 text-xs border-none shadow-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[85px] h-8 text-xs border-none shadow-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y.value} value={y.value} className="text-xs">
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={loadDashboard}
                className="h-7 w-7 text-gray-500 hover:text-[#E2661D]"
                title="Atualizar Período"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <Link href="/financial/expenses">
              <Button variant="outline" className="rounded-[9px] font-bold text-xs h-9 border-gray-300 gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#E2661D]" /> Despesas & Contas a Pagar
              </Button>
            </Link>

            <Link href="/financial/expenses/new">
              <Button className="rounded-[9px] font-bold text-xs h-9 bg-[#E2661D] hover:bg-[#c95716] text-white gap-1.5 shadow-xs">
                <Plus className="w-4 h-4" /> Nova Despesa
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. KPIs com StatusCard Oficial Setgen */}
      {data ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatusCard
            label="Total de Despesas"
            value={currency(data.summary.totalExpenses)}
            description={`${data.summary.totalCount} lançamentos no período`}
            icon={DollarSign}
            variant="orange"
          />
          <StatusCard
            label="Total Pago / Liquidado"
            value={currency(data.summary.paidExpenses)}
            description={`${data.summary.paidCount} pagamentos concluídos`}
            icon={CreditCard}
            variant="emerald"
          />
          <StatusCard
            label="A Pagar / Pendente"
            value={currency(data.summary.pendingExpenses)}
            description={`${data.summary.pendingCount} títulos a vencer`}
            icon={Clock}
            variant="amber"
          />
          <StatusCard
            label="Saldo Global em Contas"
            value={currency(data.summary.totalBalance)}
            description="Disponibilidade imediata"
            icon={Wallet}
            variant="purple"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatusCard label="Total de Despesas" value="R$ 0,00" icon={DollarSign} variant="orange" />
          <StatusCard label="Pago" value="R$ 0,00" icon={CreditCard} variant="emerald" />
          <StatusCard label="Pendente" value="R$ 0,00" icon={Clock} variant="amber" />
          <StatusCard label="Saldo em Contas" value="R$ 0,00" icon={Wallet} variant="purple" />
        </div>
      )}

      {/* 3. Gráficos Analíticos com Design Limpo */}
      {isLoading && !data ? (
        <div className="flex h-72 items-center justify-center bg-white rounded-2xl border border-gray-200">
          <RefreshCw className="h-7 w-7 animate-spin text-[#E2661D]" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CashFlowChart data={data.cashFlow} />
          <ExpensesByCategory data={data.byCategory} />
        </div>
      ) : (
        <Card className="text-center py-20 rounded-2xl border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Nenhum dado financeiro encontrado para este período.</p>
        </Card>
      )}
    </div>
  );
}
