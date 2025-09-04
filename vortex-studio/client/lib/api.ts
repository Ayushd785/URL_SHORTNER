// Api response Types matching backend

import { AxiosInstance, AxiosResponse } from "axios";
import { error } from "console";
import axios from "axios";
import { response } from "express";
import { promise } from "zod";

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse<T = any> {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

// token management
class TokenManager {
  private tokenKey = import.meta.env.VITE_JWT_TOKEN_KEY;
  private refreshKey = import.meta.env.VITE_JWT_REFRESH_KEY;

  get(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  set(token: string): void {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch (error: any) {
      console.warn("failed to store token:", error);
    }
  }
  remove(): void {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshKey);
    } catch (error: any) {
      console.warn("failed to remove tokens:", error);
    }
  }

  isValid(): boolean {
    const token = this.get();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error: any) {
      return false;
    }
  }
}

export const tokenManager = new TokenManager();

// create Axios Instance

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });
  // Request Interceptor - Add JWT token to all requests
  client.interceptors.request.use(
    (config) => {
      const token = tokenManager.get();
      if (token && tokenManager.isValid()) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response Interceptor - Handle errors and token expiration
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        tokenManager.remove();

        // Redirect to login only if not already on login.signup pages
        const currentPath = window.location.pathname;
        if (!["/login", "/signup", "/"].includes(currentPath)) {
          window.location.href = "/login";
        }
      }

      // Handle network errors
      if (!error.response) {
        console.error("Network error:", error.message);
        return Promise.reject({
          success: false,
          message: "Network error. Please check your connection.",
          error: "NETWORK_ERROR",
        });
      }

      // Return standardized error format
      const apiError: ApiErrorResponse = {
        success: false,
        message: error.response?.data?.message || "An error occoured",
        error: error.response?.data?.error || error.message,
        statusCode: error.response?.status,
      };

      return Promise.reject(apiError);
    },
  );
  return client;
};

export const apiClient = createApiClient();

export const api = {
  // GET request
  get: async <T>(url: string): Promise<ApiSuccessResponse<T>> => {
    const response = await apiClient.get<ApiSuccessResponse<T>>(url);
    return response.data;
  },

  // POST request
  post: async <T>(url: string, data?: any): Promise<ApiSuccessResponse<T>> => {
    const response = await apiClient.post<ApiSuccessResponse<T>>(url, data);
    return response.data;
  },

  // PUT request
  put: async <T>(url: string, data?: any): Promise<ApiSuccessResponse<T>> => {
    const response = await apiClient.put<ApiSuccessResponse<T>>(url, data);
    return response.data;
  },

  // DELETE request
  delete: async <T>(url: string): Promise<ApiSuccessResponse<T>> => {
    const response = await apiClient.delete<ApiSuccessResponse<T>>(url);
    return response.data;
  },
};

// Specific API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ user: any; token: string }>("/api/auth/login", {
      email,
      password,
    }),

  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) =>
    api.post<{ user: any; token: string }>("/api/auth/register", {
      firstname: firstName, // Map to lowercase
      lastname: lastName, // Map to lowercase
      email,
      password,
    }),

  getCurrentUser: () => api.get<{ user: any }>("/api/auth/me"),

  updateProfile: (data: any) =>
    api.put<{ user: any }>("/api/auth/profile", data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/api/auth/change-password", { currentPassword, newPassword }),

  logout: () => api.post("/api/auth/logout"),
};

// Links API endpoints
export const linksAPI = {
  // Create a new short link
  createLink: (data: {
    originalUrl: string;
    customAlias?: string;
    password?: string;
    description?: string;
  }) => api.post<{ link: any }>("/api/links/create", data),

  // Get all links for the current user
  getUserLinks: () => api.get<{ links: any[] }>("/api/links/user"),

  // Get links with search, filter, and pagination
  getLinksWithFilter: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/api/links?${queryString}` : "/api/links";

    return api.get<{ links: any[]; pagination: any }>(url);
  },

  // Get a specific link by ID
  getLink: (linkId: string) => api.get<{ link: any }>(`/api/links/${linkId}`),

  // Update a link
  updateLink: (
    linkId: string,
    data: {
      description?: string;
      customAlias?: string;
      isActive?: boolean;
    },
  ) => api.put<{ link: any }>(`/api/links/${linkId}`, data),

  // Delete a link
  deleteLink: (linkId: string) =>
    api.delete<{ success: boolean }>(`/api/links/${linkId}`),

  // Toggle link status
  toggleStatus: (linkId: string) =>
    api.put<{ link: any }>(`/api/links/${linkId}/status`, {}),

  // Get link analytics
  getLinkAnalytics: (linkId: string) =>
    api.get<{ analytics: any }>(`/api/links/${linkId}/analytics`),

  // Get user dashboard stats
  getDashboardStats: () =>
    api.get<{ stats: any }>("/api/links/dashboard-stats"),
};

// QR Code API functions
export const qrAPI = {
  generate: (shortCode: string, size: number = 200) =>
    api.get<{ qrCode: string }>(`/api/qr/generate/${shortCode}?size=${size}`),

  download: (shortCode: string) =>
    apiClient.get(`/api/qr/download/${shortCode}`, { responseType: "blob" }),
};
