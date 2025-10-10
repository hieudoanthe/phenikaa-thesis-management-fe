import React, { useState, useEffect, useMemo, useRef } from "react";
import Select from "react-select";
import { showToast } from "../../utils/toastHelper";
import studentAssignmentService from "../../services/studentAssignment.service";
import { API_ENDPOINTS } from "../../config/api";
import { apiGet } from "../../services/mainHttpClient";
import { useNavigate } from "react-router-dom";
import { evalService } from "../../services/evalService";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";

const StudentPeriodManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Global error handler để bắt lỗi từ browser extension
  useEffect(() => {
    const handleError = (event) => {
      // Bỏ qua lỗi từ browser extension
      if (
        event.error &&
        event.error.message &&
        (event.error.message.includes("translate-page") ||
          event.error.message.includes("save-page") ||
          event.error.message.includes("content-all.js"))
      ) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleError);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, []);

  // Department mapping sử dụng translation
  const departmentMapping = {
    CNTT: t("admin.studentPeriod.departments.CNTT"),
    KHMT: t("admin.studentPeriod.departments.KHMT"),
    KTMT: t("admin.studentPeriod.departments.KTMT"),
    HTTT: t("admin.studentPeriod.departments.HTTT"),
    KTPM: t("admin.studentPeriod.departments.KTPM"),
    ATTT: t("admin.studentPeriod.departments.ATTT"),
    MMT: t("admin.studentPeriod.departments.MMT"),
    PM: t("admin.studentPeriod.departments.PM"),
  };

  // Status mapping sử dụng translation
  const statusMapping = {
    ACTIVE: t("admin.studentPeriod.status.ACTIVE"),
    INACTIVE: t("admin.studentPeriod.status.INACTIVE"),
    CLOSED: t("admin.studentPeriod.status.CLOSED"),
    UPCOMING: t("admin.studentPeriod.status.UPCOMING"),
    PENDING: t("admin.studentPeriod.status.PENDING"),
    APPROVED: t("admin.studentPeriod.status.APPROVED"),
    REJECTED: t("admin.studentPeriod.status.REJECTED"),
  };

  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [students, setStudents] = useState([]);
  const [totalPagesServer, setTotalPagesServer] = useState(1);
  const [totalElementsServer, setTotalElementsServer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewType, setViewType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(7);
  const latestLoadRef = useRef(0);
  const [tableRenderKey, setTableRenderKey] = useState("initial");

  const [studentsCache, setStudentsCache] = useState(new Map());
  const [lastLoadedPeriod, setLastLoadedPeriod] = useState(null);

  // State cho việc gán sinh viên vào buổi bảo vệ
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [assignedStudents, setAssignedStudents] = useState(new Map());
  const [autoAssigning, setAutoAssigning] = useState(false);

  const extractStudentCode = (profile, fallbackId) => {
    const candidates = [
      profile?.username,
      profile?.userName,
      profile?.email,
      profile?.studentCode,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.length > 0) {
        const code = c.includes("@") ? c.split("@")[0] : c;
        if (code) return code;
      }
    }
    return fallbackId != null ? String(fallbackId) : "";
  };

  // Preview auto arrange
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]); // [{sessionId, sessionName, isVirtual, students:[{studentId, name, topicTitle, major, reviewer}]}]
  const [previewSelectBySession, setPreviewSelectBySession] = useState({}); // sessionId -> studentId
  const [confirmingAssign, setConfirmingAssign] = useState(false);

  // State cho việc xem thông tin giảng viên
  const [showTeacherInfoModal, setShowTeacherInfoModal] = useState(false);
  const [selectedTeacherInfo, setSelectedTeacherInfo] = useState(null);
  const [loadingTeacherInfo, setLoadingTeacherInfo] = useState(false);

  // State cho việc xem thông tin sinh viên
  const [showStudentInfoModal, setShowStudentInfoModal] = useState(false);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);
  const [loadingStudentInfo, setLoadingStudentInfo] = useState(false);

  // Load danh sách đợt đăng ký
  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedPeriod, viewType, searchQuery, filterStatus]);

  useEffect(() => {
    const checkAllStudentAssignments = async () => {
      if (students.length === 0) return;

      try {
        // Tối ưu: Lấy tất cả assignments một lần thay vì N+1 queries
        const allAssignments =
          await studentAssignmentService.getAllStudentAssignments();

        const newAssignedStudents = new Map();

        // Map assignments theo studentId
        allAssignments.forEach((assignment) => {
          newAssignedStudents.set(assignment.studentId, {
            sessionId: assignment.sessionId,
            sessionName: assignment.sessionName,
            location: assignment.location,
            defenseDate: assignment.defenseDate,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            defenseOrder: assignment.defenseOrder,
          });
        });

        setAssignedStudents(newAssignedStudents);
      } catch (error) {
        // Fallback: chỉ kiểm tra 10 sinh viên đầu tiên để tránh quá tải
        const studentsToCheck = students.slice(0, 10);
        const newAssignedStudents = new Map();

        const results = await Promise.allSettled(
          studentsToCheck.map(async (student) => {
            try {
              const assignment = await checkStudentAssignment(
                student.studentId
              );
              return { studentId: student.studentId, assignment };
            } catch (error) {
              return { studentId: student.studentId, assignment: null };
            }
          })
        );

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value.assignment) {
            newAssignedStudents.set(
              result.value.studentId,
              result.value.assignment
            );
          }
        });

        setAssignedStudents(newAssignedStudents);
      }
    };

    checkAllStudentAssignments();
  }, [students]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      // Cleanup nếu cần
    };
  }, []);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      // Gọi API thực tế để lấy danh sách đợt đăng ký
      const response = await apiGet(API_ENDPOINTS.GET_REGISTRATION_PERIODS);

      if (response && Array.isArray(response)) {
        const formattedPeriods = response.map((period) => ({
          value: period.periodId,
          label: `${period.periodName} - ${
            statusMapping[period.status] || period.status
          }`,
          status: period.status,
        }));
        setPeriods(formattedPeriods);

        if (formattedPeriods.length > 0) {
          // Tự động chọn đợt ACTIVE gần nhất
          const activePeriod = formattedPeriods.find(
            (period) => period.status === "ACTIVE"
          );
          const selectedPeriod = activePeriod || formattedPeriods[0];
          setSelectedPeriod(selectedPeriod);

          // Load data ngay sau khi chọn đợt (dùng table loading để tránh flash empty)
          flushSync(() => {
            setIsTableLoading(true);
            setStudents([]);
          });
          const req = ++latestLoadRef.current;
          await loadStudentsByPeriod(selectedPeriod.value, 0, true, null, req);
        }
      } else {
        setPeriods([]);
        showToast(t("admin.studentPeriod.noPeriods"));
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách đợt đăng ký:", error);
      showToast(t("admin.studentPeriod.errorLoadingPeriods"));
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsByPeriod = async (
    periodId,
    pageOverride = null,
    silent = false,
    sizeOverride = null,
    requestId = latestLoadRef.current
  ) => {
    const MIN_TABLE_LOADING_MS = 400;
    const startAt = Date.now();
    try {
      // Chỉ hiển thị spinner bảng nếu là chuyển trang/refresh cục bộ
      if (periods.length > 0) {
        if (silent) setIsTableLoading(true);
        else setLoading(true);
      }

      // Gọi API song song để tăng tốc độ
      const effectivePage = pageOverride != null ? pageOverride : currentPage;
      const effectiveSize = sizeOverride != null ? sizeOverride : pageSize;
      const apiCall = (() => {
        switch (viewType) {
          case "registered":
            return studentAssignmentService.getRegistrationsByPeriod(
              periodId,
              effectivePage,
              effectiveSize
            );
          case "suggested":
            return studentAssignmentService.getSuggestedStudentsByPeriod(
              periodId,
              effectivePage,
              effectiveSize
            );
          case "all":
          default:
            return studentAssignmentService.getAllStudentsByPeriod(
              periodId,
              effectivePage,
              effectiveSize
            );
        }
      })();

      const server = await apiCall;
      const studentsData = server?.content || server || [];

      // Guard: ignore stale responses
      if (requestId !== latestLoadRef.current) return;

      setTotalPagesServer(server?.totalPages || 1);
      setTotalElementsServer(server?.totalElements || studentsData.length);

      // Tối ưu hóa xử lý dữ liệu
      const studentsWithBasicInfo = (studentsData || [])
        .filter(Boolean)
        .map((s) => {
          const studentCode = s?.username
            ? extractStudentCode({ username: s.username }, s.studentId)
            : s?.studentId?.toString() || "";

          return {
            studentId: s?.studentId,
            topicId: s?.topicId,
            topicTitle: s?.topicTitle || "N/A",
            topicCode: s?.topicCode || "N/A",
            supervisorId: s?.supervisorId,
            registrationType: s?.registrationType || "N/A",
            suggestionStatus: s?.suggestionStatus || null,
            registrationPeriodId: s?.registrationPeriodId,
            fullName: s?.fullName || `Sinh viên ${s?.studentId ?? ""}`,
            username: s?.username,
            studentCode,
            major: "CNTT",
            teacherInfo: {
              fullName:
                s?.supervisorFullName ||
                (s?.supervisorId ? `Giảng viên ${s?.supervisorId}` : "N/A"),
            },
          };
        });

      // Apply only if still latest
      if (requestId !== latestLoadRef.current) return;

      setStudents(studentsWithBasicInfo);
      setLastLoadedPeriod(periodId);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sinh viên:", error);
      showToast(t("admin.studentPeriod.errorLoadingStudents"));
      setStudents([]);
    } finally {
      // Only end loading for latest request
      const elapsed = Date.now() - startAt;
      const ensureMinDelay =
        silent && elapsed < MIN_TABLE_LOADING_MS
          ? MIN_TABLE_LOADING_MS - elapsed
          : 0;
      setTimeout(() => {
        if (requestId === latestLoadRef.current) {
          setLoading(false);
          setIsTableLoading(false);
        }
      }, ensureMinDelay);
    }
  };

  const handlePeriodChange = async (selectedOption) => {
    flushSync(() => {
      setSelectedPeriod(selectedOption);
      setCurrentPage(0);
      setIsTableLoading(true);
      setStudents([]);
      setTableRenderKey(`period-0-${Date.now()}`);
    });
    // Load data ngay khi chọn đợt
    if (selectedOption?.value) {
      const req = ++latestLoadRef.current;
      await loadStudentsByPeriod(selectedOption.value, 0, false, null, req);
    }
  };

  // Giống UserManagement: điều khiển chuyển trang chủ động, giữ UI mượt
  const handlePageChange = async (newPage) => {
    const max = Math.max(1, totalPagesServer) - 1;
    if (newPage < 0 || newPage > max) return;

    // Synchronously switch UI to loading state to avoid any flash of old data
    flushSync(() => {
      setIsTableLoading(true);
      setStudents([]);
      setCurrentPage(newPage);
      setTableRenderKey(`page-${newPage}-${Date.now()}`);
    });
    if (selectedPeriod?.value) {
      const req = ++latestLoadRef.current;
      await loadStudentsByPeriod(
        selectedPeriod.value,
        newPage,
        true,
        null,
        req
      );
    } else {
      setIsTableLoading(false);
    }
  };

  const handleViewTypeChange = (selectedOption) => {
    flushSync(() => {
      setViewType(selectedOption.value);
      setCurrentPage(0);
      setIsTableLoading(true);
      setStudents([]);
      setTableRenderKey(`view-${selectedOption.value}-0-${Date.now()}`);
    });
    const req = ++latestLoadRef.current;
    if (selectedPeriod?.value) {
      loadStudentsByPeriod(selectedPeriod.value, 0, true, null, req);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "APPROVED":
        return "Đã duyệt";
      case "PENDING":
        return "Chờ duyệt";
      case "REJECTED":
        return "Từ chối";
      default:
        return "N/A";
    }
  };

  const getRegistrationTypeColor = (type) => {
    switch (type) {
      case "REGISTERED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SUGGESTED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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

  // Định dạng chỉ giờ từ ISO hoặc HH:mm(:ss) -> HH:mm
  const formatTime = (value) => {
    if (!value) return "";
    const raw = String(value);
    // Nếu là ISO có 'T', lấy phần sau 'T'
    let timePart = raw.includes("T") ? raw.split("T")[1] : raw;
    // Bỏ suffix Z hoặc mili-giây nếu có
    timePart = timePart.replace("Z", "");
    const match = timePart.match(/^(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : timePart;
  };

  // Lọc sinh viên theo search query và status (an toàn với phần tử undefined)
  // Sử dụng useMemo để tối ưu performance
  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) return [];

    return students.filter(Boolean).filter((student) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        student?.topicTitle?.toLowerCase().includes(q) ||
        student?.studentId?.toString().includes(searchQuery) ||
        student?.topicCode?.toLowerCase().includes(q) ||
        student?.fullName?.toLowerCase().includes(q) ||
        student?.studentCode?.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "all" || student?.suggestionStatus === filterStatus;

      return !!matchesSearch && !!matchesStatus;
    });
  }, [students, searchQuery, filterStatus]);

  // Tập sinh viên dùng để hiển thị
  const displayBaseStudents = students;

  const displayedFilteredStudents = useMemo(() => {
    if (!displayBaseStudents || displayBaseStudents.length === 0) return [];

    const lower = searchQuery.toLowerCase();
    return displayBaseStudents.filter(Boolean).filter((student) => {
      const matchesSearch =
        student?.topicTitle?.toLowerCase().includes(lower) ||
        student?.studentId?.toString().includes(searchQuery) ||
        student?.topicCode?.toLowerCase().includes(lower) ||
        student?.fullName?.toLowerCase().includes(lower) ||
        student?.studentCode?.toLowerCase().includes(lower);
      const matchesStatus =
        filterStatus === "all" || student?.suggestionStatus === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [displayBaseStudents, searchQuery, filterStatus]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, filterStatus]);

  // Danh sách sinh viên theo trang (client-side pagination)
  const displayedPaginatedStudents = useMemo(() => {
    // Server-side: đã nhận đúng trang từ backend; vẫn lọc nhẹ trên client theo search/status
    const current = displayedFilteredStudents || [];
    return current;
  }, [displayedFilteredStudents]);

  const viewTypeOptions = [
    { value: "all", label: "Tất cả sinh viên" },
    { value: "registered", label: "Sinh viên đăng ký" },
    { value: "suggested", label: "Sinh viên đề xuất" },
  ];

  const statusFilterOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "APPROVED", label: "Đã duyệt" },
    { value: "PENDING", label: "Chờ duyệt" },
    { value: "REJECTED", label: "Từ chối" },
  ];

  /**
   * Kiểm tra sinh viên đã được gán vào buổi bảo vệ nào chưa
   */
  const checkStudentAssignment = async (studentId) => {
    try {
      // Lấy tất cả buổi bảo vệ (kể cả đã đầy) để kiểm tra assignment
      const availableSessions = await studentAssignmentService.getAllSessions();

      // Kiểm tra từng buổi bảo vệ để tìm sinh viên
      for (const session of availableSessions) {
        try {
          const assignedStudents =
            await studentAssignmentService.getAssignedStudents(
              session.sessionId
            );

          const studentAssignment = assignedStudents.find(
            (student) =>
              student.studentId == studentId ||
              student.studentId === parseInt(studentId)
          );

          if (studentAssignment) {
            return {
              sessionId: session.sessionId,
              sessionName: session.sessionName,
              location: session.location,
              defenseDate: session.defenseDate,
              startTime: session.startTime,
              endTime: session.endTime,
              defenseOrder: studentAssignment.defenseOrder,
            };
          }
        } catch (error) {
          console.warn(
            `Không thể kiểm tra buổi bảo vệ ${session.sessionId}:`,
            error
          );
          continue;
        }
      }

      return null; // Không tìm thấy assignment
    } catch (error) {
      console.error(
        `Lỗi khi kiểm tra assignment cho sinh viên ${studentId}:`,
        error
      );
      return null;
    }
  };

  /**
   * Xử lý khi click nút "Hủy gán"
   */
  const handleUnassignStudent = async (student) => {
    try {
      const assignment = assignedStudents.get(student.studentId);
      if (!assignment) {
        showToast("Không tìm thấy thông tin gán của sinh viên");
        return;
      }

      const result = await studentAssignmentService.unassignStudent(
        assignment.sessionId,
        student.studentId
      );

      if (result.success) {
        showToast("Hủy gán sinh viên thành công!");

        // Cập nhật state
        const newAssignedStudents = new Map(assignedStudents);
        newAssignedStudents.delete(student.studentId);
        setAssignedStudents(newAssignedStudents);

        // Reload danh sách sinh viên
        if (selectedPeriod) {
          loadStudentsByPeriod(selectedPeriod.value);
        }
      } else {
        showToast(result.message || "Không thể hủy gán sinh viên");
      }
    } catch (error) {
      console.error("Lỗi khi hủy gán sinh viên:", error);
      showToast("Lỗi khi hủy gán sinh viên");
    }
  };

  /**
   * Xử lý khi click nút "Gán vào lịch"
   */
  const handleAssignToSession = async (student) => {
    try {
      // Chặn gán nếu trạng thái đang chờ duyệt
      if (student?.suggestionStatus === "PENDING") {
        showToast(
          "Sinh viên đang ở trạng thái Chờ duyệt, không thể thêm vào buổi bảo vệ.",
          "warning"
        );
        return;
      }
      // Chặn gán nếu đợt đã CLOSED
      if (selectedPeriod?.status === "CLOSED") {
        showToast(
          "Đợt đăng ký đã kết thúc (CLOSED), không thể gán.",
          "warning"
        );
        return;
      }
      // Hiển thị popup ngay lập tức
      console.log("Opening assignment modal for student:", student);
      setSelectedStudent(student);
      setSelectedSessionId(null);
      setShowAssignmentModal(true);
      setLoadingSessions(true);

      // Load sessions trong background
      try {
        const sessions = await studentAssignmentService.getAvailableSessions();
        console.log("Available sessions from API:", sessions);

        if (!sessions || sessions.length === 0) {
          console.warn("Không có buổi bảo vệ nào có sẵn");
          setAvailableSessions([]);
          return;
        }

        // Đảm bảo dữ liệu có cấu trúc đúng
        const formattedSessions = sessions.map((session) => {
          console.log("Processing session:", session);
          const formatted = {
            sessionId: session.sessionId || session.id,
            sessionName:
              session.sessionName ||
              session.name ||
              `Buổi ${session.sessionId || session.id}`,
            defenseDate: session.defenseDate || session.date,
            location: session.location || session.room || "N/A",
            maxStudents: session.maxStudents || 10,
            currentStudents: session.currentStudents || 0,
          };
          console.log("Formatted session:", formatted);
          return formatted;
        });

        console.log("Formatted sessions:", formattedSessions);
        setAvailableSessions(formattedSessions);
      } catch (sessionError) {
        console.error("Lỗi khi lấy danh sách buổi bảo vệ:", sessionError);
        setAvailableSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    } catch (error) {
      console.error("Lỗi khi mở popup gán sinh viên:", error);
      showToast("Lỗi khi mở popup gán sinh viên");
    }
  };

  /**
   * Xử lý khi gán sinh viên vào buổi bảo vệ
   */
  const handleAssignStudent = async () => {
    console.log("handleAssignStudent called with:", {
      selectedStudent,
      selectedSessionId,
    });

    if (!selectedStudent || !selectedSessionId) {
      console.log("Validation failed:", {
        selectedStudent: !!selectedStudent,
        selectedSessionId: !!selectedSessionId,
      });
      showToast("Vui lòng chọn sinh viên và buổi bảo vệ");
      return;
    }

    try {
      setAssigningStudent(true);

      const studentData = {
        studentId: selectedStudent.studentId,
        topicId: selectedStudent.topicId,
        supervisorId: selectedStudent.supervisorId,
        studentName: selectedStudent.fullName,
        studentMajor: selectedStudent.major,
        topicTitle: selectedStudent.topicTitle,
      };

      const result = await studentAssignmentService.assignStudent(
        selectedSessionId,
        studentData
      );

      if (result.success) {
        showToast("Gán sinh viên vào buổi bảo vệ thành công!");

        // Cập nhật state assignedStudents ngay lập tức
        const selectedSession = availableSessions.find(
          (s) => s.sessionId === selectedSessionId
        );
        if (selectedSession) {
          const newAssignedStudents = new Map(assignedStudents);
          newAssignedStudents.set(selectedStudent.studentId, {
            sessionId: selectedSessionId,
            sessionName: selectedSession.sessionName,
            location: selectedSession.location,
            defenseDate: selectedSession.defenseDate,
          });
          setAssignedStudents(newAssignedStudents);
        }

        setShowAssignmentModal(false);
        setSelectedStudent(null);
        setSelectedSessionId(null);

        // Reload danh sách sinh viên
        if (selectedPeriod) {
          loadStudentsByPeriod(selectedPeriod.value);
        }
      } else {
        showToast(result.message || "Không thể gán sinh viên vào buổi bảo vệ");
      }
    } catch (error) {
      console.error("Lỗi khi gán sinh viên:", error);
      showToast("Lỗi khi gán sinh viên vào buổi bảo vệ");
    } finally {
      setAssigningStudent(false);
    }
  };

  /**
   * Đóng modal gán sinh viên
   */
  const handleCloseAssignmentModal = () => {
    console.log("Closing assignment modal, resetting states");
    setShowAssignmentModal(false);
    setSelectedStudent(null);
    setSelectedSessionId(null);
    setAvailableSessions([]);
  };

  /**
   * Xử lý khi click nút "Xem chi tiết" - chuyển sang trang Quản lý buổi bảo vệ
   */
  const handleViewDetails = (student) => {
    // Chuyển sang trang Quản lý buổi bảo vệ với URL parameters
    navigate(
      `/admin/defense-sessions?viewStudent=${
        student.studentId
      }&studentName=${encodeURIComponent(student.fullName)}`,
      {
        state: {
          viewStudentDetails: true,
          studentId: student.studentId,
          studentName: student.fullName,
        },
      }
    );
  };

  // Xử lý khi click vào tên giảng viên
  const handleViewTeacherInfo = async (supervisorId) => {
    if (!supervisorId) {
      showToast("Không có thông tin giảng viên");
      return;
    }

    try {
      setLoadingTeacherInfo(true);
      setShowTeacherInfoModal(true);

      // Lấy danh sách tất cả giảng viên
      const teachers = await apiGet(API_ENDPOINTS.GET_ALL_TEACHERS);

      if (teachers && Array.isArray(teachers)) {
        const teacher = teachers.find((t) => t.userId === supervisorId);
        if (teacher) {
          setSelectedTeacherInfo(teacher);
        } else {
          showToast("Không tìm thấy thông tin giảng viên");
          setShowTeacherInfoModal(false);
        }
      } else {
        showToast("Không thể tải thông tin giảng viên");
        setShowTeacherInfoModal(false);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin giảng viên:", error);
      showToast("Lỗi khi tải thông tin giảng viên");
      setShowTeacherInfoModal(false);
    } finally {
      setLoadingTeacherInfo(false);
    }
  };

  const handleCloseTeacherInfoModal = () => {
    setShowTeacherInfoModal(false);
    setSelectedTeacherInfo(null);
  };

  // Xử lý khi click vào tên sinh viên
  const handleViewStudentInfo = async (student) => {
    if (!student) {
      showToast("Không có thông tin sinh viên");
      return;
    }

    try {
      setLoadingStudentInfo(true);
      setShowStudentInfoModal(true);

      // Lấy thông tin chi tiết sinh viên từ profile service
      const studentProfile = await studentAssignmentService.getStudentProfile(
        student.studentId
      );

      if (studentProfile) {
        setSelectedStudentInfo({
          ...student,
          ...studentProfile,
          // Merge thông tin từ student object và profile
          fullName: studentProfile.fullName || student.fullName,
          username: studentProfile.username || student.username,
          studentCode:
            student.studentCode ||
            (studentProfile.username
              ? extractStudentCode(
                  { username: studentProfile.username },
                  student.studentId
                )
              : student.studentId?.toString()),
        });
      } else {
        // Fallback nếu không lấy được profile
        setSelectedStudentInfo(student);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin sinh viên:", error);
      showToast("Lỗi khi tải thông tin sinh viên");
      // Fallback với thông tin có sẵn
      setSelectedStudentInfo(student);
    } finally {
      setLoadingStudentInfo(false);
    }
  };

  const handleCloseStudentInfoModal = () => {
    setShowStudentInfoModal(false);
    setSelectedStudentInfo(null);
  };

  const handleRefresh = async () => {
    if (!selectedPeriod || refreshing) return;

    setRefreshing(true);
    try {
      const periodId = selectedPeriod.value;
      let studentsData = [];

      // Gọi API trực tiếp, tối ưu hóa
      const apiCall = (() => {
        switch (viewType) {
          case "registered":
            return studentAssignmentService.getRegistrationsByPeriod(periodId);
          case "suggested":
            return studentAssignmentService.getSuggestedStudentsByPeriod(
              periodId
            );
          case "all":
          default:
            return studentAssignmentService.getAllStudentsByPeriod(periodId);
        }
      })();

      studentsData = await apiCall;

      // Tối ưu hóa xử lý dữ liệu
      const studentsWithBasicInfo = (studentsData || [])
        .filter(Boolean)
        .map((s) => {
          const studentCode = s?.username
            ? extractStudentCode({ username: s.username }, s.studentId)
            : s?.studentId?.toString() || "";

          return {
            studentId: s?.studentId,
            topicId: s?.topicId,
            topicTitle: s?.topicTitle || "N/A",
            topicCode: s?.topicCode || "N/A",
            supervisorId: s?.supervisorId,
            registrationType: s?.registrationType || "N/A",
            suggestionStatus: s?.suggestionStatus || null,
            registrationPeriodId: s?.registrationPeriodId,
            fullName: s?.fullName || `Sinh viên ${s?.studentId ?? ""}`,
            username: s?.username,
            studentCode,
            major: "CNTT",
            teacherInfo: {
              fullName:
                s?.supervisorFullName ||
                (s?.supervisorId ? `Giảng viên ${s?.supervisorId}` : "N/A"),
              teacherId: s?.supervisorId || null,
            },
          };
        });

      // Cập nhật state và cache cùng lúc
      setStudents(studentsWithBasicInfo);

      const cacheKey = `${periodId}-${viewType}`;
      setStudentsCache((prev) =>
        new Map(prev).set(cacheKey, studentsWithBasicInfo)
      );
      setLastLoadedPeriod(periodId);

      showToast("Đã làm mới dữ liệu thành công", "success");
    } catch (error) {
      console.error("Error refreshing data:", error);
      showToast("Lỗi khi làm mới dữ liệu");
    } finally {
      setRefreshing(false);
    }
  };

  // Helpers for preview add student
  const previewAssignedStudentIds = useMemo(() => {
    const ids = new Set();
    (previewData || []).forEach((ses) => {
      (ses.students || []).forEach((st) => ids.add(st.studentId));
    });
    return ids;
  }, [previewData]);

  const getUnassignedStudentsForPreview = () => {
    return (students || [])
      .filter(Boolean)
      .filter((s) => !previewAssignedStudentIds.has(s.studentId));
  };

  const handlePreviewSelectStudent = (sessionId, studentId) => {
    setPreviewSelectBySession((prev) => ({ ...prev, [sessionId]: studentId }));
  };

  const handlePreviewAddStudent = (sessionId) => {
    const selectedId = previewSelectBySession[sessionId];
    if (!selectedId) {
      showToast("Vui lòng chọn sinh viên", "warning");
      return;
    }
    setPreviewData((prev) => {
      const cloned = prev.map((s) => ({
        ...s,
        students: [...(s.students || [])],
      }));
      const ses = cloned.find((s) => s.sessionId === sessionId);
      if (!ses) return prev;
      if ((ses.students || []).length >= (ses.maxStudents || 5)) {
        showToast("Buổi đã đủ 5 sinh viên", "warning");
        return prev;
      }
      // Ensure not duplicated
      if (ses.students.some((st) => st.studentId === selectedId)) return prev;
      const sv = (students || []).find((u) => u.studentId === selectedId);
      if (!sv) return prev;
      ses.students.push({
        studentId: sv.studentId,
        name: sv.fullName || `Sinh viên ${sv.studentId}`,
        topicTitle: sv.topicTitle || "N/A",
        major: sv.major || "N/A",
        reviewer: "TBD",
      });
      return cloned;
    });
    // clear selection for this session
    setPreviewSelectBySession((prev) => ({ ...prev, [sessionId]: null }));
  };

  const studentIdToTopicId = useMemo(() => {
    const map = new Map();
    (students || []).forEach((s) => {
      if (s && s.studentId != null) map.set(s.studentId, s.topicId ?? null);
    });
    return map;
  }, [students]);

  const handleConfirmAutoAssign = async () => {
    try {
      if (!selectedPeriod?.value) {
        showToast("Vui lòng chọn đợt đăng ký", "warning");
        return;
      }
      if (!previewData || previewData.length === 0) {
        showToast("Không có dữ liệu để xác nhận", "warning");
        return;
      }
      setConfirmingAssign(true);

      const assignments = (previewData || [])
        .filter((ses) => (ses.students || []).length > 0)
        .map((ses) => ({
          sessionId: ses.sessionId,
          sessionName: ses.sessionName,
          location: ses.location,
          defenseDate: ses.defenseDate,
          students: (ses.students || [])
            .map((st) => ({
              studentId: st.studentId,
              topicId: studentIdToTopicId.get(st.studentId) || null,
              topicTitle: st.topicTitle || "",
              reviewerId: null,
            }))
            .filter((st) => st.topicId != null),
        }))
        .filter((ses) => (ses.students || []).length > 0);

      const payload = {
        periodId: selectedPeriod.value,
        scheduleId: null,
        assignments,
      };

      const res = await evalService.confirmAutoAssign(payload);
      if (res && res.success) {
        showToast(res.message || "Đã xác nhận phân chia", "success");
        setPreviewOpen(false);

        // Cập nhật assignedStudents state với các sinh viên vừa được gán
        const newAssignedStudents = new Map(assignedStudents);
        assignments.forEach((session) => {
          session.students.forEach((student) => {
            newAssignedStudents.set(student.studentId, {
              sessionId: session.sessionId,
              sessionName: session.sessionName,
              location: session.location,
              defenseDate: session.defenseDate,
            });
          });
        });
        setAssignedStudents(newAssignedStudents);

        // làm mới dữ liệu sinh viên
        if (selectedPeriod?.value) {
          loadStudentsByPeriod(selectedPeriod.value);
        }
      } else {
        showToast(res?.message || "Xác nhận thất bại", "error");
      }
    } catch (e) {
      console.error("Confirm auto-assign failed:", e);
      showToast("Lỗi khi xác nhận phân chia", "error");
    } finally {
      setConfirmingAssign(false);
    }
  };

  // Show loading screen only when initially loading periods and no data
  if (loading && periods.length === 0 && students.length === 0) {
    return (
      <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p>Đang tải danh sách đợt đăng ký...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6">
      <div className="w-full">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chọn đợt đăng ký */}
            <div>
              <Select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                options={periods}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn đợt đăng ký"
                isSearchable={false}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderRadius: 8,
                    minHeight: 40,
                    borderColor: state.isFocused ? "#ea580c" : base.borderColor,
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(234,88,12,0.15)"
                      : "none",
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
                }}
              />
            </div>

            {/* Chọn loại hiển thị */}
            <div>
              <Select
                value={viewTypeOptions.find(
                  (option) => option.value === viewType
                )}
                onChange={handleViewTypeChange}
                options={viewTypeOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn loại hiển thị"
                isSearchable={false}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderRadius: 8,
                    minHeight: 40,
                    borderColor: state.isFocused ? "#ea580c" : base.borderColor,
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(234,88,12,0.15)"
                      : "none",
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
                }}
              />
            </div>

            {/* Lọc theo trạng thái */}
            <div>
              <Select
                value={statusFilterOptions.find(
                  (option) => option.value === filterStatus
                )}
                onChange={(option) => setFilterStatus(option.value)}
                options={statusFilterOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Lọc theo trạng thái"
                isSearchable={false}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderRadius: 8,
                    minHeight: 40,
                    borderColor: state.isFocused ? "#ea580c" : base.borderColor,
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(234,88,12,0.15)"
                      : "none",
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
                }}
              />
            </div>

            {/* Tìm kiếm */}
            <div>
              <input
                type="text"
                placeholder="Tìm theo tên sinh viên, mã SV, tên đề tài, mã đề tài, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Statistics section removed as requested */}

        {/* Student List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Danh sách sinh viên
              {selectedPeriod && (
                <span className="text-gray-500 font-normal ml-2">
                  - {selectedPeriod.label}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 hidden sm:block">
                {`Trang ${currentPage + 1}/${Math.max(
                  1,
                  totalPagesServer
                )} - ${totalElementsServer} sinh viên`}
              </div>
              <button
                onClick={handleRefresh}
                className={`px-3 py-2 text-sm rounded-md text-white ${
                  refreshing
                    ? "bg-primary-300"
                    : "bg-primary-500 hover:bg-primary-400"
                }`}
                disabled={refreshing}
                title="Tải lại danh sách"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`inline mr-1 ${refreshing ? "animate-spin" : ""}`}
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                {refreshing ? "Đang tải..." : "Làm mới"}
              </button>
              {/* Removed heuristic auto arrange button */}
              <button
                onClick={async () => {
                  if (autoAssigning || previewLoading) return;
                  try {
                    if (!selectedPeriod?.value) {
                      showToast("Vui lòng chọn đợt đăng ký trước", "warning");
                      return;
                    }
                    setAutoAssigning(true);
                    setPreviewLoading(true);
                    const res = await evalService.autoAssignStudentsAi({
                      periodId: selectedPeriod.value,
                    });
                    if (res && res.success && Array.isArray(res.sessions)) {
                      const mapped = res.sessions.map((s, idx) => ({
                        sessionId: s.sessionId || `preview-${idx + 1}`,
                        sessionName: s.sessionName || `Buổi bổ sung ${idx + 1}`,
                        location: s.location || "TBD",
                        defenseDate: s.defenseDate || new Date().toISOString(),
                        startTime: s.startTime || null,
                        maxStudents: s.maxStudents || 5,
                        isVirtual: !!s.virtualSession,
                        students: (s.students || []).map((st) => ({
                          studentId: st.studentId,
                          name: st.studentName,
                          topicTitle: st.topicTitle,
                          reviewerName:
                            st.reviewerName ||
                            (st.reviewerId
                              ? `Giảng viên ${st.reviewerId}`
                              : "TBD"),
                          reviewerSpecialization:
                            st.reviewerSpecialization || "",
                        })),
                      }));
                      setPreviewData(mapped);
                      setPreviewOpen(true);
                    } else {
                      showToast(
                        res?.message || "Không tạo được preview AI",
                        "warning"
                      );
                    }
                  } catch (e) {
                    showToast("Lỗi khi phân chia sinh viên", "error");
                  } finally {
                    setPreviewLoading(false);
                    setAutoAssigning(false);
                  }
                }}
                className={`px-3 py-2 text-sm rounded-md text-white ${
                  autoAssigning || previewLoading
                    ? "bg-indigo-300"
                    : "bg-indigo-600 hover:bg-indigo-500"
                }`}
                disabled={
                  !selectedPeriod?.value || autoAssigning || previewLoading
                }
                title="Phân chia sinh viên"
              >
                {autoAssigning || previewLoading
                  ? "Đang xử lý..."
                  : "Phân chia sinh viên"}
              </button>
              <button
                onClick={() => {
                  showToast("Tính năng đang được phát triển", "info");
                }}
                className="px-3 py-2 text-sm rounded-md text-white bg-orange-500 hover:bg-orange-400 transition-colors duration-200 flex items-center gap-1"
                disabled={!selectedPeriod?.value}
                title="Xem sinh viên chưa hoàn thiện đăng ký đề tài"
              >
                Sinh viên chưa hoàn thiện
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                Đang tải danh sách sinh viên...
              </div>
            </div>
          ) : displayedFilteredStudents.length === 0 &&
            !isTableLoading &&
            !loading ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Không có sinh viên nào
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedPeriod
                  ? "Không có sinh viên nào trong đợt này."
                  : "Vui lòng chọn một đợt đăng ký."}
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto" key={tableRenderKey}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sinh viên
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đề tài
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giảng viên HD
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isTableLoading
                    ? Array.from({ length: pageSize }).map((_, idx) => (
                        <tr key={`sk-${idx}`} className="animate-pulse">
                          <td className="px-4 py-2">
                            <div className="h-3.5 w-40 bg-gray-200 rounded mb-1.5"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded"></div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="h-3.5 w-56 bg-gray-200 rounded mb-1.5"></div>
                            <div className="h-3 w-28 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 w-20 bg-gray-200 rounded"></div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="h-4 w-28 bg-gray-200 rounded"></div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="h-4 w-36 bg-gray-200 rounded"></div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                          </td>
                        </tr>
                      ))
                    : displayedPaginatedStudents
                        .filter(Boolean)
                        .map((student) => (
                          <tr
                            key={
                              student?.studentId ??
                              `${student?.topicId}-${student?.supervisorId}`
                            }
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div>
                                <div
                                  className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                                  onClick={() => handleViewStudentInfo(student)}
                                  title="Click để xem thông tin sinh viên"
                                >
                                  {student?.fullName ||
                                    `Sinh viên ${student?.studentId ?? "N/A"}`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Mã SV:{" "}
                                  {student?.studentCode ||
                                    student?.studentId ||
                                    "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">
                                  {student?.topicTitle || "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${getRegistrationTypeColor(
                                  student?.registrationType
                                )}`}
                              >
                                {getRegistrationTypeLabel(
                                  student?.registrationType
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {student?.suggestionStatus ? (
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${getStatusColor(
                                    student?.suggestionStatus
                                  )}`}
                                >
                                  {getStatusLabel(student?.suggestionStatus)}
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md border bg-gray-100 text-gray-800 border-gray-200">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div
                                  className="font-medium cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                                  onClick={() =>
                                    handleViewTeacherInfo(student?.supervisorId)
                                  }
                                  title="Click để xem thông tin giảng viên"
                                >
                                  {student?.teacherInfo?.fullName ||
                                    (student?.supervisorId
                                      ? `Giảng viên ${student?.supervisorId}`
                                      : null) ||
                                    "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                              <button
                                className={`mr-3 ${
                                  assignedStudents.has(student?.studentId)
                                    ? "text-blue-600 hover:text-blue-900"
                                    : "text-gray-400 cursor-not-allowed"
                                }`}
                                onClick={() =>
                                  student && handleViewDetails(student)
                                }
                                disabled={
                                  !assignedStudents.has(student?.studentId)
                                }
                                title={
                                  assignedStudents.has(student?.studentId)
                                    ? "Xem chi tiết buổi bảo vệ"
                                    : "Sinh viên chưa được thêm vào buổi bảo vệ"
                                }
                              >
                                Xem chi tiết
                              </button>
                              {assignedStudents.has(student?.studentId) ? (
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  onClick={() =>
                                    student && handleUnassignStudent(student)
                                  }
                                  title={`Đã gán vào: ${
                                    assignedStudents.get(student?.studentId)
                                      ?.sessionName || "N/A"
                                  }`}
                                >
                                  Xóa khỏi lịch
                                </button>
                              ) : (
                                <button
                                  className={`${
                                    student?.suggestionStatus === "PENDING" ||
                                    selectedPeriod?.status === "CLOSED"
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-primary-500 hover:text-primary-600"
                                  }`}
                                  onClick={() =>
                                    student && handleAssignToSession(student)
                                  }
                                  disabled={
                                    student?.suggestionStatus === "PENDING" ||
                                    selectedPeriod?.status === "CLOSED"
                                  }
                                  title={
                                    selectedPeriod?.status === "CLOSED"
                                      ? "Đợt đăng ký CLOSED - không thể gán"
                                      : student?.suggestionStatus === "PENDING"
                                      ? "Trạng thái Chờ duyệt - không thể thêm vào buổi bảo vệ"
                                      : undefined
                                  }
                                >
                                  Thêm vào lịch
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Pagination Footer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Trang {currentPage + 1} / {Math.max(1, totalPagesServer)}
          </div>
          <div className="flex items-center gap-3">
            {/* Page size selector */}
            <div className="hidden sm:flex items-center gap-2 mr-3">
              <span className="text-sm text-gray-600">Hiển thị</span>
              <div className="min-w-[110px]">
                <Select
                  value={{ value: pageSize, label: String(pageSize) }}
                  onChange={async (opt) => {
                    const newSize = parseInt(opt?.value ?? 7, 10);
                    flushSync(() => {
                      setPageSize(newSize);
                      setCurrentPage(0);
                      setIsTableLoading(true);
                      setStudents([]);
                      setTableRenderKey(`size-${newSize}-0-${Date.now()}`);
                    });
                    if (selectedPeriod?.value) {
                      const req = ++latestLoadRef.current;
                      await loadStudentsByPeriod(
                        selectedPeriod.value,
                        0,
                        true,
                        newSize,
                        req
                      );
                    }
                  }}
                  options={[7, 10, 20, 50, 100].map((n) => ({
                    value: n,
                    label: String(n),
                  }))}
                  isSearchable={false}
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: 36,
                      borderRadius: 8,
                      borderColor: state.isFocused
                        ? "#ea580c"
                        : base.borderColor,
                      boxShadow: state.isFocused
                        ? "0 0 0 3px rgba(234,88,12,0.15)"
                        : "none",
                      "&:hover": { borderColor: "#ea580c" },
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
                  }}
                />
              </div>
              <span className="text-sm text-gray-600">bản ghi/trang</span>
            </div>

            {(() => {
              const totalPageCount = Math.max(1, totalPagesServer);
              const current = currentPage + 1;
              const start = Math.max(1, current - 2);
              const end = Math.min(totalPageCount, current + 2);
              const pages = [];
              for (let p = start; p <= end; p++) pages.push(p);
              return (
                <div className="inline-flex items-center bg-white border border-gray-200 rounded-[14px] overflow-hidden shadow-sm">
                  <button
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={current === 1 || isTableLoading}
                    onClick={() => handlePageChange(0)}
                  >
                    Đầu
                  </button>
                  <button
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={current === 1 || isTableLoading}
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-label="Trang trước"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  {pages.map((p) => (
                    <button
                      key={p}
                      className={`${
                        p === current
                          ? "bg-accent-500 text-white"
                          : "bg-white text-gray-800 hover:bg-accent-50"
                      } px-3 py-2 text-sm border-x border-gray-200 disabled:opacity-50`}
                      onClick={() => handlePageChange(p - 1)}
                      aria-current={p === current ? "page" : undefined}
                      disabled={isTableLoading}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={current === totalPageCount || isTableLoading}
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-label="Trang sau"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                  <button
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={current === totalPageCount || isTableLoading}
                    onClick={() => handlePageChange(totalPageCount - 1)}
                  >
                    Cuối
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Modal Gán sinh viên vào buổi bảo vệ */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 m-0">
                Gán sinh viên vào buổi bảo vệ
              </h2>
              <button
                onClick={handleCloseAssignmentModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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

            {/* Content */}
            <div className="p-6 thin-scrollbar overflow-y-auto max-h-[70vh]">
              {selectedStudent && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Thông tin sinh viên
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-20 text-sm font-medium text-gray-700">
                        Tên:
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedStudent.fullName}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm font-medium text-gray-700">
                        Mã SV:
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedStudent.username
                          ? selectedStudent.username.split("@")[0]
                          : selectedStudent.studentCode}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm font-medium text-gray-700">
                        Ngành:
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedStudent.major}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-20 text-sm font-medium text-gray-700">
                        Đề tài:
                      </span>
                      <span className="text-sm text-gray-900 flex-1">
                        {selectedStudent.topicTitle}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Chọn buổi bảo vệ
                </label>
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <span className="ml-2 text-gray-600">
                      Đang tải danh sách buổi bảo vệ...
                    </span>
                  </div>
                ) : availableSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Không có buổi bảo vệ
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Không có buổi bảo vệ nào có sẵn
                    </p>
                  </div>
                ) : (
                  <Select
                    key={`session-select-${availableSessions.length}`}
                    value={(() => {
                      const opts = availableSessions.map((s) => ({
                        value: s.sessionId,
                        label: `${s.sessionName} - ${s.location} (${new Date(
                          s.defenseDate
                        ).toLocaleDateString("vi-VN")})`,
                      }));
                      const found =
                        opts.find((o) => o.value === selectedSessionId) || null;
                      return found;
                    })()}
                    onChange={(option) => {
                      setSelectedSessionId(option?.value || null);
                    }}
                    options={availableSessions.map((session) => ({
                      value: session.sessionId,
                      label: `${session.sessionName} - ${
                        session.location
                      } (${new Date(session.defenseDate).toLocaleDateString(
                        "vi-VN"
                      )})`,
                    }))}
                    placeholder="Chọn buổi bảo vệ..."
                    className="w-full"
                    isClearable={true}
                    isSearchable={true}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderRadius: 8,
                        minHeight: 40,
                        borderColor: state.isFocused
                          ? "#ea580c"
                          : base.borderColor,
                        boxShadow: state.isFocused
                          ? "0 0 0 3px rgba(234,88,12,0.15)"
                          : "none",
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
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseAssignmentModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAssignStudent}
                  disabled={!selectedSessionId || assigningStudent}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 border border-transparent rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {assigningStudent ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang gán...
                    </div>
                  ) : (
                    "Gán sinh viên"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {previewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 m-0">
                Xem trước phân chia
              </h2>
            </div>
            <div className="p-4 flex-1 overflow-y-auto thin-scrollbar">
              {previewLoading ? (
                <div className="text-center py-8 text-gray-600">
                  Đang xử lý...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(previewData || []).map((ses) => (
                    <div
                      key={ses.sessionId}
                      className="rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">
                          {ses.sessionName}
                        </div>
                        {ses.isVirtual && (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Bổ sung
                          </span>
                        )}
                      </div>
                      {(() => {
                        const first = (ses.students || []).find(
                          (st) => st.reviewerName
                        );
                        const text = first
                          ? `${first.reviewerName}${
                              first.reviewerSpecialization
                                ? ` (${first.reviewerSpecialization})`
                                : ""
                            }`
                          : "";
                        return (
                          <div className="text-center text-sm text-primary-700 font-medium mb-1">
                            {text}
                          </div>
                        );
                      })()}
                      <div className="mb-3 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-xs sm:text-sm">
                          Phòng: {ses.location}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-xs sm:text-sm">
                          Ngày:{" "}
                          {new Date(ses.defenseDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                        {ses.startTime && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-xs sm:text-sm">
                            Giờ: {formatTime(ses.startTime)}
                          </span>
                        )}
                        {/* Removed capacity badge as requested */}
                      </div>
                      {ses.students.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">
                          Chưa có sinh viên
                        </div>
                      ) : (
                        <table className="w-full text-sm border-t border-gray-100 mt-2">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="py-2 pr-2 font-medium">
                                Sinh viên
                              </th>
                              <th className="py-2 pr-2 font-medium">Đề tài</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {ses.students.map((st) => (
                              <tr key={st.studentId} className="align-top">
                                <td className="py-2 pr-2 font-medium text-gray-900">
                                  {st.name}
                                </td>
                                <td className="py-2 pr-2 text-gray-700">
                                  {st.topicTitle}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center justify-end gap-3 border-t pt-4 flex-shrink-0">
                <button
                  className="px-4 py-2 text-sm rounded-md border"
                  onClick={() => setPreviewOpen(false)}
                  disabled={confirmingAssign}
                >
                  Hủy
                </button>
                <button
                  className={`px-4 py-2 text-sm rounded-md text-white ${
                    confirmingAssign
                      ? "bg-primary-300"
                      : "bg-primary-500 hover:bg-primary-400"
                  }`}
                  onClick={handleConfirmAutoAssign}
                  disabled={confirmingAssign}
                >
                  {confirmingAssign ? "Đang xác nhận..." : "Xác nhận phân chia"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị thông tin giảng viên */}
      {showTeacherInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 m-0">
                Thông tin giảng viên
              </h2>
              <button
                onClick={handleCloseTeacherInfoModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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

            {/* Content */}
            <div className="p-6">
              {loadingTeacherInfo ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  <span className="ml-2 text-gray-600">
                    Đang tải thông tin...
                  </span>
                </div>
              ) : selectedTeacherInfo ? (
                <div className="space-y-4">
                  {/* Avatar và tên */}
                  <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                      {selectedTeacherInfo.avt ? (
                        <img
                          src={selectedTeacherInfo.avt}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-10 h-10 text-primary-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedTeacherInfo.fullName ||
                        selectedTeacherInfo.name ||
                        "N/A"}
                    </h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Số điện thoại
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTeacherInfo.phoneNumber || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Chuyên ngành
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTeacherInfo.specialization || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Khoa
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {departmentMapping[selectedTeacherInfo.department] ||
                        selectedTeacherInfo.department ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Không có thông tin giảng viên</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị thông tin sinh viên */}
      {showStudentInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 m-0">
                Thông tin sinh viên
              </h2>
              <button
                onClick={handleCloseStudentInfoModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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

            {/* Content */}
            <div className="p-6">
              {loadingStudentInfo ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  <span className="ml-2 text-gray-600">
                    Đang tải thông tin...
                  </span>
                </div>
              ) : selectedStudentInfo ? (
                <div className="space-y-4">
                  {/* Avatar và tên */}
                  <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                      {selectedStudentInfo.avt ? (
                        <img
                          src={selectedStudentInfo.avt}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-10 h-10 text-primary-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedStudentInfo.fullName || "N/A"}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Mã SV:{" "}
                      {selectedStudentInfo.studentCode ||
                        selectedStudentInfo.studentId ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStudentInfo.username ||
                        (selectedStudentInfo.studentCode
                          ? `${selectedStudentInfo.studentCode}@st.phenikaa-uni.edu.vn`
                          : "N/A")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Đề tài
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStudentInfo.topicTitle || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mã đề tài
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStudentInfo.topicCode || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Giảng viên hướng dẫn
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStudentInfo.teacherInfo?.fullName ||
                        (selectedStudentInfo.supervisorId
                          ? `Giảng viên ${selectedStudentInfo.supervisorId}`
                          : "N/A")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Loại đăng ký
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStudentInfo.registrationType === "REGISTERED"
                        ? "Đăng ký đề tài"
                        : selectedStudentInfo.registrationType === "SUGGESTED"
                        ? "Đề xuất đề tài"
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Trạng thái
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStudentInfo.suggestionStatus === "APPROVED"
                        ? "Đã duyệt"
                        : selectedStudentInfo.suggestionStatus === "PENDING"
                        ? "Chờ duyệt"
                        : selectedStudentInfo.suggestionStatus === "REJECTED"
                        ? "Từ chối"
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Không có thông tin sinh viên</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPeriodManagement;
