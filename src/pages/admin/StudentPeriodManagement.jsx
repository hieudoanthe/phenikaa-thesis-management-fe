import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { showToast } from "../../utils/toastHelper";
import studentAssignmentService from "../../services/studentAssignment.service";
import { API_ENDPOINTS } from "../../config/api";
import { apiGet } from "../../services/mainHttpClient";
import { useNavigate } from "react-router-dom";
import { evalService } from "../../services/evalService";

// Department mapping
const departmentMapping = {
  CNTT: "Công nghệ thông tin",
  KHMT: "Khoa học máy tính",
  KTMT: "Kỹ thuật máy tính",
  HTTT: "Hệ thống thông tin",
  KTPM: "Kỹ thuật phần mềm",
  ATTT: "An toàn thông tin",
  MMT: "Mạng máy tính",
  PM: "Phần mềm",
};

const StudentPeriodManagement = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [viewType, setViewType] = useState("all"); // "all", "registered", "suggested"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 6;

  // State cho việc gán sinh viên vào buổi bảo vệ
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [assignedStudents, setAssignedStudents] = useState(new Map());
  const suppressNextGlobalLoadingRef = React.useRef(false);
  const lastRenderedStudentsRef = React.useRef([]);
  const [autoAssigning, setAutoAssigning] = useState(false);

  // Preview auto arrange
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]); // [{sessionId, sessionName, isVirtual, students:[{studentId, name, topicTitle, major, reviewer}]}]

  // State cho việc quản lý giảng viên
  const [teachersMap, setTeachersMap] = useState(new Map());
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const navigate = useNavigate();

  // Load danh sách đợt đăng ký và giảng viên
  useEffect(() => {
    loadPeriods();
    loadTeachers();
  }, []);

  // Load sinh viên khi chọn đợt
  useEffect(() => {
    if (selectedPeriod) {
      loadStudentsByPeriod(selectedPeriod.value);
    }
  }, [selectedPeriod, viewType]);

  // Reset trang khi bộ lọc/thông tin thay đổi
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedPeriod, viewType, searchQuery, filterStatus]);

  // (moved paginatedStudents below after filteredStudents is defined)

  // Kiểm tra assignment status khi students thay đổi
  useEffect(() => {
    const checkAllStudentAssignments = async () => {
      if (students.length === 0) return;

      const newAssignedStudents = new Map();

      await Promise.all(
        students.map(async (student) => {
          try {
            const assignment = await checkStudentAssignment(student.studentId);
            if (assignment) {
              newAssignedStudents.set(student.studentId, assignment);
            }
          } catch (error) {
            console.error(
              `Lỗi khi kiểm tra assignment cho sinh viên ${student.studentId}:`,
              error
            );
          }
        })
      );

      setAssignedStudents(newAssignedStudents);
    };

    checkAllStudentAssignments();
  }, [students]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      // Gọi API thực tế để lấy danh sách đợt đăng ký
      const response = await apiGet(API_ENDPOINTS.GET_REGISTRATION_PERIODS);

      if (response && Array.isArray(response)) {
        const formattedPeriods = response.map((period) => ({
          value: period.periodId,
          label: `${period.periodName} - ${period.status}`,
          status: period.status,
        }));
        setPeriods(formattedPeriods);

        if (formattedPeriods.length > 0) {
          // Đặt cờ để không hiển thị spinner toàn trang lần 2 ngay sau khi chọn đợt đầu tiên
          suppressNextGlobalLoadingRef.current = true;
          setSelectedPeriod(formattedPeriods[0]);
        }
      } else {
        setPeriods([]);
        showToast("Không có đợt đăng ký nào");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách đợt đăng ký:", error);
      showToast("Lỗi khi tải danh sách đợt đăng ký");
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const teachers = await apiGet(API_ENDPOINTS.GET_ALL_TEACHERS);

      if (teachers && Array.isArray(teachers)) {
        const teachersMapData = new Map();
        teachers.forEach((teacher) => {
          teachersMapData.set(teacher.userId, {
            fullName:
              teacher.fullName ||
              teacher.name ||
              (teacher.firstName && teacher.lastName
                ? `${teacher.firstName} ${teacher.lastName}`
                : null) ||
              `Giảng viên ${teacher.userId}`,
            specialization: teacher.specialization || "Chưa có chuyên ngành",
            department: teacher.department || "Chưa có khoa",
            email: teacher.phoneNumber || "Chưa có thông tin liên lạc",
          });
        });
        setTeachersMap(teachersMapData);
        return teachersMapData;
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách giảng viên:", error);
      showToast("Không thể tải danh sách giảng viên");
    } finally {
      setLoadingTeachers(false);
    }
    return new Map();
  };
  const ensureTeachersMapReady = async () => {
    if (teachersMap && teachersMap.size > 0) return teachersMap;
    return await loadTeachers();
  };

  const loadStudentsByPeriod = async (periodId) => {
    try {
      if (suppressNextGlobalLoadingRef.current) {
        // Bỏ qua spinner toàn trang cho lần nạp sinh viên đầu tiên sau khi vừa tải đợt
        suppressNextGlobalLoadingRef.current = false;
      } else {
        setLoading(true);
      }
      let studentsData = [];

      switch (viewType) {
        case "registered":
          studentsData =
            await studentAssignmentService.getRegistrationsByPeriod(periodId);
          break;
        case "suggested":
          studentsData =
            await studentAssignmentService.getSuggestedStudentsByPeriod(
              periodId
            );
          break;
        case "all":
        default:
          studentsData = await studentAssignmentService.getAllStudentsByPeriod(
            periodId
          );
          break;
      }

      const minimalRows = (studentsData || []).filter(Boolean).map((s) => ({
        studentId: s?.studentId,
        topicId: s?.topicId,
        topicTitle: s?.topicTitle || "N/A",
        topicCode: s?.topicCode || "N/A",
        supervisorId: s?.supervisorId,
        registrationType: s?.registrationType || "N/A",
        suggestionStatus: s?.suggestionStatus || null,
        registrationPeriodId: s?.registrationPeriodId,
        fullName: `Sinh viên ${s?.studentId ?? ""}`,
        studentCode: s?.studentId?.toString() || "",
        teacherInfo: {
          fullName: s?.supervisorId ? `Giảng viên ${s?.supervisorId}` : "N/A",
        },
      }));
      setStudents(minimalRows);

      // Đảm bảo teachersMap đã được load trước khi xử lý sinh viên chi tiết
      const localTeachersMap = await ensureTeachersMapReady();

      // Lấy thông tin profile cho từng sinh viên và giảng viên
      setLoadingProfiles(true);
      const studentsWithProfiles = await Promise.all(
        studentsData.map(async (student) => {
          try {
            const profile = await studentAssignmentService.getStudentProfile(
              student.studentId
            );

            const teacherInfo = localTeachersMap.get(student.supervisorId) || {
              fullName: `Giảng viên ${student.supervisorId}`,
            };

            return {
              ...student,
              fullName:
                profile?.fullName ||
                profile?.name ||
                (profile?.firstName && profile?.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : null) ||
                `Sinh viên ${student.studentId}`,
              studentCode:
                profile?.studentCode ||
                profile?.userId ||
                student.studentId.toString(),
              major: profile?.major || "CNTT",
              teacherInfo: teacherInfo,
              // Đảm bảo các trường cần thiết cho việc gán vào buổi bảo vệ
              topicId: student.topicId,
              topicTitle: student.topicTitle || "N/A",
              topicCode: student.topicCode || "N/A",
              supervisorId: student.supervisorId,
              registrationType: student.registrationType || "N/A",
              suggestionStatus: student.suggestionStatus || null,
            };
          } catch (error) {
            console.warn(
              `Không thể lấy profile cho sinh viên ${student.studentId}:`,
              error
            );

            // Lấy thông tin giảng viên hướng dẫn từ teachersMap
            const teacherInfo = localTeachersMap.get(student.supervisorId) || {
              fullName: `Giảng viên ${student.supervisorId}`,
            };

            return {
              ...student,
              fullName: `Sinh viên ${student.studentId}`,
              studentCode: student.studentId.toString(),
              major: "CNTT",
              teacherInfo: teacherInfo,
              topicId: student.topicId,
              topicTitle: student.topicTitle || "N/A",
              topicCode: student.topicCode || "N/A",
              supervisorId: student.supervisorId,
              registrationType: student.registrationType || "N/A",
              suggestionStatus: student.suggestionStatus || null,
            };
          }
        })
      );
      setLoadingProfiles(false);

      setStudents((prev) =>
        studentsWithProfiles && studentsWithProfiles.length
          ? studentsWithProfiles
          : prev
      );
    } catch (error) {
      console.error("Lỗi khi tải danh sách sinh viên:", error);
      showToast("Lỗi khi tải danh sách sinh viên");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (selectedOption) => {
    setSelectedPeriod(selectedOption);
  };

  const handleViewTypeChange = (selectedOption) => {
    setViewType(selectedOption.value);
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

  // Lọc sinh viên theo search query và status (an toàn với phần tử undefined)
  const filteredStudents = (students || [])
    .filter(Boolean)
    .filter((student) => {
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

  // Cập nhật snapshot khi không loadingProfiles để tránh nháy
  useEffect(() => {
    if (!loadingProfiles) {
      lastRenderedStudentsRef.current = students;
    }
  }, [students, loadingProfiles]);

  // Tập sinh viên dùng để hiển thị (giữ dữ liệu cũ khi đang load profile)
  const displayBaseStudents = loadingProfiles
    ? lastRenderedStudentsRef.current
    : students;

  const displayedFilteredStudents = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    return (displayBaseStudents || []).filter(Boolean).filter((student) => {
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

  // Danh sách sinh viên theo trang (client-side pagination)
  const displayedPaginatedStudents = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return (displayedFilteredStudents || []).slice(start, end);
  }, [displayedFilteredStudents, currentPage, pageSize]);

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
      // Lấy tất cả buổi bảo vệ có sẵn
      const availableSessions =
        await studentAssignmentService.getAvailableSessions();

      // Kiểm tra từng buổi bảo vệ để tìm sinh viên
      for (const session of availableSessions) {
        try {
          const assignedStudents =
            await studentAssignmentService.getAssignedStudents(
              session.sessionId
            );
          const studentAssignment = assignedStudents.find(
            (student) => student.studentId === studentId
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
          "Sinh viên đang ở trạng thái Chờ duyệt, không thể gán.",
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
      console.log("Opening assignment modal for student:", student);
      setSelectedStudent(student);
      setSelectedSessionId(null); // Reset selectedSessionId
      setLoadingSessions(true);

      // Lấy danh sách buổi bảo vệ có thể gán thêm sinh viên
      const sessions = await studentAssignmentService.getAvailableSessions();
      console.log("Available sessions from API:", sessions);

      if (!sessions || sessions.length === 0) {
        console.warn("Không có buổi bảo vệ nào có sẵn");
        showToast("Không có buổi bảo vệ nào có sẵn để gán sinh viên");
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

      setShowAssignmentModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách buổi bảo vệ:", error);
      showToast("Không thể lấy danh sách buổi bảo vệ");
    } finally {
      setLoadingSessions(false);
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

  const handleRefresh = () => {
    loadTeachers(); // Reload thông tin giảng viên
    if (selectedPeriod) {
      loadStudentsByPeriod(selectedPeriod.value);
    }
  };

  const handleAutoArrange = async () => {
    try {
      if (!selectedPeriod?.value) {
        showToast("Vui lòng chọn đợt đăng ký trước", "warning");
        return;
      }
      setAutoAssigning(true);
      setPreviewLoading(true);
      const res = await evalService.autoAssignStudents({
        periodId: selectedPeriod.value,
      });
      if (res && res.success && Array.isArray(res.sessions)) {
        const mapped = res.sessions.map((s, idx) => ({
          sessionId: s.sessionId || `preview-${idx + 1}`,
          sessionName: s.sessionName || `Buổi bổ sung ${idx + 1}`,
          location: s.location || "TBD",
          defenseDate: s.defenseDate || new Date().toISOString(),
          maxStudents: s.maxStudents || 5,
          isVirtual: !!s.virtualSession,
          students: (s.students || []).map((st) => ({
            studentId: st.studentId,
            name: st.studentName,
            topicTitle: st.topicTitle,
            major: st.major,
            reviewer:
              st.reviewerName ||
              (st.reviewerId ? `Giảng viên ${st.reviewerId}` : "TBD"),
          })),
        }));
        setPreviewData(mapped);
        setPreviewOpen(true);
      } else {
        showToast(
          res?.message || "Không tạo được preview từ server",
          "warning"
        );
      }
    } catch (e) {
      console.error("Preview auto arrange failed:", e);
      showToast("Lỗi khi xem trước sắp xếp", "error");
    } finally {
      setPreviewLoading(false);
      setAutoAssigning(false);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p>Đang tải danh sách sinh viên...</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn Đợt Đăng ký
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại Hiển thị
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Danh sách Sinh viên
              {selectedPeriod && (
                <span className="text-gray-500 font-normal ml-2">
                  - {selectedPeriod.label}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 hidden sm:block">
                {(() => {
                  const total = loadingProfiles
                    ? lastRenderedStudentsRef.current.length
                    : students.length;
                  const filtered = displayedFilteredStudents.length;
                  return `Hiển thị ${filtered} / ${total} sinh viên`;
                })()}
              </div>
              <button
                onClick={handleRefresh}
                className="px-3 py-2 text-sm rounded-md border text-gray-700 hover:bg-gray-50"
                disabled={loading || loadingProfiles}
                title="Tải lại danh sách"
              >
                Làm mới
              </button>
              <button
                onClick={handleAutoArrange}
                className={`px-3 py-2 text-sm rounded-md text-white ${
                  autoAssigning
                    ? "bg-primary-300"
                    : "bg-primary-500 hover:bg-primary-400"
                }`}
                disabled={autoAssigning || !selectedPeriod?.value}
                title="Tự động sắp xếp sinh viên vào các buổi bảo vệ"
              >
                {autoAssigning ? "Đang sắp xếp..." : "Tự động sắp xếp"}
              </button>
            </div>
          </div>

          {displayedFilteredStudents.length === 0 ? (
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
            <div className="relative overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sinh viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đề tài
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giảng viên HD
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedPaginatedStudents.filter(Boolean).map((student) => (
                    <tr
                      key={
                        student?.studentId ??
                        `${student?.topicId}-${student?.supervisorId}`
                      }
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student?.fullName ||
                              `Sinh viên ${student?.studentId ?? "N/A"}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            Ngành: {student?.major || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {student?.topicTitle || "N/A"}
                          </div>
                          <div className="text-gray-500">
                            Mã đề tài: {student?.topicCode || "N/A"}
                          </div>
                          <div className="text-gray-500">
                            Đợt: {student?.registrationPeriodId ?? "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${getRegistrationTypeColor(
                            student?.registrationType
                          )}`}
                        >
                          {getRegistrationTypeLabel(student?.registrationType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {student?.teacherInfo?.fullName ||
                              (student?.supervisorId
                                ? `Giảng viên ${student?.supervisorId}`
                                : null) ||
                              "N/A"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Chuyên ngành:{" "}
                            {student?.teacherInfo?.specialization || "N/A"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Khoa:{" "}
                            {departmentMapping[
                              student?.teacherInfo?.department
                            ] ||
                              student?.teacherInfo?.department ||
                              "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => student && handleViewDetails(student)}
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
                            Hủy gán
                          </button>
                        ) : (
                          <button
                            className={`${
                              student?.suggestionStatus === "PENDING" ||
                              selectedPeriod?.status === "CLOSED"
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-green-600 hover:text-green-900"
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
                                ? "Trạng thái Chờ duyệt - không thể gán"
                                : undefined
                            }
                          >
                            Gán vào lịch
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              {Math.ceil(displayedFilteredStudents.length / pageSize) > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Trang {currentPage + 1} /{" "}
                    {Math.max(
                      1,
                      Math.ceil(displayedFilteredStudents.length / pageSize)
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      Trước
                    </button>
                    <button
                      className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(
                            Math.ceil(
                              displayedFilteredStudents.length / pageSize
                            ) - 1,
                            p + 1
                          )
                        )
                      }
                      disabled={
                        currentPage >=
                        Math.ceil(displayedFilteredStudents.length / pageSize) -
                          1
                      }
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Gán sinh viên vào buổi bảo vệ */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Gán sinh viên vào buổi bảo vệ
                </h3>
                <button
                  onClick={handleCloseAssignmentModal}
                  className="text-gray-400 hover:text-gray-600"
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
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {selectedStudent && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Thông tin sinh viên:
                  </h4>
                  <div className="text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Tên:</span>{" "}
                      {selectedStudent.fullName}
                    </p>
                    <p>
                      <span className="font-medium">Mã SV:</span>{" "}
                      {selectedStudent.studentCode}
                    </p>
                    <p>
                      <span className="font-medium">Ngành:</span>{" "}
                      {selectedStudent.major}
                    </p>
                    <p>
                      <span className="font-medium">Đề tài:</span>{" "}
                      {selectedStudent.topicTitle}
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn buổi bảo vệ:
                </label>
                {loadingSessions ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">
                      Đang tải danh sách buổi bảo vệ...
                    </p>
                  </div>
                ) : availableSessions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Không có buổi bảo vệ nào có sẵn
                  </p>
                ) : (
                  <Select
                    key={`session-select-${availableSessions.length}`}
                    value={(() => {
                      const found = availableSessions.find(
                        (s) => s.sessionId === selectedSessionId
                      );
                      console.log("Select value found:", found);
                      console.log("Looking for sessionId:", selectedSessionId);
                      console.log("Available sessions:", availableSessions);
                      return found;
                    })()}
                    onChange={(option) => {
                      console.log("Selected session option:", option);
                      console.log("Option value:", option?.value);
                      console.log("Option sessionId:", option?.sessionId);
                      setSelectedSessionId(option?.value || option?.sessionId);
                      console.log(
                        "Set selectedSessionId to:",
                        option?.value || option?.sessionId
                      );
                    }}
                    options={availableSessions.map((session) => {
                      console.log("Mapping session:", session);
                      return {
                        value: session.sessionId,
                        label: `${session.sessionName} - ${
                          session.location
                        } (${new Date(session.defenseDate).toLocaleDateString(
                          "vi-VN"
                        )})`,
                      };
                    })}
                    placeholder="Chọn buổi bảo vệ..."
                    className="w-full"
                    isClearable={true}
                    isSearchable={true}
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
                    }}
                  />
                )}
              </div>

              {/* Debug info */}
              <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <p>
                  <strong>Debug Info:</strong>
                </p>
                <p>selectedSessionId: {selectedSessionId || "null"}</p>
                <p>assigningStudent: {assigningStudent ? "true" : "false"}</p>
                <p>availableSessions count: {availableSessions.length}</p>
                <p>
                  Button disabled:{" "}
                  {!selectedSessionId || assigningStudent ? "true" : "false"}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseAssignmentModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAssignStudent}
                  disabled={!selectedSessionId || assigningStudent}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`selectedSessionId: ${selectedSessionId}, assigningStudent: ${assigningStudent}`}
                >
                  {assigningStudent ? "Đang gán..." : "Gán sinh viên"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {previewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Xem trước phân chia (tối đa 5 SV/buổi)
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setPreviewOpen(false)}
              >
                Đóng
              </button>
            </div>
            <div className="p-4">
              {previewLoading ? (
                <div className="text-center py-8 text-gray-600">
                  Đang xử lý...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(previewData || []).map((ses) => (
                    <div key={ses.sessionId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {ses.sessionName}
                        </div>
                        {ses.isVirtual && (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                            Bổ sung
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Phòng: {ses.location} • Ngày:{" "}
                        {new Date(ses.defenseDate).toLocaleDateString("vi-VN")}{" "}
                        • Sức chứa: {ses.students.length}/{ses.maxStudents}
                      </div>
                      {ses.students.length === 0 ? (
                        <div className="text-sm text-gray-500">
                          Chưa có sinh viên
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="py-1 pr-2">SV</th>
                              <th className="py-1 pr-2">Đề tài</th>
                              <th className="py-1 pr-2">Chuyên ngành</th>
                              <th className="py-1">Reviewer gợi ý</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ses.students.map((st) => (
                              <tr key={st.studentId} className="align-top">
                                <td className="py-1 pr-2 font-medium text-gray-900">
                                  {st.name}
                                </td>
                                <td className="py-1 pr-2 text-gray-700">
                                  {st.topicTitle}
                                </td>
                                <td className="py-1 pr-2 text-gray-700">
                                  {st.major}
                                </td>
                                <td className="py-1 text-gray-700">
                                  {st.reviewer}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPeriodManagement;
