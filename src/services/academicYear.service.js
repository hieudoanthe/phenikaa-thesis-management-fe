import { API_ENDPOINTS } from "../config/api";
import { apiGet, apiPost } from "./mainHttpClient";

class AcademicYearService {
  /**
   * Lấy danh sách tất cả năm học
   */
  async getAllAcademicYears() {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_ACADEMIC_YEARS);
      return {
        success: true,
        data: response,
        message: "Lấy danh sách năm học thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách năm học:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể lấy danh sách năm học",
      };
    }
  }

  /**
   * Lấy năm học đang active
   */
  async getActiveAcademicYear() {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_ACTIVE_ACADEMIC_YEAR);
      return {
        success: true,
        data: response,
        message: "Lấy năm học active thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy năm học active:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể lấy năm học active",
      };
    }
  }

  /**
   * Kích hoạt một năm học
   */
  async activateAcademicYear(yearId) {
    try {
      const endpoint = API_ENDPOINTS.ACTIVATE_ACADEMIC_YEAR.replace(
        "{yearId}",
        yearId
      );
      const response = await apiPost(endpoint);
      return {
        success: true,
        data: response,
        message: "Kích hoạt năm học thành công",
      };
    } catch (error) {
      console.error("Lỗi khi kích hoạt năm học:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể kích hoạt năm học",
      };
    }
  }
}

export default new AcademicYearService();
