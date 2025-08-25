import React, { useState, useEffect } from "react";
import TopicService from "../../services/topic.service";
import { toast } from "react-toastify";

const AssignmentManagement = () => {
  const [selectedThesis, setSelectedThesis] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState(0);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // State cho API data
  const [thesisTopics, setThesisTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supervisorCapacity, setSupervisorCapacity] = useState(null);

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
      studentId: topic.suggestedBy?.toString() || "N/A",
      status: topic.approvalStatus === "APPROVED" ? "Approved" : "Pending",
      startDate: topic.createdAt
        ? new Date(topic.createdAt).toISOString().split("T")[0]
        : "N/A",
      endDate: topic.updatedAt
        ? new Date(topic.updatedAt).toISOString().split("T")[0]
        : "N/A",
      maxStudents: topic.maxStudents,
      remainingSlots: topic.maxStudents,
      assignments: sampleAssignments, // Sử dụng sample data cho assignments
    }));
  };

  const currentThesis = thesisTopics[selectedThesis];
  const currentAssignment = currentThesis?.assignments?.[selectedAssignment];

  const getStatusColor = (status) => {
    switch (status) {
      case "On Track":
        return "bg-success-50 text-success-700 border-success-200";
      case "Overdue":
        return "bg-error-50 text-error-700 border-error-200";
      case "Completed":
        return "bg-info-50 text-info-700 border-info-200";
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

  const handleAddTask = () => {
    setShowAddTaskModal(true);
  };

  const handleEditAssignment = () => {
    // edit assignment
  };

  const handleDeleteAssignment = () => {
    // delete assignment
  };

  // ========== API FUNCTIONS ==========

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
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Left Sidebar - Thesis Topics List */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
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
              onClick={() => {
                fetchApprovedTopics(currentPage);
                fetchSupervisorCapacity();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-sm">🔄</span>
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
                  className={`bg-gray-50 hover:bg-gray-100 rounded-xl p-4 mb-4 cursor-pointer transition-all duration-200 border-2 hover:-translate-y-1 hover:shadow-card ${
                    selectedThesis === index
                      ? "bg-primary-50 border-primary-300 shadow-lg shadow-primary-200"
                      : "border-transparent"
                  }`}
                  onClick={() => {
                    setSelectedThesis(index);
                    setSelectedAssignment(0);
                  }}
                >
                  <h3 className="text-sm font-semibold text-secondary-800 mb-2 leading-tight line-clamp-2">
                    {thesis.title}
                  </h3>
                  <div className="flex flex-col gap-1.5 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">👤</span>
                      <span className="text-xs text-gray-600">
                        {thesis.student} ({thesis.studentId})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">📅</span>
                      <span className="text-xs text-gray-600">
                        {thesis.startDate} - {thesis.endDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">👥</span>
                      <span className="text-xs text-gray-600">
                        Còn {thesis.remainingSlots} chỗ trống
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        thesis.status === "Approved"
                          ? "bg-success-100 text-success-700"
                          : "bg-warning-100 text-warning-700"
                      }`}
                    >
                      {thesis.status}
                    </span>
                    <span className="text-xs text-gray-500">
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
                Assignments
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {currentThesis.title}
              </p>
              <button
                className="w-full bg-primary-500 hover:bg-primary-600 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200 shadow-card"
                onClick={handleNewAssignment}
              >
                + New Assignment
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
                    <span className="text-xs font-semibold text-gray-600">
                      {assignment.progress}%
                    </span>
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
                  Edit
                </button>
                <button
                  className="flex items-center gap-1.5 bg-error-500 hover:bg-error-600 text-white border-none rounded-md py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
                  onClick={handleDeleteAssignment}
                >
                  <span className="text-sm">🗑️</span>
                  Delete
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
                    Deadline: {currentAssignment.dueDate}
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
                      <span className="text-xs text-gray-600 cursor-pointer p-1">
                        ▼
                      </span>
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
                        Deadline: {task.deadline}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(
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
            {/* Modal content would go here */}
            <button
              className="w-full bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
              onClick={() => setShowNewAssignmentModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 min-w-[320px] max-w-[500px] w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4">
              Thêm công việc mới
            </h3>
            {/* Modal content would go here */}
            <button
              className="w-full bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer transition-colors duration-200"
              onClick={() => setShowAddTaskModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
