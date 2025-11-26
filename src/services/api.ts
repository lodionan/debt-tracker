// API Configuration - Centralized API URL management for cross-browser compatibility
export const getApiUrl = (): string => {
  // For development on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }

  // For production or remote development, use environment variable or current hostname
  return process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8080`;
};

// Default API configuration
export const apiConfig = {
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' as RequestCredentials
};

// Helper function to get auth headers
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Helper function to make authenticated requests
export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = `${getApiUrl()}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    },
    credentials: 'include'
  };

  console.log(`API Request: ${options.method || 'GET'} ${url}`);
  return fetch(url, config);
};

// Legacy axios-like API for backward compatibility
const api = {
  get: async (url: string, config?: any): Promise<any> => {
    const response = await apiRequest(url, { method: 'GET', ...config });
    const data = await response.json();
    return { data, status: response.status, statusText: response.statusText };
  },
  post: async (url: string, data?: any, config?: any): Promise<any> => {
    const response = await apiRequest(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config
    });
    const responseData = await response.json();
    return { data: responseData, status: response.status, statusText: response.statusText };
  },
  put: async (url: string, data?: any, config?: any): Promise<any> => {
    const response = await apiRequest(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config
    });
    const responseData = await response.json();
    return { data: responseData, status: response.status, statusText: response.statusText };
  },
  delete: async (url: string, config?: any): Promise<any> => {
    const response = await apiRequest(url, { method: 'DELETE', ...config });
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      // Some DELETE responses don't have a body
      responseData = { message: 'Deleted successfully' };
    }
    return { data: responseData, status: response.status, statusText: response.statusText };
  },
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} }
  }
};

// Export default for backward compatibility
export default api;