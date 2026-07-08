import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card } from "@/components/ui/card"

interface CompactDetailHeaderProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  badge?: { label: string; className: string }
  meta?: React.ReactNode
  actions?: React.ReactNode
  onBack?: () => void
  backLabel?: string
  tone?: "amber" | "blue" | "green" | "purple" | "red" | "gray"
}

const TONE_BOX: Record<NonNullable<CompactDetailHeaderProps["tone"]>, string> = {
  amber: "bg-status-amber-bg text-status-amber-fg",
  blue: "bg-status-blue-bg text-status-blue-fg",
  green: "bg-status-green-bg text-status-green-fg",
  purple: "bg-status-purple-bg text-status-purple-fg",
  red: "bg-status-red-bg text-status-red-fg",
  gray: "bg-muted/60 text-text-secondary",
}

export function CompactDetailHeader({
  icon: Icon,
  title,
  badge,
  meta,
  actions,
  onBack,
  backLabel = "Voltar",
  tone = "amber",
}: CompactDetailHeaderProps) {
  const router = useRouter()

  return (
    <div className="space-y-3">
      <button
        onClick={onBack ?? (() => router.back())}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-muted hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        {backLabel}
      </button>

      <Card className="p-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-[46px] h-[46px] rounded-[10px] flex items-center justify-center shrink-0 ${TONE_BOX[tone]}`}>
            <Icon className="h-[22px] w-[22px]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[19px] font-extrabold text-foreground truncate">{title}</h1>
              {badge && (
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${badge.className}`}>
                  {badge.label}
                </span>
              )}
            </div>
            {meta && <div className="text-[13px] text-text-secondary mt-0.5 flex items-center gap-2 flex-wrap">{meta}</div>}
          </div>
        </div>
        {actions && <div className="flex gap-2.5 shrink-0">{actions}</div>}
      </Card>
    </div>
  )
}
