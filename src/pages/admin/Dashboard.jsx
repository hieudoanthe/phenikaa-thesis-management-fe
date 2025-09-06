import React, { useState, useEffect } from "react";
import { statisticsService } from "../../services/statistics.service";
import { toast } from "react-toastify";
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
      const data = await statisticsService.getAllStatistics();
      setStatistics(data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu thống kê");
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return "0%";
    return `${num.toFixed(1)}%`;
  };

  // Dữ liệu cho stats cards
  const stats = [
    {
      label: "Tổng buổi bảo vệ",
      value: statistics.overview?.totalDefenseSessions || 0,
      icon: "🏛️",
    },
    {
      label: "Sinh viên đang chờ",
      value: statistics.overview?.pendingStudents || 0,
      icon: "⏰",
    },
    {
      label: "Tổng sinh viên",
      value: statistics.overview?.totalStudents || 0,
      icon: "👥",
    },
    {
      label: "Điểm trung bình",
      value: statistics.overview?.averageScore?.toFixed(2) || "0.00",
      icon: "⭐",
    },
  ];

  // Dữ liệu cho biểu đồ trạng thái buổi bảo vệ
  const defenseStatusData = statistics.overview
    ? [
        {
          name: "Đã lên lịch",
          value: statistics.overview.scheduledSessions || 0,
          color: "#3B82F6",
        },
        {
          name: "Đang diễn ra",
          value: statistics.overview.inProgressSessions || 0,
          color: "#F59E0B",
        },
        {
          name: "Đã hoàn thành",
          value: statistics.overview.completedSessions || 0,
          color: "#10B981",
        },
        {
          name: "Đã hủy",
          value: statistics.overview.cancelledSessions || 0,
          color: "#EF4444",
        },
      ]
    : [];

  // Dữ liệu cho biểu đồ đánh giá theo loại
  const evaluationTypeData = statistics.overview
    ? [
        {
          name: "Hướng dẫn",
          value: statistics.overview.supervisorEvaluations || 0,
          color: "#3B82F6",
        },
        {
          name: "Phản biện",
          value: statistics.overview.reviewerEvaluations || 0,
          color: "#10B981",
        },
        {
          name: "Hội đồng",
          value: statistics.overview.committeeEvaluations || 0,
          color: "#8B5CF6",
        },
      ]
    : [];

  // Dữ liệu giả lập cho biểu đồ xu hướng (có thể thay thế bằng dữ liệu thực)
  const trendData = [
    { month: "T1", sessions: 12, students: 45 },
    { month: "T2", sessions: 19, students: 52 },
    { month: "T3", sessions: 15, students: 38 },
    { month: "T4", sessions: 22, students: 61 },
    { month: "T5", sessions: 18, students: 47 },
    { month: "T6", sessions: 25, students: 68 },
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Admin
          </h1>
          <p className="text-gray-600">Tổng quan hệ thống quản lý luận văn</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((s) => (
            <div
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
              key={s.label}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
                <div className="text-3xl">{s.icon}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Evaluation Types Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Phân loại đánh giá
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evaluationTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Defense Status Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Trạng thái buổi bảo vệ
            </h3>
            <div className="h-80">
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
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {defenseStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Xu hướng buổi bảo vệ và sinh viên theo tháng
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
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
        {/* Recent Defenses Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Buổi bảo vệ gần đây
            </h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              + Thêm mới
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên đề tài
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phòng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thành viên hội đồng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {defenses.map((d) => (
                  <tr key={d.date + d.title} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.room}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
