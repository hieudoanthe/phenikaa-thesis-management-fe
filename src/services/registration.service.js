import { apiGet, apiPost } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";
import registrationPeriodService from "./registrationPeriod.service";

const registrationService = {
  getAvailableTopicList: async () => {
    try {
      console.log("=== Đang kiểm tra đợt đăng ký ==="); // Debug log

      // Kiểm tra xem có đợt đăng ký nào đang hoạt động không
      const currentPeriod = await registrationPeriodService.getCurrentPeriod();
      console.log("Kết quả getCurrentPeriod:", currentPeriod); // Debug log

      if (!currentPeriod.success || !currentPeriod.data) {
        console.log(
          "KHÔNG có đợt đăng ký - success:",
          currentPeriod.success,
          "data:",
          currentPeriod.data
        ); // Debug log
        return {
          success: false,
          message: "Hiện tại không có đợt đăng ký nào đang diễn ra!",
          data: [],
          noActivePeriod: true,
        };
      }

      console.log("CÓ đợt đăng ký:", currentPeriod.data); // Debug log

      const response = await apiGet(API_ENDPOINTS.GET_AVAILABLE_TOPIC_LIST);
      return {
        success: true,
        data: response,
        currentPeriod: currentPeriod.data,
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

  registerTopic: async (topicId) => {
    try {
      // Kiểm tra đợt đăng ký trước khi đăng ký
      const currentPeriod = await registrationPeriodService.getCurrentPeriod();
      if (!currentPeriod.success || !currentPeriod.data) {
        return {
          success: false,
          message: "Hiện tại không có đợt đăng ký nào đang diễn ra!",
        };
      }

      const response = await apiPost(API_ENDPOINTS.REGISTER_TOPIC, {
        topicId,
        registrationPeriodId: currentPeriod.data.periodId,
      });
      return response;
    } catch (error) {
      console.error("Lỗi khi đăng ký đề tài:", error);
      return { success: false, message: "Không thể đăng ký đề tài" };
    }
  },

  // Thêm method để kiểm tra trạng thái đợt đăng ký
  checkRegistrationPeriod: async () => {
    try {
      const currentPeriod = await registrationPeriodService.getCurrentPeriod();
      return currentPeriod;
    } catch (error) {
      console.error("Lỗi khi kiểm tra đợt đăng ký:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể kiểm tra đợt đăng ký",
      };
    }
  },
};

export default registrationService;
