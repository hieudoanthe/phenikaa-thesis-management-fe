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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    overview: null,
    defenses: null,
    evaluations: null,
    scores: null,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await statisticsService.getAdminStatistics();
      setStatistics({ overview: data });
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu thống kê", "error");
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return "0%";
    return `${num.toFixed(1)}%`;
  };

  // Dữ liệu cho biểu đồ trạng thái buổi bảo vệ
  const defenseStatusData = statistics.overview?.defenseSessionsByStatus
    ? Object.entries(statistics.overview.defenseSessionsByStatus).map(
        ([status, count]) => ({
          name:
            status === "SCHEDULED"
              ? "Đã lên lịch"
              : status === "IN_PROGRESS"
              ? "Đang diễn ra"
              : status === "COMPLETED"
              ? "Đã hoàn thành"
              : status === "CANCELLED"
              ? "Đã hủy"
              : status,
          value: count || 0,
          color:
            status === "SCHEDULED"
              ? "#3B82F6"
              : status === "IN_PROGRESS"
              ? "#F59E0B"
              : status === "COMPLETED"
              ? "#10B981"
              : status === "CANCELLED"
              ? "#EF4444"
              : "#6B7280",
        })
      )
    : [];

  // Dữ liệu cho biểu đồ đánh giá theo loại
  const evaluationTypeData = statistics.overview?.evaluationsByStatus
    ? Object.entries(statistics.overview.evaluationsByStatus).map(
        ([status, count]) => ({
          name:
            status === "PENDING"
              ? "Chờ xử lý"
              : status === "IN_PROGRESS"
              ? "Đang xử lý"
              : status === "COMPLETED"
              ? "Đã hoàn thành"
              : status === "CANCELLED"
              ? "Đã hủy"
              : status,
          value: count || 0,
          color:
            status === "PENDING"
              ? "#F59E0B"
              : status === "IN_PROGRESS"
              ? "#3B82F6"
              : status === "COMPLETED"
              ? "#10B981"
              : status === "CANCELLED"
              ? "#EF4444"
              : "#6B7280",
        })
      )
    : [];

  // Dữ liệu xu hướng từ API
  const trendData = statistics.overview?.registrationsOverTime
    ? statistics.overview.registrationsOverTime.map((item) => ({
        month: new Date(item.date).toLocaleDateString("vi-VN", {
          month: "short",
        }),
        sessions: item.count || 0,
        students:
          statistics.overview.submissionsOverTime?.find(
            (sub) => sub.date === item.date
          )?.count || 0,
      }))
    : [
        { month: "T1", sessions: 0, students: 0 },
        { month: "T2", sessions: 0, students: 0 },
        { month: "T3", sessions: 0, students: 0 },
        { month: "T4", sessions: 0, students: 0 },
        { month: "T5", sessions: 0, students: 0 },
        { month: "T6", sessions: 0, students: 0 },
      ];

  // Dữ liệu mẫu cho bảng buổi bảo vệ
  const defenses = [
    {
      date: "2024-02-15",
      title: "AI-Powered Healthcare System",
      room: "Room 301",
      members: "Dr. Smith, Dr. Johnson",
      status: "Scheduled",
    },
    {
      date: "2024-02-16",
      title: "Blockchain in Supply Chain",
      room: "Room 205",
      members: "Dr. Williams, Dr. Brown",
      status: "In Progress",
    },
    {
      date: "2024-02-17",
      title: "IoT Smart City Solutions",
      room: "Room 401",
      members: "Dr. Davis, Dr. Miller",
      status: "Completed",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full mx-auto">
        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Tổng người dùng
                </p>
                <p className="text-3xl font-bold">
                  {statistics.overview?.totalUsers || 0}
                </p>
              </div>
              <div className="text-4xl opacity-80">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  className="size-10"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Tổng đề tài
                </p>
                <p className="text-3xl font-bold">
                  {statistics.overview?.totalTopics || 0}
                </p>
              </div>
              <div className="text-4xl opacity-80">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  className="size-10"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Tổng đánh giá
                </p>
                <p className="text-3xl font-bold">
                  {statistics.overview?.totalEvaluations || 0}
                </p>
              </div>
              <div className="text-4xl opacity-80">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  className="size-10"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">
                  Điểm trung bình
                </p>
                <p className="text-3xl font-bold">
                  {statistics.overview?.averageScore?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="text-4xl opacity-80">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  className="size-10"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Evaluation Types Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Phân loại đánh giá
              </h3>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={evaluationTypeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Defense Status Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Trạng thái buổi bảo vệ
              </h3>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defenseStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {defenseStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trend Chart Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Xu hướng theo tháng
              </h3>
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="sessions"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Buổi bảo vệ"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="students"
                    stackId="2"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Sinh viên"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Phân bố điểm số
              </h3>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    statistics.overview?.scoreDistribution
                      ? Object.entries(
                          statistics.overview.scoreDistribution
                        ).map(([range, count]) => ({
                          range: range,
                          count: count || 0,
                          color: range.includes("0-2")
                            ? "#EF4444"
                            : range.includes("2-4")
                            ? "#F59E0B"
                            : range.includes("4-6")
                            ? "#3B82F6"
                            : range.includes("6-8")
                            ? "#10B981"
                            : range.includes("8-10")
                            ? "#8B5CF6"
                            : "#6B7280",
                        }))
                      : [
                          { range: "0-2", count: 0, color: "#EF4444" },
                          { range: "2-4", count: 0, color: "#F59E0B" },
                          { range: "4-6", count: 0, color: "#3B82F6" },
                          { range: "6-8", count: 0, color: "#10B981" },
                          { range: "8-10", count: 0, color: "#8B5CF6" },
                        ]
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* User Activity Chart */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Hoạt động người dùng
              </h3>
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={
                    statistics.overview?.registrationsOverTime
                      ? statistics.overview.registrationsOverTime
                          .slice(-7)
                          .map((item, index) => ({
                            day: new Date(item.date).toLocaleDateString(
                              "vi-VN",
                              { weekday: "short" }
                            ),
                            active: item.count || 0,
                            new:
                              statistics.overview.submissionsOverTime?.slice(
                                -7
                              )[index]?.count || 0,
                          }))
                      : [
                          { day: "T2", active: 0, new: 0 },
                          { day: "T3", active: 0, new: 0 },
                          { day: "T4", active: 0, new: 0 },
                          { day: "T5", active: 0, new: 0 },
                          { day: "T6", active: 0, new: 0 },
                          { day: "T7", active: 0, new: 0 },
                          { day: "CN", active: 0, new: 0 },
                        ]
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    name="Hoạt động"
                  />
                  <Line
                    type="monotone"
                    dataKey="new"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Mới"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Topic Status Chart */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Trạng thái đề tài
              </h3>
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      statistics.overview?.topicsByStatus
                        ? Object.entries(
                            statistics.overview.topicsByStatus
                          ).map(([status, count]) => ({
                            name:
                              status === "ACTIVE"
                                ? "Hoạt động"
                                : status === "INACTIVE"
                                ? "Tạm dừng"
                                : status === "COMPLETED"
                                ? "Hoàn thành"
                                : status === "CANCELLED"
                                ? "Hủy bỏ"
                                : status,
                            value: count || 0,
                            color:
                              status === "ACTIVE"
                                ? "#10B981"
                                : status === "INACTIVE"
                                ? "#F59E0B"
                                : status === "COMPLETED"
                                ? "#3B82F6"
                                : status === "CANCELLED"
                                ? "#EF4444"
                                : "#6B7280",
                          }))
                        : [
                            { name: "Hoạt động", value: 0, color: "#10B981" },
                            { name: "Tạm dừng", value: 0, color: "#F59E0B" },
                            { name: "Hoàn thành", value: 0, color: "#3B82F6" },
                            { name: "Hủy bỏ", value: 0, color: "#EF4444" },
                          ]
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Hoạt động", value: 45, color: "#10B981" },
                      { name: "Tạm dừng", value: 12, color: "#F59E0B" },
                      { name: "Hoàn thành", value: 28, color: "#3B82F6" },
                      { name: "Hủy bỏ", value: 5, color: "#EF4444" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Thống kê nhanh
              </h3>
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        className="size-10"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"
                        />
                      </svg>
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Đăng ký hôm nay</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.overview?.newRegistrationsToday || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        className="size-10"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nộp bài hôm nay</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.overview?.newSubmissionsToday || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        className="size-10"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chờ xử lý</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.overview?.pendingEvaluations || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Recent Defenses Table */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Buổi bảo vệ gần đây
            </h3>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              + Thêm mới
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tên đề tài
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Phòng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Thành viên hội đồng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {defenses.map((d, index) => (
                  <tr
                    key={d.date + d.title}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {d.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {d.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.room}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {d.members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          d.status === "Scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : d.status === "In Progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
