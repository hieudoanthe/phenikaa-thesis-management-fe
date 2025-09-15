import React, { useState, useEffect } from "react";
import { statisticsService } from "../../services/statistics.service";
import { toast } from "react-toastify";

// Helper hiển thị toast sử dụng react-toastify
const showToast = (message, type = "success") => {
  try {
    if (type === "error") return toast.error(message);
    if (type === "warning") return toast.warn(message);
    if (type === "info") return toast.info(message);
    return toast.success(message);
  } catch (err) {
    console.error("Không thể hiển thị toast:", err);
    (type === "success" ? console.log : console.error)(message);
  }
};

const StatisticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      const data = await statisticsService.getAdminStatistics();
      setStatistics(data);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu thống kê", "error");
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    const startDate = dateRange.startDate || null;
    const endDate = dateRange.endDate || null;
    loadStatistics(startDate, endDate);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toLocaleString("vi-VN");
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return "0%";
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thống kê hệ thống
          </h1>
          <p className="text-gray-600">
            Tổng quan và phân tích dữ liệu hệ thống quản lý luận văn
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bộ lọc thời gian
          </h3>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleDateRangeChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: "overview", label: "Tổng quan", icon: "📊" },
                { key: "defenses", label: "Buổi bảo vệ", icon: "🏛️" },
                { key: "evaluations", label: "Đánh giá", icon: "📝" },
                { key: "scores", label: "Điểm số", icon: "⭐" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && statistics && (
          <OverviewStats
            data={statistics}
            formatNumber={formatNumber}
            formatPercentage={formatPercentage}
          />
        )}

        {activeTab === "defenses" && statistics && (
          <DefenseStats data={statistics} formatNumber={formatNumber} />
        )}

        {activeTab === "evaluations" && statistics && (
          <EvaluationStats
            data={statistics}
            formatNumber={formatNumber}
            formatPercentage={formatPercentage}
          />
        )}

        {activeTab === "scores" && statistics && (
          <ScoreStats
            data={statistics}
            formatNumber={formatNumber}
            formatPercentage={formatPercentage}
          />
        )}
      </div>
    </div>
  );
};

// Overview Statistics Component
const OverviewStats = ({ data, formatNumber, formatPercentage }) => (
  <div className="space-y-6">
    {/* Key Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">👥</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng người dùng</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(data.totalUsers || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">🎓</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng sinh viên</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(data.totalStudents || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-lg">📚</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng đề tài</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(data.totalTopics || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-lg">📝</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng đánh giá</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(data.totalEvaluations || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Additional Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 text-lg">👨‍🏫</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng giảng viên</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(data.totalTeachers || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg">📋</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng đăng ký</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(data.totalRegistrations || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-600 text-lg">📄</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng nộp bài</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(data.totalSubmissions || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-lg">⭐</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Điểm trung bình</p>
            <p className="text-2xl font-semibold text-gray-900">
              {data.averageScore?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Detailed Stats */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Users by Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Trạng thái người dùng
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Hoạt động</span>
            <span className="font-semibold text-green-600">
              {formatNumber(data.usersByStatus?.ACTIVE || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Không hoạt động</span>
            <span className="font-semibold text-red-600">
              {formatNumber(data.usersByStatus?.INACTIVE || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Hoạt động hôm nay</span>
            <span className="font-semibold text-blue-600">
              {formatNumber(data.activeUsersToday || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Topics by Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Trạng thái đề tài
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Hoạt động</span>
            <span className="font-semibold text-green-600">
              {formatNumber(data.topicsByStatus?.ACTIVE || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Không hoạt động</span>
            <span className="font-semibold text-gray-600">
              {formatNumber(data.topicsByStatus?.INACTIVE || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Lưu trữ</span>
            <span className="font-semibold text-blue-600">
              {formatNumber(data.topicsByStatus?.ARCHIVED || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Real-time Statistics */}
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Thống kê thời gian thực
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(data.activeUsersToday || 0)}
          </p>
          <p className="text-sm text-blue-800">Người dùng hoạt động hôm nay</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {formatNumber(data.newRegistrationsToday || 0)}
          </p>
          <p className="text-sm text-green-800">Đăng ký mới hôm nay</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">
            {formatNumber(data.newSubmissionsToday || 0)}
          </p>
          <p className="text-sm text-purple-800">Nộp bài mới hôm nay</p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-2xl font-bold text-orange-600">
            {formatNumber(data.pendingEvaluations || 0)}
          </p>
          <p className="text-sm text-orange-800">Đánh giá chờ xử lý</p>
        </div>
      </div>
    </div>
  </div>
);

// Defense Statistics Component
const DefenseStats = ({ data, formatNumber }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Thống kê đăng ký đề tài
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(data.totalRegistrations || 0)}
          </p>
          <p className="text-sm text-blue-800">Tổng đăng ký</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {formatNumber(data.registrationsByStatus?.APPROVED || 0)}
          </p>
          <p className="text-sm text-green-800">Đã duyệt</p>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">
            {formatNumber(data.registrationsByStatus?.PENDING || 0)}
          </p>
          <p className="text-sm text-yellow-800">Chờ duyệt</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Thống kê nộp bài
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(data.totalSubmissions || 0)}
          </p>
          <p className="text-sm text-blue-800">Tổng nộp bài</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {formatNumber(data.submissionsByStatus?.APPROVED || 0)}
          </p>
          <p className="text-sm text-green-800">Đã duyệt</p>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">
            {formatNumber(data.submissionsByStatus?.UNDER_REVIEW || 0)}
          </p>
          <p className="text-sm text-yellow-800">Đang xem xét</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-600">
            {formatNumber(data.submissionsByStatus?.REJECTED || 0)}
          </p>
          <p className="text-sm text-red-800">Từ chối</p>
        </div>
      </div>
    </div>
  </div>
);

// Evaluation Statistics Component
const EvaluationStats = ({ data, formatNumber, formatPercentage }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Thống kê đánh giá
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Theo trạng thái đánh giá
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Chờ xử lý</span>
              <span className="font-semibold text-yellow-600">
                {formatNumber(data.evaluationsByStatus?.PENDING || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Đang xử lý</span>
              <span className="font-semibold text-blue-600">
                {formatNumber(data.evaluationsByStatus?.IN_PROGRESS || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Đã hoàn thành</span>
              <span className="font-semibold text-green-600">
                {formatNumber(data.evaluationsByStatus?.COMPLETED || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Đã hủy</span>
              <span className="font-semibold text-red-600">
                {formatNumber(data.evaluationsByStatus?.CANCELLED || 0)}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Tổng quan</h4>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {formatNumber(data.totalEvaluations || 0)}
            </p>
            <p className="text-sm text-gray-600">Tổng số đánh giá</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {formatNumber(data.pendingEvaluations || 0)}
            </p>
            <p className="text-sm text-gray-600">Chờ xử lý</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Score Statistics Component
const ScoreStats = ({ data, formatNumber, formatPercentage }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Thống kê điểm số
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Điểm trung bình
          </h4>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {data.averageScore?.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-gray-600">Tổng thể</p>
          </div>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Điểm cao nhất
          </h4>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {data.highestScore?.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-gray-600">Tối đa</p>
          </div>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Điểm thấp nhất
          </h4>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">
              {data.lowestScore?.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-gray-600">Tối thiểu</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Tỷ lệ đạt</h3>
      <div className="text-center">
        <p className="text-4xl font-bold text-green-600">
          {formatPercentage(data.passRate || 0)}
        </p>
        <p className="text-sm text-gray-600">Điểm &gt;= 5.0</p>
      </div>
    </div>

    {/* Score Distribution */}
    {data.scoreDistribution && (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Phân bố điểm</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(data.scoreDistribution).map(([range, count]) => (
            <div key={range} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(count)}
              </p>
              <p className="text-sm text-gray-600">{range}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default StatisticsDashboard;
