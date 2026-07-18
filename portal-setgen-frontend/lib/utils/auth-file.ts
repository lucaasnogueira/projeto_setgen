import api from '@/lib/api/client';

// /uploads/* exige Authorization: Bearer <token>; window.open/href direto nunca
// manda esse header. Busca o arquivo autenticado e abre como blob URL.
export async function openAuthedFile(path: string) {
  const res = await api.get(`/${path}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
