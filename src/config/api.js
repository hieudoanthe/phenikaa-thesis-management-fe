// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || "Phenikaa Thesis Management",
  VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",
};

export const API_URL = {
  BASE_URL: "http://localhost:8080",
}

// Academic Year API Configuration
export const ACADEMIC_YEAR_API_CONFIG = {
  BASE_URL: "http://localhost:8087",
};

// Topic API Configuration
export const TOPIC_API_CONFIG = {
  BASE_URL: "http://localhost:8080",
};

// API Endpoints
export const API_ENDPOINTS = {
  // Academic Year Management
  ACADEMIC_YEAR_LIST: "/internal/listAcademicYear",

  // Teacher Topic Management
  CREATE_TOPIC: `${TOPIC_API_CONFIG.BASE_URL}/api/lecturer/thesis/createTopic`,
  GET_TOPIC_LIST: `${TOPIC_API_CONFIG.BASE_URL}/api/lecturer/thesis/getListTopic`,
  EDIT_TOPIC: `${TOPIC_API_CONFIG.BASE_URL}/api/lecturer/thesis/editTopic`,
  UPDATE_TOPIC: `${TOPIC_API_CONFIG.BASE_URL}/api/lecturer/thesis/updateTopic`,
  DELETE_TOPIC: `${TOPIC_API_CONFIG.BASE_URL}/api/lecturer/thesis/deleteTopic`,

  // Student Topic Registration
  GET_AVAILABLE_TOPIC_LIST: `${TOPIC_API_CONFIG.BASE_URL}/api/lecturer/thesis/available-topics`,
  REGISTER_TOPIC: `${TOPIC_API_CONFIG.BASE_URL}/api/lecturer/thesis/register-topic`,

  // Student Suggest
  STUDENT_SUGGEST_TOPIC: `${TOPIC_API_CONFIG.BASE_URL}/api/lecturer/thesis/suggest-topic`,
};
