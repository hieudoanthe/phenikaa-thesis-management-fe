import { apiGet, apiPost } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

const registrationService = {
  getAvailableTopicList: async () => {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_AVAILABLE_TOPIC_LIST);
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đề tài khả dụng:", error);
      return {
        success: false,
        message: "Không thể lấy danh sách đề tài",
        data: [],
      };
    }
  },
  registerTopic: async (topicId) => {
    try {
      const response = await apiPost(API_ENDPOINTS.REGISTER_TOPIC, { topicId });
      return response;
    } catch (error) {
      console.error("Lỗi khi đăng ký đề tài:", error);
      return { success: false, message: "Không thể đăng ký đề tài" };
    }
  },
};

export default registrationService;
