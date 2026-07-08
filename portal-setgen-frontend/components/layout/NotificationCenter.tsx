"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bell, FileText, AlertTriangle, Fuel, PackageSearch, CheckCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { approvalsApi } from "@/lib/api/approvals"
import { inventoryApi } from "@/lib/api/inventory"
import { fuelRequestsApi } from "@/lib/api/fuel-requests"
import { materialRequestsApi } from "@/lib/api/material-requests"
import { FuelRequestStatus, MaterialRequestStatus } from "@/types"

interface NotificationItem {
  id: string
  title: string
  description: string
  type: "approval" | "stock" | "fuel" | "material"
  href: string
}

const TYPE_STYLE: Record<NotificationItem["type"], { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  approval: { icon: FileText, className: "bg-status-blue-bg text-status-blue-fg" },
  stock: { icon: AlertTriangle, className: "bg-status-amber-bg text-status-amber-fg" },
  fuel: { icon: Fuel, className: "bg-status-amber-bg text-status-amber-fg" },
  material: { icon: PackageSearch, className: "bg-status-purple-bg text-status-purple-fg" },
}

export function NotificationCenter() {
  const router = useRouter()
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [loading, setLoading] = React.useState(false)

  const loadNotifications = async () => {
    setLoading(true)
    const items: NotificationItem[] = []

    const results = await Promise.allSettled([
      approvalsApi.getPending(),
      inventoryApi.getAll(),
      fuelRequestsApi.getAll({ status: FuelRequestStatus.PENDING }),
      materialRequestsApi.getAll(MaterialRequestStatus.PENDING),
    ])

    if (results[0].status === "fulfilled") {
      for (const order of results[0].value) {
        items.push({
          id: `approval-${order.id}`,
          title: `OS ${order.orderNumber} aguardando aprovação`,
          description: order.client?.companyName || "Cliente não informado",
          type: "approval",
          href: `/approvals/${order.id}`,
        })
      }
    }

    if (results[1].status === "fulfilled") {
      for (const product of results[1].value) {
        if (product.currentStock <= product.minStock) {
          items.push({
            id: `stock-${product.id}`,
            title: `Estoque baixo: ${product.name}`,
            description: `${product.currentStock} ${product.unit} disponível (mínimo ${product.minStock})`,
            type: "stock",
            href: `/inventory/${product.id}`,
          })
        }
      }
    }

    if (results[2].status === "fulfilled") {
      for (const fr of results[2].value) {
        items.push({
          id: `fuel-${fr.id}`,
          title: `Abastecimento pendente: ${fr.vehicle?.name || "Veículo"}`,
          description: `${fr.liters}L — aguardando aprovação`,
          type: "fuel",
          href: `/fleet`,
        })
      }
    }

    if (results[3].status === "fulfilled") {
      for (const mr of results[3].value) {
        items.push({
          id: `material-${mr.id}`,
          title: `Solicitação de material pendente`,
          description: mr.serviceOrder?.orderNumber ? `OS ${mr.serviceOrder.orderNumber}` : "Mesa do almoxarife",
          type: "material",
          href: `/warehouse`,
        })
      }
    }

    setNotifications(items)
    setLoading(false)
  }

  React.useEffect(() => {
    loadNotifications()
  }, [])

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
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-2xl border-none overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Notificações</h3>
            <span className="text-xs text-white/80">{loading ? "Atualizando..." : `${count} pendência${count === 1 ? "" : "s"}`}</span>
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
                    <p className="text-sm font-bold text-foreground truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.description}</p>
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
