// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || "Phenikaa Thesis Management",
  VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",
};

// Academic Year API Configuration
export const ACADEMIC_YEAR_API_CONFIG = {
  BASE_URL:
    import.meta.env.VITE_ACADEMIC_YEAR_API_BASE_URL || "http://localhost:8087",
};

// Topic API Configuration
export const TOPIC_API_CONFIG = {
  BASE_URL: import.meta.env.VITE_TOPIC_API_BASE_URL || "http://localhost:8082",
};

// API Endpoints
export const API_ENDPOINTS = {
  // Academic Year Management
  ACADEMIC_YEAR_LIST: "/internal/listAcademicYear",

  // Teacher Topic Management
  CREATE_TOPIC: `${TOPIC_API_CONFIG.BASE_URL}/api/admin/thesis/createTopic`,
  GET_TOPIC_LIST: `${TOPIC_API_CONFIG.BASE_URL}/api/admin/thesis/getListTopic`,
  UPDATE_TOPIC: `${TOPIC_API_CONFIG.BASE_URL}/api/admin/thesis/updateTopic`,
  DELETE_TOPIC: `${TOPIC_API_CONFIG.BASE_URL}/api/admin/thesis/deleteTopic`,
};
