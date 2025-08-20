import mainHttpClient from "./mainHttpClient";

const notificationService = {
  /**
   * Đánh dấu tất cả thông báo đã đọc cho một giảng viên
   * @param {string|number} teacherId - ID của giảng viên
   * @returns {Promise<Object>} Kết quả từ API
   */
  markAllAsRead: async (teacherId) => {
    try {
      const response = await mainHttpClient.put(
        `/notifications/mark-all-read/${teacherId}`
      );

      // Trả về response.data thay vì response
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy danh sách thông báo của một giảng viên
   * @param {string|number} teacherId - ID của giảng viên
   * @param {Object} params - Tham số phân trang và lọc
   * @returns {Promise<Object>} Danh sách thông báo
   */
  getNotifications: async (teacherId, params = {}) => {
    try {
      const response = await mainHttpClient.get(`/notifications/${teacherId}`, {
        params,
      });
      // Trả về response.data thay vì response
      return response.data || response;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo:", error);
      throw error;
    }
  },

  /**
   * Đánh dấu một thông báo cụ thể đã đọc
   * @param {string|number} notificationId - ID của thông báo
   * @returns {Promise<Object>} Kết quả từ API
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await mainHttpClient.put(
        `/notifications/${notificationId}/mark-read`
      );

      // Trả về response.data thay vì response
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },
};

export default notificationService;
