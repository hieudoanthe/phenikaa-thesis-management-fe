import { apiGet } from "./mainHttpClient";

const evaluationService = {
  // Lấy danh sách nhiệm vụ chấm điểm theo giảng viên
  getEvaluatorTasks: async (evaluatorId, date = null, scope = "today") => {
    try {
      let url = `/api/eval-service/teacher/evaluations/evaluator/${evaluatorId}/tasks`;
      const params = new URLSearchParams();

      if (date) {
        params.append("date", date);
      }
      if (scope) {
        params.append("scope", scope);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log("Calling evaluation API:", url);
      const response = await apiGet(url);
      console.log("Evaluation API response:", response);
      return response;
    } catch (error) {
      console.error("Error fetching evaluator tasks:", error);
      throw error;
    }
  },

  // Lấy đánh giá theo giảng viên
  getEvaluationsByEvaluator: async (evaluatorId) => {
    try {
      const response = await apiGet(
        `/api/eval-service/teacher/evaluations/evaluator/${evaluatorId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching evaluations by evaluator:", error);
      throw error;
    }
  },

  // Lấy danh sách phiên bảo vệ theo giảng viên (không phụ thuộc student_defense)
  getLecturerSessions: async (evaluatorId) => {
    try {
      const response = await apiGet(
        `/api/eval-service/teacher/schedule/evaluator/${evaluatorId}/sessions`
      );
      return response;
    } catch (error) {
      console.error("Error fetching lecturer sessions:", error);
      throw error;
    }
  },

  // Lấy đánh giá theo topic
  getEvaluationsByTopic: async (topicId) => {
    try {
      const response = await apiGet(
        `/api/eval-service/teacher/evaluations/topic/${topicId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching evaluations by topic:", error);
      throw error;
    }
  },

  // Lấy điểm cuối cùng của topic
  getFinalScore: async (topicId) => {
    try {
      const response = await apiGet(
        `/api/eval-service/teacher/evaluations/topic/${topicId}/final-score`
      );
      return response;
    } catch (error) {
      console.error("Error fetching final score:", error);
      throw error;
    }
  },
};

export default evaluationService;
