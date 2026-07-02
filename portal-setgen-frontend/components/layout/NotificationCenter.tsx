"use client"

import * as React from "react"
import { Bell, Check, Info, AlertTriangle, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const mockNotifications = [
  {
    id: 1,
    title: "OS Aprovada",
    description: "A Ordem de Serviço #1234 foi aprovada pelo gerente.",
    time: "5 min atrás",
    type: "success",
    read: false
  },
  {
    id: 2,
    title: "Estoque Baixo",
    description: "O item 'Cabo CAT6' atingiu o nível crítico.",
    time: "2 horas atrás",
    type: "warning",
    read: false
  },
  {
    id: 3,
    title: "Fatura Vencida",
    description: "A fatura do cliente 'Sertões' está vencida.",
    time: "1 dia atrás",
    type: "error",
    read: true
  }
]

export function NotificationCenter() {
  const [notifications, setNotifications] = React.useState(mockNotifications)
  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-2xl border-none overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Notificações</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-colors">
                Marcar todas como lidas
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhuma notificação nova</div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="p-4 flex gap-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'success' ? 'bg-green-100 text-green-600' :
                  n.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {n.type === 'success' ? <Check className="h-5 w-5" /> : 
                   n.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> : 
                   <Info className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-bold ${n.read ? 'text-gray-500' : 'text-gray-900'}`}>{n.title}</p>
                    <span className="text-[10px] text-gray-400">{n.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{n.description}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full self-center"></div>}
              </DropdownMenuItem>
            ))
          )}
        </div>
        <div className="p-3 border-t text-center">
          <button className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors">
            Ver todas as notificações
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
