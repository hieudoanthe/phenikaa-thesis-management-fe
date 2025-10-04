import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import { getUserIdFromToken } from "../../auth/authUtils";
import scheduleService from "../../services/schedule.service";
import submissionService from "../../services/submission.service";

const StudentHome = () => {
  const navigate = useNavigate();
  const { notifications, loadNotifications } = useNotifications();
  const [stats, setStats] = useState({
    registeredTopics: 0,
    submittedReports: 0,
    completionProgress: 0,
    unreadMessages: 0,
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Only load once when component mounts
    if (hasLoadedRef.current) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const userId = getUserIdFromToken();

        // Load notifications
        if (userId) {
          await loadNotifications(userId);
        }

        // Calculate real progress based on milestones from API
        try {
          const progressData = await calculateThesisProgress();
          setStats({
            registeredTopics: progressData.registeredTopics || 1,
            submittedReports: progressData.submittedReports || 0,
            completionProgress: progressData.completionProgress || 0,
            unreadMessages: 0, // Will be updated by separate useEffect
          });
        } catch (error) {
          console.error("Error calculating progress:", error);
          // Fallback to default values
          setStats({
            registeredTopics: 1,
            submittedReports: 0,
            completionProgress: 0,
            unreadMessages: 0,
          });
        }

        // Load real upcoming deadlines from schedule
        try {
          const userId = getUserIdFromToken();
          if (userId) {
            const response = await scheduleService.getCompleteSchedule(
              parseInt(userId)
            );
            if (response.success && response.data && response.data.length > 0) {
              // Sort by date and get the closest upcoming events
              const sortedSchedule = response.data.sort((a, b) => {
                const dateA = new Date(a.date || a.dueDate);
                const dateB = new Date(b.date || b.dueDate);
                return dateA - dateB;
              });

              // Take only upcoming events (not completed) and limit to 3 most recent
              const upcoming = sortedSchedule
                .filter((event) => event.status !== "completed")
                .slice(0, 3)
                .map((event) => ({
                  id: event.scheduleId || event.assignmentId,
                  title: event.title,
                  dueDate: event.date || event.dueDate,
                  type: event.eventType,
                  priority: event.eventType === "deadline" ? "high" : "medium",
                }));

              setUpcomingDeadlines(upcoming);
            }
          }
        } catch (error) {
          console.error("Error loading upcoming deadlines:", error);
          setUpcomingDeadlines([]);
        }

        hasLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []); // Empty dependency array - only run once

  // Separate useEffect to update unread messages count when notifications change
  useEffect(() => {
    setStats((prevStats) => ({
      ...prevStats,
      unreadMessages: notifications.filter((n) => !n.isRead).length,
    }));
  }, [notifications]);

  // Calculate thesis progress based on actual submission status from API
  const calculateThesisProgress = async () => {
    try {
      const userId = getUserIdFromToken();
      if (!userId) {
        console.warn("No userId found, using default progress");
        return getDefaultProgressData();
      }

      // Call real API để lấy submission status
      const submissionStatus = await submissionService.getSubmissionStatus(
        parseInt(userId)
      );

      // Extract data từ API response
      const {
        softCopySubmitted = false,
        hardCopySubmitted = false,
        defenseCompleted = false,
        finalCopySubmitted = false,
        progressPercentage = 0,
        completedMilestones = 0,
      } = submissionStatus;

      return {
        registeredTopics: 1, // Default cho sinh viên đã đăng ký đề tài
        submittedReports: completedMilestones,
        completionProgress: progressPercentage,
      };
    } catch (error) {
      console.error("Error fetching submission status:", error);
      // Fallback to default values nếu API call fails
      return getDefaultProgressData();
    }
  };

  // Helper function to return default progress data when API fails
  const getDefaultProgressData = () => {
    return {
      registeredTopics: 1,
      submittedReports: 0,
      completionProgress: 0,
    };
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case "submit-report":
        navigate("/student/submissions");
        break;
      case "view-feedback":
        navigate("/student/my-thesis");
        break;
      case "check-schedule":
        navigate("/student/schedule");
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getDaysUntilDeadline = (dateString) => {
    const today = new Date();
    const deadline = new Date(dateString);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getDaysLeftColor = (daysLeft) => {
    if (daysLeft <= 3) return "text-red-600";
    if (daysLeft <= 7) return "text-yellow-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 w-full">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-xl mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 w-full">
      {/* Welcome Section */}
      <div className="text-center mb-8 p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Dashboard Sinh viên
        </h1>
        <p className="text-lg opacity-90">Tổng quan tiến độ luận văn của bạn</p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progress Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Tiến độ luận văn
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Hoàn thành tổng thể
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {stats.completionProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.registeredTopics}
                </div>
                <div className="text-sm text-gray-600">Đề tài đã đăng ký</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.submittedReports}
                </div>
                <div className="text-sm text-gray-600">Báo cáo đã nộp</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Thao tác nhanh
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => handleQuickAction("submit-report")}
              className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 border border-blue-200"
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  Nộp báo cáo
                </span>
              </div>
            </button>

            <button
              onClick={() => handleQuickAction("view-feedback")}
              className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 border border-green-200"
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-600 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  Xem feedback
                </span>
              </div>
            </button>

            <button
              onClick={() => handleQuickAction("check-schedule")}
              className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 border border-purple-200"
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-purple-600 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  Kiểm tra lịch
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Deadline sắp tới
        </h2>
        <div className="space-y-3">
          {upcomingDeadlines.length > 0 ? (
            upcomingDeadlines.map((deadline) => {
              const daysLeft = getDaysUntilDeadline(deadline.dueDate);
              let priorityLabel;
              if (deadline.priority === "high") {
                priorityLabel = "Cao";
              } else if (deadline.priority === "medium") {
                priorityLabel = "Trung bình";
              } else {
                priorityLabel = "Thấp";
              }
              return (
                <div
                  key={deadline.id}
                  onClick={() => navigate("/student/schedule")}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {deadline.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Hạn: {formatDate(deadline.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                        deadline.priority
                      )}`}
                    >
                      {priorityLabel}
                    </span>
                    <span
                      className={`text-sm font-bold ${getDaysLeftColor(
                        daysLeft
                      )}`}
                    >
                      {daysLeft > 0 ? `${daysLeft} ngày` : "Quá hạn"}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <p>Không có deadline nào sắp tới</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 text-center shadow-md border border-gray-200">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats.registeredTopics}
          </div>
          <div className="text-sm font-medium text-gray-600">
            Đề tài đã đăng ký
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 text-center shadow-md border border-gray-200">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.submittedReports}
          </div>
          <div className="text-sm font-medium text-gray-600">
            Báo cáo đã nộp
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 text-center shadow-md border border-gray-200">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {stats.completionProgress}%
          </div>
          <div className="text-sm font-medium text-gray-600">
            Tiến độ hoàn thành
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 text-center shadow-md border border-gray-200">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {stats.unreadMessages}
          </div>
          <div className="text-sm font-medium text-gray-600">
            Thông báo chưa đọc
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
