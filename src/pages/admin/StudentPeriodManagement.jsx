import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from "react-toastify";

// Helper hiển thị toast sử dụng react-toastify
const showToast = (message, type = "success") => {
  try {
    if (type === "error") return showToast(message);
    if (type === "warning") return toast.warn(message);
    if (type === "info") return toast.info(message);
    return showToast(message);
  } catch (err) {
    console.error("Không thể hiển thị toast:", err);
    (type === "success" ? console.log : console.error)(message);
  }
};
import studentAssignmentService from "../../services/studentAssignment.service";
import { API_ENDPOINTS } from "../../config/api";
import { apiGet } from "../../services/mainHttpClient";
import { useNavigate } from "react-router-dom";

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

  // State cho việc gán sinh viên vào buổi bảo vệ
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [assignedStudents, setAssignedStudents] = useState(new Map()); // Map lưu thông tin sinh viên đã gán

  // State cho việc quản lý giảng viên
  const [teachersMap, setTeachersMap] = useState(new Map());
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const navigate = useNavigate();

  // Load danh sách đợt đăng ký và giảng viên
  useEffect(() => {
    loadPeriods();
    loadTeachers();
  }, []);

  // Load sinh viên khi chọn đợt và teachersMap đã sẵn sàng
  useEffect(() => {
    if (selectedPeriod && !loadingTeachers) {
      loadStudentsByPeriod(selectedPeriod.value);
    }
  }, [selectedPeriod, viewType, loadingTeachers]);

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
        }));
        setPeriods(formattedPeriods);

        if (formattedPeriods.length > 0) {
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
            fullName: teacher.fullName || `Giảng viên ${teacher.userId}`,
            specialization: teacher.specialization || "Chưa có chuyên ngành",
            department: teacher.department || "Chưa có khoa",
            email: teacher.phoneNumber || "Chưa có thông tin liên lạc",
          });
        });
        setTeachersMap(teachersMapData);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách giảng viên:", error);
      showToast("Không thể tải danh sách giảng viên");
    } finally {
      setLoadingTeachers(false);
    }
  };

  const loadStudentsByPeriod = async (periodId) => {
    try {
      setLoading(true);
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

      // Đảm bảo teachersMap đã được load trước khi xử lý sinh viên
      if (teachersMap.size === 0) {
        console.log("TeachersMap chưa được load, đang load lại...");
        await loadTeachers();
      }

      // Lấy thông tin profile cho từng sinh viên và giảng viên
      setLoadingProfiles(true);
      const studentsWithProfiles = await Promise.all(
        studentsData.map(async (student) => {
          try {
            const profile = await studentAssignmentService.getStudentProfile(
              student.studentId
            );

            // Lấy thông tin giảng viên hướng dẫn từ teachersMap
            const teacherInfo = teachersMap.get(student.supervisorId) || {
              fullName: `Giảng viên ${student.supervisorId}`,
              specialization: "Chưa có chuyên ngành",
              department: "Chưa có khoa",
            };

            return {
              ...student,
              fullName:
                profile?.fullName ||
                profile?.name ||
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
            const teacherInfo = teachersMap.get(student.supervisorId) || {
              fullName: `Giảng viên ${student.supervisorId}`,
              specialization: "Chưa có chuyên ngành",
              department: "Chưa có khoa",
            };

            return {
              ...student,
              fullName: `Sinh viên ${student.studentId}`,
              studentCode: student.studentId.toString(),
              major: "CNTT",
              teacherInfo: teacherInfo,
              // Đảm bảo các trường cần thiết cho việc gán vào buổi bảo vệ
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

      setStudents(studentsWithProfiles);
      showToast(`Đã tải ${studentsWithProfiles.length} sinh viên`);
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

  const handleRefresh = () => {
    loadTeachers(); // Reload thông tin giảng viên
    if (selectedPeriod) {
      loadStudentsByPeriod(selectedPeriod.value);
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

  // Lọc sinh viên theo search query và status
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.topicTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId?.toString().includes(searchQuery) ||
      student.topicCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || student.suggestionStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

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

  // ========== STUDENT ASSIGNMENT FUNCTIONS ==========

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

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách sinh viên...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thống kê</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-blue-900">
                    {students.length}
                  </div>
                  <div className="text-sm text-blue-700">Tổng số sinh viên</div>
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
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-green-900">
                    {
                      students.filter((s) => s.suggestionStatus === "APPROVED")
                        .length
                    }
                  </div>
                  <div className="text-sm text-green-700">Đã duyệt</div>
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
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-yellow-900">
                    {
                      students.filter((s) => s.suggestionStatus === "PENDING")
                        .length
                    }
                  </div>
                  <div className="text-sm text-yellow-700">Chờ duyệt</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-red-900">
                    {
                      students.filter((s) => s.suggestionStatus === "REJECTED")
                        .length
                    }
                  </div>
                  <div className="text-sm text-red-700">Từ chối</div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
            <div className="text-sm text-gray-600">
              Hiển thị {filteredStudents.length} / {students.length} sinh viên
            </div>
          </div>

          {loadingProfiles ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Đang tải thông tin sinh viên...
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Vui lòng chờ trong giây lát
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
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
            <div className="overflow-x-auto">
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
                  {filteredStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Ngành: {student.major}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {student.topicTitle || "N/A"}
                          </div>
                          <div className="text-gray-500">
                            Mã đề tài: {student.topicCode || "N/A"}
                          </div>
                          <div className="text-gray-500">
                            Đợt: {student.registrationPeriodId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${getRegistrationTypeColor(
                            student.registrationType
                          )}`}
                        >
                          {getRegistrationTypeLabel(student.registrationType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.suggestionStatus ? (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${getStatusColor(
                              student.suggestionStatus
                            )}`}
                          >
                            {getStatusLabel(student.suggestionStatus)}
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
                            {student.teacherInfo?.fullName ||
                              `Giảng viên ${student.supervisorId}` ||
                              "N/A"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Chuyên ngành:{" "}
                            {student.teacherInfo?.specialization || "N/A"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Khoa:{" "}
                            {departmentMapping[
                              student.teacherInfo?.department
                            ] ||
                              student.teacherInfo?.department ||
                              "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => handleViewDetails(student)}
                        >
                          Xem chi tiết
                        </button>
                        {assignedStudents.has(student.studentId) ? (
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleUnassignStudent(student)}
                            title={`Đã gán vào: ${
                              assignedStudents.get(student.studentId)
                                ?.sessionName || "N/A"
                            }`}
                          >
                            Hủy gán
                          </button>
                        ) : (
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleAssignToSession(student)}
                          >
                            Gán vào lịch
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
    </div>
  );
};

export default StudentPeriodManagement;
