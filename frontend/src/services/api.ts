import { ApiResponse, Tender, Bid } from '../types';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Failed to communicate with API server',
        },
        request_id: 'REQ-CLIENT-ERROR',
      };
    }
  }

  // Health Check
  async getHealth(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/health');
  }

  // Tenders API
  async getTenders(): Promise<ApiResponse<Tender[]>> {
    return this.request<Tender[]>('/tenders');
  }

  async getTenderById(id: string): Promise<ApiResponse<Tender>> {
    return this.request<Tender>(`/tenders/${id}`);
  }

  // Bids API
  async getBids(): Promise<ApiResponse<Bid[]>> {
    return this.request<Bid[]>('/bids');
  }

  async getBidById(id: string): Promise<ApiResponse<Bid>> {
    return this.request<Bid>(`/bids/${id}`);
  }
}

export const apiService = new ApiService();
export default apiService;
