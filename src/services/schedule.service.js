import mainHttpClient from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

const scheduleService = {
  /**
   * Lấy lịch trình của sinh viên
   * @param {number} studentId - ID của sinh viên
   * @returns {Promise<Object>} Danh sách lịch trình
   */
  getStudentSchedule: async (studentId) => {
    try {
      const response = await mainHttpClient.get(
        API_ENDPOINTS.GET_STUDENT_SCHEDULE.replace("{studentId}", studentId)
      );
      return {
        success: true,
        data: response.data || response,
        message: "Lấy lịch trình thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy lịch trình sinh viên:", error);
      throw error;
    }
  },

  /**
   * Lấy lịch trình sinh viên trong khoảng thời gian
   * @param {number} studentId - ID của sinh viên
   * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
   * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
   * @returns {Promise<Object>} Danh sách lịch trình
   */
  getStudentScheduleByDateRange: async (student_id, startDate, endDate) => {
    try {
      const response = await mainHttpClient.get(
        `/eval-service/student/${student_id}/schedule/date-range`,
        {
          params: {
            startDate,
            endDate,
          },
        }
      );
      return {
        success: true,
        data: response.data || response,
        message: "Lấy lịch trình theo khoảng thời gian thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy lịch trình theo khoảng thời gian:", error);
      throw error;
    }
  },

  /**
   * Lấy lịch trình sắpr tới của sinh viên (30 ngày tiếp theo)
   * @param {number} studentId - ID của sinh viên
   * @ returns {Promise<Object>} Danh sách lịch trình sắp tới
   */
  getUpcomingSchedule: async (studentId) => {
    try {
      const response = await mainHttpClient.get(
        `/eval-service/student/${studentId}/schedule/upcoming`
      );
      return {
        success: true,
        data: response.data || response,
        message: "Lấy lịch trình sắp tới thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy lịch trình sắp tới:", error);
      throw error;
    }
  },

  /**
   * Lấy deadlines từ assignments của sinh viên
   * @param {number} studentId - ID của sinh viên
   * @returns {Promise<Object>} Danh sách deadlines
   */
  getStudentDeadlines: async (studentId) => {
    try {
      const response = await mainHttpClient.get(
        API_ENDPOINTS.GET_STUDENT_DEADLINES.replace("{studentId}", studentId)
      );
      return {
        success: true,
        data: response.data || response,
        message: "Lấy deadlines thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy deadlines:", error);
      throw error;
    }
  },

  /**
   * Lấy lịch trình đầy đủ (defense + deadlines)
   * @param {number} studentId - ID của sinh viên
   * @returns {Promise<Object>} Danh sách lịch trình đầy đủ
   */
  getCompleteSchedule: async (studentId) => {
    try {
      // Call APIs directly
      const [scheduleResponse, deadlinesResponse] = await Promise.allSettled([
        mainHttpClient.get(
          API_ENDPOINTS.GET_STUDENT_SCHEDULE.replace("{studentId}", studentId)
        ),
        mainHttpClient.get(
          API_ENDPOINTS.GET_STUDENT_DEADLINES.replace("{studentId}", studentId)
        ),
      ]);

      // Extract data safely
      const scheduleData =
        scheduleResponse.status === "fulfilled"
          ? scheduleResponse.value.data || scheduleResponse.value || []
          : [];

      const deadlinesData =
        deadlinesResponse.status === "fulfilled"
          ? deadlinesResponse.value.data?.data || deadlinesResponse.value.data
          : undefined;

      // Extract actual arrays
      const schedule = Array.isArray(scheduleData) ? scheduleData : [];
      const deadlines = Array.isArray(deadlinesData) ? deadlinesData : [];

      // Ensure both are arrays
      const scheduleArray = Array.isArray(schedule) ? schedule : [];
      const deadlinesArray = Array.isArray(deadlines) ? deadlines : [];

      // Combine và sort theo date
      const completeSchedule = [...scheduleArray, ...deadlinesArray].sort(
        (a, b) => {
          const dateA = new Date(a.date || a.dueDate);
          const dateB = new Date(b.date || b.dueDate);
          return dateA - dateB;
        }
      );

      return {
        success: true,
        data: completeSchedule,
        message: "Lấy lịch trình đầy đủ thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy lịch trình đầy đủ:", error);
      throw error;
    }
  },
};

export default scheduleService;
