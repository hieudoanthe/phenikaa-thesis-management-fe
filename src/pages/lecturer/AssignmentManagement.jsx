import React, { useState, useEffect } from "react";
import TopicService from "../../services/topic.service";
import { assignmentService } from "../../services";
import userService from "../../services/user.service";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/modals/ConfirmModal";

const AssignmentManagement = () => {
  const [selectedThesis, setSelectedThesis] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState(0);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  // State form tạo assignment
  const [createForm, setCreateForm] = useState({
    topicId: null,
    assignedTo: "",
    title: "",
    description: "",
    dueDate: "",
    priority: 1,
  });

  const resetCreateForm = (topicId, defaultAssignedTo) =>
    setCreateForm({
      topicId: topicId || null,
      assignedTo: defaultAssignedTo || "",
      title: "",
      description: "",
      dueDate: "",
      priority: 1,
    });

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
        toast.error(res.message || "Không thể tải assignments");
      }
    } catch (e) {
      console.error("Lỗi load assignments:", e);
      toast.error("Có lỗi khi tải assignments");
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
    const current = thesisTopics[selectedThesis];
    const topicId = current?.id || null;
    const defaultAssignedTo = current?.suggestedBy || "";
    resetCreateForm(topicId, defaultAssignedTo);
    setShowNewAssignmentModal(true);
  };

  const handleAddTask = () => {
    const currentAssignmentId = currentAssignment?.id || null;
    resetCreateTaskForm(currentAssignmentId);
    setShowAddTaskModal(true);
  };

  const handleEditAssignment = () => {
    if (!currentAssignment) {
      toast.error("Chưa chọn assignment");
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
      toast.error("Chưa chọn assignment");
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
            toast.success("Xoá assignment thành công");
            setSelectedAssignment(0);
            if (currentThesis?.id)
              await loadAssignmentsForTopic(currentThesis.id);
          } else {
            toast.error(res.message || "Xoá assignment thất bại");
          }
        } catch (e) {
          console.error(e);
          toast.error("Có lỗi khi xoá assignment");
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
        toast.error(response.message || "Không thể lấy danh sách đề tài");
        setThesisTopics([]);
        setTotalElements(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đề tài:", error);
      toast.error("Có lỗi xảy ra khi lấy danh sách đề tài");
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
      setSelectedThesis(0);
      setSelectedAssignment(0);

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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans">
      {/* Left Sidebar - Thesis Topics List */}
      <div className="w-full lg:w-80 xl:w-96 bg-white/90 backdrop-blur border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">
            Đề tài đã chấp nhận
          </h2>

          {/* Hiển thị thông tin năng lực giảng viên */}
          {supervisorCapacity && (
            <div className="bg-primary-50 rounded-lg p-3 mb-4">
              <div className="text-sm text-primary-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Năng lực giảng viên:</span>
                  <span className="text-xs bg-primary-100 px-2 py-1 rounded">
                    {supervisorCapacity.totalTopics} đề tài
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Đã approve: {supervisorCapacity.approvedTopics}</div>
                  <div>Còn trống: {supervisorCapacity.totalRemainingSlots}</div>
                  <div>
                    Sử dụng: {supervisorCapacity.utilizationRate?.toFixed(1)}%
                  </div>
                  <div>Đầy: {supervisorCapacity.fullTopics}</div>
                </div>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={async () => {
                await fetchApprovedTopics(currentPage);
                await fetchSupervisorCapacity();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-arrow-repeat"
                viewBox="0 0 16 16"
              >
                <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
                <path
                  fill-rule="evenodd"
                  d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"
                />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto thin-scrollbar">
          {loading ? (
            // Loading state
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-sm text-gray-500">
                Đang tải danh sách đề tài...
              </p>
            </div>
          ) : thesisTopics.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-sm text-gray-500 text-center mb-2">
                Chưa có đề tài nào được approve
              </p>
              <p className="text-xs text-gray-400 text-center">
                Các đề tài đã approve sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            // Thesis topics list - Server-side pagination
            <>
              {thesisTopics.map((thesis, index) => (
                <div
                  key={`${thesis.id}-${currentPage}-${index}`}
                  className={`bg-white/90 hover:bg-white rounded-xl p-4 mb-4 cursor-pointer transition-all duration-200 border hover:-translate-y-1 shadow-sm hover:shadow ${
                    selectedThesis === index
                      ? "border-primary-300 ring-1 ring-primary-100"
                      : "border-gray-100"
                  }`}
                  onClick={() => {
                    setSelectedThesis(index);
                    setSelectedAssignment(0);
                    if (thesis.id) {
                      loadAssignmentsForTopic(thesis.id);
                    }
                  }}
                >
                  <h3 className="text-sm font-semibold text-secondary-800 mb-2 leading-tight line-clamp-2">
                    {thesis.title}
                  </h3>
                  <div className="flex flex-col gap-1.5 mb-3">
                    <div className="flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        class="bi bi-person-fill-check text-gray-500"
                        viewBox="0 0 16 16"
                      >
                        <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                        <path d="M2 13c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4" />
                      </svg>
                      <span className="text-xs text-gray-600">
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
                    <div className="flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        class="bi bi-calendar-week-fill text-gray-500"
                        viewBox="0 0 16 16"
                      >
                        <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M9.5 7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5m3 0h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5M2 10.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5" />
                      </svg>
                      <span className="text-xs text-gray-600">
                        {thesis.startDate} - {thesis.endDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        class="bi bi-people-fill text-gray-500"
                        viewBox="0 0 16 16"
                      >
                        <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
                      </svg>
                      <span className="text-xs text-gray-600">
                        Còn {thesis.remainingSlots} chỗ trống
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md border ${
                        thesis.status === "Approved"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {thesis.status}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {thesis.assignments?.length || 0} assignments
                    </span>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    Hiển thị{" "}
                    {thesisTopics.length > 0 ? currentPage * pageSize + 1 : 0} -{" "}
                    {currentPage * pageSize + thesisTopics.length} trên{" "}
                    {totalElements} đề tài
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handlePageChange(currentPage - 1);
                      }}
                      disabled={currentPage === 0}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Trước
                    </button>

                    <span className="text-sm text-gray-600">
                      Trang {currentPage + 1} / {totalPages}
                    </span>

                    <button
                      onClick={() => {
                        handlePageChange(currentPage + 1);
                      }}
                      disabled={currentPage + 1 >= totalPages}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Middle Panel - Assignments List */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        {currentThesis && (
          <>
            <div className="p-6 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold text-secondary-800 mb-2">
                Nhiệm vụ
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {currentThesis.title}
              </p>
              <button
                className="w-full bg-primary-500 hover:bg-primary-600 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200 shadow-card"
                onClick={handleNewAssignment}
              >
                + Thêm Assignment
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto thin-scrollbar">
              {currentThesis.assignments.map((assignment, index) => (
                <div
                  key={assignment.id}
                  className={`bg-gray-50 hover:bg-gray-100 rounded-xl p-4 mb-4 cursor-pointer transition-all duration-200 border-2 hover:-translate-y-1 hover:shadow-card ${
                    selectedAssignment === index
                      ? "bg-info-50 border-info-300 shadow-lg shadow-info-200"
                      : "border-transparent"
                  }`}
                  onClick={() => setSelectedAssignment(index)}
                >
                  <h4 className="text-sm font-semibold text-secondary-800 mb-2 leading-tight">
                    {assignment.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">
                    {assignment.description}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">
                      📅 {assignment.dueDate}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600">
                        {assignment.progress}%
                      </span>
                      <button
                        type="button"
                        className="text-xs px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-100"
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
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50"
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
                                  toast.success("Đã xoá assignment");
                                  if (currentThesis?.id)
                                    await loadAssignmentsForTopic(
                                      currentThesis.id
                                    );
                                } else {
                                  toast.error(res.message || "Xoá thất bại");
                                }
                              } catch (err) {
                                console.error(err);
                                toast.error("Có lỗi khi xoá assignment");
                              } finally {
                                setConfirmState({ open: false });
                              }
                            },
                          });
                        }}
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getProgressColor(
                        assignment.progress
                      )}`}
                      style={{ width: `${assignment.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Assignment Details & Tasks */}
      <div className="flex-1 bg-white p-8 overflow-y-auto thin-scrollbar">
        {currentAssignment && (
          <>
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 pb-5 border-b border-gray-200 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-secondary-800 leading-tight mb-2">
                  {currentAssignment.title}
                </h1>
                <p className="text-sm text-gray-600">
                  Đề tài: {currentThesis.title}
                </p>
              </div>
              <div className="flex gap-3 w-full lg:w-auto">
                <button
                  className="flex items-center gap-1.5 bg-info-500 hover:bg-info-600 text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
                  onClick={handleEditAssignment}
                >
                  <span className="text-sm">✏️</span>
                  Sửa
                </button>
                <button
                  className="flex items-center gap-1.5 bg-error-500 hover:bg-error-600 text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
                  onClick={handleDeleteAssignment}
                >
                  <span className="text-sm">🗑️</span>
                  Xoá
                </button>
              </div>
            </div>

            {/* Description Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">
                Mô tả
              </h3>
              <p className="text-base text-gray-700 leading-relaxed mb-5">
                {currentAssignment.description}
              </p>
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">📅</span>
                  <span className="text-sm text-gray-700">
                    Hạn chót: {currentAssignment.dueDate}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">📊</span>
                  <span className="text-sm text-gray-700">
                    Tiến độ: {currentAssignment.progress}%
                  </span>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-4">
                <h3 className="text-lg font-semibold text-secondary-800">
                  Các công việc
                </h3>
                <button
                  className="bg-primary-500 hover:bg-primary-600 text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200 shadow-card w-full sm:w-auto"
                  onClick={handleAddTask}
                >
                  + Thêm công việc
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {currentAssignment.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gray-50 rounded-xl p-5 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-secondary-800 mb-1">
                          {task.name}
                        </h4>
                        <span className="text-sm text-gray-600">
                          Người thực hiện: {task.assignee}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-xs px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-100"
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
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50"
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
                                    toast.success("Đã xoá công việc");
                                    if (currentThesis?.id)
                                      await loadAssignmentsForTopic(
                                        currentThesis.id
                                      );
                                  } else {
                                    toast.error(
                                      res.message || "Xoá công việc thất bại"
                                    );
                                  }
                                } catch (err) {
                                  console.error(err);
                                  toast.error("Có lỗi khi xoá công việc");
                                } finally {
                                  setConfirmState({ open: false });
                                }
                              },
                            });
                          }}
                        >
                          Xoá
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getProgressColor(
                            task.progress
                          )}`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-600 min-w-[40px] text-right">
                        {task.progress}%
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-xs text-gray-600">
                        Hạn chót: {task.deadline}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-md border ${getStatusColor(
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
      {showNewAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 min-w-[320px] max-w-[500px] w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4">
              Thêm Assignment mới
            </h3>
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  // Luôn giao cho sinh viên đã đăng ký đề tài (suggestedBy)
                  const selected = thesisTopics.find(
                    (t) => t.id === createForm.topicId
                  );
                  const assigneeId = selected?.suggestedBy || null;

                  const payload = {
                    topicId: createForm.topicId,
                    assignedTo: assigneeId,
                    title: createForm.title?.trim(),
                    description: createForm.description?.trim(),
                    dueDate: createForm.dueDate || null,
                    priority:
                      createForm.priority === ""
                        ? null
                        : Number(createForm.priority),
                  };

                  if (!payload.topicId || !payload.title) {
                    toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
                    return;
                  }

                  const res = await assignmentService.createAssignment(payload);
                  if (res.success) {
                    toast.success("Tạo assignment thành công");
                    setShowNewAssignmentModal(false);
                    // Reload assignments của topic hiện tại
                    if (payload.topicId) {
                      await loadAssignmentsForTopic(payload.topicId);
                    }
                  } else {
                    toast.error(res.message || "Tạo assignment thất bại");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Có lỗi xảy ra khi tạo assignment");
                }
              }}
            >
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đề tài (ID)
                  </label>
                  <input
                    type="text"
                    value={createForm.topicId || ""}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giao cho (Sinh viên đăng ký)
                  </label>
                  <input
                    type="text"
                    value={(() => {
                      const topic = thesisTopics.find(
                        (t) => t.id === createForm.topicId
                      );
                      const profile = topic?.suggestedBy
                        ? studentProfiles[topic.suggestedBy]
                        : null;
                      const name = profile?.fullName || "Sinh viên";
                      const idText = topic?.suggestedBy
                        ? ` (ID: ${topic.suggestedBy})`
                        : "";
                      return `${name}${idText}`;
                    })()}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="Nhập tiêu đề assignment"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Mô tả chi tiết assignment"
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
                      value={createForm.dueDate}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          dueDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mức ưu tiên
                    </label>
                    <select
                      value={createForm.priority}
                      onChange={(e) =>
                        setCreateForm((f) => ({
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

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
                    onClick={() => setShowNewAssignmentModal(false)}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
                  >
                    Tạo assignment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    toast.error("Vui lòng nhập tên công việc");
                    return;
                  }

                  const res = await assignmentService.createTask(
                    assignmentId,
                    payload
                  );
                  if (res.success) {
                    toast.success("Tạo công việc thành công");
                    setShowAddTaskModal(false);
                    // reload assignments of current thesis
                    if (currentThesis?.id) {
                      await loadAssignmentsForTopic(currentThesis.id);
                    }
                  } else {
                    toast.error(res.message || "Tạo công việc thất bại");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Có lỗi xảy ra khi tạo công việc");
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
                      onChange={(e) =>
                        setCreateTaskForm((f) => ({
                          ...f,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kết thúc
                    </label>
                    <input
                      type="date"
                      value={createTaskForm.endDate}
                      onChange={(e) =>
                        setCreateTaskForm((f) => ({
                          ...f,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
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
                    toast.success("Cập nhật assignment thành công");
                    setShowEditAssignmentModal(false);
                    if (currentThesis?.id)
                      await loadAssignmentsForTopic(currentThesis.id);
                  } else {
                    toast.error(res.message || "Cập nhật assignment thất bại");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Có lỗi khi cập nhật assignment");
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
                      onChange={(e) =>
                        setEditAssignmentForm((f) => ({
                          ...f,
                          dueDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
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
                    toast.success("Cập nhật công việc thành công");
                    setShowEditTaskModal(false);
                    if (currentThesis?.id)
                      await loadAssignmentsForTopic(currentThesis.id);
                  } else {
                    toast.error(res.message || "Cập nhật công việc thất bại");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Có lỗi khi cập nhật công việc");
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
                      onChange={(e) =>
                        setEditTaskForm((f) => ({
                          ...f,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kết thúc
                    </label>
                    <input
                      type="date"
                      value={editTaskForm.endDate}
                      onChange={(e) =>
                        setEditTaskForm((f) => ({
                          ...f,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
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
