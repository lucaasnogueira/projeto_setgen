import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto">
    <table
      ref={ref}
      className={cn("w-full border-collapse text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-muted/40", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn(className)} {...props} />
))
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-t border-border transition-colors hover:bg-muted/30",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-text-muted first:pl-5 last:pr-5",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-3.5 align-middle first:pl-5 last:pr-5", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableEmpty = ({
  colSpan,
  icon: Icon,
  message,
}: {
  colSpan: number
  icon?: React.ComponentType<{ className?: string }>
  message: string
}) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-16 text-center">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />}
      <p className="text-text-secondary font-medium text-sm">{message}</p>
    </td>
  </tr>
)
TableEmpty.displayName = "TableEmpty"

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty }
