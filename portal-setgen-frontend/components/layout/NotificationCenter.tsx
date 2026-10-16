"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bell, FileText, AlertTriangle, CheckCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { approvalsApi } from "@/lib/api/approvals"
import { inventoryApi } from "@/lib/api/inventory"
import { useAuthStore } from "@/store/auth"
import { cn } from "@/lib/utils"

interface NotificationItem {
  id: string
  title: string
  description: string
  type: "approval" | "stock"
  href: string
}

const TYPE_STYLE: Record<NotificationItem["type"], { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  approval: { icon: FileText, className: "bg-status-blue-bg text-status-blue-fg" },
  stock: { icon: AlertTriangle, className: "bg-status-amber-bg text-status-amber-fg" },
}

export function NotificationCenter() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [loading, setLoading] = React.useState(false)

  const prefs = user?.notifyPrefs
  const wants = (key: keyof NonNullable<typeof prefs>) => prefs?.[key] !== false

  const loadNotifications = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || !user) return;

    setLoading(true)
    const items: NotificationItem[] = []

    const canSeeApprovals = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const canSeeStock = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'WAREHOUSE';
    const canSeeFuel = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'WAREHOUSE';
    const canSeeMaterialRequests = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'WAREHOUSE';

    const results = await Promise.allSettled([
      wants("approvals") && canSeeApprovals
        ? approvalsApi.getPending().catch(() => [])
        : Promise.resolve([]),
      wants("lowStock") && canSeeStock
        ? inventoryApi.getAll().catch(() => [])
        : Promise.resolve([]),
    ])

    if (results[0].status === "fulfilled" && Array.isArray(results[0].value)) {
      for (const quote of results[0].value) {
        if (!quote) continue;
        items.push({
          id: `approval-${quote.id}`,
          title: `Orçamento ${quote.quoteNumber || ""} aguardando aprovação`,
          description: quote.client?.companyName || "Cliente não informado",
          type: "approval",
          href: `/approvals/${quote.id}`,
        })
      }
    }

    if (results[1].status === "fulfilled" && Array.isArray(results[1].value)) {
      for (const product of results[1].value) {
        if (!product) continue;
        const cur = Number(product.currentStock) || 0;
        const min = Number(product.minStock) || 0;
        if (min > 0 && cur <= min) {
          items.push({
            id: `stock-${product.id}`,
            title: `Estoque Baixo: ${product.name || "Item sem nome"}`,
            description: `${cur} ${product.unit || "un"} disponível (mínimo ${min}). Clique para repor ou conferir saldo.`,
            type: "stock",
            href: `/inventory/${product.id}?tab=estoque`,
          })
        }
      }
    }

    setNotifications(items)
    setLoading(false)
  }

  React.useEffect(() => {
    loadNotifications();

    // Polling em tempo real a cada 15 segundos
    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);

    // Atualização imediata ao focar na janela/aba
    const handleFocus = () => loadNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (open) loadNotifications()
  }

  const handleItemClick = (href: string) => {
    router.push(href)
  }

  const count = notifications.length
  const badgeLabel = count > 9 ? "9+" : String(count)

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {badgeLabel}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl shadow-xl border border-gray-200/80 overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs sm:text-sm">Notificações</h3>
            <span className="text-[11px] text-white/80">{loading ? "Atualizando..." : `${count} pendência${count === 1 ? "" : "s"}`}</span>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-8 w-8 text-status-green-fg mx-auto mb-2" />
              <p className="text-muted-foreground text-sm font-semibold">Tudo em dia!</p>
            </div>
          ) : (
            notifications.map((n) => {
              const { icon: Icon, className } = TYPE_STYLE[n.type]
              return (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => handleItemClick(n.href)}
                  className="p-4 flex gap-3 border-b border-border last:border-0 hover:bg-muted focus:bg-muted cursor-pointer transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${className}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn(
                        "text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded",
                        n.type === 'stock'
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      )}>
                        {n.type === 'stock' ? 'Almoxarifado' : 'Aprovação'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.description}</p>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
