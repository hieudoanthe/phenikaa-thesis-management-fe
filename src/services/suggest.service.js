import { apiPost } from "./mainHttpClient";
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
