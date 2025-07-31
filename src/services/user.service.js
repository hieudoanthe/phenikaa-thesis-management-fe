import { apiPost } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

class UserService {
  async createUser(userData) {
    try {
      const response = await apiPost(API_ENDPOINTS.SAVE_USER, userData);
      return response;
    } catch (error) {
      console.error("Lỗi khi tạo user:", error);
      throw error;
    }
  }
}

export default new UserService();
