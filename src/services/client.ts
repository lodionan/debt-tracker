import api from './api';

export interface Client {
  id: number;
  name: string;
  phone: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  name: string;
  phone: string;
  address?: string;
}

export interface UpdateClientRequest {
  name: string;
  phone: string;
  address?: string;
}

export const clientService = {
  getAllClients: async (): Promise<Client[]> => {
    const response = await api.get('/api/clients');
    return response.data;
  },

  getClientById: async (id: number): Promise<Client> => {
    const response = await api.get(`/api/clients/${id}`);
    return response.data;
  },

  createClient: async (clientData: CreateClientRequest): Promise<{ message: string; client: Client }> => {
    const response = await api.post('/api/clients', clientData);
    return response.data;
  },

  updateClient: async (id: number, clientData: UpdateClientRequest): Promise<Client> => {
    const response = await api.put(`/api/clients/${id}`, clientData);
    return response.data;
  },

  deleteClient: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/clients/${id}`);
    return response.data;
  },

  getArchivedClients: async (): Promise<Client[]> => {
    const response = await api.get('/api/clients/archived');
    return response.data;
  }
};