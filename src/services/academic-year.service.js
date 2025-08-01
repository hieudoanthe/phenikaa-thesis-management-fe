import { apiGet } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Service xử lý Academic Year
 */
class AcademicYearService {
  /**
   * Lấy danh sách năm học từ API
   * @param {number} yearId - ID năm học (optional)
   * @returns {Promise<Object>} - Danh sách năm học
   */
  async getAcademicYearList(yearId = null) {
    try {
      let params = {};

      if (yearId) {
        params.yearId = yearId;
      }

      console.log(
        "Đang gọi API:",
        API_ENDPOINTS.ACADEMIC_YEAR_LIST,
        "với params:",
        params
      );

      const response = await apiGet(API_ENDPOINTS.ACADEMIC_YEAR_LIST, params);

      console.log("API response:", response);

      // Kiểm tra response có phải array không
      if (!Array.isArray(response)) {
        console.error("API response không phải array:", response);
        return {
          success: false,
          error: "Invalid response format",
          message: "Định dạng response không hợp lệ",
        };
      }

      // Chuyển đổi cấu trúc từ API response sang format cần thiết
      const academicYears = response.map((item) => ({
        id: item.academicYearId,
        name: item.yearName,
      }));

      return {
        success: true,
        data: academicYears,
        message: "Lấy danh sách năm học thành công",
      };
    } catch (error) {
      console.error("Lỗi API call chi tiết:", error);
      console.error("Error message:", error.message);

      return {
        success: false,
        error: error.message,
        message: "Lấy danh sách năm học thất bại",
      };
    }
  }

  /**
   * Lấy thông tin năm học theo ID và tên (sử dụng API hiện tại)
   * @param {number} yearId - ID năm học
   * @param {string} yearName - Tên năm học
   * @returns {Promise<Object>} - Thông tin năm học
   */
  async getAcademicYear(yearId, yearName) {
    try {
      const response = await apiGet(API_ENDPOINTS.ACADEMIC_YEAR_DETAIL, {
        yearId,
        yearName,
      });
      return {
        success: true,
        data: response,
        message: "Lấy thông tin năm học thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lấy thông tin năm học thất bại",
      };
    }
  }

  /**
   * Lấy năm học hiện tại
   * @returns {Promise<Object>} - Năm học hiện tại
   */
  async getCurrentAcademicYear() {
    try {
      // Lấy danh sách năm học và chọn năm hiện tại (có thể logic khác)
      const result = await this.getAcademicYearList();
      if (result.success && result.data.length > 0) {
        // Giả sử năm học cuối cùng trong danh sách là năm hiện tại
        const currentYear = result.data[result.data.length - 1];
        return {
          success: true,
          data: { ...currentYear, isCurrent: true },
          message: "Lấy năm học hiện tại thành công",
        };
      } else {
        return {
          success: false,
          error: "Không tìm thấy năm học",
          message: "Lấy năm học hiện tại thất bại",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lấy năm học hiện tại thất bại",
      };
    }
  }
}

export default new AcademicYearService();
