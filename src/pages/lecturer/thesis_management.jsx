import React, { useState, useEffect } from "react";
import "../../styles/pages/lecturer/thesis_management.css";
import topicService from "../../services/topic.service";
import academicYearService from "../../services/academic-year.service";

const ThesisManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    topicCode: "",
    title: "",
    description: "",
    objectives: "",
    methodology: "",
    expectedOutcome: "",
    academicYear: "2024",
    maxStudents: "1",
    difficultyLevel: "MEDIUM",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");

  // States cho API
  const [topics, setTopics] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States cho chỉnh sửa trực tiếp
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editRowData, setEditRowData] = useState({});

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
          !formData.academicYear
        ) {
          const defaultYear = response.data[response.data.length - 1]; // Lấy năm mới nhất
          setFormData((prev) => ({
            ...prev,
            academicYear: defaultYear.id.toString(),
          }));
          setSelectedYear(defaultYear.id.toString());
        }
      } else {
        console.warn("Không thể tải danh sách năm học:", response.message);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách năm học:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = [
      "topicCode",
      "title",
      "description",
      "objectives",
      "methodology",
      "expectedOutcome",
      "academicYear",
      "maxStudents",
      "difficultyLevel",
    ];
    const isValid = requiredFields.every(
      (field) => formData[field].trim() !== ""
    );

    if (!isValid) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setIsSubmitting(true);

    try {
      // Chuẩn bị dữ liệu gửi lên API
      const topicData = {
        topicId: formData.topicId, // Có thể undefined khi tạo mới
        topicCode: formData.topicCode,
        title: formData.title,
        description: formData.description,
        objectives: formData.objectives,
        methodology: formData.methodology,
        expectedOutcome: formData.expectedOutcome,
        academicYearId: parseInt(formData.academicYear),
        maxStudents: parseInt(formData.maxStudents),
        difficultyLevel: formData.difficultyLevel,
      };

      let response;
      if (formData.topicId) {
        // Nếu có topicId thì update
        response = await topicService.updateTopic(formData.topicId, topicData);
      } else {
        // Nếu không có thì create
        response = await topicService.createTopic(topicData);
      }

      if (response.success) {
        alert(
          formData.topicId
            ? "Cập nhật đề tài thành công!"
            : "Tạo đề tài thành công!"
        );
        await loadTopics();
        setFormData({
          topicCode: "",
          title: "",
          description: "",
          objectives: "",
          methodology: "",
          expectedOutcome: "",
          academicYear: "2024",
          maxStudents: "1",
          difficultyLevel: "MEDIUM",
          topicId: undefined,
        });
        handleCloseForm();
      } else {
        alert(
          response.message ||
            (formData.topicId
              ? "Cập nhật đề tài thất bại"
              : "Tạo đề tài thất bại")
        );
      }
    } catch (error) {
      console.error("Lỗi khi lưu đề tài:", error);
      alert("Đã xảy ra lỗi khi lưu đề tài");
    } finally {
      setIsSubmitting(false);
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
      // Gọi API cập nhật đề tài
      const updateData = {
        ...editRowData,
        topicStatus: editRowData.status,
        academicYearId: parseInt(editRowData.academicYearId),
        maxStudents: parseInt(editRowData.maxStudents),
      };
      delete updateData.status;
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
      setFormData({
        topicCode: topic.topicCode || "",
        title: topic.title || "",
        description: topic.description || "",
        objectives: topic.objectives || "",
        methodology: topic.methodology || "",
        expectedOutcome: topic.expectedOutcome || "",
        academicYear: topic.academicYearId?.toString() || "2024",
        maxStudents: topic.maxStudents?.toString() || "1",
        difficultyLevel: topic.difficultyLevel || "MEDIUM",
        topicId: topic.topicId,
      });
      setIsFormOpen(true);
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
    setSelectedDepartment("All Departments");
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

    return matchesSearch && matchesYear;
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
    if (!yearId || !academicYears.length) return "N/A";

    const year = academicYears.find((y) => y.id === parseInt(yearId));
    return year ? year.name : "N/A";
  };

  // Debug logs
  console.log("ThesisManagement render:", {
    loading,
    error,
    topicsLength: topics.length,
    academicYearsLength: academicYears.length,
    formData,
    selectedYear,
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
    setFormData({
      topicCode: "",
      title: "",
      description: "",
      objectives: "",
      methodology: "",
      expectedOutcome: "",
      academicYear: "2024",
      maxStudents: "1",
      difficultyLevel: "MEDIUM",
      topicId: undefined,
    });
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
      {/* Create New Topic Form */}
      {isFormOpen && (
        <div className="form-card">
          <div className="form-header" onClick={handleCloseForm}>
            <h2>Save Topic</h2>
            <button className="collapse-btn">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 14l5-5 5 5z" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="topic-form">
            <div className="form-row two-columns">
              <div className="form-group">
                <input
                  type="text"
                  id="topicCode"
                  name="topicCode"
                  value={formData.topicCode}
                  onChange={handleInputChange}
                  required
                  className={formData.topicCode ? "has-value" : ""}
                />
                <label
                  htmlFor="topicCode"
                  className={formData.topicCode ? "float" : ""}
                >
                  Topic Code *
                </label>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className={formData.title ? "has-value" : ""}
                />
                <label
                  htmlFor="title"
                  className={formData.title ? "float" : ""}
                >
                  Topic Title *
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                  className={formData.description ? "has-value" : ""}
                />
                <label
                  htmlFor="description"
                  className={formData.description ? "float" : ""}
                >
                  Detailed Description *
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <textarea
                  id="objectives"
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleInputChange}
                  rows="4"
                  required
                  className={formData.objectives ? "has-value" : ""}
                />
                <label
                  htmlFor="objectives"
                  className={formData.objectives ? "float" : ""}
                >
                  Objectives *
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <textarea
                  id="methodology"
                  name="methodology"
                  value={formData.methodology}
                  onChange={handleInputChange}
                  rows="4"
                  required
                  className={formData.methodology ? "has-value" : ""}
                />
                <label
                  htmlFor="methodology"
                  className={formData.methodology ? "float" : ""}
                >
                  Methodology *
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <textarea
                  id="expectedOutcome"
                  name="expectedOutcome"
                  value={formData.expectedOutcome}
                  onChange={handleInputChange}
                  rows="4"
                  required
                  className={formData.expectedOutcome ? "has-value" : ""}
                />
                <label
                  htmlFor="expectedOutcome"
                  className={formData.expectedOutcome ? "float" : ""}
                >
                  Expected Outcome *
                </label>
              </div>
            </div>

            <div className="form-row three-columns">
              <div className="form-group">
                <select
                  id="academicYear"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  required
                  className={formData.academicYear ? "has-value" : ""}
                >
                  {academicYears.length > 0 ? (
                    academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Đang tải...</option>
                  )}
                </select>
                <label
                  htmlFor="academicYear"
                  className={formData.academicYear ? "float" : ""}
                >
                  Academic Year *
                </label>
              </div>
              <div className="form-group">
                <input
                  type="number"
                  id="maxStudents"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  required
                  className={formData.maxStudents ? "has-value" : ""}
                />
                <label
                  htmlFor="maxStudents"
                  className={formData.maxStudents ? "float" : ""}
                >
                  Max Students *
                </label>
              </div>
              <div className="form-group">
                <select
                  id="difficultyLevel"
                  name="difficultyLevel"
                  value={formData.difficultyLevel}
                  onChange={handleInputChange}
                  required
                  className={formData.difficultyLevel ? "has-value" : ""}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
                <label
                  htmlFor="difficultyLevel"
                  className={formData.difficultyLevel ? "float" : ""}
                >
                  Difficulty Level *
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Topic"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Show Form Button (when form is hidden) */}
      {!isFormOpen && (
        <div className="show-form-section">
          <button className="show-form-btn" onClick={() => setIsFormOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Save Topic
          </button>
        </div>
      )}

      {/* Topic List - chỉ hiển thị khi form ẩn */}
      {!isFormOpen && (
        <div className="topic-list-section">
          <div className="list-header">
            <h2>Topic List</h2>
          </div>

          {/* Filters and Search */}
          <div className="filters-section">
            <div className="filters-left">
              <div className="filter-group">
                <label>Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="All">Tất cả năm học</option>
                  {academicYears.length > 0 ? (
                    academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Đang tải...</option>
                  )}
                </select>
              </div>
              <div className="filter-group">
                <label>Department:</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business">Business</option>
                </select>
              </div>
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
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="filters-right">
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>

          {/* Topics Table */}
          <div className="table-container">
            <table className="topics-table">
              <thead>
                <tr>
                  <th>Topic Code</th>
                  <th>Title</th>
                  <th>Academic Year</th>
                  <th>Student Count</th>
                  <th>Approval Status</th>
                  <th>Topic Status</th>
                  <th>Accept</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((topic) => (
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
                            <option value="PENDING">PENDING</option>
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </td>
                        <td>
                          <select
                            name="status"
                            value={editRowData.status || ""}
                            onChange={handleEditInputChange}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                            <option value="DELETED">DELETED</option>
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
                              Save
                            </button>
                            <button
                              className="action-btn cancel-btn"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* KHÔNG render topicId */}
                        <td className="topic-code">
                          {topic.topicCode || "N/A"}
                        </td>
                        <td className="topic-title">{topic.title || "N/A"}</td>
                        <td>{getAcademicYearName(topic.academicYearId)}</td>
                        <td>{topic.maxStudents || "N/A"}</td>
                        <td>
                          <span
                            className={getApprovalBadgeClass(
                              topic.approvalStatus || topic.status
                            )}
                          >
                            {topic.approvalStatus || topic.status || "Pending"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${getStatusBadgeClass(
                              topic.status || topic.topicStatus || "Active"
                            )}`}
                          >
                            {topic.status || topic.topicStatus || "Active"}
                          </span>
                        </td>
                        <td className="accept-actions">
                          {(() => {
                            const approvalStatus =
                              topic.approvalStatus || topic.status || "";
                            const statusLower = approvalStatus.toLowerCase();

                            // Hiển thị nút Accept/Reject cho trạng thái pending
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
                                    Accept
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
                                    Reject
                                  </button>
                                </div>
                              );
                            }

                            // Hiển thị trạng thái đã phê duyệt
                            if (statusLower === "approved") {
                              return (
                                <span className="accept-status-text">
                                  Accepted
                                </span>
                              );
                            }

                            if (statusLower === "rejected") {
                              return (
                                <span className="accept-status-text">
                                  Rejected
                                </span>
                              );
                            }

                            // Hiển thị trạng thái available
                            if (statusLower === "available") {
                              return (
                                <span className="accept-status-text">
                                  Available
                                </span>
                              );
                            }

                            // Fallback: hiển thị nút Accept/Reject nếu không xác định được trạng thái
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
                                  Accept
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
                                  Reject
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="actions">
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleView(topic.topicId || 0)}
                            title="View"
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
                            title="Edit"
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
                            title="Delete"
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Showing 1 to {filteredTopics.length} of {filteredTopics.length}{" "}
              results
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Trang {currentPage} / {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesisManagement;
