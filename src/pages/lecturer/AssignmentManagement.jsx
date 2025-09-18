import React, { useState, useEffect } from "react";
import TopicService from "../../services/topic.service";
import { assignmentService } from "../../services";
import userService from "../../services/user.service";
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
import ConfirmModal from "../../components/modals/ConfirmModal";
import AddAssignmentModal from "../../components/modals/AddAssignmentModal";

const AssignmentManagement = () => {
  const [selectedThesis, setSelectedThesis] = useState(-1);
  const [selectedAssignment, setSelectedAssignment] = useState(-1);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false });
  const [createTaskForm, setCreateTaskForm] = useState({
    assignmentId: null,
    taskName: "",
    description: "",
    startDate: "",
    endDate: "",
    priority: 1,
  });

  const [editAssignmentForm, setEditAssignmentForm] = useState({
    assignmentId: null,
    title: "",
    description: "",
    dueDate: "",
    priority: 1,
    status: 1,
  });

  const [editTaskForm, setEditTaskForm] = useState({
    taskId: null,
    taskName: "",
    description: "",
    startDate: "",
    endDate: "",
    priority: 1,
    status: 1,
    progress: 0,
  });

  const resetCreateTaskForm = (assignmentId) =>
    setCreateTaskForm({
      assignmentId: assignmentId || null,
      taskName: "",
      description: "",
      startDate: "",
      endDate: "",
      priority: 1,
    });

  // State cho API data
  const [thesisTopics, setThesisTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supervisorCapacity, setSupervisorCapacity] = useState(null);

  // State cho thông tin profile sinh viên
  const [studentProfiles, setStudentProfiles] = useState({});

  // States cho phân trang (theo cách ThesisManagement)
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sample data cho assignments (giữ lại để demo)
  const sampleAssignments = [
    {
      id: 1,
      title: "Phân tích yêu cầu và thiết kế hệ thống",
      description:
        "Phân tích chi tiết yêu cầu từ người dùng và thiết kế kiến trúc hệ thống",
      dueDate: "2024-02-15",
      progress: 85,
      tasks: [
        {
          id: 1,
          name: "Thu thập yêu cầu từ giảng viên và sinh viên",
          assignee: "Nguyễn Văn A",
          progress: 100,
          deadline: "2024-01-25",
          status: "Completed",
        },
        {
          id: 2,
          name: "Phân tích yêu cầu chức năng",
          assignee: "Nguyễn Văn A",
          progress: 80,
          deadline: "2024-02-05",
          status: "On Track",
        },
        {
          id: 3,
          name: "Thiết kế kiến trúc hệ thống",
          assignee: "Nguyễn Văn A",
          progress: 70,
          deadline: "2024-02-15",
          status: "On Track",
        },
      ],
    },
    {
      id: 2,
      title: "Phát triển giao diện người dùng",
      description:
        "Xây dựng giao diện web responsive và thân thiện với người dùng",
      dueDate: "2024-03-15",
      progress: 45,
      tasks: [
        {
          id: 4,
          name: "Thiết kế wireframe và mockup",
          assignee: "Nguyễn Văn A",
          progress: 100,
          deadline: "2024-02-20",
          status: "Completed",
        },
        {
          id: 5,
          name: "Phát triển giao diện đăng nhập",
          assignee: "Nguyễn Văn A",
          progress: 60,
          deadline: "2024-03-01",
          status: "On Track",
        },
        {
          id: 6,
          name: "Phát triển dashboard chính",
          assignee: "Nguyễn Văn A",
          progress: 30,
          deadline: "2024-03-15",
          status: "On Track",
        },
      ],
    },
  ];

  // Transform API data để phù hợp với UI
  const transformThesisData = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];

    return apiData.map((topic) => ({
      id: topic.topicId,
      title: topic.title,
      description: topic.description,
      student: topic.suggestedBy
        ? `Sinh viên ID: ${topic.suggestedBy}`
        : "Chưa có sinh viên",
      studentId: topic.suggestedBy?.toString() || "Không có",
      suggestedBy: topic.suggestedBy, // Lưu trữ suggestedBy gốc để sử dụng cho profile lookup
      status: topic.approvalStatus === "APPROVED" ? "Đã duyệt" : "Đang chờ",
      startDate: topic.createdAt
        ? new Date(topic.createdAt).toISOString().split("T")[0]
        : "Không có",
      endDate: topic.updatedAt
        ? new Date(topic.updatedAt).toISOString().split("T")[0]
        : "Không có",
      maxStudents: topic.maxStudents,
      remainingSlots: topic.maxStudents,
      assignments: [],
    }));
  };

  const currentThesis = thesisTopics[selectedThesis];
  // Helper: tải profile theo danh sách userId và lưu vào state
  const fetchProfilesForIds = async (userIds = []) => {
    const uniqueIds = Array.from(
      new Set(
        (userIds || []).filter(
          (id) => typeof id === "number" || typeof id === "string"
        )
      )
    );
    const need = uniqueIds.filter((id) => !studentProfiles[id]);
    if (need.length === 0) return studentProfiles;

    const fetched = {};
    for (const uid of need) {
      try {
        const profile = await userService.getStudentProfileById(uid);
        fetched[uid] = {
          fullName: profile.fullName || profile.name || "Không xác định",
          studentId: profile.userId || profile.studentId || profile.id || uid,
          email: profile.email || "",
          major: profile.major || "",
          className: profile.className || profile.class || "",
        };
      } catch (e) {
        fetched[uid] = {
          fullName: "Không xác định",
          studentId: uid,
          email: "",
          major: "",
          className: "",
        };
      }
    }
    const merged = { ...studentProfiles, ...fetched };
    setStudentProfiles(merged);
    return merged;
  };
  // Tải assignments theo topic khi chọn đề tài
  const loadAssignmentsForTopic = async (topicId) => {
    try {
      const res = await assignmentService.getAssignmentsByTopic(topicId);
      if (res.success) {
        // Thu thập userId assigned từ tasks để lấy tên người dùng
        const assignedIds = [];
        (Array.isArray(res.data) ? res.data : []).forEach((a) => {
          (a.tasks || []).forEach((t) => {
            if (t.assignedTo) assignedIds.push(t.assignedTo);
          });
        });
        const profilesMap = await fetchProfilesForIds(assignedIds);
        // Chuẩn hóa dữ liệu assignment từ API sang dạng UI
        const normalize = (list) =>
          (Array.isArray(list) ? list : []).map((a) => ({
            id: a.assignmentId,
            title: a.title,
            description: a.description,
            dueDate: a.dueDate,
            progress:
              Array.isArray(a.tasks) && a.tasks.length > 0
                ? Math.round(
                    a.tasks.reduce(
                      (sum, t) =>
                        sum + (typeof t.progress === "number" ? t.progress : 0),
                      0
                    ) / a.tasks.length
                  )
                : 0,
            tasks: (a.tasks || []).map((t) => ({
              id: t.taskId,
              name: t.taskName,
              assignee: (() => {
                if (!t.assignedTo) return "Không có";
                const p = profilesMap[t.assignedTo];
                return p?.fullName ? p.fullName : `Người dùng ${t.assignedTo}`;
              })(),
              progress: typeof t.progress === "number" ? t.progress : 0,
              deadline: t.endDate || "",
              status:
                t.status === 3
                  ? "Hoàn thành"
                  : t.status === 2
                  ? "Đang thực hiện"
                  : t.status === 1
                  ? "Đang chờ xử lý"
                  : "Không xác định",
            })),
          }));

        setThesisTopics((prev) => {
          const cloned = [...prev];
          const idx = cloned.findIndex((t) => t.id === topicId);
          if (idx !== -1) {
            cloned[idx] = {
              ...cloned[idx],
              assignments: normalize(res.data),
            };
          }
          return cloned;
        });
      } else {
        showToast(res.message || "Không thể tải assignments", "error");
      }
    } catch (e) {
      console.error("Lỗi load assignments:", e);
      showToast("Có lỗi khi tải assignments", "error");
    }
  };

  const currentAssignment = currentThesis?.assignments?.[selectedAssignment];

  const getStatusColor = (status) => {
    switch (status) {
      case "Đang thực hiện":
        return "bg-success-50 text-success-700 border-success-200";
      case "Quá hạn":
        return "bg-error-50 text-error-700 border-error-200";
      case "Hoàn thành":
        return "bg-info-50 text-info-700 border-info-200";
      case "Đang chờ xử lý":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-success-500";
    if (progress >= 50) return "bg-warning-500";
    return "bg-error-500";
  };

  const handleNewAssignment = () => {
    setShowNewAssignmentModal(true);
  };

  const handleCreateAssignment = async (payload) => {
    try {
      const res = await assignmentService.createAssignment(payload);
      if (res.success) {
        // Reload assignments của topic hiện tại
        if (payload.topicId) {
          await loadAssignmentsForTopic(payload.topicId);
        }
        return res;
      } else {
        throw new Error(res.message || "Tạo assignment thất bại");
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleAddTask = () => {
    const currentAssignmentId = currentAssignment?.id || null;
    resetCreateTaskForm(currentAssignmentId);
    setShowAddTaskModal(true);
  };

  const handleEditAssignment = () => {
    if (!currentAssignment) {
      showToast("Chưa chọn assignment", "error");
      return;
    }
    setEditAssignmentForm({
      assignmentId: currentAssignment.id,
      title: currentAssignment.title || "",
      description: currentAssignment.description || "",
      dueDate: currentAssignment.dueDate || "",
      priority: 1,
      status: 1,
    });
    setShowEditAssignmentModal(true);
  };

  const handleDeleteAssignment = () => {
    if (!currentAssignment) {
      showToast("Chưa chọn assignment", "error");
      return;
    }
    setConfirmState({
      open: true,
      title: "Xác nhận xoá assignment",
      message:
        "Bạn có chắc chắn muốn xoá assignment này? Hành động không thể hoàn tác.",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          const res = await assignmentService.deleteAssignment(
            currentAssignment.id
          );
          if (res.success) {
            showToast("Xoá assignment thành công", "success");
            setSelectedAssignment(-1);
            if (currentThesis?.id)
              await loadAssignmentsForTopic(currentThesis.id);
          } else {
            showToast(res.message || "Xoá assignment thất bại", "error");
          }
        } catch (e) {
          console.error(e);
          showToast("Có lỗi khi xoá assignment");
        } finally {
          setConfirmState({ open: false });
        }
      },
    });
  };

  /**
   * Lấy thông tin profile của sinh viên từ ID
   */
  const loadStudentProfiles = async (topicsData) => {
    try {
      const profiles = {};

      for (const topic of topicsData) {
        if (topic.suggestedBy && !profiles[topic.suggestedBy]) {
          try {
            const profile = await userService.getStudentProfileById(
              topic.suggestedBy
            );
            profiles[topic.suggestedBy] = {
              fullName: profile.fullName || profile.name || "Không xác định",
              studentId:
                profile.userId ||
                profile.studentId ||
                profile.id ||
                topic.suggestedBy,
              email: profile.email || "",
              major: profile.major || "",
              className: profile.className || profile.class || "",
            };
          } catch (error) {
            console.warn(
              "Không thể lấy profile sinh viên, dùng dữ liệu fallback cho:",
              topic.suggestedBy,
              error
            );
            profiles[topic.suggestedBy] = {
              fullName: "Không xác định",
              studentId: topic.suggestedBy,
              email: "",
              major: "",
              className: "",
            };
          }
        }
      }
      setStudentProfiles(profiles);
    } catch (error) {
      console.error("Lỗi khi load profiles của sinh viên:", error);
    }
  };

  /**
   * Lấy danh sách đề tài đã được approve với phân trang server-side
   */
  const fetchApprovedTopics = async (page) => {
    try {
      setLoading(true);

      // Gọi API với phân trang server-side: page và size=10
      const apiParams = {
        page: page,
        size: pageSize, // Sử dụng pageSize = 10 thay vì 1000
      };

      const response = await TopicService.getApprovedTopics(apiParams);

      if (response.success && response.data) {
        let topicsData = [];

        if (Array.isArray(response.data)) {
          topicsData = response.data;
        } else if (Array.isArray(response.data?.content)) {
          // Nếu API trả về dạng pagination { content: [...], totalElements: ... }
          topicsData = response.data.content;
        } else if (Array.isArray(response.data?.data)) {
          // Nếu API trả về dạng nested { data: [...] }
          topicsData = response.data.data;
        } else {
          topicsData = [];
        }

        const transformedData = transformThesisData(topicsData);

        setThesisTopics(transformedData);

        // Cập nhật pagination state từ server response
        const serverTotal =
          typeof response?.data?.totalElements === "number"
            ? response.data.totalElements
            : topicsData.length;

        setTotalElements(serverTotal);
        setTotalPages(
          typeof response?.data?.totalPages === "number"
            ? response.data.totalPages
            : Math.ceil(serverTotal / pageSize)
        );

        // Load thông tin profile của sinh viên
        await loadStudentProfiles(topicsData);
      } else {
        showToast(
          response.message || "Không thể lấy danh sách đề tài",
          "error"
        );
        setThesisTopics([]);
        setTotalElements(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đề tài:", error);
      showToast("Có lỗi xảy ra khi lấy danh sách đề tài", "error");
      setThesisTopics([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lấy thông tin năng lực giảng viên
   */
  const fetchSupervisorCapacity = async () => {
    try {
      const response = await TopicService.getSupervisorCapacity();

      if (response.success) {
        setSupervisorCapacity(response.data);
      } else {
        console.warn("Không thể lấy thông tin năng lực:", response.message);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin năng lực:", error);
    }
  };

  /**
   * Xử lý thay đổi trang - gọi API để lấy dữ liệu mới
   */
  const handlePageChange = async (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      // Sử dụng biến local để đảm bảo giá trị chính xác
      const targetPage = newPage;

      // Cập nhật currentPage trước
      setCurrentPage(targetPage);

      // Reset selection khi chuyển trang
      setSelectedThesis(-1);
      setSelectedAssignment(-1);

      // Gọi API để lấy dữ liệu trang mới
      await fetchApprovedTopics(targetPage);
    } else {
      console.warn("Trang không hợp lệ:", newPage);
    }
  };

  // ========== USE EFFECT ==========

  useEffect(() => {
    // Lấy danh sách đề tài đã approve khi component mount (trang đầu tiên)
    fetchApprovedTopics(0);

    // Lấy thông tin năng lực giảng viên
    fetchSupervisorCapacity();
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 font-sans">
      {/* Left Sidebar - Thesis Topics List */}
      <div className="w-full lg:w-80 xl:w-96 bg-white/95 backdrop-blur-sm border-r border-slate-200/60 flex flex-col overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-white to-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-secondary/80 to-secondary-light/100 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Nhiệm vụ</h2>
              <p className="text-sm text-slate-500">Quản lý nhiệm vụ</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto thin-scrollbar">
          {loading ? (
            // Loading state
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
              </div>
              <p className="text-sm text-slate-600 mt-4 font-medium">
                Đang tải danh sách đề tài...
              </p>
            </div>
          ) : thesisTopics.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Chưa có đề tài nào được xác nhận
              </h3>
              <p className="text-sm text-slate-500 text-center max-w-xs">
                Các đề tài đã xác nhận sẽ hiển thị ở đây để quản lý nhiệm vụ
              </p>
            </div>
          ) : (
            // Thesis topics list - Server-side pagination
            <>
              {thesisTopics.map((thesis, index) => (
                <div
                  key={`${thesis.id}-${currentPage}-${index}`}
                  className={`group relative bg-white/95 hover:bg-white rounded-2xl p-5 mb-4 cursor-pointer transition-all duration-300 border hover:-translate-y-1 shadow-sm hover:shadow-lg ${
                    selectedThesis === index
                      ? "border-blue-300 ring-2 ring-blue-100 shadow-lg shadow-blue-100/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => {
                    setSelectedThesis(index);
                    setSelectedAssignment(-1);
                    if (thesis.id) {
                      loadAssignmentsForTopic(thesis.id);
                    }
                  }}
                >
                  {/* Selection indicator */}
                  {selectedThesis === index && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                  )}

                  <h3 className="text-sm font-medium text-slate-800 mb-3 leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {thesis.title}
                  </h3>

                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">
                        {(() => {
                          const profile = studentProfiles[thesis.suggestedBy];
                          if (
                            profile &&
                            profile.fullName !== "Không xác định"
                          ) {
                            return profile.fullName;
                          }
                          return thesis.student;
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">
                        {thesis.assignments?.length || 0} nhiệm vụ
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200/60 shadow-sm">
                  <div className="text-sm text-slate-600 font-medium">
                    Hiển thị{" "}
                    <span className="font-bold text-slate-800">
                      {thesisTopics.length > 0 ? currentPage * pageSize + 1 : 0}
                    </span>{" "}
                    -{" "}
                    <span className="font-bold text-slate-800">
                      {currentPage * pageSize + thesisTopics.length}
                    </span>{" "}
                    trên{" "}
                    <span className="font-bold text-slate-800">
                      {totalElements}
                    </span>{" "}
                    đề tài
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        handlePageChange(currentPage - 1);
                      }}
                      disabled={currentPage === 0}
                      className="group flex items-center gap-1 px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg
                        className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">Trước</span>
                    </button>

                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-sm font-semibold text-slate-700">
                        {currentPage + 1}
                      </span>
                      <span className="text-sm text-slate-400">/</span>
                      <span className="text-sm text-slate-600">
                        {totalPages}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        handlePageChange(currentPage + 1);
                      }}
                      disabled={currentPage + 1 >= totalPages}
                      className="group flex items-center gap-1 px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <span className="font-medium">Sau</span>
                      <svg
                        className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Middle Panel - Assignments List */}
      <div className="w-full lg:w-80 xl:w-96 bg-white/95 backdrop-blur-sm border-r border-slate-200/60 flex flex-col overflow-y-auto shadow-xl">
        {currentThesis && (
          <>
            <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-white to-slate-50/50">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl p-4 mb-6 border border-slate-200/50">
                <h4 className="text-sm font-semibold text-slate-700 mb-2 line-clamp-2">
                  {currentThesis.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Đề tài đã được chọn</span>
                </div>
              </div>

              <button
                className="group w-full text-white border-none rounded-xl py-3 px-4 text-sm font-semibold cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: "#ff6600" }}
                onClick={handleNewAssignment}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Thêm nhiệm vụ</span>
                </div>
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto thin-scrollbar">
              {currentThesis.assignments.map((assignment, index) => (
                <div
                  key={assignment.id}
                  className={`group relative bg-white/95 hover:bg-white rounded-2xl p-5 mb-4 cursor-pointer transition-all duration-300 border hover:-translate-y-1 hover:shadow-lg ${
                    selectedAssignment === index
                      ? "border-indigo-300 ring-2 ring-indigo-100 shadow-lg shadow-indigo-100/50 bg-gradient-to-r from-indigo-50/50 to-blue-50/30"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setSelectedAssignment(index)}
                >
                  {/* Selection indicator */}
                  {selectedAssignment === index && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-indigo-500 rounded-full shadow-sm"></div>
                  )}

                  <h4 className="text-sm font-bold text-slate-800 mb-3 leading-tight group-hover:text-indigo-700 transition-colors">
                    {assignment.title}
                  </h4>

                  <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-2">
                    {assignment.description}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-amber-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">
                        {assignment.dueDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          Tiến độ: {assignment.progress}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="group/edit p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssignment(index);
                            setEditAssignmentForm({
                              assignmentId: assignment.id,
                              title: assignment.title || "",
                              description: assignment.description || "",
                              dueDate: assignment.dueDate || "",
                              priority: 1,
                              status: 1,
                            });
                            setShowEditAssignmentModal(true);
                          }}
                        >
                          <svg
                            className="w-3 h-3 text-slate-600 group-hover/edit:text-indigo-600 transition-colors"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="group/delete p-1.5 rounded-lg border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssignment(index);
                            setConfirmState({
                              open: true,
                              title: "Xác nhận xoá assignment",
                              message:
                                "Bạn có chắc chắn muốn xoá assignment này? Hành động không thể hoàn tác.",
                              confirmVariant: "danger",
                              onConfirm: async () => {
                                try {
                                  const res =
                                    await assignmentService.deleteAssignment(
                                      assignment.id
                                    );
                                  if (res.success) {
                                    showToast("Đã xoá assignment");
                                    if (currentThesis?.id)
                                      await loadAssignmentsForTopic(
                                        currentThesis.id
                                      );
                                  } else {
                                    showToast(res.message || "Xoá thất bại");
                                  }
                                } catch (err) {
                                  console.error(err);
                                  showToast("Có lỗi khi xoá assignment");
                                } finally {
                                  setConfirmState({ open: false });
                                }
                              },
                            });
                          }}
                        >
                          <svg
                            className="w-3 h-3 text-red-600 group-hover/delete:text-red-700 transition-colors"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Assignment Details & Tasks */}
      <div className="flex-1 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 p-8 overflow-y-auto thin-scrollbar">
        {currentAssignment && (
          <>
            {/* Header Section removed per request */}
            <div className="mb-8 pb-6 border-b border-slate-200/60"></div>

            {/* Description Section */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-slate-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Mô tả chi tiết
                </h3>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-200/60 shadow-sm">
                <p className="text-base text-slate-700 leading-relaxed">
                  {currentAssignment.description}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Hạn chót
                      </p>
                      <p className="text-lg font-bold text-amber-900">
                        {currentAssignment.dueDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        Tiến độ
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {currentAssignment.progress}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Các công việc
                  </h3>
                </div>
                <button
                  className="group text-white border-none rounded-xl py-3 px-5 text-sm font-semibold cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto"
                  style={{ backgroundColor: "#ff6600" }}
                  onClick={handleAddTask}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Thêm công việc</span>
                  </div>
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {currentAssignment.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-slate-800 group-hover:text-green-700 transition-colors">
                            {task.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-2.5 h-2.5 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="font-medium">
                            Người thực hiện:{" "}
                            <span className="font-semibold text-slate-700">
                              {task.assignee}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="group/edit p-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                          onClick={() => {
                            setEditTaskForm({
                              taskId: task.id,
                              taskName: task.name || "",
                              description: task.description || "",
                              startDate: task.startDate || "",
                              endDate: task.deadline || "",
                              priority: 1,
                              status:
                                task.status === "Hoàn thành"
                                  ? 3
                                  : task.status === "Đang thực hiện"
                                  ? 2
                                  : 1,
                              progress:
                                typeof task.progress === "number"
                                  ? task.progress
                                  : 0,
                            });
                            setShowEditTaskModal(true);
                          }}
                        >
                          <svg
                            className="w-4 h-4 text-slate-600 group-hover/edit:text-green-600 transition-colors"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="group/delete p-2 rounded-xl border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                          onClick={() => {
                            setConfirmState({
                              open: true,
                              title: "Xác nhận xoá công việc",
                              message:
                                "Bạn có chắc chắn muốn xoá công việc này? Hành động không thể hoàn tác.",
                              confirmVariant: "danger",
                              onConfirm: async () => {
                                try {
                                  const res =
                                    await assignmentService.deleteTask(task.id);
                                  if (res.success) {
                                    showToast("Đã xoá công việc");
                                    if (currentThesis?.id)
                                      await loadAssignmentsForTopic(
                                        currentThesis.id
                                      );
                                  } else {
                                    showToast(
                                      res.message || "Xoá công việc thất bại"
                                    );
                                  }
                                } catch (err) {
                                  console.error(err);
                                  showToast("Có lỗi khi xoá công việc");
                                } finally {
                                  setConfirmState({ open: false });
                                }
                              },
                            });
                          }}
                        >
                          <svg
                            className="w-4 h-4 text-red-600 group-hover/delete:text-red-700 transition-colors"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5 text-amber-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-600 font-medium">
                          Hạn chót:{" "}
                          <span className="font-semibold text-slate-700">
                            {task.deadline}
                          </span>
                        </span>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddAssignmentModal
        isOpen={showNewAssignmentModal}
        onClose={() => setShowNewAssignmentModal(false)}
        onSubmit={handleCreateAssignment}
        topicData={currentThesis}
        studentProfiles={studentProfiles}
      />

      {/* Confirm Modal dùng chung */}
      <ConfirmModal
        isOpen={!!confirmState.open}
        title={confirmState.title || "Xác nhận"}
        message={confirmState.message || "Bạn có chắc chắn muốn thực hiện?"}
        confirmText="Đồng ý"
        cancelText="Huỷ"
        confirmVariant={confirmState.confirmVariant || "danger"}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false })}
      />

      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 min-w-[320px] max-w-[500px] w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4">
              Thêm công việc mới
            </h3>
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const assignmentId = createTaskForm.assignmentId;
                  const payload = {
                    taskName: createTaskForm.taskName?.trim(),
                    description: createTaskForm.description?.trim(),
                    startDate: createTaskForm.startDate || null,
                    endDate: createTaskForm.endDate || null,
                    priority:
                      createTaskForm.priority === ""
                        ? null
                        : Number(createTaskForm.priority),
                  };

                  if (!assignmentId || !payload.taskName) {
                    showToast("Vui lòng nhập tên công việc");
                    return;
                  }

                  const res = await assignmentService.createTask(
                    assignmentId,
                    payload
                  );
                  if (res.success) {
                    showToast("Tạo công việc thành công");
                    setShowAddTaskModal(false);
                    // reload assignments of current thesis
                    if (currentThesis?.id) {
                      await loadAssignmentsForTopic(currentThesis.id);
                    }
                  } else {
                    showToast(res.message || "Tạo công việc thất bại");
                  }
                } catch (err) {
                  console.error(err);
                  showToast("Có lỗi xảy ra khi tạo công việc");
                }
              }}
            >
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thuộc assignment (ID)
                  </label>
                  <input
                    type="text"
                    value={createTaskForm.assignmentId || ""}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên công việc
                  </label>
                  <input
                    type="text"
                    value={createTaskForm.taskName}
                    onChange={(e) =>
                      setCreateTaskForm((f) => ({
                        ...f,
                        taskName: e.target.value,
                      }))
                    }
                    placeholder="Nhập tên công việc"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={createTaskForm.description}
                    onChange={(e) =>
                      setCreateTaskForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Mô tả chi tiết công việc"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bắt đầu
                    </label>
                    <input
                      type="date"
                      value={createTaskForm.startDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setCreateTaskForm((f) => ({
                          ...f,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    {createTaskForm.startDate &&
                      new Date(createTaskForm.startDate) < new Date() && (
                        <p className="text-red-500 text-xs mt-1">
                          Ngày bắt đầu không được nhỏ hơn ngày hiện tại
                        </p>
                      )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kết thúc
                    </label>
                    <input
                      type="date"
                      value={createTaskForm.endDate}
                      min={
                        createTaskForm.startDate ||
                        new Date().toISOString().split("T")[0]
                      }
                      onChange={(e) =>
                        setCreateTaskForm((f) => ({
                          ...f,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    {createTaskForm.endDate &&
                      createTaskForm.startDate &&
                      new Date(createTaskForm.endDate) <
                        new Date(createTaskForm.startDate) && (
                        <p className="text-red-500 text-xs mt-1">
                          Ngày kết thúc không được nhỏ hơn ngày bắt đầu
                        </p>
                      )}
                    {createTaskForm.endDate &&
                      new Date(createTaskForm.endDate) < new Date() && (
                        <p className="text-red-500 text-xs mt-1">
                          Ngày kết thúc không được nhỏ hơn ngày hiện tại
                        </p>
                      )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mức ưu tiên
                  </label>
                  <select
                    value={createTaskForm.priority}
                    onChange={(e) =>
                      setCreateTaskForm((f) => ({
                        ...f,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value={1}>Thấp</option>
                    <option value={2}>Trung bình</option>
                    <option value={3}>Cao</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
                    onClick={() => setShowAddTaskModal(false)}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
                  >
                    Tạo công việc
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 min-w-[320px] max-w-[500px] w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4">
              Sửa Assignment
            </h3>
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const assignmentId = editAssignmentForm.assignmentId;
                  const payload = {
                    title: editAssignmentForm.title?.trim(),
                    description: editAssignmentForm.description?.trim(),
                    dueDate: editAssignmentForm.dueDate || null,
                    priority:
                      editAssignmentForm.priority === ""
                        ? null
                        : Number(editAssignmentForm.priority),
                    status:
                      editAssignmentForm.status === ""
                        ? null
                        : Number(editAssignmentForm.status),
                  };

                  const res = await assignmentService.updateAssignment(
                    assignmentId,
                    payload
                  );
                  if (res.success) {
                    showToast("Cập nhật assignment thành công");
                    setShowEditAssignmentModal(false);
                    if (currentThesis?.id)
                      await loadAssignmentsForTopic(currentThesis.id);
                  } else {
                    showToast(res.message || "Cập nhật assignment thất bại");
                  }
                } catch (err) {
                  console.error(err);
                  showToast("Có lỗi khi cập nhật assignment");
                }
              }}
            >
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    value={editAssignmentForm.title}
                    onChange={(e) =>
                      setEditAssignmentForm((f) => ({
                        ...f,
                        title: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={editAssignmentForm.description}
                    onChange={(e) =>
                      setEditAssignmentForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hạn chót
                    </label>
                    <input
                      type="date"
                      value={editAssignmentForm.dueDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setEditAssignmentForm((f) => ({
                          ...f,
                          dueDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    {editAssignmentForm.dueDate &&
                      new Date(editAssignmentForm.dueDate) < new Date() && (
                        <p className="text-red-500 text-xs mt-1">
                          Ngày hạn chót không được nhỏ hơn ngày hiện tại
                        </p>
                      )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mức ưu tiên
                    </label>
                    <select
                      value={editAssignmentForm.priority}
                      onChange={(e) =>
                        setEditAssignmentForm((f) => ({
                          ...f,
                          priority: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value={1}>Thấp</option>
                      <option value={2}>Trung bình</option>
                      <option value={3}>Cao</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editAssignmentForm.status}
                    onChange={(e) =>
                      setEditAssignmentForm((f) => ({
                        ...f,
                        status: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value={1}>Pending</option>
                    <option value={2}>On Track</option>
                    <option value={3}>Completed</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg py-2 px-4 text-sm"
                    onClick={() => setShowEditAssignmentModal(false)}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white border-none rounded-lg py-2 px-4 text-sm"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 min-w-[320px] max-w-[500px] w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4">
              Sửa công việc
            </h3>
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload = {
                    taskName: editTaskForm.taskName?.trim(),
                    description: editTaskForm.description?.trim(),
                    startDate: editTaskForm.startDate || null,
                    endDate: editTaskForm.endDate || null,
                    priority: Number(editTaskForm.priority),
                    status: Number(editTaskForm.status),
                    progress: Number(editTaskForm.progress),
                  };
                  const res = await assignmentService.updateTask(
                    editTaskForm.taskId,
                    payload
                  );
                  if (res.success) {
                    showToast("Cập nhật công việc thành công");
                    setShowEditTaskModal(false);
                    if (currentThesis?.id)
                      await loadAssignmentsForTopic(currentThesis.id);
                  } else {
                    showToast(res.message || "Cập nhật công việc thất bại");
                  }
                } catch (err) {
                  console.error(err);
                  showToast("Có lỗi khi cập nhật công việc");
                }
              }}
            >
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên công việc
                  </label>
                  <input
                    type="text"
                    value={editTaskForm.taskName}
                    onChange={(e) =>
                      setEditTaskForm((f) => ({
                        ...f,
                        taskName: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={editTaskForm.description}
                    onChange={(e) =>
                      setEditTaskForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bắt đầu
                    </label>
                    <input
                      type="date"
                      value={editTaskForm.startDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setEditTaskForm((f) => ({
                          ...f,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    {editTaskForm.startDate &&
                      new Date(editTaskForm.startDate) < new Date() && (
                        <p className="text-red-500 text-xs mt-1">
                          Ngày bắt đầu không được nhỏ hơn ngày hiện tại
                        </p>
                      )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kết thúc
                    </label>
                    <input
                      type="date"
                      value={editTaskForm.endDate}
                      min={
                        editTaskForm.startDate ||
                        new Date().toISOString().split("T")[0]
                      }
                      onChange={(e) =>
                        setEditTaskForm((f) => ({
                          ...f,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    {editTaskForm.endDate &&
                      editTaskForm.startDate &&
                      new Date(editTaskForm.endDate) <
                        new Date(editTaskForm.startDate) && (
                        <p className="text-red-500 text-xs mt-1">
                          Ngày kết thúc không được nhỏ hơn ngày bắt đầu
                        </p>
                      )}
                    {editTaskForm.endDate &&
                      new Date(editTaskForm.endDate) < new Date() && (
                        <p className="text-red-500 text-xs mt-1">
                          Ngày kết thúc không được nhỏ hơn ngày hiện tại
                        </p>
                      )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ưu tiên
                    </label>
                    <select
                      value={editTaskForm.priority}
                      onChange={(e) =>
                        setEditTaskForm((f) => ({
                          ...f,
                          priority: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value={1}>Thấp</option>
                      <option value={2}>Trung bình</option>
                      <option value={3}>Cao</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={editTaskForm.status}
                      onChange={(e) =>
                        setEditTaskForm((f) => ({
                          ...f,
                          status: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value={1}>Pending</option>
                      <option value={2}>On Track</option>
                      <option value={3}>Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiến độ (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editTaskForm.progress}
                      onChange={(e) =>
                        setEditTaskForm((f) => ({
                          ...f,
                          progress: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg py-2 px-4 text-sm"
                    onClick={() => setShowEditTaskModal(false)}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white border-none rounded-lg py-2 px-4 text-sm"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
