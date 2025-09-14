import { apiGet } from "./mainHttpClient";

const STATISTICS_API_BASE = "/api/statistics-service";

export const statisticsService = {
  // Lấy thống kê tổng quan cho Admin
  async getAdminStatistics() {
    try {
      const data = await apiGet(`${STATISTICS_API_BASE}/admin/statistics`);
      return data;
    } catch (error) {
      console.error("Error fetching admin statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê cho Giảng viên
  async getTeacherStatistics(teacherId) {
    try {
      const data = await apiGet(
        `${STATISTICS_API_BASE}/teacher/statistics/${teacherId}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching teacher statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê tổng quan (backward compatibility)
  async getOverviewStatistics() {
    try {
      const data = await apiGet(`${STATISTICS_API_BASE}/admin/statistics`);
      return data;
    } catch (error) {
      console.error("Error fetching overview statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê buổi bảo vệ (backward compatibility)
  async getDefenseStatistics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiGet(
        `${STATISTICS_API_BASE}/admin/statistics?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching defense statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê đánh giá (backward compatibility)
  async getEvaluationStatistics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiGet(
        `${STATISTICS_API_BASE}/admin/statistics?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching evaluation statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê điểm số (backward compatibility)
  async getScoreStatistics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiGet(
        `${STATISTICS_API_BASE}/admin/statistics?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching score statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê theo tháng (backward compatibility)
  async getMonthlyStatistics(year = null) {
    try {
      const params = new URLSearchParams();
      if (year) params.append("year", year);

      const data = await apiGet(
        `${STATISTICS_API_BASE}/admin/statistics?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching monthly statistics:", error);
      throw error;
    }
  },

  // Lấy tất cả thống kê (backward compatibility)
  async getAllStatistics(startDate = null, endDate = null) {
    try {
      const data = await this.getAdminStatistics();
      return {
        overview: data,
        defenses: data,
        evaluations: data,
        scores: data,
      };
    } catch (error) {
      console.error("Error fetching all statistics:", error);
      throw error;
    }
  },
};

export default statisticsService;
