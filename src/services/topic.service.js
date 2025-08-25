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
      const response = await apiPost(API_ENDPOINTS.CREATE_TOPIC, topicData);

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
   * Lấy danh sách topic theo UserId từ JWT token (dành cho teacher)
   * @param {Object} params - Tham số tìm kiếm
   * @returns {Promise<Object>} - Danh sách topic của teacher
   */
  async getTopicListByTeacher(params = {}) {
    try {
      // Lấy UserId từ JWT token (getTeacherIdFromToken() thực chất trả về userId)
      const teacherId = getTeacherIdFromToken();

      if (!teacherId) {
        console.error("Không thể lấy UserId từ token");
        return {
          success: false,
          error: "Không thể lấy UserId từ token",
          message: "Vui lòng đăng nhập lại để lấy danh sách đề tài",
        };
      }

      // Tạo URL API với UserId (được sử dụng làm teacherId)
      const apiUrl = API_ENDPOINTS.GET_TOPIC_LIST_PAGED.replace(
        "{teacherId}",
        teacherId
      );

      // Đảm bảo tham số được truyền đúng cách vào query string
      const config = {
        params: params,
      };

      // Sử dụng API mới với TeacherId
      const response = await apiGet(apiUrl, config);

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

  /**
   * Lấy danh sách đề tài đã được approve với pagination
   * @param {Object} params - Tham số pagination {page, size}
   * @returns {Promise<Object>} - Danh sách đề tài đã approve
   */
  async getApprovedTopics(params = {}) {
    try {
      // Đảm bảo tham số được truyền đúng cách vào query string
      const config = {
        params: params,
      };

      const response = await apiGet(
        API_ENDPOINTS.GET_APPROVED_TOPICS_PAGED,
        config
      );

      return {
        success: true,
        data: response,
        message: "Lấy danh sách đề tài đã approve thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đề tài đã approve:", error);
      return {
        success: false,
        error: error.message,
        message: "Lấy danh sách đề tài đã approve thất bại",
      };
    }
  }

  /**
   * Lấy số lượng đề tài đã được approve
   * @returns {Promise<Object>} - Số lượng đề tài đã approve
   */
  async getApprovedTopicsCount() {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_APPROVED_TOPICS_COUNT);
      return {
        success: true,
        data: response,
        message: "Lấy số lượng đề tài đã approve thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy số lượng đề tài đã approve:", error);
      return {
        success: false,
        error: error.message,
        message: "Lấy số lượng đề tài đã approve thất bại",
      };
    }
  }

  /**
   * Lấy thông tin trạng thái chi tiết của một đề tài
   * @param {number} topicId - ID đề tài
   * @returns {Promise<Object>} - Thông tin trạng thái đề tài
   */
  async getTopicStatus(topicId) {
    try {
      const apiUrl = API_ENDPOINTS.GET_TOPIC_STATUS.replace(
        "{topicId}",
        topicId
      );
      const response = await apiGet(apiUrl);
      return {
        success: true,
        data: response,
        message: "Lấy thông tin trạng thái đề tài thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin trạng thái đề tài:", error);
      return {
        success: false,
        error: error.message,
        message: "Lấy thông tin trạng thái đề tài thất bại",
      };
    }
  }

  /**
   * Lấy thông tin năng lực của giảng viên
   * @returns {Promise<Object>} - Thông tin năng lực giảng viên
   */
  async getSupervisorCapacity() {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_SUPERVISOR_CAPACITY);
      return {
        success: true,
        data: response,
        message: "Lấy thông tin năng lực giảng viên thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin năng lực giảng viên:", error);
      return {
        success: false,
        error: error.message,
        message: "Lấy thông tin năng lực giảng viên thất bại",
      };
    }
  }
}

export default new TopicService();
