"use client"

import { Eye, Edit, Trash2 } from 'lucide-react';

interface InlineDeleteActionProps {
  confirming: boolean;
  deleting?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onRequestDelete?: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
}

export function InlineDeleteAction({
  confirming,
  deleting,
  onView,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  viewTitle = 'Visualizar',
  editTitle = 'Editar',
  deleteTitle = 'Excluir',
}: InlineDeleteActionProps) {
  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={onConfirmDelete}
          disabled={deleting}
          className="text-[11px] font-bold text-white bg-destructive rounded-md px-2 py-1.5 disabled:opacity-60"
        >
          Excluir
        </button>
        <button
          onClick={onCancelDelete}
          disabled={deleting}
          className="text-[11px] font-bold text-foreground bg-card border border-border rounded-md px-2 py-1.5"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {onView && (
        <button
          onClick={onView}
          className="p-1.5 text-text-muted hover:text-primary hover:bg-muted/40 rounded-md transition-colors"
          title={viewTitle}
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 text-text-muted hover:text-primary hover:bg-muted/40 rounded-md transition-colors"
          title={editTitle}
        >
          <Edit className="h-4 w-4" />
        </button>
      )}
      {onRequestDelete && (
        <button
          onClick={onRequestDelete}
          className="p-1.5 text-text-muted hover:text-destructive hover:bg-muted/40 rounded-md transition-colors"
          title={deleteTitle}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
