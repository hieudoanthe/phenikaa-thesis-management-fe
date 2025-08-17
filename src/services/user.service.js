import { apiPost, apiGet, apiDelete, apiPut, apiPatch } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

class UserService {
  /**
   * Tạo user
   */
  async createUser(userData) {
    try {
      const response = await apiPost(API_ENDPOINTS.SAVE_USER, userData);
      return response;
    } catch (error) {
      console.error("Lỗi khi tạo user:", error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin user
   * @param {{userId:number, fullName:string, username:string, roleIds:number[]}} user
   */
  async updateUser(user) {
    try {
      const response = await apiPut(API_ENDPOINTS.UPDATE_USER, user);
      return response;
    } catch (error) {
      console.error("Lỗi khi cập nhật user:", error);
      throw error;
    }
  }

  async getUsers({ page = 0, size = 1000 } = {}) {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_USERS_PAGED, {
        params: { page, size },
      });
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách user:", error);
      throw error;
    }
  }

  /**
   * Thay đổi trạng thái user
   * @param {number} userId - ID user
   * @returns {Promise<any>} - Kết quả thay đổi trạng thái
   */
  async changeStatusUser(userId) {
    try {
      const response = await apiPatch(
        `${API_ENDPOINTS.CHANGE_STATUS_USER}?userId=${userId}`
      );
      return response;
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái user:", error);
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

  /**
   * Lấy thông tin profile sinh viên
   * @param {number} userId - ID của sinh viên
   * @returns {Promise<any>} - Thông tin profile sinh viên
   */
  async getStudentProfile(userId) {
    try {
      const response = await apiGet(
        API_ENDPOINTS.GET_STUDENT_PROFILE.replace("{userId}", userId)
      );
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy profile sinh viên:", error);
      throw error;
    }
  }

  /**
   * Cập nhật profile sinh viên với avatar
   * @param {FormData} formData - FormData chứa profile và avatar file
   * @returns {Promise<any>} - Kết quả cập nhật
   */
  async updateStudentProfile(formData) {
    try {
      const response = await apiPut(
        API_ENDPOINTS.UPDATE_STUDENT_PROFILE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      throw error;
    }
  }

  /**
   * Lấy thông tin profile giảng viên
   * @param {number} userId - ID của giảng viên
   * @returns {Promise<any>} - Thông tin profile giảng viên
   */
  async getTeacherProfile(userId) {
    try {
      const response = await apiGet(
        API_ENDPOINTS.GET_TEACHER_PROFILE.replace("{userId}", userId)
      );
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy profile giảng viên:", error);
      throw error;
    }
  }

  /**
   * Cập nhật profile giảng viên với avatar
   * @param {FormData} formData - FormData chứa profile và avatar file
   * @returns {Promise<any>} - Kết quả cập nhật
   */
  async updateTeacherProfile(formData) {
    try {
      const response = await apiPut(
        API_ENDPOINTS.UPDATE_TEACHER_PROFILE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Lỗi khi cập nhật profile giảng viên:", error);
      throw error;
    }
  }
}

export default new UserService();
