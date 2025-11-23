import api from './api';

export interface User {
  id: number;
  name: string;
  phone: string;
  role: 'ADMIN' | 'CLIENT';
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (phone: string, password: string = ''): Promise<AuthResponse> => {
    // For clients, use the client-login endpoint (no password required)
    // For admins, use the regular login endpoint
    const isClientLogin = password === '';

    const endpoint = isClientLogin ? '/api/auth/client-login' : '/api/auth/login';
    const requestData = isClientLogin ? { phone } : { phone, password };

    const response = await api.post(endpoint, requestData);
    return response.data;
  },

  registerClient: async (userData: RegisterRequest): Promise<{ message: string; userId: number }> => {
    const response = await api.post('/api/auth/register-client', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'ADMIN';
  }
};