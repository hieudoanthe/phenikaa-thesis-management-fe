import { apiGet } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

class LecturerCapacityService {
  /**
   * Lấy thông tin capacity của giảng viên trong đợt đăng ký hiện tại
   */
  async getLecturerCapacity(lecturerId, periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_LECTURER_CAPACITY.replace(
          "{lecturerId}",
          lecturerId
        ).replace("{periodId}", periodId)}`
      );
      return {
        success: true,
        data: response,
        message: "Lấy thông tin capacity thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy LecturerCapacity:", error);
      return {
        success: false,
        data: null,
        message: "Không thể lấy thông tin capacity",
      };
    }
  }

  /**
   * Lấy danh sách capacity của tất cả giảng viên trong đợt đăng ký hiện tại
   */
  async getAllLecturerCapacities() {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_ALL_LECTURER_CAPACITIES);
      return {
        success: true,
        data: response,
        message: "Lấy danh sách capacity thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách LecturerCapacity:", error);
      return {
        success: false,
        data: null,
        message: "Không thể lấy danh sách capacity",
      };
    }
  }
}

export default new LecturerCapacityService();
