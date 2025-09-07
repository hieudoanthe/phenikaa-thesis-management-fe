import React, { useState, useEffect } from "react";
import { statisticsService } from "../../services/statistics.service";
import { toast } from "react-toastify";

const StatisticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    overview: null,
    defenses: null,
    evaluations: null,
    scores: null,
  });
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
      const data = await statisticsService.getAllStatistics(startDate, endDate);
      setStatistics(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu thống kê");
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
        {activeTab === "overview" && statistics.overview && (
          <OverviewStats
            data={statistics.overview}
            formatPercentage={formatPercentage}
          />
        )}

        {activeTab === "defenses" && statistics.defenses && (
          <DefenseStats data={statistics.defenses} />
        )}

        {activeTab === "evaluations" && statistics.evaluations && (
          <EvaluationStats
            data={statistics.evaluations}
            formatPercentage={formatPercentage}
          />
        )}

        {activeTab === "scores" && statistics.scores && (
          <ScoreStats
            data={statistics.scores}
            formatPercentage={formatPercentage}
          />
        )}
      </div>
    </div>
  );
};

// Overview Statistics Component
const OverviewStats = ({ data, formatPercentage }) => (
  <div className="space-y-6">
    {/* Key Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">🏛️</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">
              Tổng buổi bảo vệ
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {data.totalDefenseSessions || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">👥</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng sinh viên</p>
            <p className="text-2xl font-semibold text-gray-900">
              {data.totalStudents || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-lg">📝</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng đánh giá</p>
            <p className="text-2xl font-semibold text-gray-900">
              {data.totalEvaluations || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-lg">⭐</span>
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
      {/* Defense Sessions Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Trạng thái buổi bảo vệ
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Đã lên lịch</span>
            <span className="font-semibold text-blue-600">
              {data.scheduledSessions || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Đang diễn ra</span>
            <span className="font-semibold text-yellow-600">
              {data.inProgressSessions || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Đã hoàn thành</span>
            <span className="font-semibold text-green-600">
              {data.completedSessions || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Đã hủy</span>
            <span className="font-semibold text-red-600">
              {data.cancelledSessions || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Students Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Trạng thái sinh viên
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Chờ bảo vệ</span>
            <span className="font-semibold text-yellow-600">
              {data.pendingStudents || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Đã hoàn thành</span>
            <span className="font-semibold text-green-600">
              {data.completedStudents || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tỷ lệ hoàn thành</span>
            <span className="font-semibold text-blue-600">
              {formatPercentage(data.completionRate)}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Evaluation Types */}
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Phân loại đánh giá
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            {data.supervisorEvaluations || 0}
          </p>
          <p className="text-sm text-blue-800">Giảng viên hướng dẫn</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {data.reviewerEvaluations || 0}
          </p>
          <p className="text-sm text-green-800">Giảng viên phản biện</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">
            {data.committeeEvaluations || 0}
          </p>
          <p className="text-sm text-purple-800">Hội đồng</p>
        </div>
      </div>
    </div>
  </div>
);

// Defense Statistics Component
const DefenseStats = ({ data }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Thống kê buổi bảo vệ
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            {data.todaySessions || 0}
          </p>
          <p className="text-sm text-blue-800">Hôm nay</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {data.weekSessions || 0}
          </p>
          <p className="text-sm text-green-800">Tuần này</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">
            {data.monthSessions || 0}
          </p>
          <p className="text-sm text-purple-800">Tháng này</p>
        </div>
      </div>
    </div>
  </div>
);

// Evaluation Statistics Component
const EvaluationStats = ({ data, formatPercentage }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Thống kê đánh giá
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Theo loại đánh giá
          </h4>
          <div className="space-y-2">
            {Object.entries(data.typeCounts || {}).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{type}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Tỷ lệ hoàn thành
          </h4>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {formatPercentage(data.completionRate)}
            </p>
            <p className="text-sm text-gray-600">
              Tổng số: {data.totalEvaluations || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Score Statistics Component
const ScoreStats = ({ data, formatPercentage }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Thống kê điểm số
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Điểm trung bình
          </h4>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {data.overallAverage?.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-gray-600">Tổng thể</p>
          </div>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Tỷ lệ đạt</h4>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {formatPercentage(data.passRate)}
            </p>
            <p className="text-sm text-gray-600">Điểm &gt;= 5.0</p>
          </div>
        </div>
      </div>
    </div>

    {/* Score Distribution */}
    {data.scoreDistribution && (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Phân bố điểm</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(data.scoreDistribution).map(([range, count]) => (
            <div key={range} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600">{range}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default StatisticsDashboard;
