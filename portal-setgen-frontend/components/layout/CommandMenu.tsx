"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Users,
  Search,
  FileText,
  Package,
  Building2,
  DollarSign,
  Briefcase
} from "lucide-react"
import { Command } from "cmdk"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors w-64 bg-background"
      >
        <Search className="h-4 w-4" />
        <span>Pesquisar...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-auto">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl rounded-2xl border-none max-w-2xl">
          <Command className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground">
            <div className="flex items-center border-b px-4 py-4" cmdk-input-wrapper="">
              <Search className="mr-3 h-5 w-5 shrink-0 opacity-50" />
              <Command.Input
                placeholder="O que você está procurando?"
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[450px] overflow-y-auto overflow-x-hidden p-4 scrollbar-hide">
              <Command.Empty className="py-12 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</Command.Empty>
              
              <Command.Group heading="Atalhos Rápidos" className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                <CommandItem icon={FileText} label="Nova Ordem de Serviço" onSelect={() => runCommand(() => router.push('/orders/new'))} />
                <CommandItem icon={Users} label="Cadastrar Cliente" onSelect={() => runCommand(() => router.push('/clients/new'))} />
                <CommandItem icon={DollarSign} label="Lançar Despesa" onSelect={() => runCommand(() => router.push('/financial/expenses/new'))} />
              </Command.Group>

              <Command.Separator className="h-px bg-muted my-4" />

              <Command.Group heading="Módulos" className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                <CommandItem icon={Building2} label="Comercial" onSelect={() => runCommand(() => router.push('/clients'))} />
                <CommandItem icon={Briefcase} label="RH / Funcionários" onSelect={() => runCommand(() => router.push('/rh/employees'))} />
                <CommandItem icon={Package} label="Estoque" onSelect={() => runCommand(() => router.push('/inventory'))} />
                <CommandItem icon={DollarSign} label="Financeiro" onSelect={() => runCommand(() => router.push('/financial'))} />
              </Command.Group>

              <Command.Separator className="h-px bg-muted my-4" />

              <Command.Group heading="Configurações" className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                <CommandItem icon={User} label="Meu Perfil" onSelect={() => runCommand(() => router.push('/profile'))} />
                <CommandItem icon={Settings} label="Configurações do Sistema" onSelect={() => runCommand(() => router.push('/settings'))} />
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CommandItem({ icon: Icon, label, onSelect }: any) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer select-none items-center gap-3 rounded-xl px-4 py-3.5 text-sm outline-none aria-selected:bg-orange-50 aria-selected:text-orange-600 transition-all active:scale-[0.98]"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 aria-selected:bg-orange-100">
        <Icon className="h-4 w-4" />
      </div>
      <span className="font-medium">{label}</span>
    </Command.Item>
  )
}
