import * as React from "react"

export function FieldBlock({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-2.5">
      <div className="text-[10.5px] font-bold tracking-wider text-text-muted uppercase mb-1">{label}</div>
      <div className="text-[14px] font-semibold text-foreground">{value || '—'}</div>
    </div>
  )
}
