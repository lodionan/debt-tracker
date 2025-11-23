import api from './api';

export interface Payment {
  id: number;
  debt: {
    id: number;
    description?: string;
  };
  amount: number;
  paymentMethod: 'CASH' | 'CARD';
  notes?: string;
  paymentDate: string;
  createdAt: string;
}

export interface AddPaymentRequest {
  debtId: number;
  amount: number;
  paymentMethod: 'CASH' | 'CARD';
  notes?: string;
}

export interface UpdatePaymentRequest {
  amount: number;
  paymentMethod: 'CASH' | 'CARD';
  notes?: string;
}

export const paymentService = {
  getAllPayments: async (): Promise<Payment[]> => {
    const response = await api.get('/api/payments');
    return response.data;
  },

  getPaymentsByDebt: async (debtId: number): Promise<Payment[]> => {
    const response = await api.get(`/api/payments/debt/${debtId}`);
    return response.data;
  },

  getPaymentById: async (id: number): Promise<Payment> => {
    const response = await api.get(`/api/payments/${id}`);
    return response.data;
  },

  addPayment: async (paymentData: AddPaymentRequest): Promise<{ message: string; payment: Payment }> => {
    const response = await api.post('/api/payments', paymentData);
    return response.data;
  },

  updatePayment: async (id: number, paymentData: UpdatePaymentRequest): Promise<Payment> => {
    const response = await api.put(`/api/payments/${id}`, paymentData);
    return response.data;
  },

  deletePayment: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/payments/${id}`);
    return response.data;
  }
};