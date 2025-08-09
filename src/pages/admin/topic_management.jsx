import React, { useState, useEffect } from "react";
import AddTopicModal from "../../components/modals/add_topic_modal";
import topicService from "../../services/topic.service";
import "../../styles/pages/admin/topic_management.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const topics = [
  {
    code: "TOP001",
    title: "Machine Learning Applications in Healthcare",
    academicYear: "2023-2024",
    studentCount: 12,
    approvalStatus: "Pending",
    topicStatus: "Active",
  },
  {
    code: "TOP002",
    title: "Blockchain Technology in Supply Chain",
    academicYear: "2023-2024",
    studentCount: 8,
    approvalStatus: "Approved",
    topicStatus: "Active",
  },
  {
    code: "TOP003",
    title: "Sustainable Energy Systems",
    academicYear: "2022-2023",
    studentCount: 15,
    approvalStatus: "Rejected",
    topicStatus: "Inactive",
  },
  {
    code: "TOP004",
    title: "Artificial Intelligence in Education",
    academicYear: "2024-2025",
    studentCount: 10,
    approvalStatus: "Available",
    topicStatus: "Active",
  },
  {
    code: "TOP005",
    title: "Cybersecurity in IoT Networks",
    academicYear: "2023-2024",
    studentCount: 6,
    approvalStatus: "Approved",
    topicStatus: "Active",
  },
  {
    code: "TOP006",
    title: "Data Science in Finance",
    academicYear: "2024-2025",
    studentCount: 9,
    approvalStatus: "Pending",
    topicStatus: "Active",
  },
  {
    code: "TOP007",
    title: "Internet of Things Applications",
    academicYear: "2023-2024",
    studentCount: 7,
    approvalStatus: "Available",
    topicStatus: "Active",
  },
];

const approvalStatusClass = {
  Pending: "status-label pending",
  Available: "status-label available",
  Approved: "status-label approved",
  Rejected: "status-label rejected",
};

const topicStatusClass = {
  Active: "user-status active",
  Inactive: "user-status inactive",
};

const TopicManagement = () => {
  const [openModal, setOpenModal] = useState(false);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dữ liệu từ API khi component mount
  useEffect(() => {
    loadTopicList();
  }, []);

  const loadTopicList = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await topicService.getTopicList();

      if (result.success && result.data && result.data.length > 0) {
        console.log("Danh sách topic từ API:", result.data);
        console.log("Raw data structure:", result.data[0]); // Log cấu trúc dữ liệu đầu tiên
        console.log(
          "Raw approval status:",
          result.data.map((item) => item.approvalStatus)
        );
        console.log(
          "Raw topic status:",
          result.data.map((item) => item.topicStatus)
        );
        console.log(
          "Raw academic year fields:",
          result.data.map((item) => ({
            academicYear: item.academicYear,
            academicYearName: item.academicYearName,
            yearName: item.yearName,
            year: item.year,
          }))
        );
        // Chuyển đổi dữ liệu từ API sang format hiện tại
        const formattedTopics = result.data.map((item) => ({
          code: item.code || item.topicCode,
          title: item.title,
          academicYear:
            item.academicYear ||
            item.academicYearName ||
            item.yearName ||
            item.year ||
            "N/A",
          studentCount: item.studentCount || item.maxStudents,
          approvalStatus:
            item.approvalStatus === "AVAILABLE"
              ? "Available"
              : item.approvalStatus === "PENDING"
              ? "Pending"
              : item.approvalStatus === "APPROVED"
              ? "Approved"
              : item.approvalStatus === "REJECTED"
              ? "Rejected"
              : item.approvalStatus,
          topicStatus:
            item.topicStatus === "ACTIVE"
              ? "Active"
              : item.topicStatus === "INACTIVE"
              ? "Inactive"
              : item.topicStatus || "Active",
        }));
        console.log("Formatted topics:", formattedTopics);
        console.log(
          "Academic years after mapping:",
          formattedTopics.map((item) => item.academicYear)
        );
        setTopics(formattedTopics);
      } else {
        console.log("API không trả về dữ liệu");
        setTopics([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách topic:", error);
      setError("Không thể tải danh sách đề tài");
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);
  const handleSubmit = (result) => {
    console.log("Kết quả tạo topic:", result);

    if (result.success) {
      console.log("Tạo topic thành công:", result.data);
      // Refresh danh sách topic sau khi tạo thành công
      loadTopicList();
      alert("Tạo đề tài thành công!");
    } else {
      console.error("Lỗi tạo topic:", result.message);
      // Không cần alert vì đã có trong modal
    }
  };

  return (
    <div>
      <div className="topic-mgmt-card">
        <div className="topic-mgmt-search-row">
          <div className="topic-mgmt-search-wrap">
            <i className="bi bi-search search-icon"></i>
            <input
              className="topic-mgmt-search"
              placeholder="Search by topic code, title, or supervisor"
            />
          </div>
        </div>
        <div className="topic-mgmt-filter-row">
          <div className="topic-mgmt-filter-group">
            <button className="topic-mgmt-filter-btn">
              <i className="bi bi-funnel"></i> Approval Status{" "}
              <i className="bi bi-chevron-down"></i>
            </button>
            <button className="topic-mgmt-filter-btn">
              Topic Status <i className="bi bi-chevron-down"></i>
            </button>
            <button className="topic-mgmt-filter-btn">
              Date Range <i className="bi bi-chevron-down"></i>
            </button>
            <button className="topic-mgmt-reset-btn">Reset Filters</button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="topic-mgmt-loading">
            <div className="topic-mgmt-loading-text">
              Đang tải danh sách đề tài...
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="topic-mgmt-error">
            <div className="topic-mgmt-error-text">Lỗi: {error}</div>
            <button className="topic-mgmt-retry-btn" onClick={loadTopicList}>
              Thử lại
            </button>
          </div>
        )}

        {/* Table content */}
        {!loading && !error && (
          <table className="topic-mgmt-table">
            <thead>
              <tr>
                <th>Topic Code</th>
                <th>Title</th>
                <th>Academic Year</th>
                <th>Student Count</th>
                <th>Approval Status</th>
                <th>Topic Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.length === 0 ? (
                <tr>
                  <td colSpan="7" className="topic-mgmt-empty">
                    Không có đề tài nào
                  </td>
                </tr>
              ) : (
                topics.map((t) => (
                  <tr key={t.code}>
                    <td>{t.code}</td>
                    <td>{t.title}</td>
                    <td>{t.academicYear}</td>
                    <td>{t.studentCount}</td>
                    <td>
                      <span className={approvalStatusClass[t.approvalStatus]}>
                        {t.approvalStatus}
                      </span>
                    </td>
                    <td>
                      <span className={topicStatusClass[t.topicStatus]}>
                        <span className="user-status-dot"></span>
                        {t.topicStatus}
                      </span>
                    </td>
                    <td>
                      <span className="topic-mgmt-action" title="View">
                        <i className="bi bi-eye"></i>
                      </span>
                      <span className="topic-mgmt-action" title="Edit">
                        <i className="bi bi-pen"></i>
                      </span>
                      <span className="topic-mgmt-action" title="Delete">
                        <i className="bi bi-trash"></i>
                      </span>
                      {t.approvalStatus === "Pending" && (
                        <span
                          className="topic-mgmt-action approve"
                          title="Approve"
                        >
                          Approve
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        <div className="topic-mgmt-footer-row">
          <span>
            Showing 1 to {topics.length} of {topics.length} entries
          </span>
          <div className="topic-mgmt-pagination">
            <button className="topic-mgmt-page-btn">
              <i className="bi bi-chevron-left"></i>
            </button>
            <button className="topic-mgmt-page-btn active">1</button>
            <button className="topic-mgmt-page-btn">2</button>
            <button className="topic-mgmt-page-btn">3</button>
            <button className="topic-mgmt-page-btn">
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
        <button className="topic-mgmt-create-btn" onClick={handleCreate}>
          + Create New Topic
        </button>
      </div>
      <AddTopicModal
        open={openModal}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default TopicManagement;
