import { apiPost, apiGet } from "./httpClient";
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
   * Đăng ký
   * @param {Object} userData - Thông tin đăng ký
   * @returns {Promise<Object>} - Kết quả đăng ký
   */
  async register(userData) {
    try {
      const response = await apiPost(API_ENDPOINTS.REGISTER, userData);
      return {
        success: true,
        data: response,
        message: "Đăng ký thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Đăng ký thất bại",
      };
    }
  }

  /**
   * Đăng xuất
   * @returns {Promise<Object>} - Kết quả đăng xuất
   */
  async logout() {
    try {
      await apiPost(API_ENDPOINTS.LOGOUT);
      return {
        success: true,
        message: "Đăng xuất thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Đăng xuất thất bại",
      };
    }
  }

  /**
   * Lấy thông tin user hiện tại
   * @returns {Promise<Object>} - Thông tin user
   */
  async getCurrentUser() {
    try {
      const response = await apiGet(API_ENDPOINTS.ME);
      return {
        success: true,
        data: response,
        message: "Lấy thông tin user thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lấy thông tin user thất bại",
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
      const response = await apiPost(API_ENDPOINTS.REFRESH, { refreshToken });
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

  /**
   * Kiểm tra token có hợp lệ không
   * @returns {Promise<boolean>} - Token có hợp lệ không
   */
  async validateToken() {
    try {
      await apiGet(API_ENDPOINTS.ME);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();
