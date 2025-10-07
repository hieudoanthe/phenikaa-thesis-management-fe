import { apiGet, apiPost, apiPut, apiDownloadFile } from "./mainHttpClient";

// Base URL cho eval-service
const EVAL_SERVICE_BASE = "/api/eval-service/teacher";

// ==================== EVALUATION SERVICE ====================

/**
 * Chấm điểm cho sinh viên
 */
export const submitEvaluation = async (evaluationData) => {
  try {
    const response = await apiPost(
      `${EVAL_SERVICE_BASE}/evaluations/submit`,
      evaluationData
    );
    return response;
  } catch (error) {
    console.error("Error submitting evaluation:", error);
    throw error;
  }
};

/**
 * Lấy tất cả đánh giá của một topic
 */
export const getEvaluationsByTopic = async (topicId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/evaluations/topic/${topicId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting evaluations by topic:", error);
    throw error;
  }
};

/**
 * Lấy đánh giá theo sinh viên
 */
export const getEvaluationsByStudent = async (studentId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/evaluations/student/${studentId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting evaluations by student:", error);
    throw error;
  }
};

/**
 * Lấy đánh giá theo giảng viên
 */
export const getEvaluationsByEvaluator = async (evaluatorId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/evaluations/evaluator/${evaluatorId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting evaluations by evaluator:", error);
    throw error;
  }
};

/**
 * Lấy nhiệm vụ chấm điểm theo giảng viên cho ngày bảo vệ
 */
export const getEvaluatorTasks = async (evaluatorId, date, scope = "all") => {
  try {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (scope) params.append("scope", scope);
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/evaluations/evaluator/${evaluatorId}/tasks${query}`
    );
    return response;
  } catch (error) {
    console.error("Error getting evaluator tasks:", error);
    throw error;
  }
};

/**
 * Tính điểm trung bình cuối cùng
 */
export const getFinalScore = async (topicId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/evaluations/topic/${topicId}/final-score`
    );
    return response;
  } catch (error) {
    console.error("Error getting final score:", error);
    throw error;
  }
};

// ==================== Q&A SERVICE ====================

/**
 * Thêm câu hỏi mới
 */
export const addQuestion = async (qnaData) => {
  try {
    const response = await apiPost(
      `${EVAL_SERVICE_BASE}/defense-qna/question`,
      qnaData
    );
    return response;
  } catch (error) {
    console.error("Error adding question:", error);
    throw error;
  }
};

/**
 * Cập nhật câu trả lời
 */
export const updateAnswer = async (qnaId, answer) => {
  try {
    const response = await apiPut(
      `${EVAL_SERVICE_BASE}/defense-qna/${qnaId}/answer`,
      answer
    );
    return response;
  } catch (error) {
    console.error("Error updating answer:", error);
    throw error;
  }
};

/**
 * Lấy tất cả Q&A của một topic
 */
export const getQnAByTopic = async (topicId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/defense-qna/topic/${topicId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting Q&A by topic:", error);
    throw error;
  }
};

/**
 * Lấy Q&A theo sinh viên
 */
export const getQnAByStudent = async (studentId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/defense-qna/student/${studentId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting Q&A by student:", error);
    throw error;
  }
};

/**
 * Lấy Q&A theo topic và sinh viên
 */
export const getQnAByTopicAndStudent = async (topicId, studentId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/defense-qna/topic/${topicId}/student/${studentId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting Q&A by topic and student:", error);
    throw error;
  }
};

/**
 * Kiểm tra quyền truy cập Q&A - chỉ cho phép thư ký
 */
export const checkSecretaryAccess = async (topicId, secretaryId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/defense-qna/access/${topicId}/secretary/${secretaryId}`
    );
    return response;
  } catch (error) {
    console.error("Error checking secretary access:", error);
    throw error;
  }
};

// Lấy danh sách thành viên hội đồng theo topic
export const getCommitteeByTopic = async (topicId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/defense-qna/committee/topic/${topicId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting committee by topic:", error);
    throw error;
  }
};

// ==================== COUNCIL SUMMARY (CHAIRMAN) ====================
export const getCouncilSummary = async (topicId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/council-summary/${topicId}`
    );
    return response;
  } catch (error) {
    // Gracefully handle any error (e.g., 404 not found) as no existing summary yet
    return {};
  }
};

export const upsertCouncilSummary = async (topicId, chairmanId, content) => {
  try {
    const response = await apiPost(
      `${EVAL_SERVICE_BASE}/council-summary/${topicId}`,
      { chairmanId: Number(chairmanId), content }
    );
    return response;
  } catch (error) {
    console.error("Error upserting council summary:", error);
    throw error;
  }
};

export const checkCouncilChairmanAccess = async (topicId, lecturerId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/council-summary/${topicId}/access/${lecturerId}`
    );
    return response;
  } catch (error) {
    console.error("Error checking council chairman access:", error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết đề tài cho giảng viên chấm điểm
 */
export const getTopicDetails = async (topicId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/evaluations/topic/${topicId}/details`
    );
    return response;
  } catch (error) {
    console.error("Error getting topic details:", error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Tạo dữ liệu chấm điểm
 */
export const createEvaluationData = (
  topicId,
  studentId,
  evaluatorId,
  evaluationType,
  scores,
  comments
) => {
  return {
    topicId,
    studentId,
    evaluatorId,
    evaluationType,
    contentScore: scores.content,
    presentationScore: scores.presentation,
    technicalScore: scores.technical,
    innovationScore: scores.innovation,
    defenseScore: scores.defense, // Chỉ cho hội đồng
    comments,
  };
};

/**
 * Tạo dữ liệu Q&A
 */
export const createQnAData = (
  topicId,
  studentId,
  questionerId,
  secretaryId,
  question,
  answer = null
) => {
  return {
    topicId,
    studentId,
    questionerId,
    secretaryId,
    question,
    answer,
  };
};

/**
 * Tính điểm trung bình
 */
export const calculateAverageScore = (scores) => {
  const validScores = scores.filter(
    (score) => score !== null && score !== undefined
  );
  if (validScores.length === 0) return 0;
  return (
    validScores.reduce((sum, score) => sum + score, 0) / validScores.length
  );
};

/**
 * Validate điểm số
 */
export const validateScore = (score) => {
  return score >= 0 && score <= 10;
};

/**
 * Format điểm số
 */
export const formatScore = (score) => {
  return score ? score.toFixed(1) : "0.0";
};

// ==================== PDF EXPORT SERVICE ====================

/**
 * Xuất PDF tổng hợp đánh giá đồ án/khóa luận
 */
export const generateComprehensiveEvaluationPDF = async (topicId) => {
  try {
    const filename = `comprehensive_evaluation_${topicId}_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.pdf`;

    const response = await apiDownloadFile(
      `${EVAL_SERVICE_BASE}/reports/comprehensive-evaluation-pdf/topic/${topicId}`,
      filename
    );

    return response;
  } catch (error) {
    console.error("Error generating comprehensive evaluation PDF:", error);
    throw error;
  }
};

// ==================== REVIEWER SUMMARY (REVIEWER) ====================
export const getReviewerSummary = async (topicId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/reviewer-summary/${topicId}`
    );
    return response;
  } catch (error) {
    return {};
  }
};

export const upsertReviewerSummary = async (topicId, reviewerId, content) => {
  const payload = { reviewerId: Number(reviewerId), content };
  const response = await apiPost(
    `${EVAL_SERVICE_BASE}/reviewer-summary/${topicId}`,
    payload
  );
  return response;
};

export const checkReviewerAccess = async (topicId, lecturerId) => {
  const response = await apiGet(
    `${EVAL_SERVICE_BASE}/reviewer-summary/${topicId}/access/${lecturerId}`
  );
  return response;
};

// ==================== SUPERVISOR SUMMARY (SUPERVISOR) ====================
export const getSupervisorSummary = async (topicId) => {
  try {
    const response = await apiGet(
      `${EVAL_SERVICE_BASE}/supervisor-summary/${topicId}`
    );
    return response;
  } catch (error) {
    return {};
  }
};

export const upsertSupervisorSummary = async (
  topicId,
  supervisorId,
  content
) => {
  const payload = { supervisorId: Number(supervisorId), content };
  const response = await apiPost(
    `${EVAL_SERVICE_BASE}/supervisor-summary/${topicId}`,
    payload
  );
  return response;
};

export const checkSupervisorAccess = async (topicId, lecturerId) => {
  const response = await apiGet(
    `${EVAL_SERVICE_BASE}/supervisor-summary/${topicId}/access/${lecturerId}`
  );
  return response;
};
