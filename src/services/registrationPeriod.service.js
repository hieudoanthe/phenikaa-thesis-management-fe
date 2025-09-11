import { apiGet, apiPost, apiPut } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

class RegistrationPeriodService {
  /**
   * Lấy đợt đăng ký hiện tại đang hoạt động
   */
  async getCurrentPeriod() {
    try {
      console.log("=== Đang gọi API lấy đợt đăng ký hiện tại ==="); // Debug log
      const response = await apiGet(
        API_ENDPOINTS.GET_CURRENT_REGISTRATION_PERIOD
      );
      console.log("Response từ API đợt đăng ký:", response); // Debug log

      if (response) {
        console.log("Đợt đăng ký tìm thấy:", response); // Debug log
        console.log("Status:", response.status); // Debug log
        console.log("Start Date:", response.startDate); // Debug log
        console.log("End Date:", response.endDate); // Debug log
      } else {
        console.log("KHÔNG có đợt đăng ký nào!"); // Debug log
      }

      return {
        success: true,
        data: response,
        message: "Lấy thông tin đợt đăng ký hiện tại thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy đợt đăng ký hiện tại:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể lấy thông tin đợt đăng ký hiện tại",
      };
    }
  }

  /**
   * Lấy tất cả đợt đăng ký đang ACTIVE (public cho sinh viên)
   */
  async getActivePeriods() {
    try {
      const response = await apiGet(
        API_ENDPOINTS.GET_ACTIVE_REGISTRATION_PERIODS_PUBLIC
      );
      return { success: true, data: response };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đợt ACTIVE:", error);
      return { success: false, message: "Không thể lấy danh sách đợt ACTIVE" };
    }
  }

  /**
   * Lấy tất cả đợt đăng ký
   */
  async getAllPeriods() {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_REGISTRATION_PERIODS);
      return {
        success: true,
        data: response,
        message: "Lấy danh sách đợt đăng ký thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đợt đăng ký:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể lấy danh sách đợt đăng ký",
      };
    }
  }

  /**
   * Lấy danh sách đợt đăng ký theo năm học
   */
  async getPeriodsByAcademicYear(academicYearId) {
    try {
      let endpoint;
      if (academicYearId) {
        endpoint =
          API_ENDPOINTS.GET_REGISTRATION_PERIODS_BY_ACADEMIC_YEAR.replace(
            "{academicYearId}",
            academicYearId
          );
      } else {
        endpoint = API_ENDPOINTS.GET_REGISTRATION_PERIODS;
      }
      const response = await apiGet(endpoint);
      return {
        success: true,
        data: response,
        message: "Lấy danh sách đợt đăng ký thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đợt đăng ký:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể lấy danh sách đợt đăng ký",
      };
    }
  }

  /**
   * Tạo đợt đăng ký mới
   */
  async createPeriod(periodData) {
    try {
      const response = await apiPost(
        API_ENDPOINTS.CREATE_REGISTRATION_PERIOD,
        periodData
      );
      return {
        success: true,
        data: response,
        message: "Tạo đợt đăng ký thành công",
      };
    } catch (error) {
      console.error("Lỗi khi tạo đợt đăng ký:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể tạo đợt đăng ký",
      };
    }
  }

  /**
   * Cập nhật đợt đăng ký
   */
  async updatePeriod(periodData) {
    try {
      const response = await apiPut(
        API_ENDPOINTS.CREATE_REGISTRATION_PERIOD,
        periodData
      );
      return {
        success: true,
        data: response,
        message: "Cập nhật đợt đăng ký thành công",
      };
    } catch (error) {
      console.error("Lỗi khi cập nhật đợt đăng ký:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể cập nhật đợt đăng ký",
      };
    }
  }

  /**
   * Bắt đầu đợt đăng ký
   */
  async startPeriod(periodId) {
    try {
      const endpoint = API_ENDPOINTS.START_REGISTRATION_PERIOD.replace(
        "{periodId}",
        periodId
      );
      await apiPost(endpoint);
      return {
        success: true,
        message: "Đã bắt đầu đợt đăng ký",
      };
    } catch (error) {
      console.error("Lỗi khi bắt đầu đợt đăng ký:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể bắt đầu đợt đăng ký",
      };
    }
  }

  /**
   * Kết thúc đợt đăng ký
   */
  async closePeriod(periodId) {
    try {
      const endpoint = API_ENDPOINTS.CLOSE_REGISTRATION_PERIOD.replace(
        "{periodId}",
        periodId
      );
      await apiPost(endpoint);
      return {
        success: true,
        message: "Đã kết thúc đợt đăng ký",
      };
    } catch (error) {
      console.error("Lỗi khi kết thúc đợt đăng ký:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể kết thúc đợt đăng ký",
      };
    }
  }
}

export default new RegistrationPeriodService();
