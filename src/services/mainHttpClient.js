import axios from "axios";
import {
  getToken,
  logout,
  refreshToken,
  getRefreshToken,
} from "../auth/authUtils";

const MAIN_API_CONFIG = {
  BASE_URL: import.meta.env.VITE_MAIN_API_BASE_URL || "http://localhost:8080",
  TIMEOUT: 10000,
};

// Tạo axios instance cho API chính
const mainHttpClient = axios.create({
  baseURL: MAIN_API_CONFIG.BASE_URL,
  timeout: MAIN_API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - thêm token vào header
mainHttpClient.interceptors.request.use(
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
mainHttpClient.interceptors.response.use(
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
          return mainHttpClient(originalRequest);
        } else {
          // Refresh token thất bại, logout
          const refreshToken = getRefreshToken();
          await logout(refreshToken);
          window.location.href = "/";
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh token thất bại, logout
        const refreshToken = getRefreshToken();
        await logout(refreshToken);
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions cho main API
export const mainApiRequest = async (
  method,
  endpoint,
  data = null,
  config = {}
) => {
  try {
    const response = await mainHttpClient.request({
      method,
      url: endpoint,
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

// HTTP methods cho main API
export const apiGet = (endpoint, config = {}) =>
  mainApiRequest("GET", endpoint, null, config);

export const apiPost = (endpoint, data = null, config = {}) =>
  mainApiRequest("POST", endpoint, data, config);

export const apiPut = (endpoint, data = null, config = {}) =>
  mainApiRequest("PUT", endpoint, data, config);

export const apiPatch = (endpoint, data = null, config = {}) =>
  mainApiRequest("PATCH", endpoint, data, config);

export const apiDelete = (endpoint, config = {}) =>
  mainApiRequest("DELETE", endpoint, null, config);

export default mainHttpClient;
