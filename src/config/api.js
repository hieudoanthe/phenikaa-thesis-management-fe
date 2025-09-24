// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || "Phenikaa Thesis Management",
  VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",
};

// Base URLs from environment
const HTTP_BASE_URL =
  import.meta.env.VITE_MAIN_API_BASE_URL || "http://localhost:8080";
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

  // Student Period Management
  GET_STUDENTS_BY_PERIOD: "/api/thesis-service/student-period/{periodId}",
  GET_REGISTERED_STUDENTS_BY_PERIOD:
    "/api/thesis-service/student-period/registered/{periodId}",
  GET_SUGGESTED_STUDENTS_BY_PERIOD:
    "/api/thesis-service/student-period/suggested/{periodId}",
  GET_ALL_STUDENTS_BY_PERIOD:
    "/api/thesis-service/student-period/all/{periodId}",

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

  /**
   * Statistics APIs - Internal Services
   */
  // User Service Statistics
  GET_ALL_USERS: "/internal/users/get-all-users",
  GET_USERS_BY_ROLE: "/internal/users/get-users-by-role",
  GET_USER_COUNT: "/internal/users/get-user-count",
  GET_USER_COUNT_BY_ROLE: "/internal/users/get-user-count-by-role",
  GET_USER_COUNT_BY_STATUS: "/internal/users/get-user-count-by-status",
  GET_ACTIVE_USERS_TODAY: "/internal/users/get-active-users-today",
  // Internal user profile by id (includes period info)
  USER_INTERNAL_GET_PROFILE_BY_ID: "/internal/users/get-profile/{userId}",

  // Academic Config Service Statistics
  GET_ACADEMIC_YEARS_STATS: "/internal/academic/get-academic-years",
  GET_ACTIVE_ACADEMIC_YEAR_STATS: "/internal/academic/get-active-academic-year",
  GET_ACADEMIC_YEAR_COUNT: "/internal/academic/get-academic-year-count",
  GET_ACADEMIC_YEAR_BY_ID: "/internal/academic/get-academic-year-by-id",

  // Thesis Service Statistics
  GET_TOPIC_COUNT: "/internal/thesis/get-topic-count",
  GET_TOPIC_COUNT_BY_STATUS: "/internal/thesis/get-topic-count-by-status",
  GET_TOPIC_COUNT_BY_DIFFICULTY:
    "/internal/thesis/get-topic-count-by-difficulty",
  GET_TOPIC_COUNT_BY_ACADEMIC_YEAR:
    "/internal/thesis/get-topic-count-by-academic-year",
  GET_TOPIC_COUNT_BY_SUPERVISOR:
    "/internal/thesis/get-topic-count-by-supervisor",
  GET_REGISTRATION_COUNT: "/internal/thesis/get-registration-count",
  GET_REGISTRATION_COUNT_BY_STATUS:
    "/internal/thesis/get-registration-count-by-status",
  GET_REGISTRATION_COUNT_BY_ACADEMIC_YEAR:
    "/internal/thesis/get-registration-count-by-academic-year",
  GET_TOPICS_BY_SUPERVISOR_STATS: "/internal/thesis/get-topics-by-supervisor",
  GET_TOPICS_STATS_BY_SUPERVISOR:
    "/internal/thesis/get-topics-stats-by-supervisor",
  GET_REGISTRATIONS_BY_TOPIC: "/internal/thesis/get-registrations-by-topic",
  GET_TOPICS_OVER_TIME: "/internal/thesis/get-topics-over-time",
  GET_REGISTRATIONS_OVER_TIME: "/internal/thesis/get-registrations-over-time",
  GET_REGISTRATIONS_TODAY: "/internal/thesis/get-registrations-today",
  GET_TODAY_REGISTRATIONS: "/internal/thesis/get-today-registrations",

  // Submission Service Statistics
  GET_SUBMISSION_COUNT: "/internal/submissions/get-submission-count",
  GET_SUBMISSION_COUNT_BY_STATUS:
    "/internal/submissions/get-submission-count-by-status",
  GET_SUBMISSION_COUNT_BY_TOPIC:
    "/internal/submissions/get-submission-count-by-topic",
  GET_SUBMISSION_COUNT_BY_USER:
    "/internal/submissions/get-submission-count-by-user",
  GET_SUBMISSIONS_OVER_TIME: "/internal/submissions/get-submissions-over-time",
  GET_SUBMISSIONS_BY_TOPIC: "/internal/submissions/get-submissions-by-topic",
  GET_SUBMISSIONS_BY_USER: "/internal/submissions/get-submissions-by-user",
  GET_DEADLINE_STATS: "/internal/submissions/get-deadline-stats",
  GET_SUBMISSIONS_TODAY: "/internal/submissions/get-submissions-today",
  GET_TODAY_SUBMISSIONS: "/internal/submissions/get-today-submissions",

  // Assignment Service Statistics
  GET_ASSIGNMENT_COUNT: "/internal/assignments/get-assignment-count",
  GET_ASSIGNMENT_COUNT_BY_STATUS:
    "/internal/assignments/get-assignment-count-by-status",
  GET_ASSIGNMENT_COUNT_BY_USER:
    "/internal/assignments/get-assignment-count-by-user",
  GET_ASSIGNMENT_COUNT_BY_TOPIC:
    "/internal/assignments/get-assignment-count-by-topic",
  GET_ASSIGNMENTS_BY_USER: "/internal/assignments/get-assignments-by-user",
  GET_ASSIGNMENTS_BY_TOPIC: "/internal/assignments/get-assignments-by-topic",
  GET_TASK_COUNT: "/internal/assignments/get-task-count",
  GET_TASK_COUNT_BY_STATUS: "/internal/assignments/get-task-count-by-status",
  GET_TASK_COUNT_BY_ASSIGNMENT:
    "/internal/assignments/get-task-count-by-assignment",
  GET_TASKS_BY_ASSIGNMENT: "/internal/assignments/get-tasks-by-assignment",

  // Profile Service Statistics
  GET_PROFILE_COUNT: "/internal/profiles/get-profile-count",
  GET_STUDENT_PROFILE_COUNT: "/internal/profiles/get-student-profile-count",
  GET_LECTURER_PROFILE_COUNT: "/internal/profiles/get-lecturer-profile-count",
  GET_PROFILES_BY_MAJOR: "/internal/profiles/get-profiles-by-major",
  GET_PROFILES_BY_YEAR: "/internal/profiles/get-profiles-by-year",
  GET_STUDENT_PROFILES_BY_SUPERVISOR:
    "/internal/profiles/get-student-profiles-by-supervisor",
  GET_PROFILE_BY_USER_ID: "/internal/profiles/get-profile-by-user-id",

  // Evaluation Service Statistics (Public APIs)
  GET_OVERVIEW_STATISTICS: "/api/eval-service/admin/statistics/overview",
  GET_DEFENSE_STATISTICS: "/api/eval-service/admin/statistics/defenses",
  GET_EVALUATION_STATISTICS: "/api/eval-service/admin/statistics/evaluations",
  GET_SCORE_STATISTICS: "/api/eval-service/admin/statistics/scores",
  GET_MONTHLY_STATISTICS: "/api/eval-service/admin/statistics/monthly",
};

// WebSocket Endpoints
export const WS_ENDPOINTS = {
  // Notification
  NOTIFICATIONS: `${WS_BASE_URL}/ws/notifications`,
  // Chat
  CHAT: `${WS_BASE_URL}/ws/chat`,
};
