import mainHttpClient from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

class EvalService {
  // ==================== DEFENSE SCHEDULES ====================

  /**
   * Lấy tất cả lịch bảo vệ
   */
  async getAllDefenseSchedules() {
    try {
      const response = await mainHttpClient.get(
        API_ENDPOINTS.GET_DEFENSE_SCHEDULES
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lịch bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Lấy lịch bảo vệ theo ID
   */
  async getDefenseScheduleById(scheduleId) {
    try {
      const url = API_ENDPOINTS.GET_DEFENSE_SCHEDULE_BY_ID.replace(
        "{scheduleId}",
        scheduleId
      );
      const response = await mainHttpClient.get(url);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy lịch bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Tạo lịch bảo vệ mới
   */
  async createDefenseSchedule(scheduleData) {
    try {
      const response = await mainHttpClient.post(
        API_ENDPOINTS.CREATE_DEFENSE_SCHEDULE,
        scheduleData
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo lịch bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Cập nhật lịch bảo vệ
   */
  async updateDefenseSchedule(scheduleId, scheduleData) {
    try {
      const url = API_ENDPOINTS.UPDATE_DEFENSE_SCHEDULE.replace(
        "{scheduleId}",
        scheduleId
      );
      const response = await mainHttpClient.put(url, scheduleData);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật lịch bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Xóa lịch bảo vệ
   */
  async deleteDefenseSchedule(scheduleId) {
    try {
      const url = API_ENDPOINTS.DELETE_DEFENSE_SCHEDULE.replace(
        "{scheduleId}",
        scheduleId
      );
      await mainHttpClient.delete(url);
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa lịch bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Kích hoạt lịch bảo vệ
   */
  async activateDefenseSchedule(scheduleId) {
    try {
      const url = API_ENDPOINTS.ACTIVATE_DEFENSE_SCHEDULE.replace(
        "{scheduleId}",
        scheduleId
      );
      await mainHttpClient.post(url);
      return true;
    } catch (error) {
      console.error("Lỗi khi kích hoạt lịch bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Hủy kích hoạt lịch bảo vệ
   */
  async deactivateDefenseSchedule(scheduleId) {
    try {
      const url = API_ENDPOINTS.DEACTIVATE_DEFENSE_SCHEDULE.replace(
        "{scheduleId}",
        scheduleId
      );
      await mainHttpClient.post(url);
      return true;
    } catch (error) {
      console.error("Lỗi khi hủy kích hoạt lịch bảo vệ:", error);
      throw error;
    }
  }

  // ==================== DEFENSE SESSIONS ====================

  /**
   * Lấy tất cả buổi bảo vệ
   */
  async getAllDefenseSessions() {
    try {
      const response = await mainHttpClient.get(
        API_ENDPOINTS.GET_DEFENSE_SESSIONS
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách buổi bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Export dữ liệu buổi bảo vệ (JSON)
   */
  async exportDefenseSession(sessionId) {
    try {
      const url = API_ENDPOINTS.EXPORT_DEFENSE_SESSION.replace(
        "{sessionId}",
        sessionId
      );
      const response = await mainHttpClient.get(url);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi export buổi bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Export tất cả buổi bảo vệ (JSON)
   */
  async exportAllDefenseSessions() {
    try {
      const response = await mainHttpClient.get(
        API_ENDPOINTS.EXPORT_ALL_DEFENSE_SESSIONS
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi export tất cả buổi bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Lấy buổi bảo vệ theo ID
   */
  async getDefenseSessionById(sessionId) {
    try {
      const url = API_ENDPOINTS.GET_DEFENSE_SESSION_BY_ID.replace(
        "{sessionId}",
        sessionId
      );
      const response = await mainHttpClient.get(url);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy buổi bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Tạo buổi bảo vệ mới
   */
  async createDefenseSession(sessionData) {
    try {
      const response = await mainHttpClient.post(
        API_ENDPOINTS.CREATE_DEFENSE_SESSION,
        sessionData
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tạo buổi bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Cập nhật buổi bảo vệ
   */
  async updateDefenseSession(sessionId, sessionData) {
    try {
      const url = API_ENDPOINTS.UPDATE_DEFENSE_SESSION.replace(
        "{sessionId}",
        sessionId
      );
      const response = await mainHttpClient.put(url, sessionData);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật buổi bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Xóa buổi bảo vệ
   */
  async deleteDefenseSession(sessionId) {
    try {
      const url = API_ENDPOINTS.DELETE_DEFENSE_SESSION.replace(
        "{sessionId}",
        sessionId
      );
      await mainHttpClient.delete(url);
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa buổi bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái buổi bảo vệ
   */
  async updateDefenseSessionStatus(sessionId, status) {
    try {
      const url = API_ENDPOINTS.UPDATE_SESSION_STATUS.replace(
        "{sessionId}",
        sessionId
      );
      const response = await mainHttpClient.put(url, null, {
        params: { status },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái buổi bảo vệ:", error);
      throw error;
    }
  }

  /**
   * Lấy buổi bảo vệ theo lịch
   */
  async getSessionsBySchedule(scheduleId) {
    try {
      const url = API_ENDPOINTS.GET_SESSIONS_BY_SCHEDULE.replace(
        "{scheduleId}",
        scheduleId
      );
      const response = await mainHttpClient.get(url);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy buổi bảo vệ theo lịch:", error);
      throw error;
    }
  }

  /**
   * Lấy các buổi bảo vệ có sẵn
   */
  async getAvailableSessions() {
    try {
      const response = await mainHttpClient.get(
        API_ENDPOINTS.GET_AVAILABLE_SESSIONS
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy buổi bảo vệ có sẵn:", error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái buổi bảo vệ
   */
  async updateSessionStatus(sessionId, status) {
    try {
      const url = API_ENDPOINTS.UPDATE_SESSION_STATUS.replace(
        "{sessionId}",
        sessionId
      );
      await mainHttpClient.put(url, null, { params: { status } });
      return true;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái buổi bảo vệ:", error);
      throw error;
    }
  }

  // ==================== STUDENT ASSIGNMENT ====================

  /**
   * Phân chia sinh viên vào các buổi bảo vệ
   */
  async assignStudentsToSessions(assignmentData) {
    try {
      const response = await mainHttpClient.post(
        API_ENDPOINTS.ASSIGN_STUDENTS_TO_SESSIONS,
        assignmentData
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi phân chia sinh viên:", error);
      throw error;
    }
  }

  /**
   * Tự động sắp xếp sinh viên theo chuyên ngành hội đồng
   */
  async autoAssignStudents(payload) {
    try {
      const response = await mainHttpClient.post(
        API_ENDPOINTS.AUTO_ASSIGN_PREVIEW,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tự động sắp xếp sinh viên:", error);
      throw error;
    }
  }

  /**
   * Tự động sắp xếp sinh viên bằng AI (Gemini)
   */
  async autoAssignStudentsAi(payload) {
    try {
      // Gọi endpoint preview với query mode=gemini
      const url = `${API_ENDPOINTS.AUTO_ASSIGN_PREVIEW}?mode=gemini`;
      const response = await mainHttpClient.post(url, payload);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi tự động sắp xếp sinh viên bằng AI:", error);
      throw error;
    }
  }

  /**
   * Xác nhận phân chia sinh viên (gán thật)
   */
  async confirmAutoAssign(payload) {
    try {
      const response = await mainHttpClient.post(
        API_ENDPOINTS.AUTO_ASSIGN_CONFIRM,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi xác nhận phân chia:", error);
      throw error;
    }
  }
}

export const evalService = new EvalService();
export default evalService;
