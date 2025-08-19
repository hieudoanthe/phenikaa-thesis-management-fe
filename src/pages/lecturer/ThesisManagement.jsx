import React, { useState, useEffect } from "react";
import Select from "react-select";
import topicService from "../../services/topic.service";
import academicYearService from "../../services/academic-year.service";
import userService from "../../services/user.service";
import AddTopicModal from "../../components/modals/AddTopicModal.jsx";
import { ToastContainer } from "../../components/common";

const ThesisManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState("All");

  // States cho API
  const [topics, setTopics] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // States cho chỉnh sửa trực tiếp
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editRowData, setEditRowData] = useState({});

  // State cho xem chi tiết topic
  const [selectedTopicForView, setSelectedTopicForView] = useState(null);

  // State cho thông tin người đề xuất
  const [suggestedByProfiles, setSuggestedByProfiles] = useState({});

  // State cho xem profile sinh viên
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [isStudentProfileModalOpen, setIsStudentProfileModalOpen] =
    useState(false);

  // States cho phân trang
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 6;
  const [totalElements, setTotalElements] = useState(0);

  // Load danh sách topics và academic years khi component mount
  useEffect(() => {
    loadTopics();
    loadAcademicYears();
  }, []);

  // Helper hiển thị toast
  const showToast = (message, type = "success") => {
    if (typeof window !== "undefined" && window.addToast) {
      window.addToast(message, type);
    } else {
      (type === "success" ? console.log : console.error)(message);
    }
  };

  // Hàm load thông tin profile của người đề xuất
  const loadSuggestedByProfiles = async (topicsData) => {
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
      setSuggestedByProfiles(profiles);
    } catch (error) {
      console.error("Lỗi khi load profiles của người đề xuất:", error);
    }
  };

  // Hàm load danh sách topics từ API
  const loadTopics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Sử dụng API mới với TeacherId từ JWT token
      const response = await topicService.getTopicListByTeacher();

      if (response.success) {
        // Đảm bảo response.data là array
        let topicsData = [];

        if (Array.isArray(response.data)) {
          topicsData = response.data;
        } else if (
          response.data &&
          response.data.content &&
          Array.isArray(response.data.content)
        ) {
          // Nếu API trả về dạng pagination { content: [...], totalElements: ... }
          topicsData = response.data.content;
        } else if (response.data && Array.isArray(response.data.data)) {
          // Nếu API trả về dạng nested { data: [...] }
          topicsData = response.data.data;
        } else {
          console.warn("Response.data không phải array, sử dụng array rỗng");
          topicsData = [];
        }

        setTopics(topicsData);
        setTotalElements(topicsData.length);

        // Load thông tin profile của người đề xuất
        await loadSuggestedByProfiles(topicsData);
      } else {
        console.error("API trả về success: false:", response.message);
        setError(response.message || "Không thể tải danh sách đề tài");
        setTopics([]); // Set array rỗng để tránh lỗi
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách topics:", error);
      setError("Đã xảy ra lỗi khi tải danh sách đề tài");
      setTopics([]); // Set array rỗng để tránh lỗi
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  // Hàm load danh sách academic years từ API
  const loadAcademicYears = async () => {
    try {
      const response = await academicYearService.getAcademicYearList();

      if (response.success) {
        setAcademicYears(response.data || []);
        // Set default academic year nếu có và chưa được set
        if (
          response.data &&
          response.data.length > 0 &&
          selectedYear === "All"
        ) {
          const defaultYear = response.data[response.data.length - 1]; // Lấy năm mới nhất
          setSelectedYear(defaultYear.id.toString());
        }
      } else {
        console.warn("Không thể tải danh sách năm học:", response.message);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách năm học:", error);
    }
  };

  // Hàm xử lý khi tạo topic hoặc cập nhật topic thành công từ modal
  const handleTopicCreated = async (result) => {
    try {
      // Reload danh sách topics để hiển thị thay đổi
      await loadTopics();
      // Không cần hiển thị thông báo ở đây vì modal đã hiển thị rồi
      // Chỉ reload danh sách để cập nhật UI
    } catch (error) {
      console.error("Lỗi khi reload danh sách topics:", error);
    }
  };

  // Hàm đóng modal profile sinh viên
  const handleCloseStudentProfileModal = () => {
    setIsStudentProfileModalOpen(false);
    setSelectedStudentProfile(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đề tài này?")) {
      try {
        const response = await topicService.deleteTopic(id);

        if (response.success) {
          showToast("Xóa đề tài thành công!", "success");
          // Reload danh sách topics
          await loadTopics();
        } else {
          showToast(response.message || "Xóa đề tài thất bại", "error");
        }
      } catch (error) {
        console.error("Lỗi khi xóa topic:", error);
        showToast("Đã xảy ra lỗi khi xóa đề tài", "error");
      }
    }
  };

  const handleEdit = (id) => {
    const topic = topics.find((t) => String(t.topicId) === String(id));
    if (topic) {
      setEditingTopicId(id);
      setEditRowData({ ...topic });
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditRowData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const updateData = {
        ...editRowData,
        status: editRowData.status || "available",
        academicYearId: parseInt(editRowData.academicYearId),
        maxStudents: parseInt(editRowData.maxStudents),
      };

      const response = await topicService.editTopic(updateData);
      if (response.success) {
        showToast("Cập nhật đề tài thành công!", "success");
        setEditingTopicId(null);
        setEditRowData({});
        await loadTopics();
      } else {
        showToast(response.message || "Cập nhật đề tài thất bại", "error");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật đề tài:", error);
      showToast("Đã xảy ra lỗi khi cập nhật đề tài", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingTopicId(null);
    setEditRowData({});
  };

  const handleView = (id) => {
    const topic = topics.find((t) => String(t.topicId) === String(id));
    if (topic) {
      // Mở modal AddTopicModal với dữ liệu topic để xem
      setIsFormOpen(true);
      // Truyền dữ liệu topic vào modal để hiển thị và cập nhật
      setSelectedTopicForView(topic);
    }
  };

  const handleViewStudentProfile = async (studentId) => {
    try {
      // Kiểm tra xem đã có profile trong cache chưa
      if (suggestedByProfiles[studentId]) {
        setSelectedStudentProfile(suggestedByProfiles[studentId]);
        setIsStudentProfileModalOpen(true);
        return;
      }

      // Nếu chưa có, gọi API để lấy trực tiếp bằng suggestedBy (studentId)
      const profileData = await userService.getStudentProfileById(studentId);
      const profileInfo = {
        fullName: profileData.fullName || profileData.name || "Không xác định",
        studentId:
          profileData.userId ||
          profileData.studentId ||
          profileData.id ||
          studentId,
        email: profileData.email || "",
        major: profileData.major || "",
        className: profileData.className || profileData.class || "",
        phoneNumber: profileData.phoneNumber || "",
        status: profileData.status || 1,
        avt: profileData.avt || profileData.avatar || "",
      };

      setSelectedStudentProfile(profileInfo);
      setIsStudentProfileModalOpen(true);

      // Cập nhật cache
      setSuggestedByProfiles((prev) => ({
        ...prev,
        [studentId]: profileInfo,
      }));
    } catch (error) {
      console.error("Lỗi khi lấy profile sinh viên:", error);
      showToast("Không thể lấy thông tin profile sinh viên", "error");
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await topicService.approveTopic(id);
      if (res.success) {
        showToast(res.message || "Duyệt đề tài thành công", "success");
        await loadTopics();
      } else {
        showToast(res.message || "Duyệt đề tài thất bại", "error");
      }
    } catch (error) {
      console.error("Lỗi khi phê duyệt topic:", error);
      showToast("Đã xảy ra lỗi khi phê duyệt đề tài", "error");
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await topicService.rejectTopic(id);
      if (res.success) {
        showToast(res.message || "Từ chối đề tài thành công", "success");
        await loadTopics();
      } else {
        showToast(res.message || "Từ chối đề tài thất bại", "error");
      }
    } catch (error) {
      console.error("Lỗi khi từ chối topic:", error);
      showToast("Đã xảy ra lỗi khi từ chối đề tài", "error");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedYear("All");
    setSelectedApprovalStatus("All");
  };

  // Đảm bảo topics luôn là array trước khi filter
  const safeTopics = Array.isArray(topics) ? topics : [];

  const filteredTopics = safeTopics.filter((topic) => {
    const matchesSearch =
      (topic.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.topicCode || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (topic.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Nếu selectedYear là "All" hoặc rỗng, hiển thị tất cả
    const matchesYear =
      !selectedYear ||
      selectedYear === "All" ||
      selectedYear === (topic.academicYearId?.toString() || "");

    // Nếu selectedApprovalStatus là "All" hoặc rỗng, hiển thị tất cả
    const matchesApprovalStatus =
      !selectedApprovalStatus ||
      selectedApprovalStatus === "All" ||
      selectedApprovalStatus === (topic.approvalStatus || topic.status || "");

    return matchesSearch && matchesYear && matchesApprovalStatus;
  });

  // Áp dụng phân trang client-side
  const paginatedTopics = filteredTopics.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Reset về trang đầu tiên khi filter thay đổi
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedYear, selectedApprovalStatus, searchTerm]);

  // Debug khi suggestedByProfiles thay đổi (loại bỏ log không cần thiết)
  useEffect(() => {
    // no-op
  }, [suggestedByProfiles]);

  const getStatusBadgeClass = (status) => {
    if (!status) return "bg-green-50 text-green-700 border-green-200";

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "available":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "inactive":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-green-50 text-green-700 border-green-200";
    }
  };

  const getApprovalBadgeClass = (status) => {
    if (!status) return "bg-yellow-50 text-yellow-700 border-yellow-200";

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "available":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "inactive":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  // Helper function để lấy tên năm học từ ID
  const getAcademicYearName = (yearId) => {
    if (!yearId || !academicYears.length) return "Chưa xác định";

    const year = academicYears.find((y) => y.id === parseInt(yearId));
    return year ? year.name : "Chưa xác định";
  };

  // Helper function để kiểm tra trạng thái pending
  const isPendingStatus = (approvalStatus, status) => {
    const approvalLower = approvalStatus?.toLowerCase();
    const statusLower = status?.toLowerCase();

    return (
      approvalLower === "pending" ||
      statusLower === "pending" ||
      approvalStatus === "PENDING" ||
      status === "PENDING"
    );
  };

  const getOptionBackgroundColor = (state) => {
    if (state.isSelected) return "#2563eb";
    if (state.isFocused) return "#f3f4f6";
    return "#fff";
  };

  // Helper: Nhãn hiển thị cho bộ lọc trạng thái duyệt
  const getApprovalFilterLabel = (value) => {
    switch (value) {
      case "All":
        return "Tất cả trạng thái";
      case "pending":
        return "Chờ duyệt";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Bị từ chối";
      case "available":
        return "Còn trống";
      case "active":
        return "Hoạt động";
      case "inactive":
        return "Ngừng hoạt động";
      default:
        return "Tất cả trạng thái";
    }
  };

  // Helper: Rút gọn tiêu đề theo kích thước màn hình
  const getTitleDisplay = (title) => {
    if (!title) return "Chưa có tiêu đề";
    const limit = window.innerWidth < 640 ? 30 : 50;
    return title.length > limit ? title.substring(0, limit) + "..." : title;
  };

  // Bỏ các log debug không cần thiết

  // Hiển thị loading
  if (loading && (!Array.isArray(topics) || topics.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách đề tài...</p>
        </div>
      </div>
    );
  }

  // Hiển thị error
  if (error && (!Array.isArray(topics) || topics.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-error-500 mb-4">{error}</p>
          <button
            onClick={loadTopics}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Add Topic Modal */}
      <AddTopicModal
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedTopicForView(null); // Reset topic khi đóng modal
        }}
        onSubmit={handleTopicCreated}
        topicData={selectedTopicForView} // Truyền dữ liệu topic để xem
        isViewMode={!!selectedTopicForView} // Xác định chế độ xem
      />

      {/* Student Profile Modal */}
      {isStudentProfileModalOpen && selectedStudentProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Thông tin sinh viên
              </h3>
              <button
                onClick={handleCloseStudentProfileModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Avatar */}
              {selectedStudentProfile.avt && (
                <div className="flex justify-center">
                  <img
                    src={selectedStudentProfile.avt}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                  />
                </div>
              )}

              {/* Thông tin cơ bản */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Họ và tên
                  </label>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedStudentProfile.fullName}
                  </p>
                </div>

                {/* Ẩn mã sinh viên theo yêu cầu */}

                {selectedStudentProfile.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <p className="text-base text-gray-700">
                      {selectedStudentProfile.email}
                    </p>
                  </div>
                )}

                {selectedStudentProfile.phoneNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Số điện thoại
                    </label>
                    <p className="text-base text-gray-700">
                      {selectedStudentProfile.phoneNumber}
                    </p>
                  </div>
                )}

                {selectedStudentProfile.major && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Chuyên ngành
                    </label>
                    <p className="text-base text-gray-700">
                      {selectedStudentProfile.major}
                    </p>
                  </div>
                )}

                {selectedStudentProfile.className && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Lớp
                    </label>
                    <p className="text-base text-gray-700">
                      {selectedStudentProfile.className}
                    </p>
                  </div>
                )}

                {/* Bỏ hiển thị trạng thái theo yêu cầu */}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={handleCloseStudentProfileModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Top row - Add button and search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-white font-medium rounded-lg hover:bg-secondary-hover transition-colors duration-200 shadow-sm w-full sm:w-auto"
              onClick={() => {
                setIsFormOpen(true);
                setSelectedTopicForView(null); // Reset để tạo mới
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              <span className="hidden sm:inline">Thêm đề tài mới</span>
              <span className="sm:hidden">Thêm đề tài</span>
            </button>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
                placeholder="Tìm kiếm đề tài..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200"
              />
            </div>
          </div>

          {/* Bottom row - Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-40">
              <Select
                value={{
                  value: selectedYear,
                  label:
                    selectedYear === "All"
                      ? "Tất cả năm học"
                      : getAcademicYearName(selectedYear),
                }}
                onChange={(opt) =>
                  setSelectedYear(opt ? String(opt.value) : "All")
                }
                options={[
                  { value: "All", label: "Tất cả năm học" },
                  ...academicYears.map((y) => ({
                    value: String(y.id),
                    label: y.name,
                  })),
                ]}
                isSearchable={false}
                className="custom-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "8px",
                    minHeight: "40px",
                    fontSize: "0.95rem",
                    borderColor: "#d1d5db",
                    boxShadow: "none",
                  }),
                  option: (base, state) => ({
                    ...base,
                    fontSize: "0.95rem",
                    backgroundColor: getOptionBackgroundColor(state),
                    color: state.isSelected ? "#fff" : "#111827",
                    cursor: "pointer",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#374151",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "8px",
                    zIndex: 20,
                  }),
                }}
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                value={{
                  value: selectedApprovalStatus,
                  label: getApprovalFilterLabel(selectedApprovalStatus),
                }}
                onChange={(opt) =>
                  setSelectedApprovalStatus(opt ? String(opt.value) : "All")
                }
                options={[
                  { value: "All", label: "Tất cả trạng thái" },
                  { value: "pending", label: "Chờ duyệt" },
                  { value: "approved", label: "Đã duyệt" },
                  { value: "rejected", label: "Bị từ chối" },
                  { value: "available", label: "Còn trống" },
                  { value: "active", label: "Hoạt động" },
                  { value: "inactive", label: "Ngừng hoạt động" },
                ]}
                isSearchable={false}
                className="custom-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "8px",
                    minHeight: "40px",
                    fontSize: "0.95rem",
                    borderColor: "#d1d5db",
                    boxShadow: "none",
                  }),
                  option: (base, state) => ({
                    ...base,
                    fontSize: "0.95rem",
                    backgroundColor: getOptionBackgroundColor(state),
                    color: state.isSelected ? "#fff" : "#111827",
                    cursor: "pointer",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#374151",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "8px",
                    zIndex: 20,
                  }),
                }}
              />
            </div>

            <button
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 font-medium rounded-lg transition-colors duration-200 w-full sm:w-auto"
              onClick={clearFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Topics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Mã đề tài
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] sm:min-w-[200px]">
                  Tiêu đề
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] hidden md:table-cell">
                  Sinh viên đăng ký
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] hidden lg:table-cell">
                  Năm học
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] hidden xl:table-cell">
                  Trạng thái duyệt
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] hidden xl:table-cell">
                  Trạng thái đề tài
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!Array.isArray(paginatedTopics) ||
              paginatedTopics.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 sm:px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <p className="text-gray-500 text-base mb-2">
                        Không tìm thấy đề tài nào
                      </p>
                      <span className="text-gray-400 text-sm">
                        Hãy thử điều chỉnh bộ lọc hoặc tạo đề tài mới
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTopics.map((topic) => (
                  <tr
                    key={topic.topicId}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {editingTopicId === topic.topicId ? (
                      <>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            name="topicCode"
                            value={editRowData.topicCode || ""}
                            onChange={handleEditInputChange}
                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200 text-sm"
                          />
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            name="title"
                            value={editRowData.title || ""}
                            onChange={handleEditInputChange}
                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200 text-sm"
                          />
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <input
                            type="text"
                            name="registerId"
                            value={editRowData.registerId || ""}
                            onChange={handleEditInputChange}
                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200 text-sm"
                          />
                          {!editRowData.registerId &&
                            editRowData.suggestedBy && (
                              <div className="mt-1 text-xs">
                                <button
                                  onClick={() =>
                                    handleViewStudentProfile(
                                      editRowData.suggestedBy
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                  title="Click để xem profile sinh viên"
                                >
                                  {(() => {
                                    const profile =
                                      suggestedByProfiles[
                                        editRowData.suggestedBy
                                      ];
                                    const displayName =
                                      profile?.fullName ||
                                      editRowData.suggestedBy;
                                    return displayName;
                                  })()}
                                </button>
                              </div>
                            )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <select
                            name="academicYearId"
                            value={editRowData.academicYearId || ""}
                            onChange={handleEditInputChange}
                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200 text-sm"
                          >
                            {academicYears.map((year) => (
                              <option key={year.id} value={year.id}>
                                {year.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center hidden xl:table-cell">
                          <select
                            name="approvalStatus"
                            value={editRowData.approvalStatus || ""}
                            onChange={handleEditInputChange}
                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200 text-sm"
                          >
                            <option value="PENDING">Chờ duyệt</option>
                            <option value="AVAILABLE">Còn trống</option>
                            <option value="APPROVED">Đã duyệt</option>
                            <option value="REJECTED">Bị từ chối</option>
                          </select>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center hidden xl:table-cell">
                          <select
                            name="status"
                            value={editRowData.status || ""}
                            onChange={handleEditInputChange}
                            className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200 text-sm"
                          >
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Ngừng hoạt động</option>
                            <option value="ARCHIVED">Lưu trữ</option>
                            <option value="DELETED">Đã xóa</option>
                          </select>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-1 sm:gap-2">
                            {/* Button Chấp nhận - chỉ hiển thị khi status là pending */}
                            {isPendingStatus(
                              editRowData.approvalStatus,
                              editRowData.status
                            ) && (
                              <>
                                <button
                                  type="button"
                                  className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                  title="Chấp nhận"
                                  aria-label="Chấp nhận đề tài"
                                  onClick={() =>
                                    handleApprove(editRowData.topicId || 0)
                                  }
                                >
                                  Chấp nhận
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title="Từ chối"
                                  aria-label="Từ chối đề tài"
                                  onClick={() =>
                                    handleReject(editRowData.topicId || 0)
                                  }
                                >
                                  Từ chối
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className="p-1.5 sm:p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors duration-200"
                              title="Lưu"
                              aria-label="Lưu"
                              onClick={handleSaveEdit}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                              title="Hủy"
                              aria-label="Hủy"
                              onClick={handleCancelEdit}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-blue-600 font-mono text-sm">
                            {topic.topicCode || "Chưa có"}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className="font-medium text-gray-900 max-w-[150px] sm:max-w-[200px] block"
                            title={topic.title || "Chưa có tiêu đề"}
                          >
                            {getTitleDisplay(topic.title)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm">
                            {topic.registerId ? (
                              <span className="font-medium text-gray-600 font-mono">
                                {topic.registerId}
                              </span>
                            ) : topic.suggestedBy ? (
                              <button
                                onClick={() =>
                                  handleViewStudentProfile(topic.suggestedBy)
                                }
                                className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer transition-colors duration-200"
                                title="Click để xem profile sinh viên"
                              >
                                {(() => {
                                  const profile =
                                    suggestedByProfiles[topic.suggestedBy];
                                  const displayName =
                                    profile?.fullName || topic.suggestedBy;
                                  return displayName;
                                })()}
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          {getAcademicYearName(topic.academicYearId)}
                        </td>

                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center hidden xl:table-cell">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-medium border-none ${getApprovalBadgeClass(
                              topic.approvalStatus || topic.status
                            )}`}
                          >
                            {(() => {
                              const status =
                                topic.approvalStatus ||
                                topic.status ||
                                "pending";
                              const statusLower = status.toLowerCase();

                              switch (statusLower) {
                                case "pending":
                                  return "Chờ duyệt";
                                case "approved":
                                  return "Đã duyệt";
                                case "rejected":
                                  return "Bị từ chối";
                                case "available":
                                  return "Còn trống";
                                case "active":
                                  return "Hoạt động";
                                case "inactive":
                                  return "Ngừng hoạt động";
                                default:
                                  return status;
                              }
                            })()}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center hidden xl:table-cell">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-medium border-none ${getStatusBadgeClass(
                              topic.status || topic.topicStatus || "Active"
                            )}`}
                          >
                            {(() => {
                              const status =
                                topic.status || topic.topicStatus || "active";
                              const statusLower = status.toLowerCase();
                              switch (statusLower) {
                                case "active":
                                  return "Hoạt động";
                                case "inactive":
                                  return "Ngừng";
                                case "archived":
                                  return "Lưu trữ";
                                case "deleted":
                                  return "Đã xóa";
                                case "available":
                                  return "Còn trống";
                                case "pending":
                                  return "Chờ duyệt";
                                default:
                                  return status;
                              }
                            })()}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-1 sm:gap-2">
                            {/* Bỏ log debug không cần thiết */}

                            {/* Button Chấp nhận - chỉ hiển thị khi status là pending */}
                            {isPendingStatus(
                              topic.approvalStatus,
                              topic.status
                            ) && (
                              <>
                                <button
                                  type="button"
                                  className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                  title="Chấp nhận"
                                  aria-label="Chấp nhận đề tài"
                                  onClick={() =>
                                    handleApprove(topic.topicId || 0)
                                  }
                                >
                                  Chấp nhận
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title="Từ chối"
                                  aria-label="Từ chối đề tài"
                                  onClick={() =>
                                    handleReject(topic.topicId || 0)
                                  }
                                >
                                  Từ chối
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className="p-1.5 sm:p-2 text-info-500 hover:bg-info-50 rounded-lg transition-colors duration-200"
                              title="Xem chi tiết"
                              aria-label="Xem chi tiết"
                              onClick={() => handleView(topic.topicId || 0)}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                              title="Chỉnh sửa"
                              aria-label="Chỉnh sửa"
                              onClick={() => handleEdit(topic.topicId)}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="p-1.5 sm:p-2 text-error-500 hover:bg-error-50 rounded-lg transition-colors duration-200"
                              title="Xóa"
                              aria-label="Xóa đề tài"
                              onClick={() => handleDelete(topic.topicId || 0)}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-700">
            Hiển thị{" "}
            {Array.isArray(filteredTopics) && filteredTopics.length > 0
              ? currentPage * pageSize + 1
              : 0}{" "}
            đến{" "}
            {Array.isArray(filteredTopics)
              ? Math.min(
                  currentPage * pageSize + pageSize,
                  filteredTopics.length
                )
              : 0}{" "}
            trên {Array.isArray(filteredTopics) ? filteredTopics.length : 0} bản
            ghi — Trang {currentPage + 1}/
            {Array.isArray(filteredTopics)
              ? Math.ceil(filteredTopics.length / pageSize)
              : 1}
          </div>

          {/* Pagination - Hiển thị khi có nhiều hơn 1 trang */}
          {Array.isArray(filteredTopics) &&
          Math.ceil(filteredTopics.length / pageSize) > 1 ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="p-1.5 sm:p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={currentPage === 0}
                onClick={() =>
                  currentPage > 0 && setCurrentPage(currentPage - 1)
                }
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              <button className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium text-gray-900 bg-secondary text-white rounded-lg">
                {currentPage + 1}
              </button>
              <span className="px-1 sm:px-2 text-sm text-gray-500">
                / {Math.ceil(filteredTopics.length / pageSize)}
              </span>
              <button
                className="p-1.5 sm:p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={
                  currentPage + 1 >= Math.ceil(filteredTopics.length / pageSize)
                }
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Không có phân trang (chỉ có{" "}
              {Array.isArray(filteredTopics) ? filteredTopics.length : 0} bản
              ghi)
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ThesisManagement;
