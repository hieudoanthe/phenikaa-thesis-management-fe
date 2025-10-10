import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useProfileTeacher } from "../../hooks/useProfile";
import TopicService from "../../services/topic.service";
import dashboardService from "../../services/dashboard.service";
import evaluationService from "../../services/evaluation.service";
import "../../styles/pages/lecturer/dasboard.css";
import { getTeacherIdFromToken } from "../../auth/authUtils";

const LecturerDashboard = () => {
  const [activeTab, setActiveTab] = useState("submissions");
  const { user } = useAuth();
  const { profileData } = useProfileTeacher();
  const navigate = useNavigate();

  // State cho đề tài hướng dẫn
  const [guidanceTopics, setGuidanceTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState(null);

  // State cho lịch bảo vệ
  const [defenseTasks, setDefenseTasks] = useState([]);
  const [defenseLoading, setDefenseLoading] = useState(false);
  const [defenseError, setDefenseError] = useState(null);

  // State thống kê nhanh theo đề tài
  const [topicStats, setTopicStats] = useState({
    approvedTopics: 0,
    rejectedTopics: 0,
    pendingTopics: 0,
  });

  // Helpers
  const parseTopicsResponse = (response) => {
    if (!response) return [];
    if (Array.isArray(response?.data?.content)) return response.data.content;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response)) return response;
    return [];
  };

  const normalizeApprovalStatus = (topic) => {
    const raw = (
      topic?.approvalStatus ||
      topic?.status ||
      topic?.approval ||
      topic?.topicStatus ||
      ""
    )
      .toString()
      .trim()
      .toUpperCase();

    if (["APPROVED", "CONFIRMED", "ACCEPTED"].includes(raw)) return "APPROVED";
    if (["REJECTED", "REJECT", "DECLINED", "DENIED"].includes(raw))
      return "REJECTED";
    if (["PENDING", "WAITING", "IN_REVIEW", "SUBMITTED"].includes(raw))
      return "PENDING";
    return raw || "PENDING";
  };

  // Department mapping
  const departmentMapping = {
    CNTT: "Công nghệ thông tin",
    KHMT: "Khoa học máy tính",
    ATTT: "An toàn thông tin",
    HTTT: "Hệ thống thông tin",
    MMT: "Mạng máy tính",
    PM: "Phần mềm",
  };

  // Get real data from profile
  const lecturerName = profileData?.fullName || user?.fullName || "Giảng viên";
  const departmentCode = profileData?.department || "CNTT";
  const department =
    departmentMapping[departmentCode] ||
    departmentCode ||
    "Công nghệ thông tin";

  // Function để load đề tài hướng dẫn
  const loadGuidanceTopics = async () => {
    try {
      setTopicsLoading(true);
      setTopicsError(null);

      const response = await TopicService.getTopicListByTeacher({
        page: 0,
        size: 100,
      });

      const topicsData = parseTopicsResponse(
        response?.success ? response : response
      );
      const safeTopics = Array.isArray(topicsData) ? topicsData : [];

      setGuidanceTopics(safeTopics);

      // Cập nhật thống kê dựa trên danh sách
      const counts = safeTopics.reduce(
        (acc, t) => {
          const s = normalizeApprovalStatus(t);
          if (s === "APPROVED") acc.approvedTopics += 1;
          else if (s === "REJECTED") acc.rejectedTopics += 1;
          else acc.pendingTopics += 1;
          return acc;
        },
        { approvedTopics: 0, rejectedTopics: 0, pendingTopics: 0 }
      );
      setTopicStats(counts);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đề tài:", error);
      setTopicsError("Có lỗi xảy ra khi lấy danh sách đề tài");
      setGuidanceTopics([]);
      setTopicStats({ approvedTopics: 0, rejectedTopics: 0, pendingTopics: 0 });
    } finally {
      setTopicsLoading(false);
    }
  };

  // Phương án dự phòng: gọi API dashboard nếu vì lý do nào đó danh sách rỗng
  const loadTopicStatsFallback = async () => {
    try {
      if (!user?.userId) return;
      const res = await dashboardService.getTeacherDashboardStats(user.userId);
      if (res?.success && res.data) {
        setTopicStats({
          approvedTopics: res.data.approvedTopics || 0,
          rejectedTopics: res.data.rejectedTopics || 0,
          pendingTopics: res.data.pendingTopics || 0,
        });
      }
    } catch {
      // ignore
    }
  };

  // Function để load lịch bảo vệ (theo phiên của giảng viên)
  const loadDefenseTasks = async () => {
    const evaluatorId = user?.userId || getTeacherIdFromToken();
    console.log(
      "[Dashboard] loadDefenseTasks -> user.userId:",
      user?.userId,
      "tokenUserId:",
      getTeacherIdFromToken()
    );
    if (!evaluatorId) {
      console.warn("[Dashboard] Không tìm thấy evaluatorId để gọi lịch bảo vệ");
      return;
    }

    setDefenseLoading(true);
    setDefenseError(null);

    try {
      // Lấy các phiên bảo vệ của giảng viên (không phụ thuộc student_defense)
      const response = await evaluationService.getLecturerSessions(evaluatorId);

      console.log("Lecturer sessions response:", response);
      console.log("Lecturer sessions count:", response?.length || 0);

      // Chuyển sessions -> defenseTasks-like để hiển thị lịch và danh sách
      if (Array.isArray(response)) {
        const mapped = response.map((s) => ({
          defenseDate: s.defenseDate,
          defenseTime: s.startTime,
          evaluationType: Array.isArray(s.roles)
            ? s.roles.join("/")
            : "SESSION",
          topicId: s.sessionId,
          topicTitle: s.sessionName || `Phiên bảo vệ #${s.sessionId}`,
          studentName: s.location || "",
          evaluatorId: evaluatorId,
        }));
        setDefenseTasks(mapped);
      } else {
        setDefenseTasks([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch bảo vệ:", error);
      setDefenseError("Không thể tải lịch bảo vệ");
    } finally {
      setDefenseLoading(false);
    }
  };

  // Load dữ liệu khi component mount
  useEffect(() => {
    // Không phụ thuộc userId vì service tự lấy từ token
    console.log("[Dashboard] useEffect mount - user:", user);
    loadGuidanceTopics();
    loadDefenseTasks();
    loadTopicStatsFallback();
  }, [user?.userId]);

  // Tính toán số đề tài theo trạng thái (dựa trên trạng thái đã chuẩn hóa)
  const approvedTopics = topicStats.approvedTopics;
  const rejectedTopics = topicStats.rejectedTopics;
  const pendingTopics = topicStats.pendingTopics;

  // Đề tài hướng dẫn được hiểu là đã được phê duyệt
  const guidanceTopicsCount = approvedTopics;

  const summaryData = {
    supervisedTopics: {
      count: topicsLoading ? "..." : guidanceTopicsCount,
      label: "Đề tài hướng dẫn",
      subtitle: "Đề tài đã được phê duyệt",
      subtitleClass: "text-green-600",
      change: topicsLoading
        ? "Đang tải..."
        : guidanceTopicsCount > 0
        ? `${guidanceTopicsCount} đề tài đã duyệt`
        : "Chưa có đề tài nào được duyệt",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
          />
        </svg>
      ),
    },
    groupsAssigned: {
      count: topicsLoading ? "..." : rejectedTopics,
      label: "Đề tài đã từ chối",
      subtitle: "Đề tài không được phê duyệt",
      subtitleClass: "text-red-600",
      change: topicsLoading
        ? "Đang tải..."
        : rejectedTopics > 0
        ? `${rejectedTopics} đề tài đã từ chối`
        : "Không có đề tài nào đã từ chối",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ),
    },
    pendingEvaluations: {
      count: topicsLoading ? "..." : pendingTopics,
      label: "Đánh giá chờ xử lý",
      subtitle: "Cần xem xét",
      subtitleClass: "text-amber-600",
      change: topicsLoading
        ? "Đang tải..."
        : pendingTopics > 0
        ? `${pendingTopics} đề tài chờ duyệt`
        : "Không có đề tài chờ duyệt",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
    },
  };

  // Tạo calendar data cho tháng hiện tại
  // Điều hướng tháng cho lịch
  const [monthOffset, setMonthOffset] = useState(0);

  const calendarDays = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + monthOffset);
    const currentMonth = base.getMonth();
    const currentYear = base.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    const days = [];
    const prevMonth = new Date(currentYear, currentMonth, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isToday: false,
        hasDefense: false,
      });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const hasDefense = defenseTasks.some((task) => {
        if (!task.defenseDate) return false;
        const taskDate = new Date(task.defenseDate);
        return taskDate.toDateString() === date.toDateString();
      });
      days.push({ day, isCurrentMonth: true, isToday, hasDefense });
    }
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        hasDefense: false,
      });
    }
    return days;
  }, [defenseTasks, monthOffset]);

  // Lấy danh sách các ngày có buổi bảo vệ trong tháng hiện tại
  const defenseDaysInMonth = defenseTasks
    .filter((task) => {
      if (!task.defenseDate) return false;
      const taskDate = new Date(task.defenseDate);
      const base = new Date();
      base.setMonth(base.getMonth() + monthOffset);
      return (
        taskDate.getMonth() === base.getMonth() &&
        taskDate.getFullYear() === base.getFullYear()
      );
    })
    .map((task) => ({
      day: new Date(task.defenseDate).getDate(),
      title: task.topicTitle || task.title || "Chưa có tên đề tài",
      student: task.studentName || `Sinh viên ${task.studentId}`,
      time: task.defenseTime
        ? new Date(task.defenseTime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Chưa xác định",
      evaluationType: task.evaluationType || "UNKNOWN",
    }));

  const mapRoleVi = (text) => {
    if (!text) return "";
    const parts = text.split("/").map((p) => p.trim().toUpperCase());
    const vi = parts.map((p) => {
      if (p === "CHAIRMAN") return "Chủ tịch";
      if (p === "SECRETARY") return "Thư ký";
      if (p === "MEMBER") return "Thành viên";
      if (p === "REVIEWER") return "Phản biện";
      if (p === "SUPERVISOR") return "Hướng dẫn";
      if (p === "SESSION") return "Phiên";
      return p;
    });
    return vi.join(" / ");
  };

  // Danh sách phiên bảo vệ sắp tới của giảng viên (tối đa 5)
  const upcomingSessions = defenseTasks
    .filter(
      (s) =>
        s.defenseDate &&
        new Date(s.defenseDate) >= new Date(new Date().toDateString())
    )
    .sort((a, b) => {
      const da = new Date(a.defenseDate);
      const db = new Date(b.defenseDate);
      if (da.getTime() !== db.getTime()) return da - db;
      const ta = a.defenseTime ? new Date(a.defenseTime) : new Date(0);
      const tb = b.defenseTime ? new Date(b.defenseTime) : new Date(0);
      return ta - tb;
    })
    .slice(0, 5)
    .map((s) => ({
      date: new Date(s.defenseDate).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      time: s.defenseTime
        ? new Date(s.defenseTime).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--",
      title: s.topicTitle || s.title || `Phiên bảo vệ #${s.topicId}`,
      roles: mapRoleVi(s.evaluationType),
      location: s.studentName || "",
    }));

  // Summary items (tránh lồng ternary trong JSX)
  const summaryItems = [
    {
      key: "approved",
      count: topicsLoading ? "..." : guidanceTopicsCount,
      label: "Đề tài hướng dẫn",
      subtitle: "Đề tài đã được phê duyệt",
      subtitleClass: "text-green-600",
      change: topicsLoading
        ? "Đang tải..."
        : guidanceTopicsCount > 0
        ? `${guidanceTopicsCount} đề tài đã duyệt`
        : "Chưa có đề tài nào được duyệt",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
          />
        </svg>
      ),
      theme: "text-blue-700",
      ring: "ring-blue-100 bg-blue-50",
      gradient: "from-blue-50 to-blue-100",
      accent: "bg-blue-400",
      iconTint: "text-blue-400",
      headerLabel: "Đã duyệt",
    },
    {
      key: "rejected",
      count: topicsLoading ? "..." : rejectedTopics,
      label: "Đề tài đã từ chối",
      subtitle: "Đề tài không được phê duyệt",
      subtitleClass: "text-red-600",
      change: topicsLoading
        ? "Đang tải..."
        : rejectedTopics > 0
        ? `${rejectedTopics} đề tài đã từ chối`
        : "Không có đề tài nào đã từ chối",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002"
          />
        </svg>
      ),
      theme: "text-red-700",
      ring: "ring-red-100 bg-red-50",
      gradient: "from-red-50 to-red-100",
      accent: "bg-red-400",
      iconTint: "text-red-400",
      headerLabel: "Từ chối",
    },
    {
      key: "pending",
      count: topicsLoading ? "..." : pendingTopics,
      label: "Đánh giá chờ xử lý",
      subtitle: "Cần xem xét",
      subtitleClass: "text-amber-600",
      change: topicsLoading
        ? "Đang tải..."
        : pendingTopics > 0
        ? `${pendingTopics} đề tài chờ duyệt`
        : "Không có đề tài chờ duyệt",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
      theme: "text-yellow-700",
      ring: "ring-yellow-100 bg-yellow-50",
      gradient: "from-yellow-50 to-yellow-100",
      accent: "bg-yellow-400",
      iconTint: "text-yellow-400",
      headerLabel: "Cần duyệt",
    },
  ];

  // Bỏ "Báo cáo gần đây" – thay bằng danh sách phiên bảo vệ sắp tới

  const quickActions = [
    {
      title: "Chấm điểm",
      description: "Vào màn hình chấm điểm của giảng viên",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M9 11.25 11.25 13.5 15 9.75" />
          <path
            fillRule="evenodd"
            d="M4.5 3.75A2.25 2.25 0 0 0 2.25 6v12A2.25 2.25 0 0 0 4.5 20.25h15A2.25 2.25 0 0 0 21.75 18V6A2.25 2.25 0 0 0 19.5 3.75h-15ZM3.75 6A.75.75 0 0 1 4.5 5.25h15a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75V6Z"
            clipRule="evenodd"
          />
        </svg>
      ),
      action: "grading",
    },
    {
      title: "Duyệt đề tài",
      description: "Xem và duyệt đề tài chờ",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h5.25a2.25 2.25 0 0 1 2.25 2.25v10.5a.75.75 0 0 1-1.2.6l-2.85-2.137a2.25 2.25 0 0 0-1.35-.45H6.75A2.25 2.25 0 0 1 4.5 12.75V6.75Z" />
          <path d="M15 7.5h2.25A2.25 2.25 0 0 1 19.5 9.75v9a.75.75 0 0 1-1.2.6L15 17.25V7.5Z" />
        </svg>
      ),
      action: "approval",
    },
    {
      title: "Thông báo",
      description: "Xem thông báo dành cho bạn",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M14.25 18a3.75 3.75 0 0 1-7.5 0h7.5Z" />
          <path
            fillRule="evenodd"
            d="M12 2.25a6 6 0 0 0-6 6v3.416c0 .48-.16.947-.456 1.326l-1.57 2.037A1.125 1.125 0 0 0 4.875 17.25h14.25a1.125 1.125 0 0 0 .9-1.821l-1.57-2.037a2.25 2.25 0 0 1-.455-1.326V8.25a6 6 0 0 0-6-6Z"
            clipRule="evenodd"
          />
        </svg>
      ),
      action: "notifications",
    },
  ];

  const handleQuickAction = (action) => {
    switch (action) {
      case "grading":
        navigate("/lecturer/grading");
        break;
      case "approval":
        navigate({ pathname: "/lecturer/thesis", search: "?approval=pending" });
        break;
      case "notifications":
        navigate("/lecturer/notifications");
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="banner-content">
          <h1 className="welcome-title">Chào mừng trở lại, {lecturerName}</h1>
          <p className="department-name">{department}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 relative -mt-16 z-10 px-6">
        {summaryItems.map((item, index) => (
          <div
            key={item.key}
            className="relative overflow-hidden rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-300 bg-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className={
                    "w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 text-gray-600"
                  }
                >
                  {item.icon}
                </div>
                <span className="text-base md:text-lg font-bold text-gray-700">
                  {item.headerLabel}
                </span>
              </div>
            </div>
            {/* Body */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="pr-4">
                <p
                  className={`text-sm ${item.subtitleClass || "text-gray-700"}`}
                >
                  {item.subtitle}
                </p>
                <p className="mt-1 text-xs font-medium text-gray-600">
                  {item.change}
                </p>
              </div>
              <div className="text-4xl font-bold text-gray-900">
                {item.count}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Column - Upcoming Defenses */}
        <div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Lịch bảo vệ
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMonthOffset((v) => v - 1)}
                  className="px-2 py-1 rounded border text-sm text-gray-700 hover:bg-gray-50"
                >
                  Tháng trước
                </button>
                <button
                  onClick={() => setMonthOffset(0)}
                  className="px-2 py-1 rounded border text-sm text-gray-700 hover:bg-gray-50"
                >
                  Tháng này
                </button>
                <button
                  onClick={() => setMonthOffset((v) => v + 1)}
                  className="px-2 py-1 rounded border text-sm text-gray-700 hover:bg-gray-50"
                >
                  Tháng sau
                </button>
              </div>
            </div>

            {/* Calendar Widget */}
            <div className="w-full">
              {defenseLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 text-sm mt-2">
                    Đang tải lịch bảo vệ...
                  </p>
                </div>
              ) : defenseError ? (
                <div className="text-center py-4">
                  <p className="text-red-500 text-sm">{defenseError}</p>
                  <button
                    onClick={loadDefenseTasks}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <>
                  {/* Calendar Grid */}
                  <div className="w-full">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-semibold text-gray-600 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((dayData, index) => (
                        <div
                          key={index}
                          className={`
                            aspect-square flex items-center justify-center text-sm font-medium rounded-md cursor-pointer transition-all duration-200
                            ${
                              !dayData.isCurrentMonth
                                ? "text-gray-300"
                                : dayData.hasDefense
                                ? "bg-primary-100 text-primary-700 font-semibold hover:bg-primary-200 border border-primary-300"
                                : dayData.isToday
                                ? "ring-1 ring-gray-300 bg-white text-gray-700 font-bold"
                                : "text-gray-700 hover:bg-gray-100"
                            }
                          `}
                        >
                          {dayData.day}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Upcoming Sessions */}
        <div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Phiên bảo vệ sắp tới
              </h2>
              <span className="text-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
              </span>
            </div>
            <div className="space-y-2.5">
              {upcomingSessions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">
                  Không có phiên bảo vệ nào sắp tới
                </p>
              ) : (
                upcomingSessions.map((s, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm mb-1">
                        {s.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {s.date} • {s.time}{" "}
                        {s.location ? `• ${s.location}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-2">
                      {String(s.roles)
                        .split("/")
                        .map((r, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {r.trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const themes = [
              {
                bg: "bg-blue-50",
                text: "text-blue-600",
                ring: "ring-blue-100",
              },
              {
                bg: "bg-green-50",
                text: "text-green-600",
                ring: "ring-green-100",
              },
              {
                bg: "bg-amber-50",
                text: "text-amber-600",
                ring: "ring-amber-100",
              },
            ];
            const t = themes[index % themes.length];
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleQuickAction(action.action)}
                className="group w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 ${t.bg} ${t.text} rounded-2xl flex items-center justify-center ring-4 ${t.ring}`}
                  >
                    {action.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">
                      {action.description}
                    </span>
                    <span className="mt-1 text-lg font-semibold text-gray-900">
                      {action.title}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
