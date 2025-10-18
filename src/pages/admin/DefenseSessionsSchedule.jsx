import React, { useState, useEffect, useRef } from "react";
import LoadingButton from "../../components/common/LoadingButton";
import Select from "react-select";
import { evalService } from "../../services/evalService";
import studentAssignmentService from "../../services/studentAssignment.service";
import { showToast } from "../../utils/toastHelper";
import { useLocation } from "react-router-dom";
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
    time: "",
    committeeMembers: [],
    reviewerMembers: [],
    status: "PLANNING",
  });
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [isSessionDetailModalOpen, setIsSessionDetailModalOpen] =
    useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [reviewerMembers, setReviewerMembers] = useState([]);
  const [lecturerById, setLecturerById] = useState({});
  const didInitRef = useRef(false);

  const location = useLocation();

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

  // Tuần đang hiển thị (bắt đầu từ thứ 2)
  const [currentWeekStart, setCurrentWeekStart] = useState(null);

  const getMonday = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diffToMon = (day + 6) % 7; // 0->6
    d.setDate(d.getDate() - diffToMon);
    return d;
  };

  const formatVNDate = (d) =>
    d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  // Tính nhãn tuần so với tuần hiện tại (để hiển thị màu)
  const getWeekBadge = () => {
    const todayMon = getMonday(new Date());
    const currentMon = currentWeekStart ? new Date(currentWeekStart) : todayMon;
    // chênh lệch số tuần (làm tròn theo Monday)
    const diffDays = Math.floor(
      (currentMon.getTime() - todayMon.getTime()) / (1000 * 60 * 60 * 24)
    );
    const diffWeeks = Math.round(diffDays / 7);

    if (diffWeeks === 0) {
      return {
        label: "Tuần hiện tại",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    }
    if (diffWeeks === 1) {
      return {
        label: "Tuần sau",
        className: "bg-blue-100 text-blue-700 border-blue-200",
      };
    }
    if (diffWeeks === -1) {
      return {
        label: "Tuần trước",
        className: "bg-amber-100 text-amber-700 border-amber-200",
      };
    }
    if (diffWeeks > 1) {
      return {
        label: `+${diffWeeks} tuần`,
        className: "bg-indigo-100 text-indigo-700 border-indigo-200",
      };
    }
    // diffWeeks < -1
    return {
      label: `${diffWeeks} tuần`,
      className: "bg-rose-100 text-rose-700 border-rose-200",
    };
  };

  // Lấy phạm vi tuần (Monday) của lịch đang chọn
  const getScheduleWeekRange = () => {
    if (!selectedSchedule || !selectedSchedule.value)
      return { min: null, max: null };
    const start = selectedSchedule.startDate
      ? new Date(selectedSchedule.startDate)
      : null;
    const end = selectedSchedule.endDate
      ? new Date(selectedSchedule.endDate)
      : null;
    return {
      min: start ? getMonday(start) : null,
      max: end ? getMonday(end) : null,
    };
  };

  // Đảm bảo currentWeekStart luôn nằm trong phạm vi của lịch đang chọn
  useEffect(() => {
    const { min, max } = getScheduleWeekRange();
    if (!currentWeekStart) return;
    const cur = new Date(currentWeekStart);
    if (min && cur < min) setCurrentWeekStart(min);
    if (max && cur > max) setCurrentWeekStart(max);
  }, [selectedSchedule, currentWeekStart]);

  // Common react-select styles with primary-500 focus/selected
  const primarySelectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: 8,
      minHeight: 40,
      borderColor: state.isFocused ? "#ea580c" : base.borderColor,
      boxShadow: state.isFocused ? "0 0 0 3px rgba(234,88,12,0.15)" : "none",
      "&:hover": { borderColor: "#ea580c" },
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? "#ea580c" : base.color,
      "&:hover": { color: "#ea580c" },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#ea580c"
        : state.isFocused
        ? "#fff7ed"
        : base.backgroundColor,
      color: state.isSelected ? "#ffffff" : base.color,
    }),
  };

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
    if (didInitRef.current) return;
    didInitRef.current = true;
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

              // Load thông tin hội đồng và phản biện
              Promise.all([
                userService
                  .getAllTeachers()
                  .then((ts) =>
                    Array.isArray(ts)
                      ? ts.reduce((acc, t) => {
                          acc[t.userId] =
                            t.fullName || `Giảng viên ${t.userId}`;
                          return acc;
                        }, {})
                      : {}
                  )
                  .catch(() => ({})),
                evalService
                  .exportDefenseSession(session.sessionId)
                  .then((dto) =>
                    Array.isArray(dto?.committee) ? dto.committee : []
                  )
                  .catch(() => []),
              ])
                .then(([lecturerMap, committees]) => {
                  setLecturerById(lecturerMap);
                  const boards = committees
                    .filter((c) => c.role !== "REVIEWER")
                    .map((c) => ({
                      ...c,
                      displayedName:
                        lecturerMap[c.lecturerId] ||
                        `Giảng viên ${c.lecturerId}`,
                    }));
                  const reviewers = committees
                    .filter((c) => c.role === "REVIEWER")
                    .map((c) => ({
                      ...c,
                      displayedName:
                        lecturerMap[c.lecturerId] ||
                        `Giảng viên ${c.lecturerId}`,
                    }));
                  setCommitteeMembers(boards);
                  setReviewerMembers(reviewers);
                })
                .catch(() => {
                  setCommitteeMembers([]);
                  setReviewerMembers([]);
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

              // Load danh sách sinh viên đã được gán
              loadAssignedStudents(session.sessionId).catch((error) => {
                console.error("Lỗi khi tải dữ liệu sinh viên:", error);
              });

              // Load thông tin hội đồng và phản biện
              Promise.all([
                userService
                  .getAllTeachers()
                  .then((ts) =>
                    Array.isArray(ts)
                      ? ts.reduce((acc, t) => {
                          acc[t.userId] =
                            t.fullName || `Giảng viên ${t.userId}`;
                          return acc;
                        }, {})
                      : {}
                  )
                  .catch(() => ({})),
                evalService
                  .exportDefenseSession(session.sessionId)
                  .then((dto) =>
                    Array.isArray(dto?.committee) ? dto.committee : []
                  )
                  .catch(() => []),
              ])
                .then(([lecturerMap, committees]) => {
                  setLecturerById(lecturerMap);
                  const boards = committees
                    .filter((c) => c.role !== "REVIEWER")
                    .map((c) => ({
                      ...c,
                      displayedName:
                        lecturerMap[c.lecturerId] ||
                        `Giảng viên ${c.lecturerId}`,
                    }));
                  const reviewers = committees
                    .filter((c) => c.role === "REVIEWER")
                    .map((c) => ({
                      ...c,
                      displayedName:
                        lecturerMap[c.lecturerId] ||
                        `Giảng viên ${c.lecturerId}`,
                    }));
                  setCommitteeMembers(boards);
                  setReviewerMembers(reviewers);
                })
                .catch(() => {
                  setCommitteeMembers([]);
                  setReviewerMembers([]);
                });

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
      // Chỉ chọn mặc định, để effect selectedSchedule tự load sessions
      if (!selectedSchedule) {
        setSelectedSchedule(schedules[0]);
      }
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
          status: schedule.status,
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
      // Đặt tuần hiện tại dựa theo dữ liệu trong lịch đã chọn
      try {
        const dates = Array.isArray(data)
          ? data
              .map((s) => (s.defenseDate ? new Date(s.defenseDate) : null))
              .filter((d) => d && !isNaN(d))
          : [];
        let base = null;
        if (dates.length > 0) {
          base = new Date(Math.min(...dates));
        } else if (selectedSchedule && selectedSchedule.startDate) {
          base = new Date(selectedSchedule.startDate);
        }
        if (base) setCurrentWeekStart(getMonday(base));
      } catch (_) {}
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
      // Khởi tạo tuần dựa trên ngày buổi bảo vệ (nếu có), nếu không lấy tuần hiện tại
      try {
        const dates = Array.isArray(data)
          ? data
              .map((s) => (s.defenseDate ? new Date(s.defenseDate) : null))
              .filter((d) => d && !isNaN(d))
          : [];
        const base =
          dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
        setCurrentWeekStart(getMonday(base));
      } catch (_) {
        setCurrentWeekStart(getMonday(new Date()));
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách session:", error);
      showToast("Lỗi khi tải danh sách session");
    } finally {
      setLoading(false);
    }
  };

  const getSessionsForTimeSlot = (day, time) => {
    return sessions.filter((session) => {
      if (!session.defenseDate) return false;

      const sessionDate = new Date(session.defenseDate);
      // Giới hạn theo tuần đang chọn
      try {
        const onlyDate = new Date(
          sessionDate.getFullYear(),
          sessionDate.getMonth(),
          sessionDate.getDate()
        );
        const weekStart = currentWeekStart
          ? new Date(currentWeekStart)
          : getMonday(new Date());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (!(onlyDate >= weekStart && onlyDate <= weekEnd)) return false;
      } catch (_) {}
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

      // Tạo defenseDate từ ngày và giờ được chọn (mặc định độ dài 1 giờ)
      const dateString = formData.date + "T" + formData.time + ":00";
      const defenseDateTime = new Date(dateString);

      // Điều chỉnh timezone để giữ nguyên giờ hiển thị local
      const timezoneOffset = defenseDateTime.getTimezoneOffset() * 60000; // ms
      const localStart = new Date(defenseDateTime.getTime() - timezoneOffset);
      const localEndRaw = new Date(defenseDateTime.getTime() + 60 * 60 * 1000); // +1h
      const localEnd = new Date(localEndRaw.getTime() - timezoneOffset);

      const startIso = localStart.toISOString().slice(0, 16);
      const endIso = localEnd.toISOString().slice(0, 16);

      const sessionData = {
        scheduleId: selectedSchedule.value,
        sessionName: formData.topic,
        defenseDate: formData.date, // Chỉ gửi ngày, không có giờ
        startTime: startIso, // thời gian bắt đầu (đã điều chỉnh timezone)
        endTime: endIso, // thời gian kết thúc mặc định sau 1 giờ (đã điều chỉnh timezone)
        location: formData.room,
        maxStudents: 5,
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

      // Hiển thị thông báo lỗi validation từ backend với cải thiện
      if (error.response && error.response.data) {
        let msg = "";

        // Xử lý các format lỗi khác nhau từ backend
        if (error.response.data.error) {
          msg = String(error.response.data.error);
        } else if (error.response.data.message) {
          msg = String(error.response.data.message);
        } else if (typeof error.response.data === "string") {
          msg = error.response.data;
        }

        if (msg) {
          // Thay ID -> tên giảng viên nếu bắt được ID
          try {
            const teachers = await userService.getAllTeachers();
            const idToName = new Map(
              (Array.isArray(teachers) ? teachers : []).map((t) => [
                String(t.userId),
                t.fullName || `Giảng viên ${t.userId}`,
              ])
            );

            // Tìm và thay thế tất cả các pattern "Giảng viên ID X" thành tên thực
            msg = msg.replace(/Giảng viên ID\s+(\d+)/gi, (match, id) => {
              const name = idToName.get(id);
              return name ? `Giảng viên ${name}` : match;
            });
          } catch (_) {}

          // Hiển thị thông báo lỗi với màu đỏ
          showToast(msg, "error");
        } else {
          showToast(
            "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
            "error"
          );
        }
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

  const handleExport = async () => {
    try {
      const data = await evalService.exportAllDefenseSessions();
      const safe = Array.isArray(data) ? data : [];

      // Load danh sách giảng viên để map ID thành tên
      let lecturerMap = {};
      try {
        const teachers = await userService.getAllTeachers();
        lecturerMap = Array.isArray(teachers)
          ? teachers.reduce((acc, t) => {
              acc[t.userId] = t.fullName || `Giảng viên ${t.userId}`;
              return acc;
            }, {})
          : {};
      } catch (error) {
        console.warn("Không thể tải danh sách giảng viên:", error);
      }

      // Function để map role sang tiếng Việt
      const getRoleInVietnamese = (role) => {
        switch (role) {
          case "CHAIRMAN":
            return "Chủ tịch";
          case "SECRETARY":
            return "Thư ký";
          case "MEMBER":
            return "Thành viên";
          case "REVIEWER":
            return "Phản biện";
          default:
            return role || "";
        }
      };

      // Thu thập sinh viên: sessionId, studentName, topicTitle
      const studentsRows = [];
      for (const s of safe) {
        try {
          const assigned = await studentAssignmentService.getAssignedStudents(
            s.sessionId
          );
          if (Array.isArray(assigned)) {
            for (const st of assigned) {
              studentsRows.push({
                sessionId: s.sessionId,
                studentName: st.studentName || "",
                topicTitle: st.topicTitle || "",
              });
            }
          }
        } catch (_) {}
      }

      // Thử dùng XLSX 2 sheet
      try {
        // Use CDN ESM to avoid bundler resolution issues
        const XLSXMod = await import(
          "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm"
        );
        const XLSX = XLSXMod.default || XLSXMod;
        const wb = XLSX.utils.book_new();
        const sessionSheetData = safe.map((s) => {
          // Tách committee thành các role riêng biệt
          let chairman = "";
          let secretary = "";
          let member = "";
          let reviewer = "";

          if (Array.isArray(s.committee)) {
            s.committee.forEach((c) => {
              const lecturerName =
                lecturerMap[c.lecturerId] || `Giảng viên ${c.lecturerId}`;
              switch (c.role) {
                case "CHAIRMAN":
                  chairman = lecturerName;
                  break;
                case "SECRETARY":
                  secretary = lecturerName;
                  break;
                case "MEMBER":
                  member = lecturerName;
                  break;
                case "REVIEWER":
                  reviewer = lecturerName;
                  break;
              }
            });
          }

          return {
            SessionId: s.sessionId,
            "Tên buổi bảo vệ": s.sessionName || "",
            Trường: s.universityName || "",
            Ngày: s.defenseDate || "",
            Giờ: s.startTimeFormatted || "",
            Phòng: s.location || "",
            "Sinh viên tham gia": s.assignedCount ?? "",
            "Chủ tịch": chairman,
            "Thư ký": secretary,
            "Thành viên hội đồng": member,
            "Phản biện": reviewer,
          };
        });
        const ws1 = XLSX.utils.json_to_sheet(sessionSheetData);
        XLSX.utils.book_append_sheet(wb, ws1, "Sessions");

        const ws2 = XLSX.utils.json_to_sheet(studentsRows);
        XLSX.utils.book_append_sheet(wb, ws2, "Students");

        const ts = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const name = `defense_sessions_${ts.getFullYear()}${pad(
          ts.getMonth() + 1
        )}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(
          ts.getMinutes()
        )}${pad(ts.getSeconds())}.xlsx`;

        // Sử dụng cách download an toàn hơn để tránh lỗi permission
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        showToast("Đã xuất XLSX (2 sheet)", "success");
        return;
      } catch (e) {
        console.warn("XLSX not available, fallback to CSV", e);
      }

      // Fallback CSV một sheet
      const headers = [
        "SessionId",
        "Tên buổi bảo vệ",
        "Trường",
        "Ngày",
        "Giờ",
        "Phòng",
        "Sinh viên tham gia",
        "Chủ tịch",
        "Thư ký",
        "Thành viên hội đồng",
        "Phản biện",
      ];
      const escapeCsv = (v) => {
        if (v === null || v === undefined) return "";
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      };
      const rows = safe
        .map((s) => {
          // Tách committee thành các role riêng biệt
          let chairman = "";
          let secretary = "";
          let member = "";
          let reviewer = "";

          if (Array.isArray(s.committee)) {
            s.committee.forEach((c) => {
              const lecturerName =
                lecturerMap[c.lecturerId] || `Giảng viên ${c.lecturerId}`;
              switch (c.role) {
                case "CHAIRMAN":
                  chairman = lecturerName;
                  break;
                case "SECRETARY":
                  secretary = lecturerName;
                  break;
                case "MEMBER":
                  member = lecturerName;
                  break;
                case "REVIEWER":
                  reviewer = lecturerName;
                  break;
              }
            });
          }

          return [
            s.sessionId,
            s.sessionName || "",
            s.universityName || "",
            s.defenseDate || "",
            s.startTimeFormatted || "",
            s.location || "",
            s.assignedCount ?? "",
            chairman,
            secretary,
            member,
            reviewer,
          ];
        })
        .map((r) => r.map(escapeCsv).join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const name = `defense_sessions_${ts.getFullYear()}${pad(
        ts.getMonth() + 1
      )}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(
        ts.getSeconds()
      )}.csv`;
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Đã xuất CSV (fallback)", "success");
    } catch (e) {
      console.error("Export error:", e);
      showToast("Lỗi khi xuất dữ liệu", "error");
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSessionDetail(session);
    setIsSessionDetailModalOpen(true);
    // Load danh sách sinh viên đã được gán
    loadAssignedStudents(session.sessionId).catch((error) => {
      console.error("Lỗi khi tải dữ liệu sinh viên:", error);
    });
    // Load thông tin hội đồng và phản biện
    Promise.all([
      userService
        .getAllTeachers()
        .then((ts) =>
          Array.isArray(ts)
            ? ts.reduce((acc, t) => {
                acc[t.userId] = t.fullName || `Giảng viên ${t.userId}`;
                return acc;
              }, {})
            : {}
        )
        .catch(() => ({})),
      evalService
        .exportDefenseSession(session.sessionId)
        .then((dto) => (Array.isArray(dto?.committee) ? dto.committee : []))
        .catch(() => []),
    ])
      .then(([lecturerMap, committees]) => {
        setLecturerById(lecturerMap);
        const boards = committees
          .filter((c) => c.role !== "REVIEWER")
          .map((c) => ({
            ...c,
            displayedName:
              lecturerMap[c.lecturerId] || `Giảng viên ${c.lecturerId}`,
          }));
        const reviewers = committees
          .filter((c) => c.role === "REVIEWER")
          .map((c) => ({
            ...c,
            displayedName:
              lecturerMap[c.lecturerId] || `Giảng viên ${c.lecturerId}`,
          }));
        setCommitteeMembers(boards);
        setReviewerMembers(reviewers);
      })
      .catch(() => {
        setCommitteeMembers([]);
        setReviewerMembers([]);
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

  if (loading && sessions.length === 0) {
    return (
      <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p>Đang tải dữ liệu...</p>
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
    return matchesSearch;
  });

  return (
    <div className="bg-gray-50 p-6">
      <div className="w-full">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Schedule select + Add button */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-[200px]">
                <Select
                  value={selectedSchedule}
                  onChange={setSelectedSchedule}
                  options={schedules}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Chọn lịch bảo vệ"
                  isSearchable={false}
                  styles={primarySelectStyles}
                />
              </div>

              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-white ${
                  selectedSchedule && selectedSchedule.value
                    ? selectedSchedule.status === "COMPLETED"
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-primary-500 hover:bg-primary-400"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (!selectedSchedule || !selectedSchedule.value) {
                    showToast("Vui lòng chọn lịch bảo vệ trước", "warning");
                    return;
                  }
                  if (selectedSchedule.status === "COMPLETED") {
                    showToast(
                      "Lịch bảo vệ đã kết thúc, không thể thêm buổi bảo vệ",
                      "warning"
                    );
                    return;
                  }
                  setIsModalOpen(true);
                }}
                disabled={
                  !selectedSchedule ||
                  !selectedSchedule.value ||
                  selectedSchedule.status === "COMPLETED"
                }
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

            {/* Right: Search + view toggle + export */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className={`h-5 w-5 ${
                      viewMode === "grid" ? "text-gray-300" : "text-gray-400"
                    }`}
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
                  placeholder={
                    viewMode === "grid"
                      ? "Tìm kiếm chỉ có trong danh sách"
                      : "Tìm kiếm buổi bảo vệ..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={viewMode === "grid"}
                  title={
                    viewMode === "grid"
                      ? "Tìm kiếm chỉ hoạt động trong chế độ danh sách. Vui lòng chuyển sang chế độ danh sách để sử dụng tính năng tìm kiếm."
                      : "Tìm kiếm theo tên buổi bảo vệ và phòng"
                  }
                  className={`pl-10 pr-4 py-2 border rounded-lg outline-none transition-all duration-200 ${
                    viewMode === "grid"
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
                  }`}
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
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-gray-600">
              Xem lịch bảo vệ theo từng ngày và khung giờ
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 mr-2">
                {(() => {
                  const start = currentWeekStart
                    ? new Date(currentWeekStart)
                    : getMonday(new Date());
                  const end = new Date(start);
                  end.setDate(end.getDate() + 6);
                  return `${formatVNDate(start)} - ${formatVNDate(end)}`;
                })()}
              </span>
              {(() => {
                const badge = getWeekBadge();
                return (
                  <span
                    className={`text-xs px-2 py-1 rounded-md border ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                );
              })()}
              <button
                type="button"
                className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setCurrentWeekStart((prev) => {
                    const base = prev ? new Date(prev) : getMonday(new Date());
                    base.setDate(base.getDate() - 7);
                    if (selectedSchedule && selectedSchedule.startDate) {
                      const minStart = getMonday(
                        new Date(selectedSchedule.startDate)
                      );
                      if (base < minStart) return minStart;
                    }
                    return base;
                  });
                }}
              >
                ←
              </button>
              {/* Removed "Tuần này" button as requested */}
              <button
                type="button"
                className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setCurrentWeekStart((prev) => {
                    const base = prev ? new Date(prev) : getMonday(new Date());
                    base.setDate(base.getDate() + 7);
                    if (selectedSchedule && selectedSchedule.endDate) {
                      const maxEndMonday = getMonday(
                        new Date(selectedSchedule.endDate)
                      );
                      if (base > maxEndMonday) return maxEndMonday;
                    }
                    return base;
                  });
                }}
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-0 overflow-x-auto pb-4">
            {/* Time column */}
            <div className="sticky left-0 bg-gray-50">
              <div className="h-16 flex items-center justify-center font-medium text-gray-700 bg-gray-100 border-b border-r border-gray-300">
                Thời gian
              </div>
              {timeSlots.map((time, index) => (
                <div
                  key={index}
                  className="h-28 flex items-center justify-center text-sm text-gray-600 bg-gray-50 border-b border-r border-gray-300 px-2"
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
                  const slotSessions = getSessionsForTimeSlot(day, time);
                  return (
                    <div
                      key={`${day}-${time}`}
                      className="h-28 border-b border-gray-300 p-1"
                    >
                      {slotSessions.length > 0 && (
                        <div
                          className={`flex flex-col gap-3 h-full pr-1 ${
                            slotSessions.length > 1
                              ? "overflow-y-auto thin-scrollbar"
                              : "justify-center"
                          }`}
                        >
                          {slotSessions.map((session) => (
                            <div
                              key={session.sessionId}
                              className={`rounded-lg p-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
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
                                  ? new Date(
                                      session.startTime
                                    ).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
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
                                    {
                                      value: "PLANNING",
                                      label: "Lập kế hoạch",
                                    },
                                    {
                                      value: "SCHEDULED",
                                      label: "Sắp diễn ra",
                                    },
                                    {
                                      value: "IN_PROGRESS",
                                      label: "Đang diễn ra",
                                    },
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
                          ))}
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

      {/* Summary Footer removed per request */}

      {/* Create Schedule Modal */}
      <CreateScheduleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        selectedSchedule={selectedSchedule}
        sessions={sessions}
      />

      {/* Session Detail Modal */}
      {isSessionDetailModalOpen && selectedSessionDetail && (
        <SessionDetailModal
          session={selectedSessionDetail}
          assignedStudents={assignedStudents}
          availableStudents={availableStudents}
          committeeMembers={committeeMembers}
          reviewerMembers={reviewerMembers}
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
  sessions,
}) => {
  const [formData, setFormData] = useState({
    date: "",
    time: "", // Bắt buộc chọn
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [busyTeachers, setBusyTeachers] = useState(new Set()); // Giảng viên bị vướng lịch
  const [checkingSchedule, setCheckingSchedule] = useState(false); // Đang kiểm tra lịch
  const [checkTimeout, setCheckTimeout] = useState(null); // Timeout cho debounce

  // Function để kiểm tra lịch trống của giảng viên
  const checkTeacherAvailability = async (teacherIds, date, time) => {
    if (!date || !time || !teacherIds.length) return new Set();

    try {
      setCheckingSchedule(true);
      const busySet = new Set();

      // Tạo thời gian để kiểm tra
      const dateString = date + "T" + time + ":00";
      const defenseDateTime = new Date(dateString);
      const timezoneOffset = defenseDateTime.getTimezoneOffset() * 60000;
      const localStart = new Date(defenseDateTime.getTime() - timezoneOffset);
      const localEnd = new Date(
        defenseDateTime.getTime() + 60 * 60 * 1000 - timezoneOffset
      );

      const startIso = localStart.toISOString().slice(0, 16);
      const endIso = localEnd.toISOString().slice(0, 16);

      // Kiểm tra từng giảng viên bằng cách lấy lịch của họ
      for (const teacherId of teacherIds) {
        try {
          // Lấy lịch của giảng viên
          const response = await fetch(
            `/api/eval-service/teacher/schedule/evaluator/${teacherId}/sessions`
          );
          if (response.ok) {
            const sessions = await response.json();

            // Kiểm tra xem có session nào trùng thời gian không
            const hasConflict = sessions.some((session) => {
              if (!session.startTime || !session.endTime) return false;

              const sessionStart = new Date(session.startTime);
              const sessionEnd = new Date(session.endTime);
              const checkStart = new Date(startIso);
              const checkEnd = new Date(endIso);

              // Kiểm tra xung đột thời gian
              return checkStart < sessionEnd && checkEnd > sessionStart;
            });

            if (hasConflict) {
              busySet.add(teacherId);
            }
          }
        } catch (error) {
          console.error(
            `Lỗi khi kiểm tra lịch giảng viên ${teacherId}:`,
            error
          );
          // Nếu không thể kiểm tra, coi như không bị vướng lịch để không block user
        }
      }

      return busySet;
    } catch (error) {
      console.error("Lỗi khi kiểm tra lịch giảng viên:", error);
      return new Set();
    } finally {
      setCheckingSchedule(false);
    }
  };

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

  // Effect để kiểm tra lịch trống khi thay đổi ngày/giờ (với debounce)
  useEffect(() => {
    // Clear timeout cũ nếu có
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    // Nếu không có ngày/giờ hoặc chưa có danh sách giảng viên, reset
    if (!formData.date || !formData.time || !teacherOptions.length) {
      setBusyTeachers(new Set());
      setCheckingSchedule(false);
      return;
    }

    // Debounce: đợi 500ms sau khi người dùng ngừng thay đổi
    const timeout = setTimeout(async () => {
      console.log("🔍 Kiểm tra lịch trống cho:", formData.date, formData.time);

      // Lấy tất cả teacher IDs
      const allTeacherIds = teacherOptions.map((t) => t.value);
      const busySet = await checkTeacherAvailability(
        allTeacherIds,
        formData.date,
        formData.time
      );
      setBusyTeachers(busySet);

      console.log("📊 Kết quả kiểm tra:", {
        totalTeachers: allTeacherIds.length,
        busyTeachers: busySet.size,
        busyIds: Array.from(busySet),
      });
    }, 500);

    setCheckTimeout(timeout);

    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [formData.date, formData.time, teacherOptions]);

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
    { value: "A2-201", label: "A2-201" },
    { value: "A2-202", label: "A2-202" },
    { value: "A2-203", label: "A2-203" },
    { value: "A2-204", label: "A2-204" },
    { value: "A2-205", label: "A2-205" },
    { value: "A4-201", label: "A4-201" },
    { value: "A4-202", label: "A4-202" },
    { value: "A4-203", label: "A4-203" },
    { value: "A4-204", label: "A4-204" },
    { value: "A4-205", label: "A4-205" },
    { value: "A6-201", label: "A6-201" },
    { value: "A6-202", label: "A6-202" },
    { value: "A6-203", label: "A6-203" },
    { value: "A6-204", label: "A6-204" },
    { value: "A6-205", label: "A6-205" },
    { value: "A8-201", label: "A8-201" },
    { value: "A8-202", label: "A8-202" },
    { value: "A8-203", label: "A8-203" },
    { value: "A8-204", label: "A8-204" },
    { value: "A8-205", label: "A8-205" },
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

  // Helpers to disable occupied room/time options live in modal
  const hhmmFromIso = (isoLike) => {
    try {
      const d = new Date(isoLike);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    } catch (_) {
      return null;
    }
  };

  const occupiedTimesForSelectedRoom = React.useMemo(() => {
    if (!formData?.room || !formData?.date) return new Set();
    const list = (sessions || []).filter(
      (s) =>
        s && s.location === formData.room && s.defenseDate === formData.date
    );
    return new Set(
      list
        .map((s) => hhmmFromIso(s.startTime))
        .filter((v) => typeof v === "string" && v.length === 5)
    );
  }, [formData?.room, formData?.date, sessions]);

  const occupiedRoomsForSelectedTime = React.useMemo(() => {
    if (!formData?.time || !formData?.date) return new Set();
    const list = (sessions || []).filter(
      (s) =>
        s &&
        s.defenseDate === formData.date &&
        hhmmFromIso(s.startTime) === formData.time
    );
    return new Set(list.map((s) => s.location).filter(Boolean));
  }, [formData?.time, formData?.date, sessions]);

  const statusOptions = [
    { value: "PLANNING", label: "Lập kế hoạch" },
    { value: "SCHEDULED", label: "Sắp diễn ra" },
    { value: "IN_PROGRESS", label: "Đang diễn ra" },
    { value: "COMPLETED", label: "Hoàn thành" },
  ];

  // Validation function
  const isFormValid = () => {
    return (
      formData.date.trim() !== "" &&
      formData.time.trim() !== "" &&
      formData.room.trim() !== "" &&
      formData.topic.trim() !== "" &&
      selectedTeachers.length > 0 &&
      selectedReviewers.length > 0
    );
  };

  const handleSubmit = async (e) => {
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

    const nextErrors = {};
    if (!formData.date) nextErrors.date = "Vui lòng chọn ngày";
    if (!formData.time) nextErrors.time = "Vui lòng chọn thời gian";
    if (!formData.room) nextErrors.room = "Vui lòng chọn phòng";
    if (!formData.topic.trim()) nextErrors.topic = "Vui lòng nhập chủ đề";
    if (selectedTeachers.length === 0)
      nextErrors.committeeMembers = "Vui lòng chọn thành viên hội đồng";
    if (selectedReviewers.length === 0)
      nextErrors.reviewerMembers = "Vui lòng chọn giảng viên phản biện";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSubmitting(true);
      await onSubmit({
        ...formData,
        committeeMembers: selectedTeachers,
        reviewerMembers: selectedReviewers,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Clear timeout nếu có
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    setFormData({
      date: "",
      time: "", // Reset: bắt buộc chọn lại
      room: "",
      topic: "",
      committeeMembers: [],
      reviewerMembers: [],
      status: "PLANNING", // Reset về status mặc định
    });
    setSelectedTeachers([]);
    setSelectedReviewers([]);
    setBusyTeachers(new Set());
    setCheckingSchedule(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Tạo buổi bảo vệ mới
          </h3>
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
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  if (fieldErrors.date)
                    setFieldErrors({ ...fieldErrors, date: "" });
                }}
                className="w-full h-12 px-4 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-[#ff6600] focus:ring-2 focus:ring-[rgba(255,102,0,0.1)] bg-white"
                required
                min={minDateStr || undefined}
                max={maxDateStr || undefined}
              />
              {fieldErrors.date && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.date}</p>
              )}
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
                onChange={(option) => {
                  setFormData({ ...formData, time: option.value });
                  if (fieldErrors.time)
                    setFieldErrors({ ...fieldErrors, time: "" });
                }}
                options={timeOptions.map((opt) => ({
                  ...opt,
                  isDisabled:
                    !!formData.room &&
                    occupiedTimesForSelectedRoom.has(opt.value),
                }))}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn thời gian"
                isDisabled={!formData.date || !formData.room}
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
              {fieldErrors.time && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.time}</p>
              )}
              {(!formData.date || !formData.room) && (
                <p className="mt-2 text-xs text-gray-500">
                  Vui lòng chọn ngày và phòng trước để xem các khung giờ khả
                  dụng.
                </p>
              )}
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
                onChange={(option) => {
                  setFormData({ ...formData, room: option.value });
                  if (fieldErrors.room)
                    setFieldErrors({ ...fieldErrors, room: "" });
                }}
                options={roomOptions.map((opt) => ({
                  ...opt,
                  isDisabled:
                    !!formData.time &&
                    occupiedRoomsForSelectedTime.has(opt.value),
                }))}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn phòng"
                isDisabled={!formData.date}
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
              {fieldErrors.room && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.room}</p>
              )}
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
                onChange={(option) => {
                  setFormData({ ...formData, status: option.value });
                }}
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
                onChange={(e) => {
                  setFormData({ ...formData, topic: e.target.value });
                  if (fieldErrors.topic)
                    setFieldErrors({ ...fieldErrors, topic: "" });
                }}
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
              <span className="block text-xs text-amber-600 mt-1">
                ⚠️ Hệ thống sẽ kiểm tra lịch trống của các giảng viên được chọn
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
                if (fieldErrors.committeeMembers)
                  setFieldErrors({ ...fieldErrors, committeeMembers: "" });
              }}
              options={teacherOptions.map((option) => ({
                ...option,
                isDisabled: busyTeachers.has(option.value),
                label: busyTeachers.has(option.value)
                  ? `${option.label} (Bị vướng lịch)`
                  : option.label,
              }))}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder={
                checkingSchedule
                  ? "Đang kiểm tra lịch giảng viên..."
                  : loadingTeachers
                  ? "Đang tải giảng viên..."
                  : "Chọn thành viên hội đồng (tối đa 3 người)"
              }
              isMulti
              isSearchable={true}
              isLoading={loadingTeachers || checkingSchedule}
              menuPlacement="auto"
              maxMenuHeight={200}
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
                  maxHeight: 200,
                  overflowY: "auto",
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isDisabled
                    ? "#fef2f2"
                    : state.isSelected
                    ? "#ea580c"
                    : state.isFocused
                    ? "#fff7ed"
                    : base.backgroundColor,
                  color: state.isDisabled
                    ? "#dc2626"
                    : state.isSelected
                    ? "#ffffff"
                    : base.color,
                  cursor: state.isDisabled ? "not-allowed" : "pointer",
                }),
              }}
            />
            {fieldErrors.committeeMembers && (
              <p className="mt-2 text-sm text-red-600">
                {fieldErrors.committeeMembers}
              </p>
            )}
            {/* Thông báo trạng thái kiểm tra lịch */}
            {checkingSchedule && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                  <p className="text-xs text-yellow-700 font-medium">
                    🔍 Đang kiểm tra lịch trống của {teacherOptions.length}{" "}
                    giảng viên...
                  </p>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  Kiểm tra cho ngày {formData.date} lúc {formData.time}
                </p>
              </div>
            )}

            {/* Thông báo giảng viên bị vướng lịch */}
            {busyTeachers.size > 0 && !checkingSchedule && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-medium">
                  ⚠️ Có {busyTeachers.size} giảng viên bị vướng lịch trong khung
                  giờ này
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Các giảng viên này sẽ không thể chọn được
                </p>
              </div>
            )}

            {/* Thông báo khi tất cả giảng viên đều khả dụng */}
            {busyTeachers.size === 0 &&
              !checkingSchedule &&
              formData.date &&
              formData.time &&
              teacherOptions.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 font-medium">
                    ✅ Tất cả {teacherOptions.length} giảng viên đều khả dụng
                    trong khung giờ này
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Bạn có thể chọn bất kỳ giảng viên nào
                  </p>
                </div>
              )}

            {selectedTeachers.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">
                  📋 Đã chọn {selectedTeachers.length} thành viên hội đồng:
                </p>
                <ul className="text-xs text-blue-600 mt-1">
                  {selectedTeachers.map((teacher, index) => (
                    <li key={teacher.value} className="flex items-center">
                      <span className="mr-2">{index + 1}.</span>
                      <span>{teacher.label}</span>
                      {busyTeachers.has(teacher.value) && (
                        <span className="ml-2 text-red-600 text-xs">
                          ⚠️ Bị vướng lịch
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
              <span className="block text-xs text-amber-600 mt-1">
                ⚠️ Hệ thống sẽ kiểm tra lịch trống của giảng viên phản biện
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
                if (fieldErrors.reviewerMembers)
                  setFieldErrors({ ...fieldErrors, reviewerMembers: "" });
              }}
              options={teacherOptions.map((option) => ({
                ...option,
                isDisabled: busyTeachers.has(option.value),
                label: busyTeachers.has(option.value)
                  ? `${option.label} (Bị vướng lịch)`
                  : option.label,
              }))}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder={
                checkingSchedule
                  ? "Đang kiểm tra lịch giảng viên..."
                  : loadingTeachers
                  ? "Đang tải giảng viên..."
                  : "Chọn giảng viên phản biện (tối đa 1 người)"
              }
              isMulti
              isSearchable={true}
              isLoading={loadingTeachers || checkingSchedule}
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
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isDisabled
                    ? "#fef2f2"
                    : state.isSelected
                    ? "#ea580c"
                    : state.isFocused
                    ? "#fff7ed"
                    : base.backgroundColor,
                  color: state.isDisabled
                    ? "#dc2626"
                    : state.isSelected
                    ? "#ffffff"
                    : base.color,
                  cursor: state.isDisabled ? "not-allowed" : "pointer",
                }),
              }}
            />
            {fieldErrors.reviewerMembers && (
              <p className="mt-2 text-sm text-red-600">
                {fieldErrors.reviewerMembers}
              </p>
            )}
            {selectedReviewers.length > 0 && (
              <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-xs text-indigo-700 font-medium">
                  📝 Đã chọn giảng viên phản biện:
                </p>
                <ul className="text-xs text-indigo-600 mt-1">
                  {selectedReviewers.map((reviewer) => (
                    <li key={reviewer.value} className="flex items-center">
                      <span className="mr-2">•</span>
                      <span>{reviewer.label}</span>
                      {busyTeachers.has(reviewer.value) && (
                        <span className="ml-2 text-red-600 text-xs">
                          ⚠️ Bị vướng lịch
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Thông báo validation tổng quan */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Thông tin quan trọng về validation
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Real-time validation:</strong> Hệ thống sẽ kiểm
                      tra lịch trống ngay khi bạn chọn ngày/giờ
                    </li>
                    <li>
                      <strong>Preventive blocking:</strong> Giảng viên bị vướng
                      lịch sẽ bị disable và không thể chọn
                    </li>
                    <li>
                      <strong>Visual feedback:</strong> Giảng viên bị vướng lịch
                      sẽ hiển thị "(Bị vướng lịch)" và có màu đỏ
                    </li>
                    <li>
                      <strong>Smart suggestions:</strong> Vui lòng chọn thời
                      gian khác nếu có quá nhiều giảng viên bị vướng lịch
                    </li>
                    <li>
                      <strong>Room validation:</strong> Phòng học cũng sẽ được
                      kiểm tra để tránh xung đột thời gian
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
              onClick={handleClose}
            >
              Hủy
            </button>
            <LoadingButton
              type="submit"
              isLoading={submitting}
              disabled={!isFormValid()}
              loadingText="Đang tạo..."
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isFormValid() && !submitting
                  ? "bg-primary-500 hover:bg-primary-400 text-white"
                  : "bg-primary-300 text-white"
              }`}
            >
              Tạo buổi bảo vệ
            </LoadingButton>
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
  committeeMembers,
  reviewerMembers,
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
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl">
          <h3 className="text-xl font-semibold text-gray-900">
            Chi tiết buổi bảo vệ: {session.sessionName}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar">
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
                <p className="text-sm font-medium text-gray-700">
                  Ngày bảo vệ:
                </p>
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

            {/* Committee & Reviewers */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Hội đồng & Phản biện
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-2">
                    Thành viên hội đồng
                  </h5>
                  {!committeeMembers || committeeMembers.length === 0 ? (
                    <p className="text-gray-600 italic">
                      Chưa có dữ liệu hội đồng.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {committeeMembers.map((m) => (
                        <li
                          key={`board-${m.lecturerId}-${m.role}`}
                          className="p-2 bg-purple-50 rounded border border-purple-200 text-sm text-gray-800"
                        >
                          <span className="font-semibold">
                            {m.displayedName || `Giảng viên ${m.lecturerId}`}
                          </span>
                          <span className="ml-2 text-purple-700">
                            {m.role === "CHAIRMAN"
                              ? "Chủ tịch hội đồng"
                              : m.role === "SECRETARY"
                              ? "Thư ký"
                              : "Thành viên hội đồng"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-2">
                    Giảng viên phản biện
                  </h5>
                  {!reviewerMembers || reviewerMembers.length === 0 ? (
                    <p className="text-gray-600 italic">
                      Chưa có dữ liệu phản biện.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {reviewerMembers.map((m) => (
                        <li
                          key={`review-${m.lecturerId}-${m.role}`}
                          className="p-2 bg-indigo-50 rounded border border-indigo-200 text-sm text-gray-800"
                        >
                          <span className="font-semibold">
                            {m.displayedName || `Giảng viên ${m.lecturerId}`}
                          </span>
                          {/* Reviewer: ẩn nhãn (REVIEWER) theo yêu cầu */}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Student Management Section */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Quản lý sinh viên
              </h4>

              <div className="grid grid-cols-1 gap-6">
                {/* Assigned Students */}
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-3">
                    Sinh viên trong buổi bảo vệ ({assignedStudents.length}/
                    {session.maxStudents})
                  </h5>
                  {assignedStudents.length === 0 ? (
                    <p className="text-gray-600 italic">
                      Chưa có sinh viên nào được thêm vào buổi bảo vệ này.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto thin-scrollbar">
                      {assignedStudents.map((student) => (
                        <div
                          key={student.studentId}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
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
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white rounded-b-2xl">
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
