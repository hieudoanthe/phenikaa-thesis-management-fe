// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || "Phenikaa Thesis Management",
  VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",
};

// Base URLs from environment
const HTTP_BASE_URL = import.meta.env.VITE_MAIN_API_BASE_URL;
const WS_BASE_URL_ENV = import.meta.env.VITE_WS_BASE_URL || null;

// Derive WS base from HTTP base if not explicitly provided
const WS_BASE_URL =
  WS_BASE_URL_ENV ||
  HTTP_BASE_URL.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

// Academic Year API Configuration
export const ACADEMIC_YEAR_API_CONFIG = {
  BASE_URL: HTTP_BASE_URL,
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
  ACADEMIC_YEAR_LIST: "/api/academic-config-service/list-academic-year",

  /**
   * Admin Permission
   */
  // User Management
  SAVE_USER: "/api/user-service/admin/save-user",
  GET_USERS: "/api/user-service/admin/get-users",
  GET_USERS_PAGED: "/api/user-service/admin/get-users-paged",
  DELETE_USER: "/api/user-service/admin/delete-user",
  UPDATE_USER: "/api/user-service/admin/update-user",
  CHANGE_STATUS_USER: "/api/user-service/admin/change-status-user",

  // Student Import Management
  IMPORT_STUDENTS_CSV: "/api/user-service/admin/import-students",
  GET_IMPORTED_STUDENTS_BY_PERIOD:
    "/api/user-service/admin/students/by-period/{periodId}",
  REMOVE_STUDENT_FROM_PERIOD:
    "/api/user-service/admin/students/{studentId}/period/{periodId}",

  // Import teachers
  IMPORT_TEACHERS_CSV: "/api/user-service/admin/import-teachers",

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

  // Topic Filtering and Search
  FILTER_TOPICS: "/api/thesis-service/teacher/filter-theses",
  SEARCH_TOPICS: "/api/thesis-service/teacher/search-theses",
  GET_TOPICS_BY_SUPERVISOR: "/api/thesis-service/teacher/theses-by-supervisor",
  GET_TOPICS_BY_ACADEMIC_YEAR:
    "/api/thesis-service/teacher/theses-by-academic-year",
  GET_TOPICS_BY_DIFFICULTY: "/api/thesis-service/teacher/theses-by-difficulty",
  GET_TOPICS_BY_TOPIC_STATUS:
    "/api/thesis-service/teacher/theses-by-topic-status",
  GET_TOPICS_BY_APPROVAL_STATUS:
    "/api/thesis-service/teacher/theses-by-approval-status",

  // Approved Topics Management
  GET_APPROVED_TOPICS_PAGED:
    "/api/thesis-service/teacher/approved-topics/paged",
  GET_APPROVED_TOPICS_COUNT:
    "/api/thesis-service/teacher/approved-topics/count",
  GET_TOPIC_STATUS: "/api/thesis-service/teacher/topic-status/{topicId}",
  GET_TOPIC_CAN_APPROVE:
    "/api/thesis-service/teacher/topic-can-approve/{topicId}",
  GET_SUPERVISOR_CAPACITY: "/api/thesis-service/teacher/supervisor-capacity",

  /**
   * Student Permission
   */

  // Student Topic Registration
  GET_AVAILABLE_TOPIC_LIST: "/api/thesis-service/student/available-topics",
  STUDENT_FILTER_TOPICS: "/api/thesis-service/student/topics/filter",
  REGISTER_TOPIC: "/api/thesis-service/student/register-topic",
  STUDENT_SUGGEST_TOPIC: "/api/thesis-service/student/suggest-topic",
  GET_STUDENT_TOPIC:
    "/api/thesis-service/student/get-suggest-topic-{studentId}/paged",
  UPDATE_STUDENT_SUGGEST_TOPIC:
    "/api/thesis-service/student/update-suggest-topic",

  // Student Profile
  GET_STUDENT_PROFILE: "/api/profile-service/student/get-profile/{userId}",
  UPDATE_STUDENT_PROFILE: "/api/profile-service/student/update-profile-student",

  // Teacher Profile
  GET_ALL_TEACHERS: "/api/profile-service/student/get-all-teachers",

  // Student Schedule
  GET_STUDENT_SCHEDULE: "/api/eval-service/student/{studentId}/schedule",

  // Student Assignment Deadlines
  GET_STUDENT_DEADLINES: "/api/assign-service/student/{studentId}/deadlines",

  /**
   * Teacher Permission
   */
  // Teacher Profile
  GET_TEACHER_PROFILE: "/api/profile-service/teacher/get-profile/{userId}",
  UPDATE_TEACHER_PROFILE: "/api/profile-service/teacher/update-profile-teacher",

  // Assign Service
  GET_ASSIGNMENTS_BY_TOPIC_API: "/api/assign-service/topic/{topicId}",
  CREATE_ASSIGNMENT: "/api/assign-service",
  UPDATE_ASSIGNMENT: "/api/assign-service/{assignmentId}",
  CREATE_TASK: "/api/assign-service/{assignmentId}/tasks",
  UPDATE_TASK: "/api/assign-service/tasks/{taskId}",
  DELETE_TASK: "/api/assign-service/tasks/{taskId}",
  DELETE_ASSIGNMENT: "/api/assign-service/{assignmentId}",

  /**
   * Registration Period Management
   */
  // Registration Period
  GET_CURRENT_REGISTRATION_PERIOD: "/api/thesis-service/admin/current",
  GET_ACTIVE_REGISTRATION_PERIODS_PUBLIC:
    "/api/thesis-service/student-period/active",
  GET_REGISTRATION_PERIODS: "/api/thesis-service/admin",
  GET_REGISTRATION_PERIODS_BY_ACADEMIC_YEAR:
    "/api/thesis-service/admin/academic-year/{academicYearId}",
  CREATE_REGISTRATION_PERIOD: "/api/thesis-service/admin",
  START_REGISTRATION_PERIOD: "/api/thesis-service/admin/{periodId}/start",
  CLOSE_REGISTRATION_PERIOD: "/api/thesis-service/admin/{periodId}/close",

  // Lecturer Capacity
  GET_LECTURER_CAPACITY:
    "/api/thesis-service/admin/lecturer-capacity/{lecturerId}/{periodId}",
  UPDATE_LECTURER_CAPACITY: "/api/thesis-service/admin/lecturer-capacity",

  // Academic Year
  GET_ACTIVE_ACADEMIC_YEAR: "/api/academic-config-service/active",
  GET_ACADEMIC_YEARS: "/api/academic-config-service/list-academic-year",
  ACTIVATE_ACADEMIC_YEAR: "/api/academic-config-service/{yearId}/activate",
  DEACTIVATE_ACADEMIC_YEAR: "/api/academic-config-service/{yearId}/deactivate",
  CREATE_ACADEMIC_YEAR: "/api/academic-config-service/create",
  UPDATE_ACADEMIC_YEAR: "/api/academic-config-service/{yearId}",
  DELETE_ACADEMIC_YEAR: "/api/academic-config-service/{yearId}",

  /**
   * Evaluation Service (Defense Schedule Management)
   */
  // Defense Schedules
  GET_DEFENSE_SCHEDULES: "/api/eval-service/admin/schedules",
  GET_DEFENSE_SCHEDULE_BY_ID: "/api/eval-service/admin/schedules/{scheduleId}",
  CREATE_DEFENSE_SCHEDULE: "/api/eval-service/admin/schedules",
  UPDATE_DEFENSE_SCHEDULE: "/api/eval-service/admin/schedules/{scheduleId}",
  DELETE_DEFENSE_SCHEDULE: "/api/eval-service/admin/schedules/{scheduleId}",
  ACTIVATE_DEFENSE_SCHEDULE:
    "/api/eval-service/admin/schedules/{scheduleId}/activate",
  DEACTIVATE_DEFENSE_SCHEDULE:
    "/api/eval-service/admin/schedules/{scheduleId}/deactivate",

  // Defense Sessions
  GET_DEFENSE_SESSIONS: "/api/eval-service/admin/sessions",
  GET_DEFENSE_SESSION_BY_ID: "/api/eval-service/admin/sessions/{sessionId}",
  EXPORT_DEFENSE_SESSION: "/api/eval-service/admin/sessions/{sessionId}/export",
  EXPORT_ALL_DEFENSE_SESSIONS: "/api/eval-service/admin/sessions/export/all",
  CREATE_DEFENSE_SESSION: "/api/eval-service/admin/sessions",
  UPDATE_DEFENSE_SESSION: "/api/eval-service/admin/sessions/{sessionId}",
  DELETE_DEFENSE_SESSION: "/api/eval-service/admin/sessions/{sessionId}",
  GET_SESSIONS_BY_SCHEDULE:
    "/api/eval-service/admin/sessions/schedule/{scheduleId}",
  UPDATE_SESSION_STATUS: "/api/eval-service/admin/sessions/{sessionId}/status",

  // Student Assignment
  ASSIGN_STUDENTS_TO_SESSIONS: "/api/eval-service/admin/student-assignment",
  GET_ALL_STUDENT_ASSIGNMENTS:
    "/api/eval-service/admin/sessions/student-assignments",

  // Student Period Management
  GET_STUDENTS_BY_PERIOD: "/api/thesis-service/student-period/{periodId}",
  GET_REGISTERED_STUDENTS_BY_PERIOD:
    "/api/thesis-service/student-period/registered/{periodId}",
  GET_SUGGESTED_STUDENTS_BY_PERIOD:
    "/api/thesis-service/student-period/suggested/{periodId}",
  GET_ALL_STUDENTS_BY_PERIOD:
    "/api/thesis-service/student-period/all/{periodId}",
  GET_INCOMPLETE_STUDENTS_BY_PERIOD:
    "/api/thesis-service/student-period/incomplete/{periodId}",

  // Student Assignment to Defense Sessions
  ASSIGN_STUDENT_TO_SESSION:
    "/api/eval-service/admin/sessions/{sessionId}/students",
  UNASSIGN_STUDENT_FROM_SESSION:
    "/api/eval-service/admin/sessions/{sessionId}/students/{studentId}",
  GET_ASSIGNED_STUDENTS:
    "/api/eval-service/admin/sessions/{sessionId}/students",
  GET_AVAILABLE_SESSIONS: "/api/eval-service/admin/sessions/available",

  // Auto Assign
  AUTO_ASSIGN_PREVIEW: "/api/eval-service/admin/auto-assign/preview",
  AUTO_ASSIGN_CONFIRM: "/api/eval-service/admin/auto-assign/confirm",

  /**
   * Communication Service (Chat)
   */
  // Chat Messages
  SEND_CHAT_MESSAGE: "/chat/send",
  GET_CHAT_HISTORY: "/chat/history",
  GET_CONVERSATION_HISTORY: "/chat/conversation/{userId1}/{userId2}",
  GET_USER_CONVERSATIONS: "/chat/conversations/{userId}",
  GET_RECENT_MESSAGES: "/chat/recent-messages/{userId}",
  GET_CHAT_PARTNERS: "/chat/partners/{userId}",

  /**
   * Statistics APIs - Internal Services
   */
  // User Service Statistics
  GET_USER_COUNT: "/internal/users/get-user-count",
  GET_USER_COUNT_BY_ROLE: "/internal/users/get-user-count-by-role",
  GET_STUDENT_COUNT_BY_PERIOD: "/internal/users/get-student-count-by-period",
  // Internal user profile by ID
  USER_INTERNAL_GET_PROFILE_BY_ID: "/internal/users/get-profile/{userId}",

  // Thesis Service Statistics
  GET_REGISTERED_STUDENTS_COUNT_BY_PERIOD:
    "/internal/thesis/get-registered-students-count-by-period",
  GET_REGISTERED_STUDENTS_BY_PERIOD:
    "/internal/thesis/get-registered-students-by-period",
  GET_APPROVED_STUDENTS_COUNT_BY_PERIOD:
    "/internal/thesis/get-approved-students-count-by-period",
  GET_PENDING_STUDENTS_COUNT_BY_PERIOD:
    "/internal/thesis/get-pending-students-count-by-period",
  GET_REJECTED_STUDENTS_COUNT_BY_PERIOD:
    "/internal/thesis/get-rejected-students-count-by-period",

  // Suggested Topics Statistics
  GET_SUGGESTED_TOPICS_COUNT_BY_PERIOD:
    "/internal/thesis/get-suggested-topics-count-by-period",
  GET_SUGGESTED_TOPICS_BY_PERIOD:
    "/internal/thesis/get-suggested-topics-by-period",
  GET_APPROVED_SUGGESTIONS_COUNT_BY_PERIOD:
    "/internal/thesis/get-approved-suggestions-count-by-period",
  GET_PENDING_SUGGESTIONS_COUNT_BY_PERIOD:
    "/internal/thesis/get-pending-suggestions-count-by-period",
  GET_REJECTED_SUGGESTIONS_COUNT_BY_PERIOD:
    "/internal/thesis/get-rejected-suggestions-count-by-period",

  // Combined Statistics
  GET_TOTAL_STUDENTS_INVOLVED_BY_PERIOD:
    "/internal/thesis/get-total-students-involved-by-period",
  GET_PERIOD_STATISTICS_SUMMARY:
    "/internal/thesis/get-period-statistics-summary",

  // Time Series
  GET_REGISTRATIONS_TIME_SERIES: "/internal/thesis/registrations/time-series",
  GET_SUGGESTIONS_TIME_SERIES: "/internal/thesis/suggestions/time-series",
};

// WebSocket Endpoints
export const WS_ENDPOINTS = {
  // Notification
  NOTIFICATIONS: `${WS_BASE_URL}/ws/notifications`,
  // Chat
  CHAT: `${WS_BASE_URL}/ws/chat`,
};
