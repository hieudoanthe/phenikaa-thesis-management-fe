import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { statisticsService } from "../../services/statistics.service";
import registrationPeriodService from "../../services/registrationPeriod.service";
import { showToast } from "../../utils/toastHelper";

const StatisticsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [periodStats, setPeriodStats] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [activeTab, setActiveTab] = useState("overview");

  // Tránh gọi API 2 lần trong React StrictMode (dev)
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    loadStatistics();
    loadPeriods();
  }, []);

  const loadStatistics = async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      const data = await statisticsService.getUserStatistics();
      setStatistics(data);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu thống kê", "error");
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriods = async () => {
    try {
      const response = await registrationPeriodService.getAllPeriods();

      console.log("Periods response:", response); // Debug log

      if (response.success && response.data) {
        console.log("Periods data:", response.data); // Debug log
        setPeriods(response.data);

        // Load student count for each period
        const periodStatsData = {};
        for (const period of response.data) {
          console.log("Processing period:", period); // Debug log
          try {
            const studentCount =
              await statisticsService.getStudentCountByPeriod(period.periodId);
            periodStatsData[period.periodId] = studentCount;
          } catch (error) {
            console.error(
              `Error loading student count for period ${period.periodId}:`,
              error
            );
            periodStatsData[period.periodId] = 0;
          }
        }
        setPeriodStats(periodStatsData);
      } else {
        console.error("Failed to load periods:", response.message);
        showToast(
          response.message || "Lỗi khi tải danh sách đợt đăng ký",
          "error"
        );
      }
    } catch (error) {
      showToast("Lỗi khi tải danh sách đợt đăng ký", "error");
      console.error("Error loading periods:", error);
    }
  };

  const handleDateRangeChange = () => {
    const startDate = dateRange.startDate || null;
    const endDate = dateRange.endDate || null;
    loadStatistics(startDate, endDate);
  };

  // Load specific statistics for each tab - Only user statistics available
  const loadDefenseStats = async () => {
    // Return empty data since defense stats are not available in InternalStatisticsController
    return {
      totalDefenses: 0,
      completedDefenses: 0,
      scheduledDefenses: 0,
    };
  };

  const loadEvaluationStats = async () => {
    // Return empty data since evaluation stats are not available in InternalStatisticsController
    return {
      evaluationsByStatus: {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      },
      averageScore: 0,
      completionRate: 0,
      totalEvaluators: 0,
    };
  };

  const loadScoreStats = async () => {
    // Return empty data since score stats are not available in InternalStatisticsController
    return {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
      scoreDistribution: {},
      totalScores: 0,
      excellentScores: 0,
      goodScores: 0,
      poorScores: 0,
    };
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
      <div className="w-full bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p>Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="w-full">
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bộ lọc thời gian
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="w-full">
              <label
                htmlFor="stat-start-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Từ ngày
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                id="stat-start-date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full">
              <label
                htmlFor="stat-end-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Đến ngày
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                id="stat-end-date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleDateRangeChange}
                className="w-full sm:w-auto px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-4 sm:gap-6">
              {[
                {
                  key: "overview",
                  label: "Tổng quan",
                  icon: (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-gray-500"
                    >
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                    </svg>
                  ),
                },
                {
                  key: "periods",
                  label: "Đợt đăng ký",
                  icon: (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-gray-500"
                    >
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
                  ),
                },
                {
                  key: "defenses",
                  label: "Buổi bảo vệ",
                  icon: (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-gray-500"
                    >
                      <path d="M3 4h18v2H3V4zm2 4h14v12H5V8zm4 3h2v6H9v-6zm4 0h2v6h-2v-6z" />
                    </svg>
                  ),
                },
                {
                  key: "evaluations",
                  label: "Đánh giá",
                  icon: (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-gray-500"
                    >
                      <path d="M3 5h18v2H3V5zm0 4h12v2H3V9zm0 4h18v2H3v-2zm0 4h12v2H3v-2z" />
                    </svg>
                  ),
                },
                {
                  key: "scores",
                  label: "Điểm số",
                  icon: (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-gray-500"
                    >
                      <path d="M12 17.27 18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ),
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.key
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`${
                      activeTab === tab.key
                        ? "text-primary-600"
                        : "text-gray-500"
                    }`}
                  >
                    {tab.icon}
                  </span>
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

        {activeTab === "periods" && (
          <PeriodStats
            periods={periods}
            periodStats={periodStats}
            formatNumber={formatNumber}
            formatPercentage={formatPercentage}
            navigate={navigate}
          />
        )}

        {activeTab === "defenses" && statistics && (
          <DefenseStats
            data={statistics}
            formatNumber={formatNumber}
            loadDefenseStats={loadDefenseStats}
          />
        )}

        {activeTab === "evaluations" && statistics && (
          <EvaluationStats
            data={statistics}
            formatNumber={formatNumber}
            formatPercentage={formatPercentage}
            loadEvaluationStats={loadEvaluationStats}
          />
        )}

        {activeTab === "scores" && statistics && (
          <ScoreStats
            data={statistics}
            formatNumber={formatNumber}
            formatPercentage={formatPercentage}
            loadScoreStats={loadScoreStats}
          />
        )}
      </div>
    </div>
  );
};

// Overview Statistics Component
const OverviewStats = ({ data, formatNumber, formatPercentage }) => (
  <div className="space-y-6">
    {/* Key Metrics - Only User Statistics Available */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-blue-600"
              >
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
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

      <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-green-600"
              >
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 13L3.74 11 12 6.82 20.26 11 12 16zm-6 2h12v2H6z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng sinh viên</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(data.students || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-purple-600"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng giảng viên</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(data.teachers || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-yellow-600"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">
              Người dùng hoạt động hôm nay
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatNumber(data.activeUsersToday || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

OverviewStats.propTypes = {
  data: PropTypes.object,
  formatNumber: PropTypes.func.isRequired,
  formatPercentage: PropTypes.func.isRequired,
};

// Defense Statistics Component
const DefenseStats = ({ data, formatNumber, loadDefenseStats }) => {
  const [defenseData, setDefenseData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await loadDefenseStats();
        setDefenseData(result);
      } catch (error) {
        console.error("Error loading defense data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadDefenseStats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Thống kê buổi bảo vệ
          </h3>
          <p className="text-gray-500 mb-4">
            API thống kê buổi bảo vệ không có sẵn trong
            InternalStatisticsController
          </p>
          <p className="text-sm text-gray-400">
            Chỉ có thể xem thống kê người dùng từ user-service
          </p>
        </div>
      </div>
    </div>
  );
};

DefenseStats.propTypes = {
  data: PropTypes.object,
  formatNumber: PropTypes.func.isRequired,
  loadDefenseStats: PropTypes.func.isRequired,
};

// Evaluation Statistics Component
const EvaluationStats = ({
  data,
  formatNumber,
  formatPercentage,
  loadEvaluationStats,
}) => {
  const [evaluationData, setEvaluationData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await loadEvaluationStats();
        setEvaluationData(result);
      } catch (error) {
        console.error("Error loading evaluation data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadEvaluationStats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Thống kê đánh giá
          </h3>
          <p className="text-gray-500 mb-4">
            API thống kê đánh giá không có sẵn trong
            InternalStatisticsController
          </p>
          <p className="text-sm text-gray-400">
            Chỉ có thể xem thống kê người dùng từ user-service
          </p>
        </div>
      </div>
    </div>
  );
};

EvaluationStats.propTypes = {
  data: PropTypes.object,
  formatNumber: PropTypes.func.isRequired,
  formatPercentage: PropTypes.func.isRequired,
  loadEvaluationStats: PropTypes.func.isRequired,
};

// Score Statistics Component
const ScoreStats = ({
  data,
  formatNumber,
  formatPercentage,
  loadScoreStats,
}) => {
  const [scoreData, setScoreData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await loadScoreStats();
        setScoreData(result);
      } catch (error) {
        console.error("Error loading score data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadScoreStats]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Thống kê điểm số
          </h3>
          <p className="text-gray-500 mb-4">
            API thống kê điểm số không có sẵn trong InternalStatisticsController
          </p>
          <p className="text-sm text-gray-400">
            Chỉ có thể xem thống kê người dùng từ user-service
          </p>
        </div>
      </div>
    </div>
  );
};

ScoreStats.propTypes = {
  data: PropTypes.object,
  formatNumber: PropTypes.func.isRequired,
  formatPercentage: PropTypes.func.isRequired,
  loadScoreStats: PropTypes.func.isRequired,
};

// Period Statistics Component
const PeriodStats = ({
  periods,
  periodStats,
  formatNumber,
  formatPercentage,
  navigate,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periodStatistics, setPeriodStatistics] = useState(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);

  const totalStudents = Object.values(periodStats).reduce(
    (sum, count) => sum + count,
    0
  );

  // Load statistics for selected period
  const loadPeriodStatistics = async (periodId) => {
    if (!periodId) {
      setPeriodStatistics(null);
      return;
    }

    setLoadingStatistics(true);
    try {
      const summary = await statisticsService.getPeriodStatisticsSummary(
        periodId
      );
      setPeriodStatistics(summary);
    } catch (error) {
      console.error("Error loading period statistics:", error);
      setPeriodStatistics(null);
    } finally {
      setLoadingStatistics(false);
    }
  };

  // Handle period selection change
  const handlePeriodChange = (selectedOption) => {
    setSelectedPeriod(selectedOption);
    if (selectedOption) {
      loadPeriodStatistics(selectedOption.value);
    } else {
      setPeriodStatistics(null);
    }
  };

  // Helper function to get period status text
  const getPeriodStatusText = (status) => {
    switch (status) {
      case "ACTIVE":
        return "(Đang mở)";
      case "CLOSED":
        return "(Đã đóng)";
      case "UPCOMING":
        return "(Sắp diễn ra)";
      case "CANCELLED":
        return "(Đã hủy)";
      default:
        return "";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      case "CLOSED":
        return "bg-red-100 text-red-800";
      case "UPCOMING":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Đang mở";
      case "CANCELLED":
        return "Đã hủy";
      case "CLOSED":
        return "Đã đóng";
      case "UPCOMING":
        return "Sắp diễn ra";
      default:
        return "Không xác định";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return "N/A";

    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "Đã kết thúc";
    } else if (diffDays === 0) {
      return "Hôm nay kết thúc";
    } else if (diffDays === 1) {
      return "1 ngày";
    } else {
      return `${diffDays} ngày`;
    }
  };

  const getDaysRemainingColor = (endDate) => {
    if (!endDate) return "text-gray-500";

    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "text-red-600"; // Đã kết thúc
    } else if (diffDays <= 3) {
      return "text-orange-600"; // Sắp kết thúc
    } else if (diffDays <= 7) {
      return "text-yellow-600"; // Còn ít ngày
    } else {
      return "text-green-600"; // Còn nhiều ngày
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Total Periods Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border border-blue-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700 mb-1">
                Tổng đợt đăng ký
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {formatNumber(periods.length)}
              </p>
              <p className="text-xs text-blue-600">đợt trong hệ thống</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-blue-600">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Tất cả đợt đăng ký
          </div>
        </div>

        {/* Total Students Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm border border-green-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 mb-1">
                Tổng sinh viên
              </p>
              <p className="text-2xl font-bold text-green-900">
                {formatNumber(totalStudents)}
              </p>
              <p className="text-xs text-green-600">sinh viên tham gia</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-green-600">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Đã đăng ký trong các đợt
          </div>
        </div>

        {/* Active Periods Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm border border-purple-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-700 mb-1">
                Đợt đang mở
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {formatNumber(
                  periods.filter((p) => p.status === "ACTIVE").length
                )}
              </p>
              <p className="text-xs text-purple-600">đợt hiện tại</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-purple-600">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Có thể đăng ký ngay
          </div>
        </div>
      </div>

      {/* Period Selection Dropdown */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Chọn đợt đăng ký
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select
              value={selectedPeriod}
              onChange={handlePeriodChange}
              options={periods.map((period) => {
                const periodName =
                  period.periodName || `Đợt ${period.periodId}`;
                const statusText = getPeriodStatusText(period.status);
                return {
                  value: period.periodId,
                  label: `${periodName} ${statusText}`,
                  period: period,
                };
              })}
              placeholder="-- Chọn đợt đăng ký --"
              isClearable
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                  boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
                  "&:hover": {
                    borderColor: "#3b82f6",
                  },
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isSelected
                    ? "#3b82f6"
                    : state.isFocused
                    ? "#dbeafe"
                    : "white",
                  color: state.isSelected ? "white" : "#374151",
                  "&:hover": {
                    backgroundColor: state.isSelected ? "#3b82f6" : "#dbeafe",
                  },
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: "#374151",
                }),
              }}
            />
          </div>
        </div>
      </div>

      {/* Period Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedPeriod
              ? `Chi tiết đợt: ${selectedPeriod.label}`
              : "Đợt đăng ký gần đây"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {selectedPeriod
              ? "Thống kê chi tiết về đề xuất và đăng ký đề tài"
              : "Hiển thị tối đa 3 đợt gần đây nhất"}
          </p>
        </div>
        {selectedPeriod ? (
          <div className="p-4 sm:p-6">
            {loadingStatistics ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            ) : periodStatistics ? (
              <div className="space-y-6">
                {/* Thống kê tổng quan sinh viên */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
                  {/* Tổng sinh viên trong đợt */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 md:p-6 border border-green-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center mb-3 sm:mb-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 md:w-6 md:h-6 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3 md:ml-4">
                          <h4 className="text-base md:text-lg font-medium text-green-900">
                            Tổng sinh viên trong đợt
                          </h4>
                          <p className="text-xs md:text-sm text-green-600">
                            Tất cả sinh viên được phân vào đợt này
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-2xl md:text-3xl font-bold text-green-900">
                          {formatNumber(periodStats[selectedPeriod.value] || 0)}
                        </p>
                        <p className="text-xs md:text-sm text-green-600">
                          sinh viên
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sinh viên tham gia hoạt động */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 md:p-6 border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center mb-3 sm:mb-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 md:w-6 md:h-6 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3 md:ml-4">
                          <h4 className="text-base md:text-lg font-medium text-blue-900">
                            Sinh viên tham gia
                          </h4>
                          <p className="text-xs md:text-sm text-blue-600">
                            Đã đề xuất hoặc đăng ký đề tài
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-2xl md:text-3xl font-bold text-blue-900">
                          {formatNumber(
                            periodStatistics.totalUniqueStudents || 0
                          )}
                        </p>
                        <p className="text-xs md:text-sm text-blue-600">
                          sinh viên
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sinh viên chưa hoàn thành đăng ký */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 md:p-6 border border-orange-200 hover:shadow-md transition-shadow duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center mb-3 sm:mb-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 md:w-6 md:h-6 text-orange-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3 md:ml-4">
                          <h4 className="text-base md:text-lg font-medium text-orange-900">
                            Chưa hoàn thành
                          </h4>
                          <p className="text-xs md:text-sm text-orange-600">
                            Sinh viên chưa hoàn thành đăng ký đề tài
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-2xl md:text-3xl font-bold text-orange-900">
                          {formatNumber(
                            Math.max(
                              0,
                              (periodStats[selectedPeriod.value] || 0) -
                                (periodStatistics.totalUniqueStudents || 0)
                            )
                          )}
                        </p>
                        <p className="text-xs md:text-sm text-orange-600">
                          sinh viên
                        </p>
                      </div>
                    </div>

                    {/* Link to Registration Period Management */}
                    <div className="mt-4 pt-3 border-t border-orange-200">
                      <button
                        onClick={() => navigate("/admin/registration-period")}
                        className="inline-flex items-center text-xs font-medium text-orange-700 hover:text-orange-800 transition-colors duration-200"
                      >
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Xem chi tiết trong Quản lý đợt đăng ký
                      </button>
                    </div>
                  </div>
                </div>
                {/* Registration Statistics */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Thống kê đăng ký đề tài
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">
                            Tổng đăng ký
                          </p>
                          <p className="text-2xl font-bold text-blue-900">
                            {formatNumber(periodStatistics.totalRegistrations)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">
                            Đã duyệt
                          </p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatNumber(
                              periodStatistics.approvedRegistrations
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-yellow-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-600">
                            Chờ duyệt
                          </p>
                          <p className="text-2xl font-bold text-yellow-900">
                            {formatNumber(
                              periodStatistics.pendingRegistrations
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-red-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-600">
                            Bị từ chối
                          </p>
                          <p className="text-2xl font-bold text-red-900">
                            {formatNumber(
                              periodStatistics.rejectedRegistrations
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggestion Statistics */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Thống kê đề xuất đề tài
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-purple-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-600">
                            Tổng đề xuất
                          </p>
                          <p className="text-2xl font-bold text-purple-900">
                            {formatNumber(periodStatistics.totalSuggestions)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">
                            Đã duyệt
                          </p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatNumber(periodStatistics.approvedSuggestions)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-yellow-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-600">
                            Chờ duyệt
                          </p>
                          <p className="text-2xl font-bold text-yellow-900">
                            {formatNumber(periodStatistics.pendingSuggestions)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-red-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-600">
                            Bị từ chối
                          </p>
                          <p className="text-2xl font-bold text-red-900">
                            {formatNumber(periodStatistics.rejectedSuggestions)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">Không có dữ liệu thống kê</div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên đợt
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày bắt đầu
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày kết thúc
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số sinh viên
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày còn lại
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {periods
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt || b.startDate) -
                        new Date(a.createdAt || a.startDate)
                    )
                    .slice(0, 3)
                    .map((period) => {
                      const studentCount = periodStats[period.periodId] || 0;

                      return (
                        <tr key={period.periodId} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {period.periodName || `Đợt ${period.periodId}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {period.periodId}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                period.status
                              )}`}
                            >
                              {getStatusText(period.status)}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(period.startDate)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(period.endDate)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className="font-medium">
                                {formatNumber(studentCount)}
                              </span>
                              <span className="ml-2 text-gray-500">
                                sinh viên
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span
                                className={`font-medium ${getDaysRemainingColor(
                                  period.endDate
                                )}`}
                              >
                                {getDaysRemaining(period.endDate)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {periods
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || b.startDate) -
                    new Date(a.createdAt || a.startDate)
                )
                .slice(0, 3)
                .map((period) => {
                  const studentCount = periodStats[period.periodId] || 0;

                  return (
                    <div
                      key={period.periodId}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {period.periodName || `Đợt ${period.periodId}`}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ID: {period.periodId}
                          </p>
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            period.status
                          )}`}
                        >
                          {getStatusText(period.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Ngày bắt đầu
                          </p>
                          <p className="text-sm text-gray-900">
                            {formatDate(period.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Ngày kết thúc
                          </p>
                          <p className="text-sm text-gray-900">
                            {formatDate(period.endDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatNumber(studentCount)} sinh viên
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Ngày còn lại
                          </p>
                          <p
                            className={`text-sm font-medium ${getDaysRemainingColor(
                              period.endDate
                            )}`}
                          >
                            {getDaysRemaining(period.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {!selectedPeriod && periods.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có đợt đăng ký nào
            </h3>
            <p className="text-gray-500">
              Chưa có đợt đăng ký nào được tạo trong hệ thống.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

PeriodStats.propTypes = {
  periods: PropTypes.array.isRequired,
  periodStats: PropTypes.object.isRequired,
  formatNumber: PropTypes.func.isRequired,
  formatPercentage: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
};

export default StatisticsDashboard;
