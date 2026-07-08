import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  }
  return phone
}

const AVATAR_PALETTE = [
  { bg: 'bg-amber-100', fg: 'text-amber-700' },
  { bg: 'bg-blue-100', fg: 'text-blue-700' },
  { bg: 'bg-violet-100', fg: 'text-violet-700' },
  { bg: 'bg-rose-100', fg: 'text-rose-700' },
  { bg: 'bg-teal-100', fg: 'text-teal-700' },
  { bg: 'bg-slate-200', fg: 'text-slate-700' },
]

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function getAvatarColor(name: string): { bg: string; fg: string } {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    ADMINISTRATIVE: 'Administrativo',
    WAREHOUSE: 'Almoxarifado',
    TECHNICIAN: 'Técnico',
  }
  return labels[role] || role
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Client
    ACTIVE: 'bg-status-green-bg text-status-green-fg',
    INACTIVE: 'bg-status-gray-bg text-status-gray-fg',
    DEFAULTER: 'bg-status-red-bg text-status-red-fg',
    // Employee
    AWAY: 'bg-status-amber-bg text-status-amber-fg',
    VACATION: 'bg-status-blue-bg text-status-blue-fg',
    TERMINATED: 'bg-status-red-bg text-status-red-fg',
    // Service Order
    DRAFT: 'bg-status-gray-bg text-status-gray-fg',
    PENDING_APPROVAL: 'bg-status-amber-bg text-status-amber-fg',
    APPROVED: 'bg-status-green-bg text-status-green-fg',
    SENT_TO_CLIENT: 'bg-status-blue-bg text-status-blue-fg',
    AWAITING_RESPONSE: 'bg-status-amber-bg text-status-amber-fg',
    AWAITING_MATERIALS: 'bg-status-amber-bg text-status-amber-fg',
    REJECTED: 'bg-status-red-bg text-status-red-fg',
    IN_PROGRESS: 'bg-status-blue-bg text-status-blue-fg',
    COMPLETED: 'bg-status-green-bg text-status-green-fg',
    CANCELLED: 'bg-status-red-bg text-status-red-fg',
    // Invoice
    ISSUED: 'bg-status-blue-bg text-status-blue-fg',
    PAID: 'bg-status-green-bg text-status-green-fg',
    OVERDUE: 'bg-status-red-bg text-status-red-fg',
    // Purchase Order
    PENDING: 'bg-status-amber-bg text-status-amber-fg',
    EXPIRED: 'bg-status-red-bg text-status-red-fg',
  }
  return colors[status] || 'bg-status-gray-bg text-status-gray-fg'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    // Client
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    DEFAULTER: 'Inadimplente',
    // Employee
    AWAY: 'Afastado',
    VACATION: 'Férias',
    TERMINATED: 'Desligado',
    // Service Order
    DRAFT: 'Rascunho',
    PENDING_APPROVAL: 'Aguardando Aprovação',
    APPROVED: 'Aprovado',
    SENT_TO_CLIENT: 'Enviado ao Cliente',
    AWAITING_RESPONSE: 'Aguardando Resposta',
    AWAITING_MATERIALS: 'Aguardando Materiais',
    REJECTED: 'Rejeitado',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    // Invoice
    ISSUED: 'Emitida',
    PAID: 'Paga',
    OVERDUE: 'Vencida',
    // Purchase Order
    PENDING: 'Pendente',
    EXPIRED: 'Expirada',
  }
  return labels[status] || status
}
