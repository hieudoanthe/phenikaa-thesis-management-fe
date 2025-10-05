import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserIdFromToken } from "../../auth/authUtils";
import {
  getStudentSuggestedTopics,
  getAllTeachers,
} from "../../services/suggest.service";
import userService from "../../services/user.service";
import { assignmentService } from "../../services";
import EditTopicModal from "../../components/modals/EditTopicModal";
import { useTranslation } from "react-i18next";

/**
 * Trang theo dõi trạng thái đề tài của sinh viên
 * Hiển thị thông tin chi tiết về đề tài đã đăng ký và trạng thái xử lý
 */
const MyThesis = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [thesisList, setThesisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(6);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedThesis, setSelectedThesis] = useState(null);
  const [suggestedByProfiles, setSuggestedByProfiles] = useState({});
  const [suggestedForProfiles, setSuggestedForProfiles] = useState({});
  const [teacherProfiles, setTeacherProfiles] = useState({});
  // Assignments/Tasks theo đề tài
  const [assignments, setAssignments] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Edit topic modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);

  // Rút gọn tên đề tài dài theo ký tự
  const getShortTitle = (title, max = 60) => {
    if (!title) return "";
    if (title.length <= max) return title;
    return title.slice(0, Math.max(0, max - 1)) + "…";
  };

  // Rút gọn theo số từ (tối đa maxWords từ)
  const getShortWords = (title, maxWords = 5) => {
    if (!title) return "";
    const words = String(title).trim().split(/\s+/);
    if (words.length <= maxWords) return title;
    return words.slice(0, maxWords).join(" ") + "…";
  };

  // Hàm lấy trạng thái hiển thị
  const getStatusDisplay = (status) => {
    const map = t("myThesis.status", { returnObjects: true });
    return map?.[status] || map?.UNKNOWN;
  };

  // Hàm lấy màu trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500 text-white"; // Màu emerald-500 cho đã duyệt
      case "PENDING":
        return "bg-yellow-500 text-white";
      case "REJECTED":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Hàm tính phần trăm tiến độ
  const getProgressPercentage = (status) => {
    const progressMap = {
      PENDING: 20,
      APPROVED: 40,
      IN_PROGRESS: 70,
      COMPLETED: 90,
      DEFENDED: 100,
      // Thêm tiến độ cho suggested topics
      SUGGESTED: 30,
      UNDER_REVIEW: 50,
      NEEDS_REVISION: 25,
    };
    return progressMap[status] || 0;
  };

  // Hàm refresh dữ liệu
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Hàm format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return t("myThesis.notUpdated");
    try {
      return new Date(dateString).toLocaleDateString(
        i18n.language === "vi" ? "vi-VN" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );
    } catch {
      return t("myThesis.invalid");
    }
  };

  // Hàm chuyển trang
  const handlePageChange = (page) => {
    setIsChangingPage(true);
    setCurrentPage(page);
    setSelectedThesis(null); // Reset đề tài được chọn khi chuyển trang
    setSuggestedByProfiles({}); // Reset profiles khi chuyển trang
    setSuggestedForProfiles({}); // Reset profiles khi chuyển trang
    setTeacherProfiles({}); // Reset teacher profiles khi chuyển trang

    // Chỉ hiển thị spinner sau 300ms để tránh nháy khó chịu
    const timeout = setTimeout(() => {
      setShowLoadingSpinner(true);
    }, 300);

    setLoadingTimeout(timeout);
  };

  // Hàm chọn đề tài để xem chi tiết
  const handleThesisSelect = (thesis) => {
    setSelectedThesis(thesis);
    // Fetch assignments for this topic
    if (thesis?.topicId) {
      loadAssignmentsForTopic(thesis.topicId);
    } else {
      setAssignments([]);
    }
  };

  // Lấy assignments theo topicId
  const loadAssignmentsForTopic = async (topicId) => {
    try {
      setAssignLoading(true);
      setAssignError("");
      const res = await assignmentService.getAssignmentsByTopic(topicId);
      if (res.success) {
        setAssignments(Array.isArray(res.data) ? res.data : []);
      } else {
        setAssignments([]);
        setAssignError(res.message || "Không thể tải nhiệm vụ");
      }
    } catch (e) {
      setAssignments([]);
      setAssignError("Có lỗi khi tải nhiệm vụ");
    } finally {
      setAssignLoading(false);
    }
  };

  // Cập nhật hoàn thành task
  const handleCompleteTask = async (taskId) => {
    try {
      const payload = { status: 3, progress: 100 };
      const res = await assignmentService.updateTask(taskId, payload);
      if (res.success && selectedThesis?.topicId) {
        await loadAssignmentsForTopic(selectedThesis.topicId);
      }
    } catch (e) {
      // noop; có thể thêm toast nếu cần
    }
  };

  // Hàm mở chat với giảng viên
  const handleOpenChat = (teacherId) => {
    // Chuyển hướng đến trang chat với giảng viên
    navigate(`/student/chat?teacherId=${teacherId}`);
  };

  // Hàm mở modal chỉnh sửa đề tài
  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setEditModalOpen(true);
  };

  // Hàm xử lý sau khi chỉnh sửa thành công
  const handleEditSuccess = () => {
    // Reload the thesis list after successful edit
    loadThesisList();
    setEditModalOpen(false);
    setEditingTopic(null);
  };

  // Hàm đóng modal chỉnh sửa
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingTopic(null);
  };

  // Hàm lấy profile của người đề xuất và người được đề xuất
  const fetchProfiles = async (thesisList) => {
    try {
      const suggestedByIds = [...new Set(thesisList.map((t) => t.suggestedBy))];
      const suggestedForIds = [
        ...new Set(thesisList.map((t) => t.suggestedFor)),
      ];

      // Lấy profile của người đề xuất (sinh viên)
      const suggestedByProfilesData = {};
      for (const id of suggestedByIds) {
        try {
          const profile = await userService.getStudentProfileById(id);
          if (profile && profile.fullName) {
            suggestedByProfilesData[id] = profile.fullName;
          }
        } catch (error) {
          console.error(`Lỗi khi lấy profile của người đề xuất ${id}:`, error);
          suggestedByProfilesData[id] = `ID: ${id}`;
        }
      }
      setSuggestedByProfiles(suggestedByProfilesData);

      // Lấy danh sách tất cả giảng viên trước
      try {
        console.log("Đang lấy danh sách tất cả giảng viên...");
        const allTeachers = await getAllTeachers();
        console.log("Danh sách tất cả giảng viên:", allTeachers);

        // Tạo map từ ID sang fullName
        const teacherMap = {};
        if (allTeachers && Array.isArray(allTeachers)) {
          allTeachers.forEach((teacher) => {
            if (teacher.userId && teacher.fullName) {
              teacherMap[teacher.userId] = teacher.fullName;
            }
          });
        }
        console.log("Map giảng viên ID -> fullName:", teacherMap);

        // Lấy profile của người được đề xuất (giảng viên) từ map
        const suggestedForProfilesData = {};
        for (const id of suggestedForIds) {
          if (teacherMap[id]) {
            suggestedForProfilesData[id] = teacherMap[id];
          } else {
            console.log(`Không tìm thấy giảng viên với ID: ${id}`);
            suggestedForProfilesData[id] = `ID: ${id}`;
          }
        }
        console.log(
          "Tất cả profiles của giảng viên:",
          suggestedForProfilesData
        );
        setSuggestedForProfiles(suggestedForProfilesData);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách giảng viên:", error);
        // Fallback: sử dụng cách cũ
        const suggestedForProfilesData = {};
        for (const id of suggestedForIds) {
          suggestedForProfilesData[id] = `ID: ${id}`;
        }
        setSuggestedForProfiles(suggestedForProfilesData);
      }
    } catch (error) {
      console.error("Lỗi khi lấy profiles:", error);
    }
  };

  // Lấy thông tin đề tài của sinh viên
  useEffect(() => {
    const fetchThesisData = async () => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        setError("");

        const userId = getUserIdFromToken();
        if (!userId) {
          throw new Error("Không thể xác định người dùng");
        }

        // Sử dụng API mới để lấy thông tin đề tài của sinh viên với phân trang
        const response = await getStudentSuggestedTopics(
          userId,
          currentPage,
          pageSize
        );

        // Debug: Log response để kiểm tra cấu trúc
        console.log("API Response:", response);
        console.log("Current Page:", currentPage);
        console.log("Page Size:", pageSize);

        // API trả về dữ liệu trực tiếp thông qua apiGet
        if (response) {
          const data = response;

          // Debug: Log data để kiểm tra cấu trúc
          console.log("Data content:", data?.content);
          console.log("Content length:", data?.content?.length);
          console.log("Total pages:", data?.totalPages);
          console.log("Total elements:", data?.totalElements);

          if (data && data.content && data.content.length > 0) {
            // Cập nhật danh sách đề tài và thông tin phân trang
            setThesisList(data.content);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
            setCurrentPage(data.number || currentPage);

            // Lấy profile của người đề xuất và người được đề xuất
            await fetchProfiles(data.content);
          } else {
            // Chưa đề xuất đề tài nào
            console.log("Không có content hoặc content rỗng");
            setThesisList([]);
            setTotalPages(0);
            setTotalElements(0);
          }
        } else {
          throw new Error("Không có dữ liệu từ API");
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin đề tài:", err);
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          response: err.response,
        });

        // Hiển thị lỗi chi tiết hơn cho người dùng
        let errorMessage = "Có lỗi xảy ra khi tải dữ liệu";
        if (err.message) {
          errorMessage = err.message;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        setError(errorMessage);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          setIsInitialLoad(false);
        }
        setIsChangingPage(false);
        setShowLoadingSpinner(false);

        // Clear timeout nếu có
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          setLoadingTimeout(null);
        }
      }
    };

    fetchThesisData();
  }, [refreshKey, currentPage, pageSize]);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải thông tin đề tài...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4 flex justify-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Có lỗi xảy ra
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!thesisList || thesisList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-6">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Bạn chưa đề xuất đề tài nào
            </h2>
            <p className="text-gray-600 mb-6">
              Để theo dõi tiến độ đề tài, bạn cần đề xuất một đề tài luận văn
              trước.
            </p>
            <div className="space-y-3">
              <button
                onClick={() =>
                  (window.location.href = "/student/topic-registration")
                }
                className="w-full md:w-auto px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200 font-medium"
              >
                Đề xuất đề tài ngay
              </button>
              <button
                onClick={() => (window.location.href = "/student/topic")}
                className="w-full md:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Xem danh sách đề tài
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      <div className="max-w-full mx-auto p-2 h-full flex flex-col">
        {/* Header - Giảm margin và padding */}
        <div className="mb-2">
          <div className="flex items-center justify-end mb-2">
            <button
              onClick={handleRefresh}
              className="px-2 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200 flex items-center gap-1 text-xs"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        {/* Main Content - Grid Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
          {/* Thông tin đề tài - Bên trái */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin đề tài
            </h3>

            {selectedThesis ? (
              // Hiển thị thông tin chi tiết của đề tài được chọn
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4
                    className="font-semibold text-blue-900 mb-2 break-words"
                    title={selectedThesis?.title}
                  >
                    {selectedThesis?.title ||
                      `Đề tài #${selectedThesis?.topicId}`}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-blue-700 mb-1">
                        Trạng thái:
                      </label>
                      <span
                        className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(
                          selectedThesis.suggestionStatus
                        )}`}
                      >
                        {getStatusDisplay(selectedThesis.suggestionStatus)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm text-blue-700 mb-1">
                        Sinh viên đăng ký:
                      </label>
                      <p className="font-medium text-blue-900">
                        {suggestedByProfiles[selectedThesis.suggestedBy] ||
                          `ID: ${selectedThesis.suggestedBy}`}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-blue-700 mb-1">
                        Giảng viên được đăng ký:
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-blue-900">
                          {(() => {
                            const name =
                              suggestedForProfiles[selectedThesis.suggestedFor];
                            console.log(
                              `Hiển thị người được đề xuất chi tiết cho thesis ${selectedThesis.suggestedFor}:`,
                              name
                            );
                            return name || `ID: ${selectedThesis.suggestedFor}`;
                          })()}
                        </p>
                        <button
                          onClick={() =>
                            handleOpenChat(selectedThesis.suggestedFor)
                          }
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Chat với giảng viên"
                        >
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
                              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-blue-700 mb-1">
                        Ngày đăng ký:
                      </label>
                      <p className="font-medium text-blue-900">
                        {formatDate(selectedThesis.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Danh sách Assignment/Task */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-900 m-0">
                      Nhiệm vụ được giao
                    </h4>
                    {selectedThesis?.topicId && (
                      <button
                        onClick={() =>
                          navigate(
                            `/student/assignments?topicId=${selectedThesis.topicId}`
                          )
                        }
                        className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        Xem chi tiết
                      </button>
                    )}
                  </div>
                  {assignLoading ? (
                    <p className="text-sm text-gray-500 m-0">
                      Đang tải nhiệm vụ...
                    </p>
                  ) : assignError ? (
                    <p className="text-sm text-red-600 m-0">{assignError}</p>
                  ) : assignments.length === 0 ? (
                    <p className="text-sm text-gray-500 m-0">
                      Chưa có assignment nào.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((a) => (
                        <div
                          key={a.assignmentId}
                          className="border border-gray-200 rounded-md p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {a.title}
                              </div>
                              <div className="text-xs text-gray-600">
                                Hạn chót: {a.dueDate || "Không có"}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              Tiến độ:{" "}
                              {Array.isArray(a.tasks) && a.tasks.length > 0
                                ? Math.round(
                                    a.tasks.reduce(
                                      (s, t) =>
                                        s +
                                        (typeof t.progress === "number"
                                          ? t.progress
                                          : 0),
                                      0
                                    ) / a.tasks.length
                                  )
                                : 0}
                              %
                            </div>
                          </div>
                          {/* tasks */}
                          <div className="mt-3 space-y-2">
                            {(a.tasks || []).map((t) => {
                              const isCompleted =
                                t.status === 3 || t.status === "Hoàn thành";
                              const currentUserId = getUserIdFromToken();
                              const isMine = t.assignedTo === currentUserId;
                              return (
                                <div
                                  key={t.taskId}
                                  className="flex items-center justify-between bg-gray-50 rounded p-2 border border-gray-200"
                                >
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-800 truncate">
                                      {t.taskName}
                                    </div>
                                    <div className="text-[11px] text-gray-600">
                                      Hạn: {t.endDate || "Không có"} • Trạng
                                      thái:{" "}
                                      {t.status === 3
                                        ? "Hoàn thành"
                                        : t.status === 2
                                        ? "Đang thực hiện"
                                        : "Đang chờ xử lý"}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* Bỏ progress bar theo yêu cầu */}
                                    <span className="text-xs text-gray-700 w-8 text-right">
                                      {typeof t.progress === "number"
                                        ? t.progress
                                        : 0}
                                      %
                                    </span>
                                    <button
                                      disabled={!isMine || isCompleted}
                                      onClick={() =>
                                        handleCompleteTask(t.taskId)
                                      }
                                      className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                                        isMine && !isCompleted
                                          ? "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600"
                                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                      }`}
                                    >
                                      Hoàn thành
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedThesis(null)}
                  className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Xem tất cả đề tài
                </button>
              </div>
            ) : (
              // Hiển thị thông tin tổng quan
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {totalElements}
                  </div>
                  <p className="text-sm text-gray-600">Đề tài đã đăng ký</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Đã duyệt:</span>
                    <span className="font-medium text-green-600">
                      {
                        thesisList.filter(
                          (t) => t.suggestionStatus === "APPROVED"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Chờ duyệt:</span>
                    <span className="font-medium text-yellow-600">
                      {
                        thesisList.filter(
                          (t) => t.suggestionStatus === "PENDING"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Từ chối:</span>
                    <span className="font-medium text-red-600">
                      {
                        thesisList.filter(
                          (t) => t.suggestionStatus === "REJECTED"
                        ).length
                      }
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Click vào đề tài để xem chi tiết
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Danh sách đề tài - 3 cột */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách đề tài đã đăng ký ({totalElements})
                  {totalPages > 1 && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      - Trang {currentPage + 1}/{totalPages}
                    </span>
                  )}
                </h3>
              </div>

              {/* Loading khi chuyển trang - Chỉ hiển thị spinner khi thực sự cần */}
              {isChangingPage && showLoadingSpinner ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3"></div>
                    <p className="text-sm text-gray-600">
                      Đang tải trang mới...
                    </p>
                  </div>
                </div>
              ) : (
                /* Grid đề tài - tự co giãn theo nội dung, không chiếm full chiều cao */
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {thesisList.map((thesis, index) => (
                      <div
                        key={thesis.suggestedId}
                        className="border border-gray-200 rounded-lg p-4 transition-all duration-200 bg-white min-h-[180px] cursor-pointer hover:shadow-md hover:border-orange-600"
                        onClick={() => handleThesisSelect(thesis)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-gray-500">
                              #{index + 1}
                            </span>
                            <span
                              className="text-base font-semibold text-gray-900 truncate whitespace-nowrap overflow-hidden text-ellipsis"
                              title={thesis?.title}
                            >
                              {getShortWords(
                                thesis?.title || `Đề tài #${thesis.topicId}`,
                                5
                              )}
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(
                              thesis.suggestionStatus
                            )}`}
                          >
                            {getStatusDisplay(thesis.suggestionStatus)}
                          </span>
                        </div>

                        <div className="space-y-2.5 text-sm">
                          <div>
                            <label className="block text-gray-600 mb-1.5">
                              Sinh viên đăng ký:
                            </label>
                            <p className="font-medium">
                              {suggestedByProfiles[thesis.suggestedBy] ||
                                `ID: ${thesis.suggestedBy}`}
                            </p>
                          </div>
                          <div>
                            <label className="block text-gray-600 mb-1.5">
                              Giảng viên được đăng ký:
                            </label>
                            <p className="font-medium">
                              {(() => {
                                const name =
                                  suggestedForProfiles[thesis.suggestedFor];
                                console.log(
                                  `Hiển thị người được đề xuất cho thesis ${thesis.suggestedFor}:`,
                                  name
                                );
                                return name || `ID: ${thesis.suggestedFor}`;
                              })()}
                            </p>
                          </div>
                          <div>
                            <label className="block text-gray-600 mb-1.5">
                              Ngày đăng ký:
                            </label>
                            <p className="font-medium">
                              {formatDate(thesis.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Nút chỉnh sửa cho đề tài đang chờ duyệt */}
                        {thesis.suggestionStatus === "PENDING" && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTopic(thesis);
                              }}
                              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Chỉnh sửa đề tài
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phân trang - Tăng font size */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Hiển thị{" "}
                      {thesisList.length > 0 ? currentPage * pageSize + 1 : 0}{" "}
                      đến{" "}
                      {Math.min(
                        currentPage * pageSize + pageSize,
                        totalElements
                      )}{" "}
                      trong tổng số {totalElements} đề tài
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Trước
                      </button>

                      {/* Logic phân trang thông minh */}
                      {(() => {
                        const pages = [];

                        if (totalPages <= 7) {
                          // Nếu ít hơn 7 trang, hiển thị tất cả
                          for (let i = 0; i < totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Nếu nhiều hơn 7 trang, hiển thị thông minh
                          if (currentPage < 4) {
                            // Trang đầu: 1 2 3 4 5 ... last
                            for (let i = 0; i < 5; i++) {
                              pages.push(i);
                            }
                            pages.push("...");
                            pages.push(totalPages - 1);
                          } else if (currentPage > totalPages - 4) {
                            // Trang cuối: 0 ... last-4 last-3 last-2 last-1 last
                            pages.push(0);
                            pages.push("...");
                            for (let i = totalPages - 5; i < totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // Trang giữa: 0 ... current-1 current current+1 ... last
                            pages.push(0);
                            pages.push("...");
                            for (
                              let i = currentPage - 1;
                              i <= currentPage + 1;
                              i++
                            ) {
                              pages.push(i);
                            }
                            pages.push("...");
                            pages.push(totalPages - 1);
                          }
                        }

                        return pages.map((page, index) => {
                          if (page === "...") {
                            return (
                              <span
                                key={`ellipsis-${index}`}
                                className="px-3 py-2 text-sm text-gray-400"
                              >
                                ...
                              </span>
                            );
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 text-sm font-medium rounded ${
                                currentPage === page
                                  ? "bg-secondary text-white"
                                  : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page + 1}
                            </button>
                          );
                        });
                      })()}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Topic Modal */}
      <EditTopicModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        topic={editingTopic}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default MyThesis;
