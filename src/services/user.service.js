import { apiPost, apiGet, apiDelete } from "./mainHttpClient";
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

  /**
   * Xóa user
   * @param {number} userId - ID user
   * @returns {Promise<any>} - Kết quả xóa
   */
  async deleteUser(userId) {
    try {
      const response = await apiDelete(
        `${API_ENDPOINTS.DELETE_USER}?userId=${userId}`
      );
      return response;
    } catch (error) {
      console.error("Lỗi khi xóa user:", error);
      throw error;
    }
  }
}

export default new UserService();
