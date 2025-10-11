import { API_ENDPOINTS } from "../config/api";
import { apiGet, apiPost, apiDelete, apiPut } from "./mainHttpClient";

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

  /**
   * Vô hiệu hóa một năm học
   */
  async deactivateAcademicYear(yearId) {
    try {
      const endpoint = API_ENDPOINTS.DEACTIVATE_ACADEMIC_YEAR.replace(
        "{yearId}",
        yearId
      );
      const response = await apiPut(endpoint);
      return {
        success: true,
        data: response,
        message: "Vô hiệu hóa năm học thành công",
      };
    } catch (error) {
      console.error("Lỗi khi vô hiệu hóa năm học:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể vô hiệu hóa năm học",
      };
    }
  }

  /**
   * Tạo năm học mới
   */
  async createAcademicYear(yearData) {
    try {
      const response = await apiPost(
        API_ENDPOINTS.CREATE_ACADEMIC_YEAR,
        yearData
      );
      return {
        success: true,
        data: response,
        message: "Tạo năm học thành công",
      };
    } catch (error) {
      console.error("Lỗi khi tạo năm học:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể tạo năm học",
      };
    }
  }

  /**
   * Cập nhật năm học
   */
  async updateAcademicYear(yearId, yearData) {
    try {
      const endpoint = API_ENDPOINTS.UPDATE_ACADEMIC_YEAR.replace(
        "{yearId}",
        yearId
      );
      const response = await apiPut(endpoint, yearData);
      return {
        success: true,
        data: response,
        message: "Cập nhật năm học thành công",
      };
    } catch (error) {
      console.error("Lỗi khi cập nhật năm học:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể cập nhật năm học",
      };
    }
  }

  /**
   * Xóa năm học
   */
  async deleteAcademicYear(yearId) {
    try {
      const endpoint = API_ENDPOINTS.DELETE_ACADEMIC_YEAR.replace(
        "{yearId}",
        yearId
      );
      const response = await apiDelete(endpoint);
      return {
        success: true,
        data: response,
        message: "Xóa năm học thành công",
      };
    } catch (error) {
      console.error("Lỗi khi xóa năm học:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể xóa năm học",
      };
    }
  }
}

export default new AcademicYearService();
