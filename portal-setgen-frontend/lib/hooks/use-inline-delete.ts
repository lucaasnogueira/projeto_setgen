import { useState } from 'react';

export function useInlineDelete<T = void>(
  deleteFn: (id: string) => Promise<T>,
  onDeleted: (id: string, result: T) => void
) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const requestDelete = (id: string) => setConfirmId(id);
  const cancelDelete = () => setConfirmId(null);

  const confirmDelete = async (id: string) => {
    setDeleting(true);
    try {
      const result = await deleteFn(id);
      onDeleted(id, result);
      setConfirmId(null);
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert(error?.response?.data?.message || 'Erro ao excluir registro');
    } finally {
      setDeleting(false);
    }
  };

  return { confirmId, deleting, requestDelete, cancelDelete, confirmDelete };
}
