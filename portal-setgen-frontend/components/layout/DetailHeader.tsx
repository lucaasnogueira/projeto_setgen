import * as React from "react"
import { ArrowLeft } from "lucide-react"

interface DetailHeaderProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: React.ReactNode
  onBack: () => void
  backLabel?: string
  actions?: React.ReactNode
  tone?: "amber" | "blue" | "green" | "purple" | "red" | "gray"
}

const TONE_BOX: Record<NonNullable<DetailHeaderProps["tone"]>, string> = {
  amber: "bg-status-amber-bg text-status-amber-fg",
  blue: "bg-status-blue-bg text-status-blue-fg",
  green: "bg-status-green-bg text-status-green-fg",
  purple: "bg-status-purple-bg text-status-purple-fg",
  red: "bg-status-red-bg text-status-red-fg",
  gray: "bg-muted/60 text-text-secondary",
}

export function DetailHeader({
  icon: Icon,
  title,
  subtitle,
  onBack,
  backLabel = "Voltar",
  actions,
  tone = "amber",
}: DetailHeaderProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-muted hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        {backLabel}
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-[14px] flex items-center justify-center shrink-0 ${TONE_BOX[tone]}`}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold text-foreground leading-tight">{title}</h1>
            {subtitle && <div className="text-[13px] text-text-secondary mt-1 flex items-center gap-2">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="flex gap-2.5">{actions}</div>}
      </div>
    </div>
  )
}
