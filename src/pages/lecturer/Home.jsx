import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import dashboardService from "../../services/dashboard.service";

const LecturerHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalTopics: 0,
      approvedTopics: 0,
      pendingTopics: 0,
      availableTopics: 0,
      rejectedTopics: 0,
      totalStudents: 0,
      maxStudents: 0,
    },
    pendingReports: { pendingReports: 0, reports: [] },
    upcomingDefenses: { upcomingDefenses: 0, defenses: [] },
    notifications: { newNotifications: 0, notifications: [] },
    activities: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.userId) return;

      setLoading(true);
      try {
        const [
          statsRes,
          reportsRes,
          defensesRes,
          notificationsRes,
          activitiesRes,
        ] = await Promise.all([
          dashboardService.getTeacherDashboardStats(user.userId),
          dashboardService.getPendingReports(user.userId),
          dashboardService.getUpcomingDefenses(user.userId),
          dashboardService.getNewNotifications(user.userId),
          dashboardService.getRecentActivities(user.userId),
        ]);

        setDashboardData({
          stats: statsRes.data,
          pendingReports: reportsRes.data,
          upcomingDefenses: defensesRes.data,
          notifications: notificationsRes.data,
          activities: activitiesRes.data,
        });
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.userId]);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Vừa xong";
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 text-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-100 mb-2">
            Trang chủ - Giảng viên
          </h1>
          <p className="text-lg text-gray-400">Đang tải dữ liệu...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-gray-100">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-100 mb-2">
          Trang chủ - Giảng viên
        </h1>
        <p className="text-lg text-gray-400">
          Chào mừng {user?.fullName || "bạn"} đến với hệ thống quản lý luận văn
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Đề tài đang hướng dẫn */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-100">
              Đề tài đang hướng dẫn
            </h3>
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {dashboardData.stats.totalTopics}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300">
              Bạn đang hướng dẫn {dashboardData.stats.totalTopics} đề tài luận
              văn
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex items-center text-green-400">
                <span className="mr-2">✅</span>
                <span>Đã duyệt: {dashboardData.stats.approvedTopics}</span>
              </div>
              <div className="flex items-center text-yellow-400">
                <span className="mr-2">⏳</span>
                <span>Chờ duyệt: {dashboardData.stats.pendingTopics}</span>
              </div>
              <div className="flex items-center text-blue-400">
                <span className="mr-2">📋</span>
                <span>Có sẵn: {dashboardData.stats.availableTopics}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Báo cáo chờ duyệt */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-100">
              Báo cáo chờ duyệt
            </h3>
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {dashboardData.pendingReports.pendingReports}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300">
              Có {dashboardData.pendingReports.pendingReports} báo cáo tiến độ
              đang chờ bạn duyệt
            </p>
            {dashboardData.pendingReports.reports.length > 0 && (
              <div className="space-y-1 text-sm">
                {dashboardData.pendingReports.reports
                  .slice(0, 2)
                  .map((report, index) => (
                    <div
                      key={index}
                      className="flex items-center text-gray-300"
                    >
                      <span className="mr-2">📄</span>
                      <span>
                        {report.studentName} - {report.type}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Lịch bảo vệ sắp tới */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-100">
              Lịch bảo vệ sắp tới
            </h3>
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {dashboardData.upcomingDefenses.upcomingDefenses}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300">
              Có {dashboardData.upcomingDefenses.upcomingDefenses} buổi bảo vệ
              luận văn sắp tới
            </p>
            {dashboardData.upcomingDefenses.defenses.length > 0 && (
              <div className="space-y-1 text-sm">
                {dashboardData.upcomingDefenses.defenses
                  .slice(0, 2)
                  .map((defense, index) => (
                    <div
                      key={index}
                      className="flex items-center text-gray-300"
                    >
                      <span className="mr-2">📅</span>
                      <span>
                        {defense.studentName} -{" "}
                        {formatDateTime(defense.defenseDate)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Thông báo mới */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-100">
              Thông báo mới
            </h3>
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {dashboardData.notifications.newNotifications}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300">
              Bạn có {dashboardData.notifications.newNotifications} thông báo
              mới chưa đọc
            </p>
            {dashboardData.notifications.notifications.length > 0 && (
              <div className="space-y-1 text-sm">
                {dashboardData.notifications.notifications
                  .slice(0, 2)
                  .map((notification, index) => (
                    <div
                      key={index}
                      className="flex items-center text-gray-300"
                    >
                      <span className="mr-2">🔔</span>
                      <span>{notification.title}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hoạt động gần đây */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 border border-gray-600">
        <h2 className="text-2xl font-semibold text-gray-100 mb-6">
          Hoạt động gần đây
        </h2>
        <div className="space-y-4">
          {dashboardData.activities.length > 0 ? (
            dashboardData.activities.map((activity, index) => (
              <div
                key={activity.id || index}
                className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors duration-200"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-xl">
                  {activity.icon || "📝"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-100 font-medium">{activity.title}</p>
                  {activity.description && (
                    <p className="text-gray-400 text-sm mt-1">
                      {activity.description}
                    </p>
                  )}
                  <span className="text-gray-500 text-sm">
                    {formatTimeAgo(activity.createdAt)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Chưa có hoạt động nào gần đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerHome;
