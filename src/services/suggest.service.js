import { apiPost, apiGet, apiPut } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

// Gửi đề xuất đề tài cho sinh viên
// data: { title, description, objectives, methodology, expectedOutcome, supervisorId, reason, registrationPeriodId }
export const suggestTopicForStudent = async (duLieuDeXuat) => {
  try {
    // Kiểm tra xem có registrationPeriodId trong data không
    if (!duLieuDeXuat.registrationPeriodId) {
      throw new Error("Vui lòng chọn đợt đăng ký trước khi đề xuất đề tài!");
    }

    const ketQua = await apiPost(
      API_ENDPOINTS.STUDENT_SUGGEST_TOPIC,
      duLieuDeXuat
    );
    return ketQua;
  } catch (error) {
    // Ném nguyên văn thông điệp lỗi đã được chuẩn hoá ở mainHttpClient
    throw error;
  }
};

// Lấy danh sách đề tài đã đề xuất của sinh viên với phân trang
export const getStudentSuggestedTopics = async (
  studentId,
  page = 0,
  size = 6
) => {
  try {
    const endpoint = API_ENDPOINTS.GET_STUDENT_TOPIC.replace(
      "{studentId}",
      studentId
    );
    const paginatedEndpoint = `${endpoint}?page=${page}&size=${size}`;

    const response = await apiGet(paginatedEndpoint);
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đề tài đã đề xuất:", error);
    throw error;
  }
};

export const getAllTeachers = async () => {
  try {
    const response = await apiGet(API_ENDPOINTS.GET_ALL_TEACHERS);
    return response;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách giảng viên:", error);
    throw error;
  }
};

// Cập nhật đề xuất đề tài của sinh viên
export const updateStudentSuggestedTopic = async (suggestedId, topicData) => {
  try {
    const response = await apiPut(
      `${API_ENDPOINTS.UPDATE_STUDENT_SUGGEST_TOPIC}/${suggestedId}`,
      topicData
    );
    return response;
  } catch (error) {
    console.error("Lỗi khi cập nhật đề xuất đề tài:", error);
    throw error;
  }
};
