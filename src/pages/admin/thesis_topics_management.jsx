import React, { useState, useEffect } from "react";
import "../../styles/pages/admin/thesis_topics_management.css";

const ThesisTopicsManagement = () => {
  // State cho danh sách đề tài
  const [topics, setTopics] = useState([
    {
      id: 1,
      title: "Machine Learning Applications in Healthcare Diagnostics",
      student: "John Smith",
      submissionDate: "2024-01-15",
      researchArea: "Computer Science",
      status: "Pending",
      description:
        "This research aims to explore the potential applications of machine learning algorithms in improving healthcare diagnostic accuracy.",
    },
    {
      id: 2,
      title: "Sustainable Urban Planning: A Case Study of Smart Cities",
      student: "Jane Doe",
      submissionDate: "2024-01-14",
      researchArea: "Urban Planning",
      status: "Approved",
      description:
        "A comprehensive study of sustainable urban development practices in modern smart cities.",
    },
    {
      id: 3,
      title: "Quantum Computing: Breaking Cryptographic Systems",
      student: "Mike Johnson",
      submissionDate: "2024-01-13",
      researchArea: "Computer Science",
      status: "Pending",
      description:
        "Investigation of quantum computing's impact on current cryptographic security systems.",
    },
  ]);

  // State cho đề tài được chọn
  const [selectedTopic, setSelectedTopic] = useState(topics[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [selectedReviewer, setSelectedReviewer] = useState("");

  // Danh sách giảng viên và reviewer
  const supervisors = [
    { id: 1, name: "Dr. Nguyen Van A", workload: 5, maxWorkload: 8 },
    { id: 2, name: "Dr. Tran Thi B", workload: 8, maxWorkload: 8 },
    { id: 3, name: "Dr. Le Van C", workload: 3, maxWorkload: 8 },
  ];

  const reviewers = [
    { id: 1, name: "Dr. Pham Van D" },
    { id: 2, name: "Dr. Hoang Thi E" },
    { id: 3, name: "Dr. Vu Van F" },
  ];

  // Lọc đề tài theo search term
  const filteredTopics = topics.filter(
    (topic) =>
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Xử lý chọn đề tài
  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
  };

  // Xử lý phê duyệt/từ chối
  const handleAction = (action) => {
    setModalAction(action);
    setShowConfirmModal(true);
  };

  // Xác nhận hành động
  const confirmAction = () => {
    const updatedTopics = topics.map((topic) =>
      topic.id === selectedTopic.id
        ? {
            ...topic,
            status: modalAction === "approve" ? "Approved" : "Rejected",
          }
        : topic
    );
    setTopics(updatedTopics);
    setSelectedTopic((prev) => ({
      ...prev,
      status: modalAction === "approve" ? "Approved" : "Rejected",
    }));
    setShowConfirmModal(false);
  };

  // Kiểm tra workload của supervisor
  const getSelectedSupervisor = () => {
    return supervisors.find((s) => s.name === selectedSupervisor);
  };

  const isWorkloadExceeded = () => {
    const supervisor = getSelectedSupervisor();
    return supervisor && supervisor.workload >= supervisor.maxWorkload;
  };

  return (
    <div className="thesis-management-container">
      {/* Modal xác nhận */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Xác nhận hành động</h3>
            <p>
              Bạn có chắc chắn muốn{" "}
              {modalAction === "approve" ? "phê duyệt" : "từ chối"} đề tài này?
            </p>
            <div className="modal-actions">
              <button className="btn-confirm" onClick={confirmAction}>
                Xác nhận
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="thesis-layout">
        {/* Cột trái - Danh sách đề tài */}
        <div className="topics-list">
          <div className="search-section">
            <div className="search-box">
              <i className="search-icon">🔍</i>
              <input
                type="text"
                placeholder="Search topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="topics-table">
            <div className="table-header">
              <div className="header-cell">Topic Title</div>
              <div className="header-cell">Date</div>
              <div className="header-cell">Status</div>
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
                  <div className="cell topic-title">{topic.title}</div>
                  <div className="cell date">{topic.submissionDate}</div>
                  <div className="cell status">
                    <span
                      className={`status-badge ${topic.status.toLowerCase()}`}
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
        <div className="topic-details">
          {selectedTopic && (
            <>
              <div className="topic-header">
                <h2 className="topic-title">{selectedTopic.title}</h2>
              </div>

              <div className="topic-info">
                <div className="info-item">
                  <span className="label">Student:</span>
                  <span className="value">{selectedTopic.student}</span>
                </div>
                <div className="info-item">
                  <span className="label">Submission Date:</span>
                  <span className="value">{selectedTopic.submissionDate}</span>
                </div>
                <div className="info-item">
                  <span className="label">Research Area:</span>
                  <span className="value">{selectedTopic.researchArea}</span>
                </div>
                <div className="info-item">
                  <span className="label">Status:</span>
                  <span className="value">
                    <span
                      className={`status-badge ${selectedTopic.status.toLowerCase()}`}
                    >
                      {selectedTopic.status}
                    </span>
                  </span>
                </div>
              </div>

              <div className="topic-description">
                <h3>Description</h3>
                <p>{selectedTopic.description}</p>
              </div>

              <div className="action-buttons">
                <button
                  className="btn-approve"
                  onClick={() => handleAction("approve")}
                  disabled={selectedTopic.status === "Approved"}
                >
                  Approve
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleAction("reject")}
                  disabled={selectedTopic.status === "Rejected"}
                >
                  Reject
                </button>
              </div>

              <div className="assign-staff">
                <h3>Assign Staff</h3>

                <div className="staff-selection">
                  <div className="select-group">
                    <label>Supervisor:</label>
                    <select
                      value={selectedSupervisor}
                      onChange={(e) => setSelectedSupervisor(e.target.value)}
                      className="staff-select"
                    >
                      <option value="">Select supervisor</option>
                      {supervisors.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.name}>
                          {supervisor.name} ({supervisor.workload}/
                          {supervisor.maxWorkload})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="select-group">
                    <label>Reviewer:</label>
                    <select
                      value={selectedReviewer}
                      onChange={(e) => setSelectedReviewer(e.target.value)}
                      className="staff-select"
                    >
                      <option value="">Select reviewer</option>
                      {reviewers.map((reviewer) => (
                        <option key={reviewer.id} value={reviewer.name}>
                          {reviewer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cảnh báo workload */}
                {isWorkloadExceeded() && (
                  <div className="workload-warning">
                    <div className="warning-icon">⚠️</div>
                    <div className="warning-content">
                      <strong>Workload Warning</strong>
                      <p>
                        Selected supervisor has reached the maximum workload
                        limit. Consider assigning to another staff member.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThesisTopicsManagement;
