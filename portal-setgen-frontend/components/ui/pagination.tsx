import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalItems?: number;
  itemsPerPage?: number;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis-start');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('ellipsis-end');
      pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (typeof page === 'string') {
        return (
          <div key={`${page}-${index}`} className="flex items-center justify-center w-8 h-8">
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        );
      }

      return (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'outline'}
          size="icon"
          className={cn(
            "w-8 h-8 text-xs font-semibold rounded-lg transition-all",
            currentPage === page
              ? "bg-[#E2661D] hover:bg-[#c95716] text-white border-[#E2661D] shadow-2xs"
              : "hover:bg-muted text-muted-foreground border-border"
          )}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      );
    });
  };

  return (
    <div className={cn("flex items-center justify-center gap-1.5 py-4", className)}>
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8 rounded-lg border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      
      <div className="flex items-center gap-1">
        {renderPageNumbers()}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8 rounded-lg border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = "registros",
  className,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const start = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-border bg-slate-50/50 text-xs text-muted-foreground", className)}>
      <div>
        Mostrando <span className="font-semibold text-foreground">{start}</span> a <span className="font-semibold text-foreground">{end}</span> de <span className="font-semibold text-foreground">{totalItems}</span> {itemLabel}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        className="py-0"
      />
    </div>
  );
}
