import api from './api';

export interface Debt {
  id: number;
  client: {
    id: number;
    name: string;
    phone: string;
  };
  amount: number;
  remainingAmount: number;
  status: 'ACTIVE' | 'PAID' | 'OVERDUE';
  description?: string;
  createdAt: string;
  dueDate?: string;
}

export interface CreateDebtRequest {
  clientId: number;
  amount: number;
  description?: string;
  dueDate?: string;
}

export interface UpdateDebtRequest {
  totalAmount: number;
  description?: string;
}

export const debtService = {
  getAllDebts: async (): Promise<Debt[]> => {
    const response = await api.get('/api/debts');
    return response.data;
  },

  getDebtById: async (id: number): Promise<Debt> => {
    const response = await api.get(`/api/debts/${id}`);
    return response.data;
  },

  createDebt: async (debtData: CreateDebtRequest): Promise<{ message: string; debt: Debt }> => {
    const response = await api.post('/api/debts', debtData);
    return response.data;
  },

  updateDebt: async (id: number, debtData: UpdateDebtRequest): Promise<Debt> => {
    const response = await api.put(`/api/debts/${id}`, debtData);
    return response.data;
  },

  deleteDebt: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/debts/${id}`);
    return response.data;
  }
};