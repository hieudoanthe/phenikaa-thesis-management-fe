import { apiGet } from "./mainHttpClient";

const STATISTICS_API_BASE = "/api/eval-service/admin/statistics";

export const statisticsService = {
  // Lấy thống kê tổng quan
  async getOverviewStatistics() {
    try {
      const data = await apiGet(`${STATISTICS_API_BASE}/overview`);
      return data;
    } catch (error) {
      console.error("Error fetching overview statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê buổi bảo vệ
  async getDefenseStatistics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiGet(
        `${STATISTICS_API_BASE}/defenses?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching defense statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê đánh giá
  async getEvaluationStatistics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiGet(
        `${STATISTICS_API_BASE}/evaluations?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching evaluation statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê điểm số
  async getScoreStatistics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiGet(
        `${STATISTICS_API_BASE}/scores?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching score statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê theo tháng
  async getMonthlyStatistics(year = null) {
    try {
      const params = new URLSearchParams();
      if (year) params.append("year", year);

      const data = await apiGet(
        `${STATISTICS_API_BASE}/monthly?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching monthly statistics:", error);
      throw error;
    }
  },

  // Lấy tất cả thống kê
  async getAllStatistics(startDate = null, endDate = null) {
    try {
      const [overview, defenses, evaluations, scores] = await Promise.all([
        this.getOverviewStatistics(),
        this.getDefenseStatistics(startDate, endDate),
        this.getEvaluationStatistics(startDate, endDate),
        this.getScoreStatistics(startDate, endDate),
      ]);

      return {
        overview,
        defenses,
        evaluations,
        scores,
      };
    } catch (error) {
      console.error("Error fetching all statistics:", error);
      throw error;
    }
  },
};

export default statisticsService;
