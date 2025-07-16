// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api",
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  AUTH_ENDPOINT: import.meta.env.VITE_AUTH_ENDPOINT || "/auth",
  REFRESH_ENDPOINT: import.meta.env.VITE_REFRESH_ENDPOINT || "/auth/refresh",
};

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || "Phenikaa Thesis Management",
  VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_CONFIG.AUTH_ENDPOINT}/login`,
  REGISTER: `${API_CONFIG.AUTH_ENDPOINT}/register`,
  LOGOUT: `${API_CONFIG.AUTH_ENDPOINT}/logout`,
  ME: `${API_CONFIG.AUTH_ENDPOINT}/me`,
  REFRESH: API_CONFIG.REFRESH_ENDPOINT,

  // Thesis Management
  THESIS: "/thesis",
  THESIS_LIST: "/thesis/list",
  THESIS_DETAIL: (id) => `/thesis/${id}`,
  THESIS_CREATE: "/thesis/create",
  THESIS_UPDATE: (id) => `/thesis/${id}`,
  THESIS_DELETE: (id) => `/thesis/${id}`,

  // Topic Management
  TOPICS: "/topics",
  TOPIC_LIST: "/topics/list",
  TOPIC_DETAIL: (id) => `/topics/${id}`,
  TOPIC_CREATE: "/topics/create",
  TOPIC_UPDATE: (id) => `/topics/${id}`,
  TOPIC_DELETE: (id) => `/topics/${id}`,

  // User Management
  USERS: "/users",
  USER_LIST: "/users/list",
  USER_DETAIL: (id) => `/users/${id}`,
  USER_CREATE: "/users/create",
  USER_UPDATE: (id) => `/users/${id}`,
  USER_DELETE: (id) => `/users/${id}`,

  // Admin
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_STATS: "/admin/stats",
};

// Helper function để tạo full URL
export const createApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
