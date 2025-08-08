import { apiPost } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Service xử lý authentication
 */
class AuthService {
  /**
   * Đăng nhập
   * @param {Object} credentials - Thông tin đăng nhập
   * @param {string} credentials.email - Email
   * @param {string} credentials.password - Mật khẩu
   * @returns {Promise<Object>} - Thông tin user và token
   */
  async login(credentials) {
    try {
      const response = await apiPost(API_ENDPOINTS.LOGIN, credentials);
      return {
        success: true,
        data: response,
        message: "Đăng nhập thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Đăng nhập thất bại",
      };
    }
  }

  /**
   * Đăng xuất
   * @param {string} refreshToken - Refresh token cần xóa khỏi database
   * @returns {Promise<Object>} - Kết quả đăng xuất
   */
  async logout(refreshToken) {
    try {
      // Gửi refreshToken trong request body để backend xóa khỏi database
      const response = await apiPost(API_ENDPOINTS.LOGOUT, {
        refreshToken: refreshToken,
      });
      console.log("API logout response:", response);
      return {
        success: true,
        message: "Đăng xuất thành công",
      };
    } catch (error) {
      console.error("API logout error:", error);
      return {
        success: false,
        error: error.message,
        message: "Đăng xuất thất bại",
      };
    }
  }

  /**
   * Refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - Token mới
   */
  async refreshToken(refreshToken) {
    try {
      const response = await apiPost(API_ENDPOINTS.REFRESH, {
        refreshToken: refreshToken,
      });
      return {
        success: true,
        data: response,
        message: "Refresh token thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Refresh token thất bại",
      };
    }
  }
}

export default new AuthService();
