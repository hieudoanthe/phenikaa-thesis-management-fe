import React, { useState, useEffect } from "react";
import Select from "react-select";
import { evalService } from "../../services/evalService";
import studentAssignmentService from "../../services/studentAssignment.service";
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
import { useLocation } from "react-router-dom"; // Import useLocation
import userService from "../../services/user.service";

const DefenseSessionsSchedule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState({
    value: "This Week",
    label: "Tuần này",
  });
  const [selectedStatus, setSelectedStatus] = useState({
    value: "all",
    label: "Tất cả trạng thái",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formData, setFormData] = useState({
    topic: "",
    room: "",
    date: "",
    time: "09:00",
    committeeMembers: [],
    reviewerMembers: [], // Thêm giảng viên phản biện
    status: "PLANNING",
  });
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [isSessionDetailModalOpen, setIsSessionDetailModalOpen] =
    useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const location = useLocation(); // Get location object

  // Dữ liệu mẫu cho demo
  const mockSessions = [
    {
      id: 1,
      day: "Mon",
      time: "10:00 AM",
      status: "upcoming",
      room: "Room 301",
      topic: "Machine Learning Applications in Healthcare",
      committeeMembers: 3,
      date: "2024-01-15",
    },
    {
      id: 2,
      day: "Fri",
      time: "11:00 AM",
      status: "completed",
      room: "Room 401",
      topic: "Blockchain Technology in Supply Chain",
      committeeMembers: 3,
      date: "2024-01-19",
    },
  ];

  // Hiển thị nút quay về đầu trang khi scroll
  useEffect(() => {
    const mainEl = document.querySelector("main");
    const container = mainEl || window;

    const getScrollTop = () =>
      container === window
        ? window.pageYOffset || document.documentElement.scrollTop
        : container.scrollTop;

    const handleScroll = () => {
      setShowBackToTop(getScrollTop() > 200);
    };

    const target = container === window ? window : container;
    target.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => target.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBackToTop = () => {
    const mainEl = document.querySelector("main");
    const container = mainEl || window;
    if (container === window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Tạo time slots từ 8:00 AM đến 6:00 PM (chỉ giờ làm việc)
  const timeSlots = [
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
  ];

  // Tạo days of week (chỉ từ thứ 2 đến thứ 6)
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const weekDayLabels = {
    Mon: "Thứ 2",
    Tue: "Thứ 3",
    Wed: "Thứ 4",
    Thu: "Thứ 5",
    Fri: "Thứ 6",
  };

  // Options cho react-select
  const periodOptions = [
    { value: "This Week", label: "Tuần này" },
    { value: "Next Week", label: "Tuần tới" },
    { value: "This Month", label: "Tháng này" },
  ];

  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "PLANNING", label: "Lập kế hoạch" },
    { value: "SCHEDULED", label: "Sắp diễn ra" },
    { value: "IN_PROGRESS", label: "Đang diễn ra" },
    { value: "COMPLETED", label: "Hoàn thành" },
  ];

  useEffect(() => {
    loadSchedules();
  }, []);

  // Xử lý URL parameters khi component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const studentIdFromUrl = urlParams.get("viewStudent");
    const studentNameFromUrl = urlParams.get("studentName");

    if (studentIdFromUrl && studentNameFromUrl) {
      // Tìm buổi bảo vệ có chứa sinh viên này
      const findSessionWithStudent = async () => {
        try {
          // Đợi cho đến khi sessions được load
          if (sessions.length === 0) {
            await loadSessions();
          }

          // Tìm buổi bảo vệ có chứa sinh viên
          for (const session of sessions) {
            const assignedStudents =
              await studentAssignmentService.getAssignedStudents(
                session.sessionId
              );
            const studentFound = assignedStudents.find(
              (s) => s.studentId === parseInt(studentIdFromUrl)
            );

            if (studentFound) {
              // Mở popup hiển thị thông tin buổi bảo vệ
              setSelectedSessionDetail(session);
              setIsSessionDetailModalOpen(true);

              // Load danh sách sinh viên đã được gán
              loadAssignedStudents(session.sessionId).catch((error) => {
                console.error("Lỗi khi tải dữ liệu sinh viên:", error);
              });

              // Xóa URL parameters để tránh mở lại popup khi refresh
              window.history.replaceState(
                {},
                document.title,
                "/admin/defense-sessions"
              );
              break;
            }
          }
        } catch (error) {
          console.error("Lỗi khi tìm buổi bảo vệ:", error);
          showToast("Không thể tìm thông tin buổi bảo vệ");
        }
      };

      findSessionWithStudent();
    }
  }, [sessions]);

  // Xử lý state từ navigation (khi chuyển từ trang StudentPeriodManagement)
  useEffect(() => {
    if (location.state?.viewStudentDetails) {
      const { studentId, studentName } = location.state;

      // Tìm buổi bảo vệ có chứa sinh viên này
      const findSessionWithStudent = async () => {
        try {
          // Lấy tất cả buổi bảo vệ
          const allSessions = await evalService.getAllDefenseSessions();

          // Tìm buổi bảo vệ có chứa sinh viên
          for (const session of allSessions) {
            const assignedStudents =
              await studentAssignmentService.getAssignedStudents(
                session.sessionId
              );
            const studentFound = assignedStudents.find(
              (s) => s.studentId === studentId
            );

            if (studentFound) {
              // Mở popup hiển thị thông tin buổi bảo vệ
              setSelectedSessionDetail(session);
              setIsSessionDetailModalOpen(true);
              break;
            }
          }
        } catch (error) {
          console.error("Lỗi khi tìm buổi bảo vệ:", error);
          showToast("Không thể tìm thông tin buổi bảo vệ");
        }
      };

      findSessionWithStudent();

      // Xóa state để tránh mở lại popup khi refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (schedules.length > 0) {
      loadSessions();
    }
  }, [schedules]);

  useEffect(() => {
    if (selectedSchedule && selectedSchedule.value) {
      loadSessionsBySchedule(selectedSchedule.value);
    } else {
      loadSessions();
    }
  }, [selectedSchedule]);

  const loadSchedules = async () => {
    try {
      const data = await evalService.getAllDefenseSchedules();
      const scheduleOptions = [
        { value: null, label: "Tất cả lịch bảo vệ" },
        ...data.map((schedule) => ({
          value: schedule.scheduleId,
          label: schedule.scheduleName,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
        })),
      ];
      setSchedules(scheduleOptions);

      if (data.length > 0 && !selectedSchedule) {
        setSelectedSchedule(scheduleOptions[0]); // Chọn "Tất cả lịch bảo vệ"
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách lịch bảo vệ:", error);
      showToast("Lỗi khi tải danh sách lịch bảo vệ");
    }
  };

  const loadSessionsBySchedule = async (scheduleId) => {
    try {
      setLoading(true);
      const data = await evalService.getSessionsBySchedule(scheduleId);
      setSessions(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách session:", error);
      showToast("Lỗi khi tải danh sách session");
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await evalService.getAllDefenseSessions();
      console.log("Loaded sessions data:", data);
      setSessions(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách session:", error);
      showToast("Lỗi khi tải danh sách session");
    } finally {
      setLoading(false);
    }
  };

  const getSessionForTimeSlot = (day, time) => {
    return sessions.find((session) => {
      if (!session.defenseDate) return false;

      const sessionDate = new Date(session.defenseDate);
      const dayOfWeek = sessionDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const sessionDay = dayNames[dayOfWeek];

      // Chỉ hiển thị session cho thứ 2-6
      if (dayOfWeek === 0 || dayOfWeek === 6) return false;

      // Kiểm tra ngày trong tuần
      if (sessionDay !== day) return false;

      // Kiểm tra thời gian (nếu có startTime)
      if (session.startTime) {
        const startTime = new Date(session.startTime);
        const hours = startTime.getHours();
        const minutes = startTime.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        const sessionTimeString = `${displayHours}:${minutes
          .toString()
          .padStart(2, "0")} ${ampm}`;

        return sessionTimeString === time;
      }

      return false;
    });
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "upcoming":
        return "var(--color-info)";
      case "completed":
        return "var(--color-gray-600)";
      case "in-progress":
        return "var(--color-warning)";
      default:
        return "var(--color-gray-600)";
    }
  };

  const handleCreateSchedule = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (!selectedSchedule) {
        showToast("Vui lòng chọn lịch bảo vệ trước");
        return;
      }

      // Tạo defenseDate từ ngày và giờ được chọn, đảm bảo không có giờ hiện tại
      const dateString = formData.date + "T" + formData.time + ":00";
      const defenseDateTime = new Date(dateString);

      // Tạo ISO string với timezone offset để giữ nguyên giờ local
      const timezoneOffset = defenseDateTime.getTimezoneOffset() * 60000; // Convert to milliseconds
      const localDateTime = new Date(
        defenseDateTime.getTime() - timezoneOffset
      );
      const isoString = localDateTime.toISOString().slice(0, 16); // Remove seconds and timezone

      // Tạo ISO string với timezone offset để giữ nguyên giờ local

      const sessionData = {
        scheduleId: selectedSchedule.value,
        sessionName: formData.topic,
        defenseDate: formData.date, // Chỉ gửi ngày, không có giờ
        startTime: isoString, // Gửi thời gian đã được điều chỉnh timezone
        endTime: isoString, // Gửi thời gian đã được điều chỉnh timezone
        location: formData.room,
        maxStudents: 10,
        status: formData.status,
        notes: `Committee: ${formData.committeeMembers.length} members, Reviewers: ${formData.reviewerMembers.length} members`,
        committeeMembers: formData.committeeMembers.map(
          (member) => member.value
        ), // Gửi danh sách ID giảng viên hội đồng
        reviewerMembers: formData.reviewerMembers.map((member) => member.value), // Gửi danh sách ID giảng viên phản biện
      };

      await evalService.createDefenseSession(sessionData);
      showToast("Tạo buổi bảo vệ thành công!");

      // Reload sessions
      if (selectedSchedule) {
        loadSessionsBySchedule(selectedSchedule.value);
      }
    } catch (error) {
      console.error("Lỗi khi tạo buổi bảo vệ:", error);

      // Hiển thị thông báo lỗi validation từ backend
      if (error.response && error.response.data && error.response.data.error) {
        showToast(error.response.data.error, "error");
      } else if (error.response && error.response.status === 400) {
        showToast(
          "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
          "error"
        );
      } else {
        showToast("Lỗi khi tạo buổi bảo vệ. Vui lòng thử lại.", "error");
      }
    }
  };

  const handleExport = () => {
    // TODO: Export dữ liệu
    showToast("Chức năng export sẽ được phát triển!");
  };

  const handleSessionClick = (session) => {
    setSelectedSessionDetail(session);
    setIsSessionDetailModalOpen(true);
    // Load danh sách sinh viên đã được gán
    loadAssignedStudents(session.sessionId).catch((error) => {
      console.error("Lỗi khi tải dữ liệu sinh viên:", error);
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PLANNING":
        return "Lập kế hoạch";
      case "SCHEDULED":
        return "Sắp diễn ra";
      case "IN_PROGRESS":
        return "Đang diễn ra";
      case "COMPLETED":
        return "Hoàn thành";
      default:
        return "Lập kế hoạch";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PLANNING":
        return "#7c3aed"; // purple-600
      case "SCHEDULED":
        return "#2563eb"; // blue-600
      case "IN_PROGRESS":
        return "#d97706"; // amber-600
      case "COMPLETED":
        return "#059669"; // emerald-600
      default:
        return "#6b7280"; // gray-500
    }
  };

  const handleStatusChange = async (sessionId, newStatus) => {
    try {
      // Cập nhật trạng thái trong backend
      await evalService.updateDefenseSessionStatus(sessionId, newStatus);

      // Cập nhật trạng thái trong state local
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.sessionId === sessionId
            ? { ...session, status: newStatus }
            : session
        )
      );

      showToast(`Đã cập nhật trạng thái thành: ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      showToast("Lỗi khi cập nhật trạng thái");
    }
  };

  // Function để load danh sách sinh viên có sẵn
  const loadAvailableStudents = async () => {
    try {
      setLoading(true);
      const students = await studentAssignmentService.getAvailableStudents();
      setAvailableStudents(students);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sinh viên:", error);
      showToast("Lỗi khi tải danh sách sinh viên");
      // Fallback to empty array
      setAvailableStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Function để load danh sách sinh viên đã được gán
  const loadAssignedStudents = async (sessionId) => {
    try {
      setLoading(true);
      const students = await studentAssignmentService.getAssignedStudents(
        sessionId
      );
      setAssignedStudents(students);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sinh viên đã gán:", error);
      showToast("Lỗi khi tải danh sách sinh viên đã gán");
      // Fallback to empty array
      setAssignedStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Function để gán sinh viên vào buổi bảo vệ
  const handleAssignStudent = async (studentId) => {
    try {
      if (!selectedSessionDetail) {
        showToast("Không tìm thấy thông tin buổi bảo vệ");
        return;
      }

      // Gọi API để gán sinh viên
      await studentAssignmentService.assignStudent(
        selectedSessionDetail.sessionId,
        studentId
      );

      // Cập nhật state local
      const student = availableStudents.find((s) => s.studentId === studentId);
      if (student) {
        const newAssignedStudent = {
          ...student,
          defenseOrder: assignedStudents.length + 1,
        };
        setAssignedStudents([...assignedStudents, newAssignedStudent]);
        setAvailableStudents(
          availableStudents.filter((s) => s.studentId !== studentId)
        );
        showToast(`Đã gán sinh viên ${student.studentName} vào buổi bảo vệ`);
      }
    } catch (error) {
      console.error("Lỗi khi gán sinh viên:", error);
      showToast("Lỗi khi gán sinh viên");
    }
  };

  // Function để hủy gán sinh viên
  const handleUnassignStudent = async (studentId) => {
    try {
      if (!selectedSessionDetail) {
        showToast("Không tìm thấy thông tin buổi bảo vệ");
        return;
      }

      // Gọi API để hủy gán sinh viên
      await studentAssignmentService.unassignStudent(
        selectedSessionDetail.sessionId,
        studentId
      );

      // Cập nhật state local
      const student = assignedStudents.find((s) => s.studentId === studentId);
      if (student) {
        setAssignedStudents(
          assignedStudents.filter((s) => s.studentId !== studentId)
        );
        setAvailableStudents([...availableStudents, student]);
        showToast(`Đã hủy gán sinh viên ${student.studentName}`);
      }
    } catch (error) {
      console.error("Lỗi khi hủy gán sinh viên:", error);
      showToast("Lỗi khi hủy gán sinh viên");
    }
  };

  // Helper functions for registration type display
  const getRegistrationTypeLabel = (type) => {
    switch (type) {
      case "REGISTERED":
        return "Đăng ký đề tài";
      case "SUGGESTED":
        return "Đề xuất đề tài";
      default:
        return "N/A";
    }
  };

  const getRegistrationTypeColor = (type) => {
    switch (type) {
      case "REGISTERED":
        return "bg-green-100 text-green-800 border-green-200";
      case "SUGGESTED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Apply simple filters for list view
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = searchQuery
      ? (s.sessionName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (s.location || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesStatus =
      selectedStatus && selectedStatus.value && selectedStatus.value !== "all"
        ? s.status === selectedStatus.value
        : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            {/* Schedule Selection */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="min-w-[200px]">
                {/* Removed visible label to align select with button */}
                <Select
                  value={selectedSchedule}
                  onChange={setSelectedSchedule}
                  options={schedules}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Chọn lịch bảo vệ"
                  isSearchable={false}
                />
              </div>

              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-white ${
                  selectedSchedule && selectedSchedule.value
                    ? "bg-primary-500 hover:bg-primary-400"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (!selectedSchedule || !selectedSchedule.value) {
                    showToast("Vui lòng chọn lịch bảo vệ trước", "warning");
                    return;
                  }
                  setIsModalOpen(true);
                }}
                disabled={!selectedSchedule || !selectedSchedule.value}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Thêm buổi bảo vệ
              </button>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[150px]">
                <Select
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  options={periodOptions}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Chọn kỳ"
                  isSearchable={false}
                />
              </div>

              <div className="min-w-[150px]">
                <Select
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={statusOptions}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Chọn trạng thái"
                  isSearchable={false}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm buổi bảo vệ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
                />
              </div>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    viewMode === "grid"
                      ? "bg-primary-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z" />
                  </svg>
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    viewMode === "list"
                      ? "bg-primary-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                  </svg>
                </button>
              </div>

              <button
                className="bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                onClick={handleExport}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                  />
                </svg>
                Xuất dữ liệu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content: Grid or List */}
      {viewMode === "grid" ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Lịch Bảo Vệ Theo Tuần
            </h2>
            <p className="text-gray-600">
              Xem lịch bảo vệ theo từng ngày và khung giờ
            </p>
          </div>

          <div className="grid grid-cols-6 gap-0 overflow-x-auto">
            {/* Time column */}
            <div className="sticky left-0 bg-gray-50">
              <div className="h-16 flex items-center justify-center font-medium text-gray-700 bg-gray-100 border-b border-r border-gray-300">
                Thời gian
              </div>
              {timeSlots.map((time, index) => (
                <div
                  key={index}
                  className="h-24 flex items-center justify-center text-sm text-gray-600 bg-gray-50 border-b border-r border-gray-300 px-2"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="min-w-[200px]">
                <div className="h-16 flex items-center justify-center font-medium text-gray-700 bg-gray-100 border-b border-gray-300">
                  {weekDayLabels[day] || day}
                </div>
                {timeSlots.map((time, timeIndex) => {
                  const session = getSessionForTimeSlot(day, time);
                  return (
                    <div
                      key={timeIndex}
                      className="h-24 border-b border-gray-300 p-1"
                    >
                      {session && (
                        <div
                          className={`h-full rounded-lg p-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            session.status === "PLANNING"
                              ? "bg-purple-50 border border-purple-200 hover:bg-purple-100"
                              : session.status === "SCHEDULED"
                              ? "bg-blue-50 border border-blue-200 hover:bg-blue-100"
                              : session.status === "COMPLETED"
                              ? "bg-green-50 border border-green-200 hover:bg-green-100"
                              : session.status === "IN_PROGRESS"
                              ? "bg-yellow-50 border border-yellow-200 hover:bg-yellow-100"
                              : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                          }`}
                          onClick={() => handleSessionClick(session)}
                          title={`${session.sessionName} - ${session.location}`}
                        >
                          <div className="text-gray-900 font-semibold text-xs mb-1 truncate leading-tight">
                            {session.sessionName}
                          </div>
                          <div className="text-gray-600 text-xs mb-1 font-medium">
                            {session.startTime
                              ? new Date(session.startTime).toLocaleTimeString(
                                  "vi-VN",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : "N/A"}
                          </div>
                          <div className="text-gray-500 text-xs truncate leading-tight mb-1">
                            📍 {session.location || "N/A"}
                          </div>
                          <div
                            className="mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Select
                              value={{
                                value: session.status,
                                label: getStatusLabel(session.status),
                              }}
                              onChange={(option) =>
                                handleStatusChange(
                                  session.sessionId,
                                  option.value
                                )
                              }
                              options={[
                                { value: "PLANNING", label: "Lập kế hoạch" },
                                { value: "SCHEDULED", label: "Sắp diễn ra" },
                                { value: "IN_PROGRESS", label: "Đang diễn ra" },
                                { value: "COMPLETED", label: "Hoàn thành" },
                              ]}
                              className="text-xs"
                              classNamePrefix="react-select"
                              isSearchable={false}
                              menuPlacement="auto"
                              styles={{
                                control: (provided) => ({
                                  ...provided,
                                  minHeight: "16px",
                                  height: "16px",
                                  fontSize: "8px",
                                  border: "none",
                                  backgroundColor: "transparent",
                                  boxShadow: "none",
                                  cursor: "pointer",
                                }),
                                valueContainer: (provided) => ({
                                  ...provided,
                                  padding: "0 2px",
                                  height: "16px",
                                }),
                                input: (provided) => ({
                                  ...provided,
                                  margin: "0px",
                                  fontSize: "8px",
                                }),
                                option: (provided) => ({
                                  ...provided,
                                  fontSize: "8px",
                                  padding: "2px 4px",
                                  cursor: "pointer",
                                }),
                                menu: (provided) => ({
                                  ...provided,
                                  fontSize: "8px",
                                  zIndex: 9999,
                                  minWidth: "70px",
                                }),
                                singleValue: (provided) => ({
                                  ...provided,
                                  fontSize: "8px",
                                  color: getStatusColor(session.status),
                                  fontWeight: "500",
                                }),
                                indicatorsContainer: (provided) => ({
                                  ...provided,
                                  height: "16px",
                                }),
                                indicatorSeparator: (provided) => ({
                                  ...provided,
                                  display: "none",
                                }),
                                dropdownIndicator: (provided) => ({
                                  ...provided,
                                  padding: "0 2px",
                                  height: "16px",
                                  width: "12px",
                                }),
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Danh sách buổi bảo vệ
          </h2>
          {filteredSessions.length === 0 ? (
            <p className="text-gray-600">Không có buổi bảo vệ phù hợp.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-gray-900 font-semibold truncate pr-2">
                      {session.sessionName}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                      {getStatusLabel(session.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    <strong>Ngày:</strong> {session.defenseDate || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    <strong>Giờ:</strong>{" "}
                    {session.startTime
                      ? new Date(session.startTime).toLocaleTimeString(
                          "vi-VN",
                          { hour: "2-digit", minute: "2-digit" }
                        )
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Phòng:</strong> {session.location || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Thống Kê Tổng Quan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-blue-900">
                  {sessions.length}
                </div>
                <div className="text-sm text-blue-700">Tổng số buổi bảo vệ</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-yellow-900">
                  {
                    sessions.filter(
                      (s) => s.status === "PLANNING" || s.status === "SCHEDULED"
                    ).length
                  }
                </div>
                <div className="text-sm text-yellow-700">Sắp diễn ra</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-orange-900">
                  {sessions.filter((s) => s.status === "IN_PROGRESS").length}
                </div>
                <div className="text-sm text-orange-700">Đang diễn ra</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-green-900">
                  {sessions.filter((s) => s.status === "COMPLETED").length}
                </div>
                <div className="text-sm text-green-700">Đã hoàn thành</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBackToTop && (
        <button
          type="button"
          onClick={handleBackToTop}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-lg bg-primary-500 text-white shadow-lg hover:bg-primary-400 transition-colors"
          aria-label="Quay về đầu trang"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      )}

      {/* Create Schedule Modal */}
      <CreateScheduleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        selectedSchedule={selectedSchedule}
      />

      {/* Session Detail Modal */}
      {isSessionDetailModalOpen && selectedSessionDetail && (
        <SessionDetailModal
          session={selectedSessionDetail}
          assignedStudents={assignedStudents}
          availableStudents={availableStudents}
          onAssignStudent={handleAssignStudent}
          onUnassignStudent={handleUnassignStudent}
          onClose={() => setIsSessionDetailModalOpen(false)}
        />
      )}
    </div>
  );
};

// Create Schedule Modal Component
const CreateScheduleModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedSchedule,
}) => {
  const [formData, setFormData] = useState({
    date: "",
    time: "09:00", // Giờ mặc định 9:00 AM
    room: "",
    topic: "",
    committeeMembers: [],
    reviewerMembers: [], // Thêm giảng viên phản biện
    status: "PLANNING", // Status mặc định
  });

  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const teachers = await userService.getAllTeachers();
        const options = Array.isArray(teachers)
          ? teachers.map((t) => ({
              value: t.userId,
              label: t.fullName || `Giảng viên ${t.userId}`,
            }))
          : [];
        setTeacherOptions(options);
      } catch (e) {
        console.error("Lỗi khi tải danh sách giảng viên:", e);
        showToast("Không thể tải danh sách giảng viên");
        setTeacherOptions([]);
      } finally {
        setLoadingTeachers(false);
      }
    };
    if (isOpen) loadTeachers();
  }, [isOpen]);

  // Function kiểm tra ngày có phải là thứ 2-6 không
  const isWeekday = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return day >= 1 && day <= 5; // Chỉ thứ 2-6 (Monday-Friday)
  };

  // Giới hạn theo lịch bảo vệ được chọn
  const scheduleStart =
    selectedSchedule && selectedSchedule.startDate
      ? new Date(selectedSchedule.startDate)
      : null;
  const scheduleEnd =
    selectedSchedule && selectedSchedule.endDate
      ? new Date(selectedSchedule.endDate)
      : null;
  const minDateStr = scheduleStart
    ? new Date(
        scheduleStart.getTime() - scheduleStart.getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0]
    : "";
  const maxDateStr = scheduleEnd
    ? new Date(scheduleEnd.getTime() - scheduleEnd.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0]
    : "";

  // Function lấy tên ngày trong tuần
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const dayNames = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    return dayNames[date.getDay()];
  };

  const roomOptions = [
    { value: "room301", label: "Room 301" },
    { value: "room401", label: "Room 401" },
    { value: "room501", label: "Room 501" },
    { value: "room601", label: "Room 601" },
  ];

  const timeOptions = [
    { value: "08:00", label: "08:00 AM" },
    { value: "09:00", label: "09:00 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "12:00", label: "12:00 PM" },
    { value: "13:00", label: "01:00 PM" },
    { value: "14:00", label: "02:00 PM" },
    { value: "15:00", label: "03:00 PM" },
    { value: "16:00", label: "04:00 PM" },
    { value: "17:00", label: "05:00 PM" },
    { value: "18:00", label: "06:00 PM" },
  ];

  const statusOptions = [
    { value: "PLANNING", label: "Lập kế hoạch" },
    { value: "SCHEDULED", label: "Sắp diễn ra" },
    { value: "IN_PROGRESS", label: "Đang diễn ra" },
    { value: "COMPLETED", label: "Hoàn thành" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    // Kiểm tra giới hạn theo lịch bảo vệ
    if (!selectedSchedule || !selectedSchedule.value) {
      showToast("Vui lòng chọn lịch bảo vệ trước");
      return;
    }
    if (scheduleStart && scheduleEnd) {
      const chosen = new Date(formData.date);
      const startOnly = new Date(
        scheduleStart.getFullYear(),
        scheduleStart.getMonth(),
        scheduleStart.getDate()
      );
      const endOnly = new Date(
        scheduleEnd.getFullYear(),
        scheduleEnd.getMonth(),
        scheduleEnd.getDate()
      );
      const chosenOnly = new Date(
        chosen.getFullYear(),
        chosen.getMonth(),
        chosen.getDate()
      );
      if (chosenOnly < startOnly || chosenOnly > endOnly) {
        showToast(
          "Ngày phải nằm trong khoảng thời gian của lịch bảo vệ đã chọn"
        );
        return;
      }
    }

    // Kiểm tra ngày có phải là thứ 2-6 không
    if (!isWeekday(formData.date)) {
      showToast("Chỉ được phép tạo buổi bảo vệ từ thứ 2 đến thứ 6!");
      return;
    }

    onSubmit({
      ...formData,
      committeeMembers: selectedTeachers,
      reviewerMembers: selectedReviewers,
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      date: "",
      time: "09:00", // Reset về giờ mặc định
      room: "",
      topic: "",
      committeeMembers: [],
      reviewerMembers: [],
      status: "PLANNING", // Reset về status mặc định
    });
    setSelectedTeachers([]);
    setSelectedReviewers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Tạo Buổi Bảo Vệ Mới
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            onClick={handleClose}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="date-input"
              >
                Ngày <span className="text-red-500">*</span>
              </label>
              <input
                id="date-input"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full h-12 px-4 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-[#ff6600] focus:ring-2 focus:ring-[rgba(255,102,0,0.1)] bg-white"
                required
                min={minDateStr || undefined}
                max={maxDateStr || undefined}
              />
              {formData.date && (
                <div
                  className={`mt-2 text-sm px-3 py-2 rounded-lg border ${
                    isWeekday(formData.date)
                      ? "text-blue-600 bg-blue-50 border-blue-200"
                      : "text-red-600 bg-red-50 border-red-200"
                  }`}
                >
                  <svg
                    className="w-4 h-4 inline mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  <strong>Ngày đã chọn:</strong> {formData.date} (
                  {getDayName(formData.date)})
                  {!isWeekday(formData.date) && (
                    <span className="font-medium text-red-700">
                      <br />
                      ⚠️ Chỉ được phép tạo buổi bảo vệ từ thứ 2 đến thứ 6!
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="time-select"
              >
                Thời gian <span className="text-red-500">*</span>
              </label>
              <Select
                inputId="time-select"
                value={timeOptions.find(
                  (option) => option.value === formData.time
                )}
                onChange={(option) =>
                  setFormData({ ...formData, time: option.value })
                }
                options={timeOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn thời gian"
                isSearchable={false}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: 48,
                    height: 48,
                    borderWidth: 2,
                    borderColor: state.isFocused ? "#ff6600" : "#d1d5db",
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(255,102,0,0.1)"
                      : "none",
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    paddingTop: 4,
                    paddingBottom: 4,
                  }),
                  indicatorsContainer: (base) => ({
                    ...base,
                    height: 48,
                  }),
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="room-select"
              >
                Phòng <span className="text-red-500">*</span>
              </label>
              <Select
                inputId="room-select"
                value={roomOptions.find(
                  (option) => option.value === formData.room
                )}
                onChange={(option) =>
                  setFormData({ ...formData, room: option.value })
                }
                options={roomOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn phòng"
                isSearchable={false}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: 48,
                    height: 48,
                    borderWidth: 2,
                    borderColor: state.isFocused ? "#ff6600" : "#d1d5db",
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(255,102,0,0.1)"
                      : "none",
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    paddingTop: 4,
                    paddingBottom: 4,
                  }),
                  indicatorsContainer: (base) => ({
                    ...base,
                    height: 48,
                  }),
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="status-select"
              >
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <Select
                inputId="status-select"
                value={statusOptions.find(
                  (option) => option.value === formData.status
                )}
                onChange={(option) =>
                  setFormData({ ...formData, status: option.value })
                }
                options={statusOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn trạng thái"
                isSearchable={false}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: 48,
                    height: 48,
                    borderWidth: 2,
                    borderColor: state.isFocused ? "#ff6600" : "#d1d5db",
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(255,102,0,0.1)"
                      : "none",
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    paddingTop: 4,
                    paddingBottom: 4,
                  }),
                  indicatorsContainer: (base) => ({
                    ...base,
                    height: 48,
                  }),
                }}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <textarea
                id="topic-textarea"
                placeholder=" "
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-[#ff6600] focus:ring-2 focus:ring-[rgba(255,102,0,0.1)] bg-white peer"
                rows="3"
                required
              />
              <label
                htmlFor="topic-textarea"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-secondary peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
              >
                Chủ đề bảo vệ <span className="text-red-500">*</span>
              </label>
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="committee-select"
            >
              Thành viên hội đồng <span className="text-red-500">*</span>
              <span className="block text-xs text-gray-500 mt-1">
                (Thứ tự 1: Chủ tịch, Thứ tự 2: Thư ký, Thứ tự 3: Thành viên)
              </span>
            </label>
            <Select
              inputId="committee-select"
              value={selectedTeachers}
              onChange={(selected) => {
                if (selected && selected.length > 3) {
                  showToast(
                    "Chỉ được chọn tối đa 3 thành viên hội đồng",
                    "warning"
                  );
                  return;
                }
                setSelectedTeachers(selected || []);
              }}
              options={teacherOptions}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder={
                loadingTeachers
                  ? "Đang tải giảng viên..."
                  : "Chọn thành viên hội đồng (tối đa 3 người)"
              }
              isMulti
              isSearchable={true}
              isLoading={loadingTeachers}
              menuPlacement="auto"
              maxMenuHeight={80}
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 48,
                  borderWidth: 2,
                  borderColor: state.isFocused ? "#ff6600" : "#d1d5db",
                  boxShadow: state.isFocused
                    ? "0 0 0 3px rgba(255,102,0,0.1)"
                    : "none",
                }),
                menuList: (base) => ({
                  ...base,
                  maxHeight: 80,
                  overflowY: "auto",
                }),
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="reviewer-select"
            >
              Giảng viên phản biện <span className="text-red-500">*</span>
              <span className="block text-xs text-gray-500 mt-1">
                (Tối đa 1 người)
              </span>
            </label>
            <Select
              inputId="reviewer-select"
              value={selectedReviewers}
              onChange={(selected) => {
                if (selected && selected.length > 1) {
                  showToast(
                    "Chỉ được chọn tối đa 1 giảng viên phản biện",
                    "warning"
                  );
                  return;
                }
                setSelectedReviewers(selected || []);
              }}
              options={teacherOptions}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder={
                loadingTeachers
                  ? "Đang tải giảng viên..."
                  : "Chọn giảng viên phản biện (tối đa 1 người)"
              }
              isMulti
              isSearchable={true}
              isLoading={loadingTeachers}
              menuPlacement="auto"
              maxMenuHeight={80}
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 48,
                  borderWidth: 2,
                  borderColor: state.isFocused ? "#ff6600" : "#d1d5db",
                  boxShadow: state.isFocused
                    ? "0 0 0 3px rgba(255,102,0,0.1)"
                    : "none",
                }),
                menuList: (base) => ({
                  ...base,
                  maxHeight: 80,
                  overflowY: "auto",
                }),
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
              onClick={handleClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Tạo buổi bảo vệ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Session Detail Modal Component
const SessionDetailModal = ({
  session,
  assignedStudents,
  availableStudents,
  onAssignStudent,
  onUnassignStudent,
  onClose,
}) => {
  if (!session) return null;

  const getStatusLabel = (status) => {
    switch (status) {
      case "PLANNING":
        return "Lập kế hoạch";
      case "SCHEDULED":
        return "Sắp diễn ra";
      case "IN_PROGRESS":
        return "Đang diễn ra";
      case "COMPLETED":
        return "Hoàn thành";
      default:
        return "Lập kế hoạch";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Chi tiết Buổi Bảo Vệ: {session.sessionName}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            onClick={onClose}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Session Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Tên buổi bảo vệ:
              </p>
              <p className="text-lg font-bold text-gray-900">
                {session.sessionName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Ngày bảo vệ:</p>
              <p className="text-lg font-bold text-gray-900">
                {session.defenseDate}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Thời gian:</p>
              <p className="text-lg font-bold text-gray-900">
                {session.startTime
                  ? new Date(session.startTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Phòng:</p>
              <p className="text-lg font-bold text-gray-900">
                {session.location}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Trạng thái:</p>
              <p
                className={`text-lg font-bold ${
                  session.status === "PLANNING"
                    ? "text-purple-600"
                    : session.status === "SCHEDULED"
                    ? "text-blue-600"
                    : session.status === "IN_PROGRESS"
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {getStatusLabel(session.status)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Số sinh viên tối đa:
              </p>
              <p className="text-lg font-bold text-gray-900">
                {session.maxStudents}
              </p>
            </div>
          </div>

          {/* Student Management Section */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Quản lý Sinh viên
            </h4>

            <div className="grid grid-cols-1 gap-6">
              {/* Assigned Students */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">
                  Sinh viên đã gán ({assignedStudents.length}/
                  {session.maxStudents})
                </h5>
                {assignedStudents.length === 0 ? (
                  <p className="text-gray-600 italic">
                    Chưa có sinh viên nào được gán.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {assignedStudents.map((student) => (
                      <div
                        key={student.studentId}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              Thứ tự: {student.defenseOrder || "N/A"}
                            </span>
                            {student.registrationType && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full border ${getRegistrationTypeColor(
                                  student.registrationType
                                )}`}
                              >
                                {getRegistrationTypeLabel(
                                  student.registrationType
                                )}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {student.studentName}
                          </p>
                          <p className="text-xs text-gray-600">
                            MSSV: {student.studentCode}
                          </p>
                          <p className="text-xs text-gray-600">
                            Chuyên ngành: {student.major}
                          </p>
                          <p className="text-xs text-gray-700 font-medium">
                            {student.topicTitle}
                          </p>
                        </div>
                        <button
                          onClick={() => onUnassignStudent(student.studentId)}
                          className="text-red-600 hover:text-red-700 transition-colors duration-200 ml-2"
                          title="Hủy gán sinh viên"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefenseSessionsSchedule;
