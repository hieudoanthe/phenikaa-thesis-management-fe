// Export tất cả services
export { default as authService } from "./authService";
export { default as academicYearService } from "./academicYearService";
export { default as userService } from "./user.service";

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
