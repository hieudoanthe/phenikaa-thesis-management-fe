import { apiPost, apiGet, apiPut, apiDelete } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

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
   * Lấy danh sách topic
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
}

export default new TopicService();
