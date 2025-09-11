import { apiPost, apiGet } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";
import registrationPeriodService from "./registrationPeriod.service";

// Gửi đề xuất đề tài cho sinh viên
// data: { title, description, objectives, methodology, expectedOutcome, supervisorId, reason }
export const suggestTopicForStudent = async (duLieuDeXuat) => {
  try {
    // Kiểm tra đợt đăng ký trước khi đề xuất
    const currentPeriod = await registrationPeriodService.getCurrentPeriod();
    if (!currentPeriod.success || !currentPeriod.data) {
      throw new Error("Hiện tại không có đợt đăng ký nào đang diễn ra!");
    }

    // Thêm thông tin đợt đăng ký vào dữ liệu đề xuất
    const dataWithPeriod = {
      ...duLieuDeXuat,
      registrationPeriodId: currentPeriod.data.periodId,
    };

    const ketQua = await apiPost(
      API_ENDPOINTS.STUDENT_SUGGEST_TOPIC,
      dataWithPeriod
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
