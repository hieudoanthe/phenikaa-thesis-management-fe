import { apiPost, apiGet } from "./mainHttpClient";
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

  async getUsers() {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_USERS);
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách user:", error);
      throw error;
    }
  }
}

export default new UserService();
