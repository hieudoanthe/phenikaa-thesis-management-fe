import axios from "axios";
import {
  getToken,
  logout,
  refreshToken,
  getRefreshToken,
} from "../auth/authUtils";

const MAIN_API_CONFIG = {
  BASE_URL: import.meta.env.VITE_MAIN_API_BASE_URL || "http://localhost:8080",
  TIMEOUT: 300000, // 5 phút để phù hợp với server timeout
};

// Tạo axios instance cho API chính
const mainHttpClient = axios.create({
  baseURL: MAIN_API_CONFIG.BASE_URL,
  timeout: MAIN_API_CONFIG.TIMEOUT,
  // Không set Content-Type mặc định để FormData có thể tự set
});

// Request interceptor - thêm token vào header
mainHttpClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Chỉ set Content-Type nếu chưa có (để FormData tự set)
    if (!config.headers["Content-Type"] && !(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
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
          const refreshTokenValue = getRefreshToken();
          await logout(refreshTokenValue);
          window.location.href = "/";
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh token thất bại, logout
        const refreshTokenValue = getRefreshToken();
        await logout(refreshTokenValue);
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
    const finalConfig = {
      method,
      url: endpoint,
      data,
      ...config,
    };

    const response = await mainHttpClient.request(finalConfig);
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

    // Lấy thông điệp lỗi rõ ràng nhất có thể từ nhiều format khác nhau
    const extractMessage = (payload) => {
      if (!payload) return null;
      if (typeof payload === "string") return payload; // backend trả plain text
      return (
        payload.message ||
        payload.detail ||
        payload.error ||
        payload.title ||
        (Array.isArray(payload.errors) && payload.errors[0]?.defaultMessage) ||
        null
      );
    };

    const serverMessage = extractMessage(data);

    switch (status) {
      case 400:
        return new Error(serverMessage || "Dữ liệu không hợp lệ");
      case 401:
        return new Error(serverMessage || "Phiên đăng nhập đã hết hạn");
      case 403:
        return new Error(serverMessage || "Bạn không có quyền truy cập");
      case 404:
        return new Error(serverMessage || "Không tìm thấy dữ liệu");
      case 500:
        return new Error(serverMessage || "Lỗi server, vui lòng thử lại sau");
      default:
        return new Error(serverMessage || "Có lỗi xảy ra");
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

// Helper function để tải file (PDF, Excel, etc.)
export const apiDownloadFile = async (endpoint, filename, config = {}) => {
  try {
    const response = await mainHttpClient.request({
      method: "GET",
      url: endpoint,
      responseType: "blob",
      ...config,
    });

    // Tạo blob từ response
    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });

    // Tạo URL tạm thời và tải file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export default mainHttpClient;
