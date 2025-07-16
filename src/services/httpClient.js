import axios from "axios";
import { API_CONFIG, createApiUrl } from "../config/api";
import { getToken, logout, refreshToken } from "../auth/authUtils";

// Tạo axios instance
const httpClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - thêm token vào header
httpClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý token expiration
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Thử refresh token
        const newToken = await refreshToken();
        if (newToken) {
          // Cập nhật token mới và thử lại request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return httpClient(originalRequest);
        } else {
          // Refresh token thất bại, logout
          logout();
          window.location.href = "/";
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh token thất bại, logout
        logout();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions
export const apiRequest = async (
  method,
  endpoint,
  data = null,
  config = {}
) => {
  try {
    const url = createApiUrl(endpoint);
    const response = await httpClient.request({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Error handling
export const handleApiError = (error) => {
  if (error.response) {
    // Server trả về response với status code lỗi
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return new Error(data?.message || "Dữ liệu không hợp lệ");
      case 401:
        return new Error("Phiên đăng nhập đã hết hạn");
      case 403:
        return new Error("Bạn không có quyền truy cập");
      case 404:
        return new Error("Không tìm thấy dữ liệu");
      case 500:
        return new Error("Lỗi server, vui lòng thử lại sau");
      default:
        return new Error(data?.message || "Có lỗi xảy ra");
    }
  } else if (error.request) {
    // Request được gửi nhưng không nhận được response
    return new Error("Không thể kết nối đến server");
  } else {
    // Lỗi khác
    return new Error("Có lỗi xảy ra");
  }
};

// HTTP methods
export const apiGet = (endpoint, config = {}) =>
  apiRequest("GET", endpoint, null, config);

export const apiPost = (endpoint, data = null, config = {}) =>
  apiRequest("POST", endpoint, data, config);

export const apiPut = (endpoint, data = null, config = {}) =>
  apiRequest("PUT", endpoint, data, config);

export const apiPatch = (endpoint, data = null, config = {}) =>
  apiRequest("PATCH", endpoint, data, config);

export const apiDelete = (endpoint, config = {}) =>
  apiRequest("DELETE", endpoint, null, config);

export default httpClient;
