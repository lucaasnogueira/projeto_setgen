import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
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
          <div key={`${page}-${index}`} className="flex items-center justify-center w-9 h-9">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </div>
        );
      }

      return (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'outline'}
          size="icon"
          className={cn(
            "w-9 h-9 transition-all",
            currentPage === page ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-md" : "hover:bg-gray-100 text-gray-600 border-gray-200"
          )}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      );
    });
  };

  return (
    <div className={cn("flex items-center justify-center gap-2 py-4", className)}>
      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9 border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-1">
        {renderPageNumbers()}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9 border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
