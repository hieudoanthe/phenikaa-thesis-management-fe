// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || "Phenikaa Thesis Management",
  VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",
};

// Academic Year API Configuration
export const ACADEMIC_YEAR_API_CONFIG = {
  BASE_URL: "http://localhost:8080",
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: "/api/auth/login",
  LOGOUT: "/api/auth/logout",
  REFRESH: "/api/auth/refresh-token",

  // Academic Year Management
  ACADEMIC_YEAR_LIST: "/academic-config/listAcademicYear",
  ACADEMIC_YEAR_DETAIL: "/academic-config/getAcademicYear",

  // Admin Permission
  // User Management
  SAVE_USER: "/api/admin/saveUser",
  GET_USERS: "/api/admin/getUsers",
  GET_USERS_PAGED: "/api/admin/getUsersPaged",
  DELETE_USER: "/api/admin/deleteUser",
  UPDATE_USER: "/api/admin/updateUser",
  CHANGE_STATUS_USER: "/api/admin/changeStatusUser",

  // Teacher Permission
  // Topic Management
  CREATE_TOPIC: "/api/thesis-service/teacher/createTopic",
  GET_TOPIC_LIST: "/api/thesis-service/teacher/getListTopic",
  EDIT_TOPIC: "/api/thesis-service/teacher/editTopic",
  UPDATE_TOPIC: "/api/thesis-service/teacher/updateTopic",
  DELETE_TOPIC: "/api/thesis-service/teacher/deleteTopic",
  APPROVE_TOPIC: "/api/thesis-service/teacher/approveTopic",
  REJECT_TOPIC: "/api/thesis-service/teacher/rejectTopic",

  // Student Topic Registration
  GET_AVAILABLE_TOPIC_LIST: "/api/thesis-service/student/available-topics",
  REGISTER_TOPIC: "/api/thesis-service/student/register-topic",

  // Student Suggest
  STUDENT_SUGGEST_TOPIC: "/api/thesis-service/student/suggest-topic",
};
