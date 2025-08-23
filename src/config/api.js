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
  /**
   * Authentication
   */
  LOGIN: "/api/auth/login",
  LOGOUT: "/api/auth/logout",
  REFRESH: "/api/auth/refresh-token",

  // Academic Year Management
  ACADEMIC_YEAR_LIST: "/academic-config/list-academic-year",
  ACADEMIC_YEAR_DETAIL: "/academic-config/get-academic-year",

  /**
   * Admin Permission
   */
  // User Management
  SAVE_USER: "/api/admin/save-user",
  GET_USERS: "/api/admin/get-users",
  GET_USERS_PAGED: "/api/admin/get-users-paged",
  DELETE_USER: "/api/admin/delete-user",
  UPDATE_USER: "/api/admin/update-user",
  CHANGE_STATUS_USER: "/api/admin/change-status-user",

  /**
   * Teacher Permission
   */
  // Topic Management
  CREATE_TOPIC: "/api/thesis-service/teacher/create-topic",
  GET_TOPIC_LIST: "/api/thesis-service/teacher/get-list-topic",
  GET_TOPIC_LIST_PAGED:
    "/api/thesis-service/teacher/get-topic-by-{teacherId}/paged",
  EDIT_TOPIC: "/api/thesis-service/teacher/edit-topic",
  UPDATE_TOPIC: "/api/thesis-service/teacher/update-topic",
  DELETE_TOPIC: "/api/thesis-service/teacher/delete-topic",
  APPROVE_TOPIC: "/api/thesis-service/teacher/approve-topic",
  REJECT_TOPIC: "/api/thesis-service/teacher/reject-topic",

  /**
   * Student Permission
   */

  // Student Topic Registration
  GET_AVAILABLE_TOPIC_LIST: "/api/thesis-service/student/available-topics",
  REGISTER_TOPIC: "/api/thesis-service/student/register-topic",
  STUDENT_SUGGEST_TOPIC: "/api/thesis-service/student/suggest-topic",
  GET_STUDENT_TOPIC:
    "/api/thesis-service/student/get-suggest-topic-{studentId}/paged",

  // Student Profile
  GET_STUDENT_PROFILE: "/api/profile-service/student/get-profile/{userId}",
  UPDATE_STUDENT_PROFILE: "/api/profile-service/student/update-profile-student",

  // Teacher Profile
  GET_ALL_TEACHERS: "/api/profile-service/student/get-all-teachers",

  /**
   * Teacher Permission
   */
  // Teacher Profile
  GET_TEACHER_PROFILE: "/api/profile-service/teacher/get-profile/{userId}",
  UPDATE_TEACHER_PROFILE: "/api/profile-service/teacher/update-profile-teacher",
};

// WebSocket Endpoints
export const WS_ENDPOINTS = {
  // Notification
  NOTIFICATIONS: "ws://localhost:8080/ws/notifications",
  // Chat
  CHAT: "ws://localhost:8080/ws/chat",
};
