import { apiGet, apiPost, apiPut, apiDelete } from "./mainHttpClient";
import mainHttpClient from "./mainHttpClient";

// Base URL cho submission-service
const SUBMISSION_SERVICE_BASE = "/api/submission-service";
const THESIS_SERVICE_BASE = "/api/thesis-service";

// ==================== STUDENT TOPIC SERVICE ====================

/**
 * Lấy danh sách đề tài đã được xác nhận của sinh viên
 * Sử dụng cùng API với trang "Đề tài của tôi" nhưng chỉ lấy những đề tài đã được duyệt
 */
export const getStudentConfirmedTopics = async (studentId) => {
  try {
    // Sử dụng API getStudentSuggestedTopics và lọc chỉ những đề tài đã được duyệt
    const response = await apiGet(
      `${THESIS_SERVICE_BASE}/student/get-suggest-topic-${studentId}/paged?page=0&size=100`
    );

    // Lọc chỉ những đề tài có trạng thái APPROVED
    const confirmedTopics =
      response?.content?.filter(
        (topic) => topic.suggestionStatus === "APPROVED"
      ) || [];
    return confirmedTopics;
  } catch (error) {
    console.error("Error getting student confirmed topics:", error);
    throw error;
  }
};

// ==================== REPORT SUBMISSION SERVICE ====================

/**
 * Tạo báo cáo mới
 */
export const createSubmission = async (submissionData) => {
  try {
    // Luôn sử dụng FormData vì form luôn có input file
    const formData = new FormData();

    // Thêm dữ liệu báo cáo
    Object.keys(submissionData).forEach((key) => {
      if (key !== "file") {
        // Bỏ qua field file vì sẽ xử lý riêng
        formData.append(key, submissionData[key]);
      }
    });

    // Thêm file nếu có (có thể là null nếu không chọn file)
    if (submissionData.file) {
      formData.append("file", submissionData.file);
    }

    // Sử dụng axios trực tiếp để tránh interceptor issues
    const response = await mainHttpClient.post(
      `${SUBMISSION_SERVICE_BASE}/submissions`,
      formData,
      {
        headers: {
          // Không set Content-Type để FormData tự set
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating submission:", error);
    throw error;
  }
};

/**
 * Cập nhật báo cáo
 */
export const updateSubmission = async (submissionId, submissionData) => {
  try {
    // Luôn sử dụng FormData vì form luôn có input file
    const formData = new FormData();

    // Thêm dữ liệu báo cáo
    Object.keys(submissionData).forEach((key) => {
      if (key !== "file") {
        // Bỏ qua field file vì sẽ xử lý riêng
        formData.append(key, submissionData[key]);
      }
    });

    // Thêm file nếu có (có thể là null nếu không chọn file)
    if (submissionData.file) {
      formData.append("file", submissionData.file);
    }

    // Sử dụng axios trực tiếp để tránh interceptor issues
    const response = await mainHttpClient.put(
      `${SUBMISSION_SERVICE_BASE}/submissions/${submissionId}`,
      formData,
      {
        headers: {
          // Không set Content-Type để FormData tự set
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating submission:", error);
    throw error;
  }
};

/**
 * Lấy báo cáo theo ID
 */
export const getSubmissionById = async (submissionId) => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/submissions/${submissionId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting submission:", error);
    throw error;
  }
};

/**
 * Lấy báo cáo theo topic
 */
export const getSubmissionsByTopic = async (topicId) => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/submissions/topic/${topicId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting submissions by topic:", error);
    throw error;
  }
};

/**
 * Lấy báo cáo theo người dùng
 */
export const getSubmissionsByUser = async (userId) => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/submissions/user/${userId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting submissions by user:", error);
    throw error;
  }
};

/**
 * Lấy báo cáo với phân trang
 */
export const getSubmissionsWithPagination = async (page = 0, size = 10) => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/submissions?page=${page}&size=${size}`
    );
    return response;
  } catch (error) {
    console.error("Error getting submissions with pagination:", error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái báo cáo
 */
export const updateSubmissionStatus = async (submissionId, status) => {
  try {
    const response = await apiPut(
      `${SUBMISSION_SERVICE_BASE}/submissions/${submissionId}/status?status=${status}`
    );
    return response;
  } catch (error) {
    console.error("Error updating submission status:", error);
    throw error;
  }
};

/**
 * Xóa báo cáo
 */
export const deleteSubmission = async (submissionId) => {
  try {
    const response = await apiDelete(
      `${SUBMISSION_SERVICE_BASE}/submissions/${submissionId}`
    );
    return response;
  } catch (error) {
    console.error("Error deleting submission:", error);
    throw error;
  }
};

// ==================== FEEDBACK SERVICE ====================

/**
 * Tạo phản hồi mới
 */
export const createFeedback = async (feedbackData) => {
  try {
    const response = await apiPost(
      `${SUBMISSION_SERVICE_BASE}/feedbacks`,
      feedbackData
    );
    return response;
  } catch (error) {
    console.error("Error creating feedback:", error);
    throw error;
  }
};

/**
 * Cập nhật phản hồi
 */
export const updateFeedback = async (feedbackId, feedbackData) => {
  try {
    const response = await apiPut(
      `${SUBMISSION_SERVICE_BASE}/feedbacks/${feedbackId}`,
      feedbackData
    );
    return response;
  } catch (error) {
    console.error("Error updating feedback:", error);
    throw error;
  }
};

/**
 * Lấy phản hồi theo submission
 */
export const getFeedbacksBySubmission = async (submissionId) => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/feedbacks/submission/${submissionId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting feedbacks by submission:", error);
    throw error;
  }
};

/**
 * Lấy phản hồi theo reviewer
 */
export const getFeedbacksByReviewer = async (reviewerId) => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/feedbacks/reviewer/${reviewerId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting feedbacks by reviewer:", error);
    throw error;
  }
};

/**
 * Duyệt phản hồi
 */
export const approveFeedback = async (feedbackId) => {
  try {
    const response = await apiPut(
      `${SUBMISSION_SERVICE_BASE}/feedbacks/${feedbackId}/approve`
    );
    return response;
  } catch (error) {
    console.error("Error approving feedback:", error);
    throw error;
  }
};

/**
 * Tính điểm trung bình
 */
export const getAverageScore = async (submissionId) => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/feedbacks/submission/${submissionId}/average-score`
    );
    return response;
  } catch (error) {
    console.error("Error getting average score:", error);
    throw error;
  }
};

// ==================== PDF REPORT SERVICE ====================

/**
 * Tạo PDF báo cáo chấm điểm
 */
export const generateEvaluationReportPDF = async (evaluationData) => {
  try {
    const response = await apiPost(
      `${SUBMISSION_SERVICE_BASE}/reports/evaluation-pdf`,
      evaluationData
    );
    return response;
  } catch (error) {
    console.error("Error generating evaluation report PDF:", error);
    throw error;
  }
};

/**
 * Tạo PDF mẫu
 */
export const generateSampleReportPDF = async () => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/reports/evaluation-pdf/sample`
    );
    return response;
  } catch (error) {
    console.error("Error generating sample report PDF:", error);
    throw error;
  }
};

// ==================== ANALYTICS SERVICE ====================

/**
 * Lấy thống kê tổng quan
 */
export const getOverallAnalytics = async () => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/analytics/overview`
    );
    return response;
  } catch (error) {
    console.error("Error getting overall analytics:", error);
    throw error;
  }
};

/**
 * Lấy thống kê theo khoảng thời gian
 */
export const getAnalyticsByDateRange = async (startDate, endDate) => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/analytics/date-range?startDate=${startDate}&endDate=${endDate}`
    );
    return response;
  } catch (error) {
    console.error("Error getting analytics by date range:", error);
    throw error;
  }
};

/**
 * Lấy thống kê theo người dùng
 */
export const getUserAnalytics = async (userId) => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/analytics/user/${userId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting user analytics:", error);
    throw error;
  }
};

/**
 * Lấy thống kê theo đề tài
 */
export const getTopicAnalytics = async (topicId) => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/analytics/topic/${topicId}`
    );
    return response;
  } catch (error) {
    console.error("Error getting topic analytics:", error);
    throw error;
  }
};

/**
 * Lấy thống kê real-time
 */
export const getRealtimeAnalytics = async () => {
  try {
    const response = await apiGet(
      `${SUBMISSION_SERVICE_BASE}/analytics/realtime`
    );
    return response;
  } catch (error) {
    console.error("Error getting realtime analytics:", error);
    throw error;
  }
};

/**
 * Download file từ submission
 */
export const downloadFile = async (submissionId) => {
  try {
    const response = await mainHttpClient.get(
      `${SUBMISSION_SERVICE_BASE}/submissions/${submissionId}/file`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

/**
 * Xem file từ submission (preview) - trả về URL để hiển thị trong iframe
 */
export const previewFile = async (submissionId) => {
  try {
    const response = await mainHttpClient.get(
      `${SUBMISSION_SERVICE_BASE}/submissions/${submissionId}/file`,
      {
        responseType: "blob",
      }
    );

    // Lấy MIME type từ response hoặc xác định dựa trên content
    let mimeType = response.data.type;

    // Nếu không có MIME type, thử xác định dựa trên content
    if (!mimeType || mimeType === "application/octet-stream") {
      // Kiểm tra magic bytes để xác định loại file
      const arrayBuffer = await response.data.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // PDF
      if (
        uint8Array[0] === 0x25 &&
        uint8Array[1] === 0x50 &&
        uint8Array[2] === 0x44 &&
        uint8Array[3] === 0x46
      ) {
        mimeType = "application/pdf";
      }
      // JPEG
      else if (uint8Array[0] === 0xff && uint8Array[1] === 0xd8) {
        mimeType = "image/jpeg";
      }
      // PNG
      else if (
        uint8Array[0] === 0x89 &&
        uint8Array[1] === 0x50 &&
        uint8Array[2] === 0x4e &&
        uint8Array[3] === 0x47
      ) {
        mimeType = "image/png";
      }
      // Word document
      else if (
        uint8Array[0] === 0xd0 &&
        uint8Array[1] === 0xcf &&
        uint8Array[2] === 0x11 &&
        uint8Array[3] === 0xe0
      ) {
        mimeType = "application/msword";
      }
      // Default
      else {
        mimeType = "application/octet-stream";
      }
    }

    const blob = new Blob([response.data], {
      type: mimeType,
    });
    const url = window.URL.createObjectURL(blob);

    return {
      url: url,
      type: mimeType,
      size: response.data.size,
    };
  } catch (error) {
    console.error("Error previewing file:", error);
    throw error;
  }
};
