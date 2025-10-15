import { apiGet, apiPost, apiDelete } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

/**
 * Service để quản lý việc gán sinh viên vào buổi bảo vệ
 */
const studentAssignmentService = {
  /**
   * Lấy danh sách sinh viên đã đăng ký đề tài (đã được duyệt)
   * @returns {Promise<Array>} Danh sách sinh viên đã đăng ký
   */
  getApprovedRegistrations: async () => {
    try {
      const response = await apiGet("/api/thesis-service/registers/approved");
      return response || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sinh viên đã đăng ký:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách sinh viên đã đăng ký theo đợt đăng ký
   * @param {number} periodId - ID của đợt đăng ký
   * @returns {Promise<Array>} Danh sách sinh viên đã đăng ký
   */
  getRegistrationsByPeriod: async (periodId, page = 0, size = 6) => {
    try {
      if (!periodId) {
        console.warn("periodId không được cung cấp, trả về mảng rỗng");
        return [];
      }
      const response = await apiGet(
        API_ENDPOINTS.GET_REGISTERED_STUDENTS_BY_PERIOD.replace(
          "{periodId}",
          periodId
        ) + `?page=${page}&size=${size}`
      );
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sinh viên theo đợt:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách sinh viên đã đề xuất đề tài theo đợt đăng ký
   * @param {number} periodId - ID của đợt đăng ký
   * @returns {Promise<Array>} Danh sách sinh viên đã đề xuất
   */
  getSuggestedStudentsByPeriod: async (periodId, page = 0, size = 6) => {
    try {
      if (!periodId) {
        console.warn("periodId không được cung cấp, trả về mảng rỗng");
        return [];
      }
      const response = await apiGet(
        API_ENDPOINTS.GET_SUGGESTED_STUDENTS_BY_PERIOD.replace(
          "{periodId}",
          periodId
        ) + `?page=${page}&size=${size}`
      );
      return response;
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách sinh viên đã đề xuất theo đợt:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy danh sách tất cả sinh viên (đăng ký + đề xuất) theo đợt đăng ký
   * @param {number} periodId - ID của đợt đăng ký
   * @returns {Promise<Array>} Danh sách tất cả sinh viên
   */
  getAllStudentsByPeriod: async (periodId, page = 0, size = 6) => {
    try {
      if (!periodId) {
        console.warn("periodId không được cung cấp, trả về mảng rỗng");
        return [];
      }
      const response = await apiGet(
        API_ENDPOINTS.GET_ALL_STUDENTS_BY_PERIOD.replace(
          "{periodId}",
          periodId
        ) + `?page=${page}&size=${size}`
      );
      return response;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tất cả sinh viên theo đợt:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách sinh viên chưa hoàn thiện (chưa đăng ký/đề xuất) theo đợt đăng ký
   */
  getIncompleteStudentsByPeriod: async (periodId, page = 0, size = 6) => {
    try {
      if (!periodId) {
        console.warn("periodId không được cung cấp, trả về mảng rỗng");
        return [];
      }
      const response = await apiGet(
        API_ENDPOINTS.GET_INCOMPLETE_STUDENTS_BY_PERIOD.replace(
          "{periodId}",
          periodId
        ) + `?page=${page}&size=${size}`
      );
      return response;
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách sinh viên chưa hoàn thiện theo đợt:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy danh sách đề tài được đề xuất và đã duyệt
   * @returns {Promise<Array>} Danh sách đề tài được đề xuất
   */
  getApprovedSuggestedTopics: async () => {
    try {
      const response = await apiGet(
        "/api/thesis-service/suggested-topics/approved"
      );
      return response || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đề tài được đề xuất:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin sinh viên từ profile-service
   * @param {number} studentId - ID của sinh viên
   * @returns {Promise<Object>} Thông tin profile sinh viên
   */
  getStudentProfile: async (studentId) => {
    try {
      if (!studentId) {
        console.warn("studentId không được cung cấp");
        return null;
      }
      const response = await apiGet(
        API_ENDPOINTS.GET_STUDENT_PROFILE.replace("{userId}", studentId)
      );
      return response?.data || response;
    } catch (error) {
      console.error("Lỗi khi lấy profile sinh viên:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách sinh viên có sẵn để gán vào buổi bảo vệ
   * @returns {Promise<Array>} Danh sách sinh viên có sẵn
   */
  getAvailableStudents: async () => {
    try {
      console.log("Đang tải danh sách sinh viên có sẵn...");

      // Lấy danh sách sinh viên đã đăng ký đề tài (đã được duyệt)
      const approvedRegistrations = await this.getApprovedRegistrations();
      console.log(
        `Tìm thấy ${approvedRegistrations.length} sinh viên đã đăng ký`
      );

      // Lấy danh sách đề tài được đề xuất và đã duyệt
      const suggestedTopics = await this.getApprovedSuggestedTopics();
      console.log(`Tìm thấy ${suggestedTopics.length} đề tài được đề xuất`);

      // Kết hợp dữ liệu từ cả hai nguồn
      const allStudents = [];

      // Xử lý sinh viên đã đăng ký đề tài
      for (const registration of approvedRegistrations) {
        try {
          if (!registration.studentId) {
            console.warn(
              "Bỏ qua registration không có studentId:",
              registration
            );
            continue;
          }

          const studentProfile = await this.getStudentProfile(
            registration.studentId
          );
          if (studentProfile) {
            allStudents.push({
              studentId: registration.studentId,
              studentName:
                studentProfile.fullName || studentProfile.name || "N/A",
              studentCode:
                studentProfile.studentCode || studentProfile.userId || "N/A",
              major: studentProfile.major || "CNTT",
              topicTitle: registration.projectTopic?.title || "N/A",
              topicId: registration.projectTopic?.topicId,
              registrationType: "REGISTERED",
              registrationId: registration.registerId,
            });
          }
        } catch (profileError) {
          console.warn(
            `Không thể lấy profile cho sinh viên ${registration.studentId}:`,
            profileError
          );
          // Thêm sinh viên với thông tin cơ bản nếu không thể lấy profile
          allStudents.push({
            studentId: registration.studentId,
            studentName: `Sinh viên ${registration.studentId}`,
            studentCode: registration.studentId.toString(),
            major: "CNTT",
            topicTitle: registration.projectTopic?.title || "N/A",
            topicId: registration.projectTopic?.topicId,
            registrationType: "REGISTERED",
            registrationId: registration.registerId,
          });
        }
      }

      // Xử lý sinh viên đã đề xuất đề tài
      for (const suggestedTopic of suggestedTopics) {
        try {
          if (!suggestedTopic.suggestedBy) {
            console.warn(
              "Bỏ qua suggested topic không có suggestedBy:",
              suggestedTopic
            );
            continue;
          }

          // Kiểm tra xem sinh viên đã có trong danh sách chưa
          const existingStudent = allStudents.find(
            (s) => s.studentId === suggestedTopic.suggestedBy
          );
          if (!existingStudent) {
            const studentProfile = await this.getStudentProfile(
              suggestedTopic.suggestedBy
            );
            if (studentProfile) {
              allStudents.push({
                studentId: suggestedTopic.suggestedBy,
                studentName:
                  studentProfile.fullName || studentProfile.name || "N/A",
                studentCode:
                  studentProfile.studentCode || studentProfile.userId || "N/A",
                major: studentProfile.major || "CNTT",
                topicTitle: suggestedTopic.projectTopic?.title || "N/A",
                topicId: suggestedTopic.projectTopic?.topicId,
                registrationType: "SUGGESTED",
                suggestionId: suggestedTopic.suggestedId,
              });
            }
          }
        } catch (profileError) {
          console.warn(
            `Không thể lấy profile cho sinh viên ${suggestedTopic.suggestedBy}:`,
            profileError
          );
          // Thêm sinh viên với thông tin cơ bản nếu không thể lấy profile
          const existingStudent = allStudents.find(
            (s) => s.studentId === suggestedTopic.suggestedBy
          );
          if (!existingStudent) {
            allStudents.push({
              studentId: suggestedTopic.suggestedBy,
              studentName: `Sinh viên ${suggestedTopic.suggestedBy}`,
              studentCode: suggestedTopic.suggestedBy.toString(),
              major: "CNTT",
              topicTitle: suggestedTopic.projectTopic?.title || "N/A",
              topicId: suggestedTopic.projectTopic?.topicId,
              registrationType: "SUGGESTED",
              suggestionId: suggestedTopic.suggestedId,
            });
          }
        }
      }

      console.log(`Tổng cộng có ${allStudents.length} sinh viên có sẵn`);
      return allStudents;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sinh viên có sẵn:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách sinh viên đã được gán vào buổi bảo vệ
   * @param {number} sessionId - ID của buổi bảo vệ
   * @returns {Promise<Array>} Danh sách sinh viên đã gán
   */
  getAssignedStudents: async (sessionId) => {
    try {
      if (!sessionId) {
        console.warn("sessionId không được cung cấp, trả về mảng rỗng");
        return [];
      }

      const response = await apiGet(
        API_ENDPOINTS.GET_ASSIGNED_STUDENTS.replace("{sessionId}", sessionId)
      );
      return response || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sinh viên đã gán:", error);
      return [];
    }
  },

  /**
   * Gán sinh viên vào buổi bảo vệ
   * @param {number} sessionId - ID của buổi bảo vệ
   * @param {Object} studentData - Dữ liệu sinh viên cần gán
   * @returns {Promise<Object>} Kết quả gán
   */
  assignStudent: async (sessionId, studentData) => {
    try {
      if (!sessionId || !studentData) {
        throw new Error("sessionId và studentData phải được cung cấp");
      }

      const url = API_ENDPOINTS.ASSIGN_STUDENT_TO_SESSION.replace(
        "{sessionId}",
        sessionId
      );
      console.log("Calling API:", url);
      console.log("With data:", studentData);

      const response = await apiPost(url, studentData);
      console.log("API response:", response);

      return response;
    } catch (error) {
      console.error("Lỗi khi gán sinh viên:", error);
      throw error;
    }
  },

  /**
   * Hủy gán sinh viên khỏi buổi bảo vệ
   * @param {number} sessionId - ID của buổi bảo vệ
   * @param {number} studentId - ID của sinh viên
   * @returns {Promise<Object>} Kết quả hủy gán
   */
  unassignStudent: async (sessionId, studentId) => {
    try {
      if (!sessionId || !studentId) {
        throw new Error("sessionId và studentId phải được cung cấp");
      }

      const response = await apiDelete(
        API_ENDPOINTS.UNASSIGN_STUDENT_FROM_SESSION.replace(
          "{sessionId}",
          sessionId
        ).replace("{studentId}", studentId)
      );

      return response;
    } catch (error) {
      console.error("Lỗi khi hủy gán sinh viên:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách buổi bảo vệ có thể gán thêm sinh viên
   * @returns {Promise<Array>} Danh sách buổi bảo vệ có sẵn
   */
  getAvailableSessions: async () => {
    try {
      console.log(
        "Calling GET_AVAILABLE_SESSIONS:",
        API_ENDPOINTS.GET_AVAILABLE_SESSIONS
      );
      const response = await apiGet(API_ENDPOINTS.GET_AVAILABLE_SESSIONS);
      return response || [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách buổi bảo vệ có sẵn:", error);
      throw error;
    }
  },

  /**
   * Lấy tất cả buổi bảo vệ (kể cả đã đầy) để kiểm tra assignment
   * @returns {Promise<Array>} Danh sách tất cả buổi bảo vệ
   */
  getAllSessions: async () => {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_DEFENSE_SESSIONS);
      return response || [];
    } catch (error) {
      console.error("Lỗi khi lấy tất cả buổi bảo vệ:", error);
      throw error;
    }
  },

  /**
   * Lấy tất cả assignments của sinh viên (tối ưu cho performance)
   * @returns {Promise<Array>} Danh sách tất cả assignments
   */
  getAllStudentAssignments: async () => {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_ALL_STUDENT_ASSIGNMENTS);
      return response || [];
    } catch (error) {
      console.error("Lỗi khi lấy tất cả assignments:", error);
      throw error;
    }
  },

  /**
   * Kiểm tra xem service có hoạt động bình thường không
   * @returns {Promise<boolean>} true nếu service hoạt động bình thường
   */
  healthCheck: async () => {
    try {
      // Thử gọi một API đơn giản để kiểm tra kết nối
      await this.getApprovedRegistrations();
      return true;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  },
};

export default studentAssignmentService;
