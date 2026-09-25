/**
 * Centralized API client with automatic auth token handling,
 * error normalization, and request/response interceptors
 */

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

type ApiResponse<T = any> = {
  statusCode: number;
  message: string;
  data?: T;
  errors?: any[];
};

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get authorization header with stored token
   */
  private getAuthHeader(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Normalize error responses and throw
   */
  private async handleError(response: Response, body: any): Promise<never> {
    const statusCode = response.status;
    const message = body?.message || `Error ${statusCode}`;
    const errors = body?.errors || [];

    // Handle common error cases
    if (statusCode === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    const error = new Error(message) as any;
    error.statusCode = statusCode;
    error.errors = errors;
    throw error;
  }

  /**
   * Execute HTTP request with automatic auth and error handling
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...(fetchOptions.headers || {}),
      ...(skipAuth ? {} : this.getAuthHeader()),
    };

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      const data: ApiResponse<T> = await response.json().catch(() => ({}));

      if (!response.ok) {
        await this.handleError(response, data);
      }

      return data.data as T;
    } catch (error) {
      // Re-throw with context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`API request failed: ${endpoint}`);
    }
  }

  // Public methods for HTTP verbs
  get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instances
export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL);
export const internalApiClient = new ApiClient(process.env.NEXT_PUBLIC_INTERNAL_API_URL);

export type { ApiResponse };
