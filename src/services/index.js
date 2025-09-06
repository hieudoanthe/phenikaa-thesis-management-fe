// Export tất cả services
export { default as authService } from "./auth.service";
export { default as academicYearService } from "./academic-year.service";
export { default as userService } from "./user.service";
export { default as topicService } from "./topic.service";
export { default as registrationService } from "./registration.service";
export { default as notificationService } from "./notification.service";
export { default as assignmentService } from "./assignment.service";
export { default as chatService } from "./chat.service";
export {
  suggestTopicForStudent,
  getStudentSuggestedTopics,
  getAllTeachers,
} from "./suggest.service";

// Export HTTP clients
export { default as mainHttpClient } from "./mainHttpClient";

// Export main API methods
export {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  handleApiError,
} from "./mainHttpClient";
