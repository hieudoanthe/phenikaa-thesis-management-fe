import { API_ENDPOINTS, TOPIC_API_CONFIG } from "../config/api";
import axios from "axios";
import { getToken } from "../auth/authUtils";

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

      const token = getToken();
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(API_ENDPOINTS.CREATE_TOPIC, topicData, {
        headers,
        timeout: 10000,
      });

      console.log("API createTopic response:", response.data);

      return {
        success: true,
        data: response.data,
        message: "Tạo đề tài thành công",
      };
    } catch (error) {
      console.error("Lỗi khi tạo topic:", error);

      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
      }

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
      const token = getToken();
      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(API_ENDPOINTS.GET_TOPIC_LIST, {
        params,
        headers,
        timeout: 10000,
      });

      return {
        success: true,
        data: response.data,
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
   * Cập nhật topic
   * @param {number} topicId - ID topic
   * @param {Object} topicData - Dữ liệu cập nhật
   * @returns {Promise<Object>} - Kết quả cập nhật
   */
  async updateTopic(topicId, topicData) {
    try {
      const token = getToken();
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.put(
        `${API_ENDPOINTS.UPDATE_TOPIC}/${topicId}`,
        topicData,
        {
          headers,
          timeout: 10000,
        }
      );

      return {
        success: true,
        data: response.data,
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
      const token = getToken();
      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.delete(
        `${API_ENDPOINTS.DELETE_TOPIC}/${topicId}`,
        {
          headers,
          timeout: 10000,
        }
      );

      return {
        success: true,
        data: response.data,
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
