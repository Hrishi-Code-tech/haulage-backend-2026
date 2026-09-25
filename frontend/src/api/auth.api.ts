/**
 * Authentication API endpoints
 */

import { apiClient } from './client';

export interface AuthUser {
  id: string;
  name: string;
  companyName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  companyName: string;
  email: string;
  password: string;
}

export const authApi = {
  /**
   * Login with email and password
   */
  login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient.post('/auth/login', payload, { skipAuth: true });
  },

  /**
   * Sign up new account
   */
  signup(payload: SignupPayload): Promise<AuthResponse> {
    return apiClient.post('/auth/signup', payload, { skipAuth: true });
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Store auth data in localStorage
   */
  setAuthData(response: AuthResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  },

  /**
   * Clear all auth data
   */
  clearAuthData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },
};
