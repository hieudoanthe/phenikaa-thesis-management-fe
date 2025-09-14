import { apiGet, apiPost } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

const dashboardService = {
  // Lấy thống kê tổng quan cho giảng viên
  getTeacherDashboardStats: async (teacherId) => {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_TEACHER_TOPICS}/${teacherId}?page=0&size=1000`
      );
      const topics = response.content || response;

      // Tính toán thống kê từ dữ liệu đề tài
      const stats = {
        totalTopics: topics.length,
        approvedTopics: topics.filter(
          (topic) => topic.approvalStatus === "APPROVED"
        ).length,
        pendingTopics: topics.filter(
          (topic) => topic.approvalStatus === "PENDING"
        ).length,
        availableTopics: topics.filter(
          (topic) => topic.approvalStatus === "AVAILABLE"
        ).length,
        rejectedTopics: topics.filter(
          (topic) => topic.approvalStatus === "REJECTED"
        ).length,
        totalStudents: topics.reduce(
          (sum, topic) => sum + (topic.currentStudents || 0),
          0
        ),
        maxStudents: topics.reduce(
          (sum, topic) => sum + (topic.maxStudents || 0),
          0
        ),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error("Lỗi khi lấy thống kê dashboard:", error);
      return {
        success: false,
        message: "Không thể lấy thống kê dashboard",
        data: {
          totalTopics: 0,
          approvedTopics: 0,
          pendingTopics: 0,
          availableTopics: 0,
          rejectedTopics: 0,
          totalStudents: 0,
          maxStudents: 0,
        },
      };
    }
  },

  // Lấy danh sách đề tài gần đây
  getRecentTopics: async (teacherId) => {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_TEACHER_TOPICS}/${teacherId}?page=0&size=5&sortBy=createdAt&sortDirection=DESC`
      );
      const topics = response.content || response;

      return {
        success: true,
        data: topics,
      };
    } catch (error) {
      console.error("Lỗi khi lấy đề tài gần đây:", error);
      return {
        success: false,
        message: "Không thể lấy đề tài gần đây",
        data: [],
      };
    }
  },

  // Lấy thống kê báo cáo chờ duyệt (mock data - cần API thật)
  getPendingReports: async (teacherId) => {
    try {
      // TODO: Thay thế bằng API thật khi có
      const mockData = {
        pendingReports: 3,
        reports: [
          {
            id: 1,
            studentName: "Nguyễn Văn A",
            topicTitle: "Hệ thống quản lý sinh viên",
            submittedAt: "2024-01-15T10:30:00Z",
            type: "Báo cáo tiến độ",
          },
          {
            id: 2,
            studentName: "Trần Thị B",
            topicTitle: "Ứng dụng mobile học tập",
            submittedAt: "2024-01-14T15:45:00Z",
            type: "Báo cáo định kỳ",
          },
          {
            id: 3,
            studentName: "Lê Văn C",
            topicTitle: "Hệ thống AI phân tích dữ liệu",
            submittedAt: "2024-01-13T09:20:00Z",
            type: "Báo cáo tiến độ",
          },
        ],
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error("Lỗi khi lấy báo cáo chờ duyệt:", error);
      return {
        success: false,
        message: "Không thể lấy báo cáo chờ duyệt",
        data: { pendingReports: 0, reports: [] },
      };
    }
  },

  // Lấy lịch bảo vệ sắp tới (mock data - cần API thật)
  getUpcomingDefenses: async (teacherId) => {
    try {
      // TODO: Thay thế bằng API thật khi có
      const mockData = {
        upcomingDefenses: 2,
        defenses: [
          {
            id: 1,
            studentName: "Nguyễn Văn A",
            topicTitle: "Hệ thống quản lý sinh viên",
            defenseDate: "2024-01-20T14:00:00Z",
            location: "Phòng A101",
            status: "Scheduled",
          },
          {
            id: 2,
            studentName: "Trần Thị B",
            topicTitle: "Ứng dụng mobile học tập",
            defenseDate: "2024-01-22T09:00:00Z",
            location: "Phòng B205",
            status: "Scheduled",
          },
        ],
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error("Lỗi khi lấy lịch bảo vệ:", error);
      return {
        success: false,
        message: "Không thể lấy lịch bảo vệ",
        data: { upcomingDefenses: 0, defenses: [] },
      };
    }
  },

  // Lấy thông báo mới (mock data - cần API thật)
  getNewNotifications: async (teacherId) => {
    try {
      // TODO: Thay thế bằng API thật khi có
      const mockData = {
        newNotifications: 8,
        notifications: [
          {
            id: 1,
            title: "Sinh viên nộp báo cáo mới",
            message: "Nguyễn Văn A đã nộp báo cáo tiến độ",
            createdAt: "2024-01-15T10:30:00Z",
            isRead: false,
            type: "report",
          },
          {
            id: 2,
            title: "Đề tài được duyệt",
            message: "Đề tài 'Hệ thống AI' đã được duyệt",
            createdAt: "2024-01-15T09:15:00Z",
            isRead: false,
            type: "approval",
          },
          {
            id: 3,
            title: "Lịch bảo vệ cập nhật",
            message: "Lịch bảo vệ tuần tới đã được cập nhật",
            createdAt: "2024-01-14T16:45:00Z",
            isRead: true,
            type: "schedule",
          },
        ],
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông báo:", error);
      return {
        success: false,
        message: "Không thể lấy thông báo",
        data: { newNotifications: 0, notifications: [] },
      };
    }
  },

  // Lấy hoạt động gần đây
  getRecentActivities: async (teacherId) => {
    try {
      const response = await apiGet(
        `${API_ENDPOINTS.GET_TEACHER_TOPICS}/${teacherId}?page=0&size=10&sortBy=updatedAt&sortDirection=DESC`
      );
      const topics = response.content || response;

      // Tạo danh sách hoạt động từ dữ liệu đề tài
      const activities = topics.slice(0, 5).map((topic) => ({
        id: topic.topicId,
        type: "topic_update",
        title: `Đề tài "${topic.title}" đã được cập nhật`,
        description: `Trạng thái: ${topic.approvalStatus}`,
        createdAt: topic.updatedAt || topic.createdAt,
        icon: "📝",
      }));

      return {
        success: true,
        data: activities,
      };
    } catch (error) {
      console.error("Lỗi khi lấy hoạt động gần đây:", error);
      return {
        success: false,
        message: "Không thể lấy hoạt động gần đây",
        data: [],
      };
    }
  },
};

export default dashboardService;
