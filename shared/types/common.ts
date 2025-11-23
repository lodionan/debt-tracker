export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  createdAt: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  archived?: boolean;
  archivedAt?: string;
  archivedReason?: string;
}

export interface Debt {
  id: number;
  clientId?: number;
  client: Client;
  amount?: number;
  totalAmount?: number;
  remainingAmount?: number;
  description: string;
  dueDate?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'ACTIVE';
  createdAt: string;
  updatedAt?: string;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  debtId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalClients: number;
  totalDebts: number;
  totalPaid: number;
  totalPending: number;
  monthlyRevenue: number;
  overdueDebts: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}