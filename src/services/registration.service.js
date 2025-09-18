import { apiGet, apiPost } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";
import registrationPeriodService from "./registrationPeriod.service";

const registrationService = {
  getAvailableTopicList: async () => {
    try {
      console.log("=== Đang lấy danh sách đề tài khả dụng ==="); // Debug log

      const response = await apiGet(API_ENDPOINTS.GET_AVAILABLE_TOPIC_LIST);
      return {
        success: true,
        data: response.content || response, // Xử lý cả Page và List
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đề tài khả dụng:", error);
      return {
        success: false,
        message: "Không thể lấy danh sách đề tài",
        data: [],
      };
    }
  },

  // Lọc/tìm kiếm đề tài dùng Specification
  filterTopics: async (filter) => {
    try {
      const payload = {
        page: 0,
        size: 10,
        sortBy: "topicId",
        sortDirection: "DESC",
        ...filter,
        userRole: "STUDENT", // Đảm bảo userRole luôn là STUDENT
      };
      const res = await apiPost(API_ENDPOINTS.STUDENT_FILTER_TOPICS, payload);
      return { success: true, data: res };
    } catch (error) {
      console.error("Lỗi khi lọc đề tài:", error);
      return { success: false, message: error.message };
    }
  },

  registerTopic: async (topicId, registrationPeriodId) => {
    try {
      const response = await apiPost(API_ENDPOINTS.REGISTER_TOPIC, {
        topicId,
        registrationPeriodId,
      });
      // Backend trả về string "Registered successfully!" nên cần wrap thành object
      return {
        success: true,
        message:
          response ||
          "Đăng ký đề tài thành công! Vui lòng chờ giảng viên duyệt.",
      };
    } catch (error) {
      console.error("Lỗi khi đăng ký đề tài:", error);
      return { success: false, message: "Không thể đăng ký đề tài" };
    }
  },
};

export default registrationService;
