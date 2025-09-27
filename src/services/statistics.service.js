import { apiGet } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

export const statisticsService = {
  async getUserStatistics() {
    try {
      const [totalUsers, students, teachers, activeUsersToday] =
        await Promise.all([
          apiGet(API_ENDPOINTS.GET_USER_COUNT),
          apiGet(`${API_ENDPOINTS.GET_USER_COUNT_BY_ROLE}?role=STUDENT`),
          apiGet(`${API_ENDPOINTS.GET_USER_COUNT_BY_ROLE}?role=TEACHER`),
        ]);

      return {
        totalUsers,
        students,
        teachers,
        activeUsersToday,
      };
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      throw error;
    }
  },

  async getStudentCountByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_STUDENT_COUNT_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching student count by period:", error);
      throw error;
    }
  },

  // Thesis Service Statistics
  async getRegisteredStudentsCountByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_REGISTERED_STUDENTS_COUNT_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error(
        "Error fetching registered students count by period:",
        error
      );
      throw error;
    }
  },

  async getRegisteredStudentsByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_REGISTERED_STUDENTS_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching registered students by period:", error);
      throw error;
    }
  },

  async getApprovedStudentsCountByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_APPROVED_STUDENTS_COUNT_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching approved students count by period:", error);
      throw error;
    }
  },

  async getPendingStudentsCountByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_PENDING_STUDENTS_COUNT_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching pending students count by period:", error);
      throw error;
    }
  },

  async getRejectedStudentsCountByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_REJECTED_STUDENTS_COUNT_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching rejected students count by period:", error);
      throw error;
    }
  },

  // Suggested Topics Statistics
  async getSuggestedTopicsCountByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_SUGGESTED_TOPICS_COUNT_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching suggested topics count by period:", error);
      throw error;
    }
  },

  async getSuggestedTopicsByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_SUGGESTED_TOPICS_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching suggested topics by period:", error);
      throw error;
    }
  },

  async getApprovedSuggestionsCountByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_APPROVED_SUGGESTIONS_COUNT_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error(
        "Error fetching approved suggestions count by period:",
        error
      );
      throw error;
    }
  },

  async getPendingSuggestionsCountByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_PENDING_SUGGESTIONS_COUNT_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error(
        "Error fetching pending suggestions count by period:",
        error
      );
      throw error;
    }
  },

  async getRejectedSuggestionsCountByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_REJECTED_SUGGESTIONS_COUNT_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error(
        "Error fetching rejected suggestions count by period:",
        error
      );
      throw error;
    }
  },

  // Combined Statistics
  async getTotalStudentsInvolvedByPeriod(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_TOTAL_STUDENTS_INVOLVED_BY_PERIOD}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching total students involved by period:", error);
      throw error;
    }
  },

  async getPeriodStatisticsSummary(periodId) {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_PERIOD_STATISTICS_SUMMARY}?periodId=${periodId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching period statistics summary:", error);
      throw error;
    }
  },
};

export default statisticsService;
