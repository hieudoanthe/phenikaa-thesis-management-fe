import React, { useState, useEffect } from "react";
import Select from "react-select";
import topicService from "../../services/topic.service";
import academicYearService from "../../services/academic-year.service";
import AddTopicModal from "../../components/modals/AddTopicModal.jsx";

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

  // States cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8;

  // Load danh sách topics và academic years khi component mount
  useEffect(() => {
    loadTopics();
    loadAcademicYears();
  }, []);

  // Hàm load danh sách topics từ API
  const loadTopics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await topicService.getTopicList();

      if (response.success) {
        setTopics(response.data || []);
      } else {
        setError(response.message || "Không thể tải danh sách đề tài");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách topics:", error);
      setError("Đã xảy ra lỗi khi tải danh sách đề tài");
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

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đề tài này?")) {
      try {
        const response = await topicService.deleteTopic(id);

        if (response.success) {
          alert("Xóa đề tài thành công!");
          // Reload danh sách topics
          await loadTopics();
        } else {
          alert(response.message || "Xóa đề tài thất bại");
        }
      } catch (error) {
        console.error("Lỗi khi xóa topic:", error);
        alert("Đã xảy ra lỗi khi xóa đề tài");
      }
    }
  };

  const handleEdit = (id) => {
    console.log("Edit topic id:", id);
    const topic = topics.find((t) => String(t.topicId) === String(id));
    console.log("Found topic:", topic);
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
      console.log("Dữ liệu cập nhật:", updateData);

      const response = await topicService.editTopic(updateData);
      if (response.success) {
        alert("Cập nhật đề tài thành công!");
        setEditingTopicId(null);
        setEditRowData({});
        await loadTopics();
      } else {
        alert(response.message || "Cập nhật đề tài thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật đề tài:", error);
      alert("Đã xảy ra lỗi khi cập nhật đề tài");
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

  const handleApprove = async (id) => {
    try {
      // TODO: Implement approve API call
      alert("Chức năng phê duyệt đang được phát triển");
    } catch (error) {
      console.error("Lỗi khi phê duyệt topic:", error);
      alert("Đã xảy ra lỗi khi phê duyệt đề tài");
    }
  };

  const handleReject = async (id) => {
    try {
      // TODO: Implement reject API call
      alert("Chức năng từ chối đang được phát triển");
    } catch (error) {
      console.error("Lỗi khi từ chối topic:", error);
      alert("Đã xảy ra lỗi khi từ chối đề tài");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedYear("All");
    setSelectedApprovalStatus("All");
  };

  const filteredTopics = topics.filter((topic) => {
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

  const getStatusBadgeClass = (status) => {
    if (!status) return "bg-green-100 text-green-800";

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "available":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getApprovalBadgeClass = (status) => {
    if (!status) return "bg-yellow-100 text-yellow-800";

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "available":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Helper function để lấy tên năm học từ ID
  const getAcademicYearName = (yearId) => {
    if (!yearId || !academicYears.length) return "Chưa xác định";

    const year = academicYears.find((y) => y.id === parseInt(yearId));
    return year ? year.name : "Chưa xác định";
  };

  // Debug logs
  console.log("ThesisManagement render:", {
    loading,
    error,
    topicsLength: topics.length,
    academicYearsLength: academicYears.length,
    selectedYear,
    selectedApprovalStatus,
  });

  // Hiển thị loading
  if (loading && topics.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 text-sm">Đang tải danh sách đề tài...</p>
        </div>
      </div>
    );
  }

  // Hiển thị error
  if (error && topics.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <p className="text-red-500 text-base mb-4 max-w-md">{error}</p>
          <button
            onClick={loadTopics}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200"
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

  // Sau khi có filteredTopics:
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredTopics.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredTopics.length / recordsPerPage);

  return (
    <div className="min-h-screen bg-white">
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

      {/* Show Form Button (when form is hidden) */}
      {!isFormOpen && (
        <div className="sticky top-[70px] left-0 right-0 z-50 p-4 lg:p-8 bg-white border-b border-gray-200 transition-all duration-300">
          <button
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200"
            onClick={() => {
              setIsFormOpen(true);
              setSelectedTopicForView(null); // Reset để tạo mới
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Thêm Đề Tài Mới
          </button>
        </div>
      )}

      {/* Topic List - chỉ hiển thị khi form ẩn */}
      {!isFormOpen && (
        <div className="bg-white min-h-screen">
          <div className="bg-gray-50 p-6 lg:p-8 border-b border-gray-200">
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 m-0">
              Danh Sách Đề Tài
            </h2>
          </div>

          {/* Filters and Search */}
          <div className="sticky top-[140px] left-0 right-0 z-40 p-4 lg:p-8 bg-white border-b border-gray-200 transition-all duration-300">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 flex-wrap">
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 min-w-[260px]">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Năm học:
                  </label>
                  {(() => {
                    const yearOptions = [
                      { value: "All", label: "Tất cả năm học" },
                      ...academicYears.map((y) => ({
                        value: String(y.id),
                        label: y.name,
                      })),
                    ];
                    const yearValue = yearOptions.find(
                      (o) => o.value === String(selectedYear)
                    );
                    return (
                      <Select
                        classNamePrefix="select"
                        options={yearOptions}
                        value={yearValue}
                        onChange={(opt) =>
                          setSelectedYear(opt ? String(opt.value) : "All")
                        }
                        isClearable
                        placeholder="Chọn năm học"
                        className="w-full sm:w-auto"
                      />
                    );
                  })()}
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 min-w-[200px]">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Trạng thái duyệt:
                  </label>
                  <Select
                    classNamePrefix="select"
                    options={[
                      { value: "All", label: "Tất cả trạng thái" },
                      { value: "pending", label: "Chờ duyệt" },
                      { value: "approved", label: "Đã duyệt" },
                      { value: "rejected", label: "Bị từ chối" },
                      { value: "available", label: "Còn trống" },
                      { value: "active", label: "Hoạt động" },
                      { value: "inactive", label: "Ngừng hoạt động" },
                    ]}
                    value={{
                      value: selectedApprovalStatus,
                      label:
                        selectedApprovalStatus === "All"
                          ? "Tất cả trạng thái"
                          : selectedApprovalStatus === "pending"
                          ? "Chờ duyệt"
                          : selectedApprovalStatus === "approved"
                          ? "Đã duyệt"
                          : selectedApprovalStatus === "rejected"
                          ? "Bị từ chối"
                          : selectedApprovalStatus === "available"
                          ? "Còn trống"
                          : selectedApprovalStatus === "active"
                          ? "Hoạt động"
                          : selectedApprovalStatus === "inactive"
                          ? "Ngừng hoạt động"
                          : "Tất cả trạng thái",
                    }}
                    onChange={(opt) =>
                      setSelectedApprovalStatus(opt ? String(opt.value) : "All")
                    }
                    isClearable
                    placeholder="Chọn trạng thái"
                    className="w-full sm:w-auto"
                  />
                </div>
              </div>

              <div className="flex-1 max-w-md w-full">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Tìm kiếm đề tài..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <button
                  className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200"
                  onClick={clearFilters}
                >
                  Xóa Bộ Lọc
                </button>
              </div>
            </div>
          </div>

          {/* Topics Table */}
          <div className="w-full overflow-x-auto pt-24 lg:pt-28">
            <table className="w-full border-collapse bg-white min-w-[1200px]">
              <thead>
                <tr>
                  <th className="bg-gray-50 p-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 w-[10%]">
                    Mã đề tài
                  </th>
                  <th className="bg-gray-50 p-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 w-[20%]">
                    Tiêu đề
                  </th>
                  <th className="bg-gray-50 p-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 w-[12%]">
                    Sinh viên đăng kí
                  </th>
                  <th className="bg-gray-50 p-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 w-[12%]">
                    Năm học
                  </th>
                  <th className="bg-gray-50 p-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200 w-[10%]">
                    Số lượng
                  </th>
                  <th className="bg-gray-50 p-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200 w-[13%]">
                    Trạng thái duyệt
                  </th>
                  <th className="bg-gray-50 p-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200 w-[13%]">
                    Trạng thái đề tài
                  </th>
                  <th className="bg-gray-50 p-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200 w-[10%]">
                    Phê duyệt
                  </th>
                  <th className="bg-gray-50 p-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200 w-[10%] min-w-[140px]">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center">
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
                  currentRecords.map((topic) => (
                    <tr
                      key={topic.topicId}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {editingTopicId === topic.topicId ? (
                        <>
                          {/* KHÔNG render topicId */}
                          <td className="p-4 border-b border-gray-100">
                            <input
                              type="text"
                              name="topicCode"
                              value={editRowData.topicCode || ""}
                              onChange={handleEditInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-4 border-b border-gray-100">
                            <input
                              type="text"
                              name="title"
                              value={editRowData.title || ""}
                              onChange={handleEditInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-4 border-b border-gray-100">
                            <input
                              type="text"
                              name="registerId"
                              value={editRowData.registerId || ""}
                              onChange={handleEditInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-4 border-b border-gray-100">
                            <select
                              name="academicYearId"
                              value={editRowData.academicYearId || ""}
                              onChange={handleEditInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:border-blue-500 focus:outline-none"
                            >
                              {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                  {year.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4 border-b border-gray-100 text-center">
                            <input
                              type="number"
                              name="maxStudents"
                              min="1"
                              max="10"
                              value={editRowData.maxStudents || ""}
                              onChange={handleEditInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-4 border-b border-gray-100 text-center">
                            <select
                              name="approvalStatus"
                              value={editRowData.approvalStatus || ""}
                              onChange={handleEditInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="PENDING">Chờ duyệt</option>
                              <option value="AVAILABLE">Còn trống</option>
                              <option value="APPROVED">Đã duyệt</option>
                              <option value="REJECTED">Bị từ chối</option>
                            </select>
                          </td>
                          <td className="p-4 border-b border-gray-100 text-center">
                            <select
                              name="status"
                              value={editRowData.status || ""}
                              onChange={handleEditInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="ACTIVE">Hoạt động</option>
                              <option value="INACTIVE">Ngừng hoạt động</option>
                              <option value="ARCHIVED">Lưu trữ</option>
                              <option value="DELETED">Đã xóa</option>
                            </select>
                          </td>
                          <td className="p-4 border-b border-gray-100 text-center">
                            <span className="text-sm text-gray-600 italic">
                              {editRowData.approvalStatus ||
                                editRowData.status ||
                                "Available"}
                            </span>
                          </td>
                          <td className="p-4 border-b border-gray-100 text-center">
                            <div className="flex gap-2 items-center justify-start">
                              <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                                onClick={handleSaveEdit}
                              >
                                Lưu
                              </button>
                              <button
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                                onClick={handleCancelEdit}
                              >
                                Hủy
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* KHÔNG render topicId */}
                          <td className="p-4 border-b border-gray-100">
                            <span className="font-semibold text-blue-600 font-mono text-sm">
                              {topic.topicCode || "Chưa có"}
                            </span>
                          </td>
                          <td className="p-4 border-b border-gray-100">
                            <span
                              className="font-medium text-gray-900 max-w-[300px] block"
                              title={topic.title || "Chưa có tiêu đề"}
                            >
                              {topic.title
                                ? topic.title.length > 50
                                  ? topic.title.substring(0, 50) + "..."
                                  : topic.title
                                : "Chưa có tiêu đề"}
                            </span>
                          </td>
                          <td className="p-4 border-b border-gray-100 text-center">
                            <span className="font-medium text-gray-600 font-mono text-sm">
                              {topic.registerId || "Chưa có"}
                            </span>
                          </td>
                          <td className="p-4 border-b border-gray-100">
                            {getAcademicYearName(topic.academicYearId)}
                          </td>
                          <td className="p-4 border-b border-gray-100 text-center">
                            {topic.currentStudents || 0}/
                            {topic.maxStudents || 1}
                          </td>
                          <td className="p-4 border-b border-gray-100 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getApprovalBadgeClass(
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
                          <td className="p-4 border-b border-gray-100 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                                topic.status || topic.topicStatus || "Active"
                              )}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full mr-1.5"></span>
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
                          <td className="p-4 border-b border-gray-100 text-center">
                            {(() => {
                              const approvalStatus =
                                topic.approvalStatus || topic.status || "";
                              const statusLower = approvalStatus.toLowerCase();

                              // Hiển thị nút Duyệt/Từ chối cho trạng thái chờ duyệt
                              if (statusLower === "pending") {
                                return (
                                  <div className="flex flex-row gap-1 items-center justify-center">
                                    <button
                                      className="flex items-center gap-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm"
                                      onClick={() =>
                                        handleApprove(topic.topicId || 0)
                                      }
                                      title="Approve"
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                      >
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                      </svg>
                                      Duyệt
                                    </button>
                                    <button
                                      className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm"
                                      onClick={() =>
                                        handleReject(topic.topicId || 0)
                                      }
                                      title="Reject"
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                      >
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                      </svg>
                                      Từ chối
                                    </button>
                                  </div>
                                );
                              }

                              // Hiển thị trạng thái đã phê duyệt
                              if (statusLower === "approved") {
                                return (
                                  <span className="text-sm text-gray-600 italic">
                                    Đã duyệt
                                  </span>
                                );
                              }

                              if (statusLower === "rejected") {
                                return (
                                  <span className="text-sm text-gray-600 italic">
                                    Đã từ chối
                                  </span>
                                );
                              }

                              // Hiển thị trạng thái available
                              if (
                                statusLower === "available" ||
                                statusLower === "active"
                              ) {
                                return (
                                  <span className="text-sm text-gray-600 italic">
                                    Còn trống
                                  </span>
                                );
                              }

                              // Fallback: hiển thị nút Duyệt/Từ chối nếu không xác định được trạng thái
                              return (
                                <div className="flex flex-row gap-1 items-center justify-center">
                                  <button
                                    className="flex items-center gap-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm"
                                    onClick={() =>
                                      handleApprove(topic.topicId || 0)
                                    }
                                    title="Approve"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                    Duyệt
                                  </button>
                                  <button
                                    className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm"
                                    onClick={() =>
                                      handleReject(topic.topicId || 0)
                                    }
                                    title="Reject"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </svg>
                                    Từ chối
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-4 border-b border-gray-100 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors duration-200"
                                onClick={() => handleView(topic.topicId || 0)}
                                title="Xem chi tiết"
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
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors duration-200"
                                onClick={() => handleEdit(topic.topicId)}
                                title="Chỉnh sửa"
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
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors duration-200"
                                onClick={() => handleDelete(topic.topicId || 0)}
                                title="Xóa"
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

          {/* Pagination */}
          <div className="p-6 lg:p-8 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-0">
              <div className="text-sm text-gray-500 text-center lg:text-left">
                Hiển thị {indexOfFirstRecord + 1} đến{" "}
                {Math.min(indexOfLastRecord, filteredTopics.length)} của{" "}
                {filteredTopics.length} kết quả
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1 || totalPages === 0}
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Trang {currentPage} / {totalPages || 1}
                </span>
                <button
                  className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Tiếp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesisManagement;
