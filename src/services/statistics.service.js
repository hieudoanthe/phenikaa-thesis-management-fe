import { apiGet } from "./mainHttpClient";
import { API_ENDPOINTS } from "../config/api";

const STATISTICS_API_BASE = "/api/statistics-service";

export const statisticsService = {
  // ===== COMPREHENSIVE STATISTICS =====

  // Lấy thống kê tổng quan từ tất cả các service
  async getComprehensiveOverview() {
    try {
      const [
        userStats,
        topicStats,
        registrationStats,
        submissionStats,
        evaluationStats,
        assignmentStats,
        profileStats,
        academicYearStats,
      ] = await Promise.all([
        this.getUserStatistics(),
        this.getTopicStatistics(),
        this.getRegistrationStatistics(),
        this.getSubmissionStatistics(),
        this.getEvaluationStatistics(),
        this.getAssignmentStatistics(),
        this.getProfileStatistics(),
        this.getAcademicYearStatistics(),
      ]);

      return {
        users: userStats,
        topics: topicStats,
        registrations: registrationStats,
        submissions: submissionStats,
        evaluations: evaluationStats,
        assignments: assignmentStats,
        profiles: profileStats,
        academicYears: academicYearStats,
        // Tổng hợp các số liệu chính
        totalUsers: userStats.totalUsers || 0,
        totalStudents: userStats.students || 0,
        totalTeachers: userStats.teachers || 0,
        totalTopics: topicStats.totalTopics || 0,
        totalRegistrations: registrationStats.totalRegistrations || 0,
        totalSubmissions: submissionStats.totalSubmissions || 0,
        totalEvaluations: evaluationStats.totalEvaluations || 0,
        totalAssignments: assignmentStats.totalAssignments || 0,
        activeUsersToday: userStats.activeUsersToday || 0,
        newRegistrationsToday: registrationStats.newRegistrationsToday || 0,
        newSubmissionsToday: submissionStats.newSubmissionsToday || 0,
        pendingEvaluations: evaluationStats.pendingEvaluations || 0,
      };
    } catch (error) {
      console.error("Error fetching comprehensive overview:", error);
      throw error;
    }
  },

  // Lấy thống kê tổng quan cho Admin (backward compatibility)
  async getAdminStatistics() {
    try {
      return await this.getComprehensiveOverview();
    } catch (error) {
      console.error("Error fetching admin statistics:", error);
      throw error;
    }
  },

  // ===== USER STATISTICS =====
  async getUserStatistics() {
    try {
      const [totalUsers, students, teachers, activeUsersToday, usersByStatus] =
        await Promise.all([
          apiGet(API_ENDPOINTS.GET_USER_COUNT),
          apiGet(`${API_ENDPOINTS.GET_USER_COUNT_BY_ROLE}?role=STUDENT`),
          apiGet(`${API_ENDPOINTS.GET_USER_COUNT_BY_ROLE}?role=TEACHER`),
          apiGet(API_ENDPOINTS.GET_ACTIVE_USERS_TODAY),
          this.getUsersByStatus(),
        ]);

      return {
        totalUsers,
        students,
        teachers,
        activeUsersToday,
        usersByStatus,
      };
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      throw error;
    }
  },

  async getUsersByStatus() {
    try {
      const [active, inactive] = await Promise.all([
        apiGet(`${API_ENDPOINTS.GET_USER_COUNT_BY_STATUS}?status=1`),
        apiGet(`${API_ENDPOINTS.GET_USER_COUNT_BY_STATUS}?status=0`),
      ]);

      return {
        ACTIVE: active,
        INACTIVE: inactive,
      };
    } catch (error) {
      console.error("Error fetching users by status:", error);
      return { ACTIVE: 0, INACTIVE: 0 };
    }
  },

  // ===== TOPIC STATISTICS =====
  async getTopicStatistics() {
    try {
      const [
        totalTopics,
        activeTopics,
        inactiveTopics,
        topicsByDifficulty,
        topicsOverTime,
      ] = await Promise.all([
        apiGet(API_ENDPOINTS.GET_TOPIC_COUNT),
        apiGet(`${API_ENDPOINTS.GET_TOPIC_COUNT_BY_STATUS}?status=ACTIVE`),
        apiGet(`${API_ENDPOINTS.GET_TOPIC_COUNT_BY_STATUS}?status=INACTIVE`),
        this.getTopicsByDifficulty(),
        apiGet(API_ENDPOINTS.GET_TOPICS_OVER_TIME),
      ]);

      return {
        totalTopics,
        activeTopics,
        inactiveTopics,
        topicsByDifficulty,
        topicsOverTime,
        topicsByStatus: {
          ACTIVE: activeTopics,
          INACTIVE: inactiveTopics,
        },
      };
    } catch (error) {
      console.error("Error fetching topic statistics:", error);
      throw error;
    }
  },

  async getTopicsByDifficulty() {
    try {
      const [easy, medium, hard] = await Promise.all([
        apiGet(
          `${API_ENDPOINTS.GET_TOPIC_COUNT_BY_DIFFICULTY}?difficulty=EASY`
        ),
        apiGet(
          `${API_ENDPOINTS.GET_TOPIC_COUNT_BY_DIFFICULTY}?difficulty=MEDIUM`
        ),
        apiGet(
          `${API_ENDPOINTS.GET_TOPIC_COUNT_BY_DIFFICULTY}?difficulty=HARD`
        ),
      ]);

      return {
        EASY: easy,
        MEDIUM: medium,
        HARD: hard,
      };
    } catch (error) {
      console.error("Error fetching topics by difficulty:", error);
      return { EASY: 0, MEDIUM: 0, HARD: 0 };
    }
  },

  // ===== REGISTRATION STATISTICS =====
  async getRegistrationStatistics() {
    try {
      const [
        totalRegistrations,
        approvedRegistrations,
        pendingRegistrations,
        rejectedRegistrations,
        newRegistrationsToday,
        registrationsOverTime,
      ] = await Promise.all([
        apiGet(API_ENDPOINTS.GET_REGISTRATION_COUNT),
        apiGet(
          `${API_ENDPOINTS.GET_REGISTRATION_COUNT_BY_STATUS}?status=APPROVED`
        ),
        apiGet(
          `${API_ENDPOINTS.GET_REGISTRATION_COUNT_BY_STATUS}?status=PENDING`
        ),
        apiGet(
          `${API_ENDPOINTS.GET_REGISTRATION_COUNT_BY_STATUS}?status=REJECTED`
        ),
        apiGet(API_ENDPOINTS.GET_REGISTRATIONS_TODAY),
        apiGet(API_ENDPOINTS.GET_REGISTRATIONS_OVER_TIME),
      ]);

      return {
        totalRegistrations,
        approvedRegistrations,
        pendingRegistrations,
        rejectedRegistrations,
        newRegistrationsToday,
        registrationsOverTime,
        registrationsByStatus: {
          APPROVED: approvedRegistrations,
          PENDING: pendingRegistrations,
          REJECTED: rejectedRegistrations,
        },
      };
    } catch (error) {
      console.error("Error fetching registration statistics:", error);
      throw error;
    }
  },

  // ===== SUBMISSION STATISTICS =====
  async getSubmissionStatistics() {
    try {
      const [
        totalSubmissions,
        approvedSubmissions,
        underReviewSubmissions,
        rejectedSubmissions,
        newSubmissionsToday,
        submissionsOverTime,
        deadlineStats,
      ] = await Promise.all([
        apiGet(API_ENDPOINTS.GET_SUBMISSION_COUNT),
        apiGet(`${API_ENDPOINTS.GET_SUBMISSION_COUNT_BY_STATUS}?status=1`), // APPROVED
        apiGet(`${API_ENDPOINTS.GET_SUBMISSION_COUNT_BY_STATUS}?status=2`), // UNDER_REVIEW
        apiGet(`${API_ENDPOINTS.GET_SUBMISSION_COUNT_BY_STATUS}?status=3`), // REJECTED
        apiGet(API_ENDPOINTS.GET_SUBMISSIONS_TODAY),
        apiGet(API_ENDPOINTS.GET_SUBMISSIONS_OVER_TIME),
        apiGet(API_ENDPOINTS.GET_DEADLINE_STATS),
      ]);

      return {
        totalSubmissions,
        approvedSubmissions,
        underReviewSubmissions,
        rejectedSubmissions,
        newSubmissionsToday,
        submissionsOverTime,
        deadlineStats,
        submissionsByStatus: {
          APPROVED: approvedSubmissions,
          UNDER_REVIEW: underReviewSubmissions,
          REJECTED: rejectedSubmissions,
        },
      };
    } catch (error) {
      console.error("Error fetching submission statistics:", error);
      throw error;
    }
  },

  // ===== EVALUATION STATISTICS =====
  async getEvaluationStatistics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiGet(
        `${API_ENDPOINTS.GET_EVALUATION_STATISTICS}?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching evaluation statistics:", error);
      throw error;
    }
  },

  // ===== ASSIGNMENT STATISTICS =====
  async getAssignmentStatistics() {
    try {
      const [totalAssignments, totalTasks, assignmentsByStatus, tasksByStatus] =
        await Promise.all([
          apiGet(API_ENDPOINTS.GET_ASSIGNMENT_COUNT),
          apiGet(API_ENDPOINTS.GET_TASK_COUNT),
          this.getAssignmentsByStatus(),
          this.getTasksByStatus(),
        ]);

      return {
        totalAssignments,
        totalTasks,
        assignmentsByStatus,
        tasksByStatus,
      };
    } catch (error) {
      console.error("Error fetching assignment statistics:", error);
      throw error;
    }
  },

  async getAssignmentsByStatus() {
    try {
      const [active, completed, cancelled] = await Promise.all([
        apiGet(`${API_ENDPOINTS.GET_ASSIGNMENT_COUNT_BY_STATUS}?status=ACTIVE`),
        apiGet(
          `${API_ENDPOINTS.GET_ASSIGNMENT_COUNT_BY_STATUS}?status=COMPLETED`
        ),
        apiGet(
          `${API_ENDPOINTS.GET_ASSIGNMENT_COUNT_BY_STATUS}?status=CANCELLED`
        ),
      ]);

      return {
        ACTIVE: active,
        COMPLETED: completed,
        CANCELLED: cancelled,
      };
    } catch (error) {
      console.error("Error fetching assignments by status:", error);
      return { ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
    }
  },

  async getTasksByStatus() {
    try {
      const [pending, inProgress, completed, cancelled] = await Promise.all([
        apiGet(`${API_ENDPOINTS.GET_TASK_COUNT_BY_STATUS}?status=PENDING`),
        apiGet(`${API_ENDPOINTS.GET_TASK_COUNT_BY_STATUS}?status=IN_PROGRESS`),
        apiGet(`${API_ENDPOINTS.GET_TASK_COUNT_BY_STATUS}?status=COMPLETED`),
        apiGet(`${API_ENDPOINTS.GET_TASK_COUNT_BY_STATUS}?status=CANCELLED`),
      ]);

      return {
        PENDING: pending,
        IN_PROGRESS: inProgress,
        COMPLETED: completed,
        CANCELLED: cancelled,
      };
    } catch (error) {
      console.error("Error fetching tasks by status:", error);
      return { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
    }
  },

  // ===== PROFILE STATISTICS =====
  async getProfileStatistics() {
    try {
      const [
        totalProfiles,
        studentProfiles,
        lecturerProfiles,
        profilesByMajor,
        profilesByYear,
      ] = await Promise.all([
        apiGet(API_ENDPOINTS.GET_PROFILE_COUNT),
        apiGet(API_ENDPOINTS.GET_STUDENT_PROFILE_COUNT),
        apiGet(API_ENDPOINTS.GET_LECTURER_PROFILE_COUNT),
        this.getProfilesByMajor(),
        this.getProfilesByYear(),
      ]);

      return {
        totalProfiles,
        studentProfiles,
        lecturerProfiles,
        profilesByMajor,
        profilesByYear,
      };
    } catch (error) {
      console.error("Error fetching profile statistics:", error);
      throw error;
    }
  },

  async getProfilesByMajor() {
    try {
      // Lấy danh sách các major từ API hoặc hardcode
      const majors = ["IT", "CS", "SE", "AI", "DS"]; // Có thể lấy từ API khác
      const profilesByMajor = {};

      for (const major of majors) {
        try {
          const count = await apiGet(
            `${API_ENDPOINTS.GET_PROFILES_BY_MAJOR}?major=${major}`
          );
          profilesByMajor[major] = count;
        } catch (error) {
          profilesByMajor[major] = 0;
        }
      }

      return profilesByMajor;
    } catch (error) {
      console.error("Error fetching profiles by major:", error);
      return {};
    }
  },

  async getProfilesByYear() {
    try {
      const currentYear = new Date().getFullYear();
      const years = [
        currentYear - 2,
        currentYear - 1,
        currentYear,
        currentYear + 1,
      ];
      const profilesByYear = {};

      for (const year of years) {
        try {
          const count = await apiGet(
            `${API_ENDPOINTS.GET_PROFILES_BY_YEAR}?year=${year}`
          );
          profilesByYear[year] = count;
        } catch (error) {
          profilesByYear[year] = 0;
        }
      }

      return profilesByYear;
    } catch (error) {
      console.error("Error fetching profiles by year:", error);
      return {};
    }
  },

  // ===== ACADEMIC YEAR STATISTICS =====
  async getAcademicYearStatistics() {
    try {
      const [academicYears, activeAcademicYear, academicYearCount] =
        await Promise.all([
          apiGet(API_ENDPOINTS.GET_ACADEMIC_YEARS_STATS),
          apiGet(API_ENDPOINTS.GET_ACTIVE_ACADEMIC_YEAR_STATS),
          apiGet(API_ENDPOINTS.GET_ACADEMIC_YEAR_COUNT),
        ]);

      return {
        academicYears,
        activeAcademicYear,
        academicYearCount,
      };
    } catch (error) {
      console.error("Error fetching academic year statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê cho Giảng viên
  async getTeacherStatistics(teacherId) {
    try {
      const [
        topicsBySupervisor,
        topicsStatsBySupervisor,
        assignmentsByUser,
        studentProfilesBySupervisor,
      ] = await Promise.all([
        apiGet(
          `${API_ENDPOINTS.GET_TOPICS_BY_SUPERVISOR_STATS}?supervisorId=${teacherId}`
        ),
        apiGet(
          `${API_ENDPOINTS.GET_TOPICS_STATS_BY_SUPERVISOR}?supervisorId=${teacherId}`
        ),
        apiGet(`${API_ENDPOINTS.GET_ASSIGNMENTS_BY_USER}?userId=${teacherId}`),
        apiGet(
          `${API_ENDPOINTS.GET_STUDENT_PROFILES_BY_SUPERVISOR}?supervisorId=${teacherId}`
        ),
      ]);

      return {
        topicsBySupervisor,
        topicsStatsBySupervisor,
        assignmentsByUser,
        studentProfilesBySupervisor,
      };
    } catch (error) {
      console.error("Error fetching teacher statistics:", error);
      throw error;
    }
  },

  // ===== BACKWARD COMPATIBILITY METHODS =====

  // Lấy thống kê tổng quan (backward compatibility)
  async getOverviewStatistics() {
    try {
      return await this.getComprehensiveOverview();
    } catch (error) {
      console.error("Error fetching overview statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê buổi bảo vệ (backward compatibility)
  async getDefenseStatistics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiGet(
        `${API_ENDPOINTS.GET_DEFENSE_STATISTICS}?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching defense statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê điểm số (backward compatibility)
  async getScoreStatistics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const data = await apiGet(
        `${API_ENDPOINTS.GET_SCORE_STATISTICS}?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching score statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê theo tháng (backward compatibility)
  async getMonthlyStatistics(year = null) {
    try {
      const params = new URLSearchParams();
      if (year) params.append("year", year);

      const data = await apiGet(
        `${API_ENDPOINTS.GET_MONTHLY_STATISTICS}?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching monthly statistics:", error);
      throw error;
    }
  },

  // Lấy tất cả thống kê (backward compatibility)
  async getAllStatistics(startDate = null, endDate = null) {
    try {
      const data = await this.getComprehensiveOverview();
      return {
        overview: data,
        defenses: data,
        evaluations: data,
        scores: data,
      };
    } catch (error) {
      console.error("Error fetching all statistics:", error);
      throw error;
    }
  },

  // ===== REAL-TIME STATISTICS =====
  async getRealTimeStatistics() {
    try {
      const [
        activeUsersToday,
        newRegistrationsToday,
        newSubmissionsToday,
        pendingEvaluations,
      ] = await Promise.all([
        apiGet(API_ENDPOINTS.GET_ACTIVE_USERS_TODAY),
        apiGet(API_ENDPOINTS.GET_REGISTRATIONS_TODAY),
        apiGet(API_ENDPOINTS.GET_SUBMISSIONS_TODAY),
        this.getPendingEvaluationsCount(),
      ]);

      return {
        activeUsersToday,
        newRegistrationsToday,
        newSubmissionsToday,
        pendingEvaluations,
      };
    } catch (error) {
      console.error("Error fetching real-time statistics:", error);
      throw error;
    }
  },

  async getPendingEvaluationsCount() {
    try {
      const evaluationStats = await this.getEvaluationStatistics();
      return evaluationStats.pendingEvaluations || 0;
    } catch (error) {
      console.error("Error fetching pending evaluations count:", error);
      return 0;
    }
  },
};

export default statisticsService;
