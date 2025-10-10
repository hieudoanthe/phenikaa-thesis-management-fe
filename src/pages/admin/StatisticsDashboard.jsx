import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { statisticsService } from "../../services/statistics.service";
import registrationPeriodService from "../../services/registrationPeriod.service";
import { showToast } from "../../utils/toastHelper";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PieChart, Pie, Cell } from "recharts";

const StatisticsDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [periodStats, setPeriodStats] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [registrationsSeries, setRegistrationsSeries] = useState([]);
  const [suggestionsSeries, setSuggestionsSeries] = useState([]);
  const [combinedSeries, setCombinedSeries] = useState([]);
  const [totalSeries, setTotalSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);

  const didFetchRef = useRef(false);
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    // set default to last 30 days in inputs
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - 29);
    const toISO = (d) => new Date(d).toISOString().slice(0, 10);
    setDateRange({ startDate: toISO(start), endDate: toISO(end) });

    loadStatistics();
    loadPeriods();
    setSeriesLoading(true);
    Promise.all([
      loadRegistrationsSeries(toISO(start), toISO(end)),
      loadSuggestionsSeries(toISO(start), toISO(end)),
    ]).finally(() => setSeriesLoading(false));
  }, []);

  const loadStatistics = async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      const data = await statisticsService.getUserStatistics();
      setStatistics(data);
    } catch (error) {
      showToast(t("admin.statistics.errorLoadingData"), "error");
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Safe stub loaders for other tabs to avoid runtime errors if backends are not ready
  const loadDefenseStats = async () => {
    return {
      totalDefenses: 0,
      completedDefenses: 0,
      scheduledDefenses: 0,
    };
  };

  const loadEvaluationStats = async () => {
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

  // Recompute merged + total when either series changes
  useEffect(() => {
    const merged = mergeSeries(registrationsSeries, suggestionsSeries);
    setCombinedSeries(merged);
    setTotalSeries(
      merged.map((d) => ({
        date: d.date,
        count: (d.registrations || 0) + (d.suggestions || 0),
      }))
    );
  }, [registrationsSeries, suggestionsSeries]);

  const loadPeriods = async () => {
    try {
      const response = await registrationPeriodService.getAllPeriods();

      if (response.success && response.data) {
        setPeriods(response.data);

        const periodStatsData = {};
        for (const period of response.data) {
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
          response.message || t("admin.statistics.errorLoadingPeriods"),
          "error"
        );
      }
    } catch (error) {
      showToast(t("admin.statistics.errorLoadingPeriods"), "error");
      console.error("Error loading periods:", error);
    }
  };

  const handleDateRangeChange = async () => {
    const startDate = dateRange.startDate || null;
    const endDate = dateRange.endDate || null;
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      showToast(t("admin.statistics.invalidDateRange"), "error");
      return;
    }
    setSeriesLoading(true);
    try {
      await Promise.all([
        loadRegistrationsSeries(startDate, endDate),
        loadSuggestionsSeries(startDate, endDate),
      ]);
    } finally {
      setSeriesLoading(false);
    }
  };

  const toInstantString = (dateStr, isEnd) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      if (isEnd) {
        d.setHours(23, 59, 59, 999);
      }
      return d.toISOString();
    } catch (e) {
      return null;
    }
  };

  // Helpers for quick date presets
  const toISO = (d) => new Date(d).toISOString().slice(0, 10);
  const applyRange = async (start, end) => {
    setDateRange({ startDate: start, endDate: end });
    setSeriesLoading(true);
    try {
      await Promise.all([
        loadRegistrationsSeries(start, end),
        loadSuggestionsSeries(start, end),
      ]);
    } finally {
      setSeriesLoading(false);
    }
  };
  const setQuickRangeDays = async (days) => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);
    await applyRange(toISO(start), toISO(end));
  };
  // Removed preset: This month (30-day preset is sufficient)

  const mergeSeries = (regs, sugs) => {
    const map = new Map();
    regs.forEach((p) => {
      map.set(p.date, { date: p.date, registrations: p.count, suggestions: 0 });
    });
    sugs.forEach((p) => {
      const existing = map.get(p.date);
      if (existing) {
        existing.suggestions = p.count;
      } else {
        map.set(p.date, {
          date: p.date,
          registrations: 0,
          suggestions: p.count,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0
    );
  };

  const loadRegistrationsSeries = async (startDate = null, endDate = null) => {
    try {
      const startInstant = toInstantString(startDate, false);
      const endInstant = toInstantString(endDate, true);
      const series = await statisticsService.getRegistrationsTimeSeries({
        start: startInstant,
        end: endInstant,
      });
      const regs = Array.isArray(series) ? series : [];
      setRegistrationsSeries(regs);
    } catch (error) {
      console.error("Error loading registrations time series:", error);
      setRegistrationsSeries([]);
    }
  };

  const loadSuggestionsSeries = async (startDate = null, endDate = null) => {
    try {
      const startInstant = toInstantString(startDate, false);
      const endInstant = toInstantString(endDate, true);
      const series = await statisticsService.getSuggestionsTimeSeries({
        start: startInstant,
        end: endInstant,
      });
      const sugs = Array.isArray(series) ? series : [];
      setSuggestionsSeries(sugs);
    } catch (error) {
      console.error("Error loading suggestions time series:", error);
      setSuggestionsSeries([]);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toLocaleString("vi-VN");
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return "0%";
    return `${num.toFixed(1)}%`;
  };

  const TotalTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0];
      const value = point && point.value ? point.value : 0;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2">
          <div className="text-sm font-medium text-gray-900 mb-1">{`${t(
            "admin.statistics.overviewStats.dayPrefix"
          )} ${label}`}</div>
          <div className="text-sm text-blue-600">
            Tổng: {formatNumber(value)}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p>{t("admin.statistics.loadingData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="w-full">
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {t("admin.statistics.timeFilter.title")}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setQuickRangeDays(7)}
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-gray-300 hover:border-blue-500 hover:text-blue-600"
                >
                  {t("admin.statistics.timeFilter.quickFilters.days7")}
                </button>
                <button
                  onClick={() => setQuickRangeDays(14)}
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-gray-300 hover:border-blue-500 hover:text-blue-600"
                >
                  {t("admin.statistics.timeFilter.quickFilters.days14")}
                </button>
                <button
                  onClick={() => setQuickRangeDays(30)}
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-gray-300 hover:border-blue-500 hover:text-blue-600"
                >
                  {t("admin.statistics.timeFilter.quickFilters.days30")}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="w-full lg:col-span-2">
                <label
                  htmlFor="stat-start-date"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  {t("admin.statistics.timeFilter.fromDate")}
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
              <div className="w-full lg:col-span-2">
                <label
                  htmlFor="stat-end-date"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  {t("admin.statistics.timeFilter.toDate")}
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
              <div className="flex items-end lg:col-span-1">
                <button
                  onClick={handleDateRangeChange}
                  disabled={seriesLoading}
                  className={`inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md transition-colors ${
                    seriesLoading
                      ? "bg-primary-300 cursor-not-allowed"
                      : "bg-primary-500 hover:bg-primary-600 text-white"
                  }`}
                >
                  {seriesLoading
                    ? t("admin.statistics.applying")
                    : t("admin.statistics.apply")}
                </button>
              </div>
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
                  label: t("admin.statistics.overview"),
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
                  label: t("admin.statistics.registrationPeriods"),
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
                  label: t("admin.statistics.defenseSessions"),
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
                  label: t("admin.statistics.evaluations"),
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
                  label: t("admin.statistics.grades"),
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
            totalsInRange={{
              registrations: registrationsSeries.reduce(
                (s, p) => s + (p?.count || 0),
                0
              ),
              suggestions: suggestionsSeries.reduce(
                (s, p) => s + (p?.count || 0),
                0
              ),
              combined: combinedSeries.reduce((s, p) => s + (p?.count || 0), 0),
            }}
            totalSeries={totalSeries}
            t={t}
          />
        )}

        {activeTab === "periods" && (
          <PeriodStats
            periods={periods}
            periodStats={periodStats}
            formatNumber={formatNumber}
            formatPercentage={formatPercentage}
            navigate={navigate}
            t={t}
          />
        )}

        {activeTab === "defenses" && statistics && (
          <DefenseStats
            data={statistics}
            formatNumber={formatNumber}
            loadDefenseStats={loadDefenseStats}
            t={t}
          />
        )}

        {activeTab === "evaluations" && statistics && (
          <EvaluationStats
            data={statistics}
            formatNumber={formatNumber}
            formatPercentage={formatPercentage}
            loadEvaluationStats={loadEvaluationStats}
            t={t}
          />
        )}

        {activeTab === "scores" && statistics && (
          <ScoreStats
            data={statistics}
            formatNumber={formatNumber}
            formatPercentage={formatPercentage}
            loadScoreStats={loadScoreStats}
            t={t}
          />
        )}
      </div>
    </div>
  );
};

// Overview Statistics Component
const OverviewStats = ({
  data,
  formatNumber,
  formatPercentage,
  totalSeries,
  totalsInRange,
  t,
}) => {
  const TotalTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0]?.value || 0;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2">
          <div className="text-sm font-medium text-gray-900 mb-1">{`${t(
            "admin.statistics.overview"
          )} ${label}`}</div>
          <div className="text-sm text-blue-600">
            {t("admin.statistics.totalRegistrations")}: {formatNumber(value)}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderLegend = () => (
    <div className="flex justify-end pr-2">
      <div className="text-xs flex items-center gap-2 text-gray-700">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: "#2563eb" }}
        ></span>
        <span>{t("admin.statistics.totalRegistrations")}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics - reflect date-range where meaningful */}
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
              <p className="text-sm font-medium text-gray-500">
                {t("admin.statistics.overviewStats.totalUsers")}
              </p>
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
              <p className="text-sm font-medium text-gray-500">
                {t("admin.statistics.metrics.totalStudents")}
              </p>
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
              <p className="text-sm font-medium text-gray-500">
                {t("admin.statistics.overviewStats.totalTeachers")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(data.teachers || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations Time Series */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {t("admin.statistics.overviewStats.chartTitle")}
          </h3>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={totalSeries}
              margin={{ top: 6, right: 16, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                allowDecimals={false}
                width={36}
              />
              <Tooltip content={<TotalTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                content={renderLegend}
              />
              <Area
                type="monotone"
                dataKey="count"
                name={t("admin.statistics.totalRegistrations")}
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="count"
                name=""
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 0 }}
                connectNulls
                strokeLinecap="round"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

OverviewStats.propTypes = {
  data: PropTypes.object,
  formatNumber: PropTypes.func.isRequired,
  formatPercentage: PropTypes.func.isRequired,
  totalSeries: PropTypes.array,
  totalsInRange: PropTypes.object,
  t: PropTypes.func.isRequired,
};

// Defense Statistics Component
const DefenseStats = ({ data, formatNumber, loadDefenseStats, t }) => {
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
        <p className="ml-4 text-gray-600">
          {t("admin.statistics.periodStats.loadingData")}
        </p>
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
            {t("admin.statistics.defenseStats.title")}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("admin.statistics.defenseStats.notAvailable")}
          </p>
          <p className="text-sm text-gray-400">
            {t("admin.statistics.defenseStats.onlyUserStats")}
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
  t: PropTypes.func.isRequired,
};

// Evaluation Statistics Component
const EvaluationStats = ({
  data,
  formatNumber,
  formatPercentage,
  loadEvaluationStats,
  t,
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
        <p className="ml-4 text-gray-600">
          {t("admin.statistics.periodStats.loadingData")}
        </p>
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
            {t("admin.statistics.evaluationStats.title")}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("admin.statistics.evaluationStats.notAvailable")}
          </p>
          <p className="text-sm text-gray-400">
            {t("admin.statistics.evaluationStats.onlyUserStats")}
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
  t: PropTypes.func.isRequired,
};

// Score Statistics Component
const ScoreStats = ({
  data,
  formatNumber,
  formatPercentage,
  loadScoreStats,
  t,
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
        <p className="ml-4 text-gray-600">
          {t("admin.statistics.periodStats.loadingData")}
        </p>
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
            {t("admin.statistics.scoreStats.title")}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("admin.statistics.scoreStats.notAvailable")}
          </p>
          <p className="text-sm text-gray-400">
            {t("admin.statistics.scoreStats.onlyUserStats")}
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
  t: PropTypes.func.isRequired,
};

// Period Statistics Component
const PeriodStats = ({
  periods,
  periodStats,
  formatNumber,
  formatPercentage,
  navigate,
  t,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periodStatistics, setPeriodStatistics] = useState(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);

  const totalStudents = Object.values(periodStats).reduce(
    (sum, count) => sum + count,
    0
  );

  // Helper functions for status text and colors
  const getPeriodStatusText = (status) => {
    switch (status) {
      case "ACTIVE":
        return `(${t("admin.statistics.status.open")})`;
      case "CLOSED":
        return `(${t("admin.statistics.status.closed")})`;
      case "UPCOMING":
        return `(${t("admin.statistics.status.upcoming")})`;
      case "CANCELLED":
        return `(${t("admin.statistics.status.cancelled")})`;
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
        return t("admin.statistics.status.open");
      case "CANCELLED":
        return t("admin.statistics.status.cancelled");
      case "CLOSED":
        return t("admin.statistics.status.closed");
      case "UPCOMING":
        return t("admin.statistics.status.upcoming");
      default:
        return t("admin.statistics.status.unknown");
    }
  };

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
      return t("admin.statistics.status.ended");
    } else if (diffDays === 0) {
      return t("admin.statistics.status.endsToday");
    } else if (diffDays === 1) {
      return t("admin.statistics.status.oneDay");
    } else {
      return t("admin.statistics.status.daysLeft", { count: diffDays });
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
                {t("admin.statistics.periodStats.totalPeriods")}
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {formatNumber(periods.length)}
              </p>
              <p className="text-xs text-blue-600">
                {t("admin.statistics.periodStats.labels.periods")}
              </p>
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
            {t("admin.statistics.periodStats.labels.allPeriods")}
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
                {t("admin.statistics.periodStats.totalStudents")}
              </p>
              <p className="text-2xl font-bold text-green-900">
                {formatNumber(totalStudents)}
              </p>
              <p className="text-xs text-green-600">
                {t("admin.statistics.periodStats.labels.studentsParticipated")}
              </p>
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
            {t("admin.statistics.periodStats.labels.registeredInPeriods")}
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
                {t("admin.statistics.periodStats.activePeriods")}
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {formatNumber(
                  periods.filter((p) => p.status === "ACTIVE").length
                )}
              </p>
              <p className="text-xs text-purple-600">
                {t("admin.statistics.periodStats.labels.activePeriodsCount")}
              </p>
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
            {t("admin.statistics.periodStats.labels.canRegisterNow")}
          </div>
        </div>
      </div>

      {/* Period Selection Dropdown */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("admin.statistics.periodStats.selectPeriod")}
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
              placeholder={t(
                "admin.statistics.periodStats.selectPeriodPlaceholder"
              )}
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
              ? `${t("admin.statistics.periodStats.periodDetails")}: ${
                  selectedPeriod.label
                }`
              : t("admin.statistics.periodStats.recentPeriods")}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {selectedPeriod
              ? t("admin.statistics.periodStats.periodDetailsDesc")
              : t("admin.statistics.periodStats.recentPeriodsDesc")}
          </p>
        </div>
        {selectedPeriod ? (
          <div className="p-4 sm:p-6">
            {loadingStatistics ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  {t("admin.statistics.periodStats.loadingData")}
                </span>
              </div>
            ) : periodStatistics ? (
              <div className="space-y-6">
                {/* Donut: tổng (đăng ký + đề xuất) theo trạng thái */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-base font-medium text-gray-900 mb-3">
                    {t("admin.statistics.periodStats.pieChart.title")}
                  </h4>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          dataKey="value"
                          data={[
                            {
                              name: t(
                                "admin.statistics.periodStats.pieChart.approved"
                              ),
                              value:
                                (periodStatistics.approvedRegistrations || 0) +
                                (periodStatistics.approvedSuggestions || 0),
                            },
                            {
                              name: t(
                                "admin.statistics.periodStats.pieChart.pending"
                              ),
                              value:
                                (periodStatistics.pendingRegistrations || 0) +
                                (periodStatistics.pendingSuggestions || 0),
                            },
                            {
                              name: t(
                                "admin.statistics.periodStats.pieChart.rejected"
                              ),
                              value:
                                (periodStatistics.rejectedRegistrations || 0) +
                                (periodStatistics.rejectedSuggestions || 0),
                            },
                          ]}
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={2}
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(v, n) => [
                            v?.toLocaleString?.("vi-VN") ?? v,
                            n,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

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
                            {t(
                              "admin.statistics.periodStats.cards.totalInPeriod"
                            )}
                          </h4>
                          <p className="text-xs md:text-sm text-green-600">
                            {t(
                              "admin.statistics.periodStats.cards.totalInPeriodDesc"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-2xl md:text-3xl font-bold text-green-900">
                          {formatNumber(periodStats[selectedPeriod.value] || 0)}
                        </p>
                        <p className="text-xs md:text-sm text-green-600">
                          {t("admin.statistics.periodStats.labels.students")}
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
                            {t(
                              "admin.statistics.periodStats.cards.studentsParticipated"
                            )}
                          </h4>
                          <p className="text-xs md:text-sm text-blue-600">
                            {t(
                              "admin.statistics.periodStats.cards.studentsParticipatedDesc"
                            )}
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
                          {t("admin.statistics.periodStats.labels.students")}
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
                            {t(
                              "admin.statistics.periodStats.cards.notCompleted"
                            )}
                          </h4>
                          <p className="text-xs md:text-sm text-orange-600">
                            {t(
                              "admin.statistics.periodStats.cards.notCompletedDesc"
                            )}
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
                          {t("admin.statistics.periodStats.labels.students")}
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
                        {t("admin.statistics.periodStats.cards.viewDetails")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  {t("admin.statistics.periodStats.noData")}
                </div>
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
                      {t(
                        "admin.statistics.periodStats.tableHeaders.periodName"
                      )}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("admin.statistics.periodStats.tableHeaders.status")}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("admin.statistics.periodStats.tableHeaders.startDate")}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("admin.statistics.periodStats.tableHeaders.endDate")}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t(
                        "admin.statistics.periodStats.tableHeaders.studentCount"
                      )}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t(
                        "admin.statistics.periodStats.tableHeaders.daysRemaining"
                      )}
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
                                {t(
                                  "admin.statistics.periodStats.labels.students"
                                )}
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
              {t("admin.statistics.periodStats.noPeriods")}
            </h3>
            <p className="text-gray-500">
              {t("admin.statistics.periodStats.noPeriodsDesc")}
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
  t: PropTypes.func.isRequired,
};

export default StatisticsDashboard;
