import mainHttpClient from "./mainHttpClient";

const notificationService = {
  /**
   * Đánh dấu tất cả thông báo đã đọc cho một người dùng
   * @param {string|number} receiverId - ID của người nhận (teacher hoặc student)
   * @returns {Promise<Object>} Kết quả từ API
   */
  markAllAsRead: async (receiverId) => {
    try {
      const response = await mainHttpClient.put(
        `/notifications/mark-all-read/${receiverId}`
      );

      // Trả về response.data thay vì response
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy danh sách thông báo của một người dùng
   * @param {string|number} receiverId - ID của người nhận (teacher hoặc student)
   * @param {Object} params - Tham số phân trang và lọc
   * @returns {Promise<Object>} Danh sách thông báo
   */
  getNotifications: async (receiverId, params = {}) => {
    try {
      const response = await mainHttpClient.get(
        `/notifications/${receiverId}`,
        {
          params,
        }
      );
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
