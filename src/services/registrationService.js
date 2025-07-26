import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import { getToken } from "../auth/authUtils";

const registrationService = {
  getAvailableTopicList: async () => {
    try {
      const token = getToken();
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await axios.get(API_ENDPOINTS.GET_AVAILABLE_TOPIC_LIST, {
        headers,
      });
      return response.data;
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
      const token = getToken();
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await axios.post(
        API_ENDPOINTS.REGISTER_TOPIC,
        { topicId },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi đăng ký đề tài:", error);
      return { success: false, message: "Không thể đăng ký đề tài" };
    }
  },
};

export default registrationService;
