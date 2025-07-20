// Export tất cả services
export { default as authService } from "./authService";
export { default as thesisService } from "./thesisService";
export { default as academicYearService } from "./academicYearService";

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
