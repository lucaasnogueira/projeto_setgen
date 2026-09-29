import api from './client';

export interface PaymentMethodConfigItem {
  id: string;
  description: string;
  maxInstallments: number;
  bankAccount: string;
  gatewayOrModality: string;
  feePercentage: number;
  feeFixedAmount: number;
  settlementPeriodDays: number;
  active: boolean;
}

export const paymentMethodsApi = {
  async getAll(activeOnly = true): Promise<PaymentMethodConfigItem[]> {
    try {
      const { data } = await api.get('/payment-methods', { params: { activeOnly } });
      return data;
    } catch {
      return [];
    }
  },

  async create(payload: Partial<PaymentMethodConfigItem>): Promise<PaymentMethodConfigItem> {
    const { data } = await api.post('/payment-methods', payload);
    return data;
  },

  async update(id: string, payload: Partial<PaymentMethodConfigItem>): Promise<PaymentMethodConfigItem> {
    const { data } = await api.put(`/payment-methods/${id}`, payload);
    return data;
  },
};

