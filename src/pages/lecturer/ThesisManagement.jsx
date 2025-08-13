import React, { useState, useEffect } from "react";
import "../../styles/pages/lecturer/thesis_management.css";
import Select from "react-select";
import topicService from "../../services/topic.service";
import academicYearService from "../../services/academic-year.service";
import AddTopicModal from "../../components/modals/add_topic_modal";

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
    if (!status) return "status-badge active";

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "available":
        return "status-badge available";
      case "active":
        return "status-badge active";
      case "inactive":
        return "status-badge inactive";
      case "approved":
        return "status-badge approved";
      case "rejected":
        return "status-badge rejected";
      case "pending":
        return "status-badge pending";
      default:
        return "status-badge active";
    }
  };

  const getApprovalBadgeClass = (status) => {
    if (!status) return "approval-badge pending";

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "available":
        return "approval-badge available";
      case "approved":
        return "approval-badge approved";
      case "rejected":
        return "approval-badge rejected";
      case "pending":
        return "approval-badge pending";
      case "active":
        return "approval-badge active";
      case "inactive":
        return "approval-badge inactive";
      default:
        return "approval-badge pending";
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
      <div className="thesis-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách đề tài...</p>
        </div>
      </div>
    );
  }

  // Hiển thị error
  if (error && topics.length === 0) {
    return (
      <div className="thesis-management">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadTopics} className="retry-btn">
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
    <div className="thesis-management">
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
        <div className="show-form-section">
          <button
            className="show-form-btn"
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
        <div className="topic-list-section">
          <div className="list-header">
            <h2>Danh Sách Đề Tài</h2>
          </div>

          {/* Filters and Search */}
          <div className="filters-section">
            <div className="filter-group" style={{ minWidth: 260 }}>
              <label>Năm học:</label>
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
                  />
                );
              })()}
            </div>
            <div className="filter-group" style={{ minWidth: 200 }}>
              <label>Trạng thái duyệt:</label>
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
              />
            </div>
            <div className="search-section">
              <div className="search-box">
                <svg
                  width="16"
                  height="16"
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
                />
              </div>
            </div>

            <div className="filters-right">
              <button className="clear-filters-btn" onClick={clearFilters}>
                Xóa Bộ Lọc
              </button>
            </div>
          </div>

          {/* Topics Table */}
          <div className="table-container">
            <table className="topics-table">
              <thead>
                <tr>
                  <th>Mã đề tài</th>
                  <th>Tiêu đề</th>
                  <th>Sinh viên đăng kí</th>
                  <th>Năm học</th>
                  <th>Số lượng</th>
                  <th>Trạng thái duyệt</th>
                  <th>Trạng thái đề tài</th>
                  <th>Phê duyệt</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-state">
                      <div className="empty-message">
                        <p>Không tìm thấy đề tài nào</p>
                        <span>
                          Hãy thử điều chỉnh bộ lọc hoặc tạo đề tài mới
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((topic) => (
                    <tr key={topic.topicId}>
                      {editingTopicId === topic.topicId ? (
                        <>
                          {/* KHÔNG render topicId */}
                          <td>
                            <input
                              type="text"
                              name="topicCode"
                              value={editRowData.topicCode || ""}
                              onChange={handleEditInputChange}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="title"
                              value={editRowData.title || ""}
                              onChange={handleEditInputChange}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="registerId"
                              value={editRowData.registerId || ""}
                              onChange={handleEditInputChange}
                            />
                          </td>
                          <td>
                            <select
                              name="academicYearId"
                              value={editRowData.academicYearId || ""}
                              onChange={handleEditInputChange}
                            >
                              {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                  {year.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              name="maxStudents"
                              min="1"
                              max="10"
                              value={editRowData.maxStudents || ""}
                              onChange={handleEditInputChange}
                            />
                          </td>
                          <td>
                            <select
                              name="approvalStatus"
                              value={editRowData.approvalStatus || ""}
                              onChange={handleEditInputChange}
                            >
                              <option value="PENDING">Chờ duyệt</option>
                              <option value="AVAILABLE">Còn trống</option>
                              <option value="APPROVED">Đã duyệt</option>
                              <option value="REJECTED">Bị từ chối</option>
                            </select>
                          </td>
                          <td>
                            <select
                              name="status"
                              value={editRowData.status || ""}
                              onChange={handleEditInputChange}
                            >
                              <option value="ACTIVE">Hoạt động</option>
                              <option value="INACTIVE">Ngừng hoạt động</option>
                              <option value="ARCHIVED">Lưu trữ</option>
                              <option value="DELETED">Đã xóa</option>
                            </select>
                          </td>
                          <td>
                            <span className="accept-status-text">
                              {editRowData.approvalStatus ||
                                editRowData.status ||
                                "Available"}
                            </span>
                          </td>
                          <td>
                            <div className="inline-edit-actions">
                              <button
                                className="action-btn save-btn"
                                onClick={handleSaveEdit}
                              >
                                Lưu
                              </button>
                              <button
                                className="action-btn cancel-btn"
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
                          <td className="topic-code">
                            {topic.topicCode || "Chưa có"}
                          </td>
                          <td
                            className="topic-title"
                            title={topic.title || "Chưa có tiêu đề"}
                          >
                            {topic.title
                              ? topic.title.length > 50
                                ? topic.title.substring(0, 50) + "..."
                                : topic.title
                              : "Chưa có tiêu đề"}
                          </td>
                          <td className="register-id">
                            {topic.registerId || "Chưa có"}
                          </td>
                          <td>{getAcademicYearName(topic.academicYearId)}</td>
                          <td>
                            {topic.currentStudents || 0}/
                            {topic.maxStudents || 1}
                          </td>
                          <td>
                            <span
                              className={getApprovalBadgeClass(
                                topic.approvalStatus || topic.status
                              )}
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
                          <td>
                            <span
                              className={`status-badge ${getStatusBadgeClass(
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
                          <td className="accept-actions">
                            {(() => {
                              const approvalStatus =
                                topic.approvalStatus || topic.status || "";
                              const statusLower = approvalStatus.toLowerCase();

                              // Hiển thị nút Duyệt/Từ chối cho trạng thái chờ duyệt
                              if (statusLower === "pending") {
                                return (
                                  <div className="accept-buttons">
                                    <button
                                      className="accept-btn approve-btn"
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
                                      className="accept-btn reject-btn"
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
                                  <span className="accept-status-text">
                                    Đã duyệt
                                  </span>
                                );
                              }

                              if (statusLower === "rejected") {
                                return (
                                  <span className="accept-status-text">
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
                                  <span className="accept-status-text">
                                    Còn trống
                                  </span>
                                );
                              }

                              // Fallback: hiển thị nút Duyệt/Từ chối nếu không xác định được trạng thái
                              return (
                                <div className="accept-buttons">
                                  <button
                                    className="accept-btn approve-btn"
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
                                    className="accept-btn reject-btn"
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
                          <td className="actions">
                            <button
                              className="action-btn view-btn"
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
                              className="action-btn edit-btn"
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
                              className="action-btn delete-btn"
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
          <div className="pagination">
            <div className="pagination-info">
              Hiển thị {indexOfFirstRecord + 1} đến{" "}
              {Math.min(indexOfLastRecord, filteredTopics.length)} của{" "}
              {filteredTopics.length} kết quả
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || totalPages === 0}
              >
                Trước
              </button>
              <span>
                Trang {currentPage} / {totalPages || 1}
              </span>
              <button
                className="pagination-btn"
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
      )}
    </div>
  );
};

export default ThesisManagement;
