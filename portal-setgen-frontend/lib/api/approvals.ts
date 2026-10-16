import api from './client';
import { Quote } from '@/types';

export const approvalsApi = {
  async getPending(): Promise<Quote[]> {
    try {
      const { data } = await api.get('/approvals/pending');
      return data;
    } catch {
      return [];
    }
  },

  async approve(quoteId: string, comments?: string): Promise<Quote> {
    const { data } = await api.post(`/approvals/approve/${quoteId}`, { comments });
    return data;
  },

  async reject(quoteId: string, comments: string): Promise<Quote> {
    const { data } = await api.post(`/approvals/reject/${quoteId}`, { comments });
    return data;
  },
};
