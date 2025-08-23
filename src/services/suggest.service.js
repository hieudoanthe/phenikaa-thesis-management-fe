import { apiPost, apiGet } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

// Gửi đề xuất đề tài cho sinh viên
// data: { title, description, objectives, methodology, expectedOutcome, supervisorId, reason }
export const suggestTopicForStudent = async (duLieuDeXuat) => {
  try {
    // Gọi API gửi đề xuất đề tài
    const ketQua = await apiPost(
      API_ENDPOINTS.STUDENT_SUGGEST_TOPIC,
      duLieuDeXuat
    );
    return ketQua;
  } catch (error) {
    // Xử lý lỗi và ném ra cho component xử lý tiếp
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
