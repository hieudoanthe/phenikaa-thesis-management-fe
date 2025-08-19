import { apiPost, apiGet, apiPut, apiDelete, apiPatch } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";
import { getTeacherIdFromToken } from "../auth/authUtils";

class TopicService {
  /**
   * Tạo topic mới
   * @param {Object} topicData - Dữ liệu topic
   * @returns {Promise<Object>} - Kết quả tạo topic
   */
  async createTopic(topicData) {
    try {
      console.log("Đang gọi API createTopic với dữ liệu:", topicData);
      console.log("API URL:", API_ENDPOINTS.CREATE_TOPIC);

      const response = await apiPost(API_ENDPOINTS.CREATE_TOPIC, topicData);

      console.log("API createTopic response:", response);

      return {
        success: true,
        data: response,
        message: "Tạo đề tài thành công",
      };
    } catch (error) {
      console.error("Lỗi khi tạo topic:", error);

      return {
        success: false,
        error: error.message,
        message: "Tạo đề tài thất bại",
      };
    }
  }

  /**
   * Lấy danh sách topic (API cũ - giữ lại để tương thích)
   * @param {Object} params - Tham số tìm kiếm
   * @returns {Promise<Object>} - Danh sách topic
   */
  async getTopicList(params = {}) {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_TOPIC_LIST, params);

      return {
        success: true,
        data: response,
        message: "Lấy danh sách đề tài thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách topic:", error);

      return {
        success: false,
        error: error.message,
        message: "Lấy danh sách đề tài thất bại",
      };
    }
  }

  /**
   * Lấy danh sách topic theo TeacherId từ JWT token
   * @param {Object} params - Tham số tìm kiếm
   * @returns {Promise<Object>} - Danh sách topic của teacher
   */
  async getTopicListByTeacher(params = {}) {
    try {
      // Lấy TeacherId từ JWT token
      const teacherId = getTeacherIdFromToken();

      if (!teacherId) {
        console.error("Không thể lấy TeacherId từ token");
        return {
          success: false,
          error: "Không thể lấy TeacherId từ token",
          message: "Vui lòng đăng nhập lại để lấy danh sách đề tài",
        };
      }

      // Tạo URL API với TeacherId
      const apiUrl = API_ENDPOINTS.GET_TOPIC_LIST_PAGED.replace(
        "{teacherId}",
        teacherId
      );

      console.log("API URL gốc:", API_ENDPOINTS.GET_TOPIC_LIST_PAGED);
      console.log("API URL sau khi thay thế:", apiUrl);
      console.log("Params:", params);

      // Sử dụng API mới với TeacherId
      const response = await apiGet(apiUrl, params);

      console.log("API getTopicListByTeacher response:", response);

      return {
        success: true,
        data: response,
        message: "Lấy danh sách đề tài của giáo viên thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách topic theo teacher:", error);

      return {
        success: false,
        error: error.message,
        message: "Lấy danh sách đề tài của giáo viên thất bại",
      };
    }
  }

  /**
   * Sửa topic
   * @param {Object} topicData - Dữ liệu sửa
   * @returns {Promise<Object>} - Kết quả sửa
   */
  async editTopic(topicData) {
    try {
      const response = await apiPost(API_ENDPOINTS.EDIT_TOPIC, topicData);
      return {
        success: true,
        data: response,
        message: "Sửa đề tài thành công",
      };
    } catch (error) {
      console.error("Lỗi khi sửa đề tài:", error);
      return {
        success: false,
        error: error.message,
        message: "Sửa đề tài thất bại",
      };
    }
  }

  /**
   * Cập nhật topic
   * @param {Object} topicData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Kết quả cập nhật
   */
  async updateTopic(topicId, topicData) {
    try {
      const response = await apiPut(API_ENDPOINTS.UPDATE_TOPIC, topicData);

      return {
        success: true,
        data: response,
        message: "Cập nhật đề tài thành công",
      };
    } catch (error) {
      console.error("Lỗi khi cập nhật topic:", error);

      return {
        success: false,
        error: error.message,
        message: "Cập nhật đề tài thất bại",
      };
    }
  }

  /**
   * Xóa topic
   * @param {number} topicId - ID topic
   * @returns {Promise<Object>} - Kết quả xóa
   */
  async deleteTopic(topicId) {
    try {
      const response = await apiDelete(
        `${API_ENDPOINTS.DELETE_TOPIC}?topicId=${topicId}`
      );

      return {
        success: true,
        data: response,
        message: "Xóa đề tài thành công",
      };
    } catch (error) {
      console.error("Lỗi khi xóa topic:", error);

      return {
        success: false,
        error: error.message,
        message: "Xóa đề tài thất bại",
      };
    }
  }

  /**
   * Duyệt đề tài
   * @param {number} topicId - ID đề tài
   * @returns {Promise<any>} - Kết quả thay đổi trạng thái
   */
  async approveTopic(topicId) {
    try {
      const response = await apiPatch(
        `${API_ENDPOINTS.APPROVE_TOPIC}?topicId=${topicId}`
      );
      return {
        success: true,
        data: response,
        message: "Duyệt đề tài thành công",
      };
    } catch (error) {
      console.error("Lỗi khi duyệt đề tài:", error);

      return {
        success: false,
        error: error.message,
        message: "Duyệt đề tài thất bại",
      };
    }
  }

  /**
   * Duyệt đề tài
   * @param {number} topicId - ID đề tài
   * @returns {Promise<any>} - Kết quả thay đổi trạng thái
   */
  async rejectTopic(topicId) {
    try {
      const response = await apiPatch(
        `${API_ENDPOINTS.REJECT_TOPIC}?topicId=${topicId}`
      );
      return {
        success: true,
        data: response,
        message: "Từ chối đề tài thành công",
      };
    } catch (error) {
      console.error("Lỗi khi từ chối đề tài:", error);

      return {
        success: false,
        error: error.message,
        message: "Từ chối đề tài thất bại",
      };
    }
  }
}

export default new TopicService();
