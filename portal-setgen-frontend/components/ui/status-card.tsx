import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusCardVariant =
  | "orange"
  | "primary"
  | "emerald"
  | "success"
  | "blue"
  | "amber"
  | "warning"
  | "red"
  | "danger"
  | "purple"
  | "slate";

export interface StatusCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  variant?: StatusCardVariant;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<StatusCardVariant, { iconBg: string; iconColor: string }> = {
  orange:  { iconBg: "bg-[#FFF3EC]",  iconColor: "text-[#E2661D]" },
  primary: { iconBg: "bg-[#FFF3EC]",  iconColor: "text-[#E2661D]" },
  emerald: { iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  success: { iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  blue:    { iconBg: "bg-blue-50",    iconColor: "text-blue-600" },
  amber:   { iconBg: "bg-amber-50",   iconColor: "text-amber-600" },
  warning: { iconBg: "bg-amber-50",   iconColor: "text-amber-600" },
  red:     { iconBg: "bg-red-50",     iconColor: "text-red-600" },
  danger:  { iconBg: "bg-red-50",     iconColor: "text-red-600" },
  purple:  { iconBg: "bg-purple-50",  iconColor: "text-purple-600" },
  slate:   { iconBg: "bg-slate-100",  iconColor: "text-slate-600" },
};

export function StatusCard({
  label,
  value,
  description,
  icon: Icon,
  variant = "orange",
  className,
  onClick,
}: StatusCardProps) {
  const styles = variantStyles[variant] ?? variantStyles.orange;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex justify-between items-center transition-all",
        onClick && "cursor-pointer hover:border-gray-300 hover:shadow-sm",
        className
      )}
    >
      <div className="space-y-0.5 min-w-0">
        <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
        <p className="text-2xl font-bold text-[#1B2834] tracking-tight">{value}</p>
        {description && (
          <p className="text-[11px] text-slate-400 truncate">{description}</p>
        )}
      </div>

      {Icon && (
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ml-3", styles.iconBg, styles.iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}