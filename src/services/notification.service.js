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

      // Chuẩn hóa kết quả: coi mọi phản hồi 2xx là thành công
      const status = response?.status;
      const isOk = typeof status === "number" && status >= 200 && status < 300;
      const payload = response?.data;
      return {
        success:
          isOk === true ||
          payload?.success === true ||
          payload === true ||
          payload === "",
        status,
        data: payload,
        message: payload?.message || (isOk ? "Thành công" : "Không thành công"),
      };
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

      // Chuẩn hóa kết quả như một object có success + data
      const status = response?.status;
      const isOk = typeof status === "number" && status >= 200 && status < 300;
      const payload = response?.data;
      return {
        success:
          isOk === true ||
          payload?.success === true ||
          !!payload?.id ||
          payload?.read === true ||
          payload?.isRead === true,
        status,
        data: payload,
        message: payload?.message || (isOk ? "Thành công" : "Không thành công"),
      };
    } catch (error) {
      throw error;
    }
  },
};

export default notificationService;
