import React, { useState, useEffect } from "react";
import { FaSearch, FaExclamationTriangle } from "react-icons/fa";
import Select from "react-select";
import "../../styles/pages/admin/thesis_topics_management.css";

const ThesisTopicsManagement = () => {
  // State cho danh sách đề tài
  const [topics, setTopics] = useState([
    {
      id: 1,
      title: "Machine Learning Applications in Healthcare Diagnostics",
      date: "2024-01-15",
      status: "Chờ duyệt",
      lecturer: "John Smith",
      researchArea: "Khoa học máy tính",
      description:
        "Nghiên cứu này nhằm khám phá các ứng dụng tiềm năng của thuật toán học máy trong việc cải thiện độ chính xác chẩn đoán y tế.",
    },
    {
      id: 2,
      title: "Sustainable Urban Planning: A Case Study of Smart Cities",
      date: "2024-01-14",
      status: "Đã duyệt",
      lecturer: "Jane Doe",
      researchArea: "Quy hoạch đô thị",
      description:
        "Nghiên cứu toàn diện về các thực hành phát triển đô thị bền vững trong các thành phố thông minh hiện đại.",
    },
    {
      id: 3,
      title: "Quantum Computing: Breaking Cryptographic Systems",
      date: "2024-01-13",
      status: "Chờ duyệt",
      lecturer: "Mike Johnson",
      researchArea: "Khoa học máy tính",
      description:
        "Điều tra tác động của máy tính lượng tử đối với các hệ thống bảo mật mật mã hiện tại.",
    },
  ]);

  // State cho đề tài được chọn
  const [selectedTopic, setSelectedTopic] = useState(topics[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [supervisor, setSupervisor] = useState(null);
  const [reviewer, setReviewer] = useState(null);

  // State cho modal xác nhận
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  // Dữ liệu cho dropdown options
  const supervisorOptions = [
    { value: "supervisor1", label: "TS. John Smith" },
    { value: "supervisor2", label: "TS. Jane Doe" },
    { value: "supervisor3", label: "TS. Mike Johnson" },
    { value: "supervisor4", label: "TS. Sarah Wilson" },
    { value: "supervisor5", label: "TS. Robert Brown" },
  ];

  const reviewerOptions = [
    { value: "reviewer1", label: "TS. Sarah Wilson" },
    { value: "reviewer2", label: "TS. Robert Brown" },
    { value: "reviewer3", label: "TS. Emily Davis" },
    { value: "reviewer4", label: "TS. Michael Chen" },
    { value: "reviewer5", label: "TS. Lisa Anderson" },
  ];

  // Lọc đề tài theo search term
  const filteredTopics = topics.filter((topic) =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Xử lý chọn đề tài
  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
  };

  // Xử lý hiển thị modal xác nhận
  const handleShowConfirmModal = (action) => {
    setConfirmAction(action);
    if (action === "approve") {
      setConfirmMessage("Bạn có chắc chắn muốn phê duyệt đề tài này?");
    } else if (action === "reject") {
      setConfirmMessage("Bạn có chắc chắn muốn từ chối đề tài này?");
    }
    setShowConfirmModal(true);
  };

  // Xử lý xác nhận hành động
  const handleConfirmAction = () => {
    if (confirmAction === "approve") {
      setTopics((prevTopics) =>
        prevTopics.map((topic) =>
          topic.id === selectedTopic.id
            ? { ...topic, status: "Đã duyệt" }
            : topic
        )
      );
      setSelectedTopic((prev) => ({ ...prev, status: "Đã duyệt" }));
    } else if (confirmAction === "reject") {
      setTopics((prevTopics) =>
        prevTopics.map((topic) =>
          topic.id === selectedTopic.id
            ? { ...topic, status: "Từ chối" }
            : topic
        )
      );
      setSelectedTopic((prev) => ({ ...prev, status: "Từ chối" }));
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage("");
  };

  // Xử lý hủy modal
  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage("");
  };

  // Lấy class cho status badge
  const getStatusClass = (status) => {
    switch (status) {
      case "Đã duyệt":
        return "status-approved";
      case "Từ chối":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  return (
    <div className="thesis-topics-management">
      {/* Cột trái - Danh sách đề tài */}
      <div className="topics-list-column">
        {/* Search bar */}
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm đề tài..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Bảng đề tài */}
        <div className="topics-table">
          <div className="table-header">
            <div className="header-cell">Tên đề tài</div>
            <div className="header-cell">Ngày</div>
            <div className="header-cell">Trạng thái</div>
          </div>

          <div className="table-body">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className={`table-row ${
                  selectedTopic.id === topic.id ? "selected" : ""
                }`}
                onClick={() => handleTopicSelect(topic)}
              >
                <div className="cell table-topic-title">{topic.title}</div>
                <div className="cell topic-date">{topic.date}</div>
                <div className="cell">
                  <span
                    className={`status-badge ${getStatusClass(topic.status)}`}
                  >
                    {topic.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cột phải - Chi tiết đề tài */}
      <div className="topic-details-column">
        {selectedTopic && (
          <>
            {/* Tiêu đề đề tài */}
            <h2 className="topic-title">{selectedTopic.title}</h2>

            {/* Thông tin đề tài */}
            <div className="topic-info">
              <div className="info-row">
                <span className="info-label">Giảng viên</span>
                <span className="info-value">{selectedTopic.lecturer}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Ngày nộp</span>
                <span className="info-value">{selectedTopic.date}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Lĩnh vực nghiên cứu</span>
                <span className="info-value">{selectedTopic.researchArea}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Trạng thái</span>
                <span
                  className={`status-badge ${getStatusClass(
                    selectedTopic.status
                  )}`}
                >
                  {selectedTopic.status}
                </span>
              </div>
            </div>

            {/* Mô tả */}
            <div className="description-section">
              <h3 className="section-title">Mô tả</h3>
              <p className="description-text">{selectedTopic.description}</p>
            </div>

            {/* Action buttons */}
            <div className="action-buttons">
              <button
                className="btn-approve"
                onClick={() => handleShowConfirmModal("approve")}
                disabled={selectedTopic.status === "Đã duyệt"}
              >
                Phê duyệt
              </button>
              <button
                className="btn-reject"
                onClick={() => handleShowConfirmModal("reject")}
                disabled={selectedTopic.status === "Từ chối"}
              >
                Từ chối
              </button>
            </div>

            {/* Assign Staff section */}
            <div className="assign-staff-section">
              <h3 className="section-title">Phân công nhân viên</h3>

              <div className="staff-field">
                <label className="field-label">Người hướng dẫn</label>
                <Select
                  value={supervisor}
                  onChange={setSupervisor}
                  options={supervisorOptions}
                  placeholder="Chọn người hướng dẫn"
                  className="staff-select"
                  classNamePrefix="react-select"
                  isClearable
                  isSearchable
                />
              </div>

              <div className="staff-field">
                <label className="field-label">Người phản biện</label>
                <Select
                  value={reviewer}
                  onChange={setReviewer}
                  options={reviewerOptions}
                  placeholder="Chọn người phản biện"
                  className="staff-select"
                  classNamePrefix="react-select"
                  isClearable
                  isSearchable
                />
              </div>

              {/* Workload Warning */}
              <div className="workload-warning">
                <FaExclamationTriangle className="warning-icon" />
                <span className="warning-text">
                  Cảnh báo khối lượng công việc: Người hướng dẫn đã được chọn đã
                  đạt đến giới hạn khối lượng công việc tối đa. Hãy cân nhắc
                  phân công cho nhân viên khác.
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal xác nhận */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="modal-header">
              <h3 className="modal-title">Xác nhận hành động</h3>
            </div>
            <div className="modal-body">
              <p className="modal-message">{confirmMessage}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancelAction}>
                Hủy
              </button>
              <button
                className={`btn-confirm ${
                  confirmAction === "approve"
                    ? "btn-confirm-approve"
                    : "btn-confirm-reject"
                }`}
                onClick={handleConfirmAction}
              >
                {confirmAction === "approve" ? "Phê duyệt" : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesisTopicsManagement;
