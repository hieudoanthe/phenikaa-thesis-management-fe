import React, { useState, useEffect } from "react";
import "../../styles/pages/student/topic_registration.css";
import registrationService from "../../services/registration.service";

const difficultyMap = {
  ADVANCED: { label: "Khó", class: "advanced" },
  INTERMEDIATE: { label: "Trung bình", class: "intermediate" },
  BEGINNER: { label: "Dễ", class: "beginner" },
};

const TopicRegistration = () => {
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeringId, setRegisteringId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [topicsPerPage] = useState(10);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await registrationService.getAvailableTopicList();
        if (Array.isArray(res)) {
          setTopics(res);
        } else if (res.success) {
          setTopics(res.data || []);
        } else {
          setError(res.message || "Không thể tải danh sách đề tài");
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải danh sách đề tài");
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const filterTopics = () => {
    return topics.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.topicCode.toLowerCase().includes(search.toLowerCase()) ||
        (t.supervisorName || "").toLowerCase().includes(search.toLowerCase());

      const matchesDepartment =
        !selectedDepartment || t.department === selectedDepartment;
      const matchesYear = !selectedYear || t.academicYear === selectedYear;

      return matchesSearch && matchesDepartment && matchesYear;
    });
  };

  const getStatusColor = (status) => {
    if (status === "Approved") return "approved";
    if (status === "Pending") return "pending";
    return "register";
  };

  const handleRegister = async (topicId) => {
    setRegisteringId(topicId);
    try {
      const res = await registrationService.registerTopic(topicId);
      console.log("Kết quả đăng ký:", res);

      if (res.success) {
        // Cập nhật trạng thái đề tài thành "Pending" khi đăng ký thành công
        setTopics((prevTopics) =>
          prevTopics.map((topic) =>
            topic.topicId === topicId ? { ...topic, status: "Pending" } : topic
          )
        );

        alert(
          res.message ||
            "Đăng ký đề tài thành công! Vui lòng chờ giảng viên duyệt."
        );
      } else {
        alert(res.message || "Đăng ký đề tài thất bại");
      }
    } catch (err) {
      console.error("Lỗi khi đăng ký:", err);
      alert("Đã xảy ra lỗi khi đăng ký đề tài");
    } finally {
      setRegisteringId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedDepartment("");
    setSelectedYear("");
    setCurrentPage(1);
  };

  const filteredTopics = filterTopics();
  const indexOfLastTopic = currentPage * topicsPerPage;
  const indexOfFirstTopic = indexOfLastTopic - topicsPerPage;
  const currentTopics = filteredTopics.slice(
    indexOfFirstTopic,
    indexOfLastTopic
  );
  const totalPages = Math.ceil(filteredTopics.length / topicsPerPage);

  // Mock data cho departments và years (có thể thay bằng API thực tế)
  const departments = [
    "Khoa Công nghệ Thông tin",
    "Khoa Kỹ thuật Phần mềm",
    "Khoa Khoa học Máy tính",
    "Khoa Khoa học Dữ liệu",
    "Khoa An ninh Mạng",
  ];

  const years = ["2024-2025", "2023-2024", "2022-2023"];

  return (
    <div className="topic-registration-page">
      <div className="filters-bar">
        <div className="filter-group">
          <label>Khoa</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">Chọn khoa</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Năm học</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Chọn năm học</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Tìm kiếm</label>
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo từ khóa hoặc giảng viên"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <button className="clear-filters-btn" onClick={clearFilters}>
          Xóa bộ lọc
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách đề tài...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="topics-grid">
            {currentTopics.map((topic) => (
              <div className="topic-card" key={topic.topicId}>
                <div className="topic-title">{topic.title}</div>
                <div className="topic-description">{topic.description}</div>
                <div className="topic-meta">
                  <div className="meta-item">
                    <span className="meta-label">Giảng viên:</span>
                    <span className="meta-value supervisor">
                      {topic.supervisorName || `Dr. ${topic.supervisorId}`}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Số lượng:</span>
                    <span
                      className={`meta-value slots ${
                        topic.currentStudents >= topic.maxStudents
                          ? "full"
                          : "available"
                      }`}
                    >
                      {topic.currentStudents}/{topic.maxStudents} chỗ trống
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Độ khó:</span>
                    <span
                      className={`meta-value difficulty-tag ${
                        difficultyMap[topic.difficultyLevel]?.class || ""
                      }`}
                    >
                      {difficultyMap[topic.difficultyLevel]?.label ||
                        topic.difficultyLevel}
                    </span>
                  </div>
                </div>
                <button
                  className={`register-btn ${getStatusColor(topic.status)}`}
                  disabled={
                    topic.status === "Approved" ||
                    topic.status === "Pending" ||
                    registeringId === topic.topicId ||
                    topic.currentStudents >= topic.maxStudents
                  }
                  onClick={() => handleRegister(topic.topicId)}
                >
                  {registeringId === topic.topicId
                    ? "Đang đăng ký..."
                    : topic.status === "Approved"
                    ? "Đã duyệt"
                    : topic.status === "Pending"
                    ? "Đang chờ"
                    : topic.currentStudents >= topic.maxStudents
                    ? "Hết chỗ"
                    : "Đăng ký"}
                </button>
              </div>
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`pagination-btn ${
                      currentPage === page ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                className="pagination-btn"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Tiếp
              </button>
            </div>
          )}

          {/* Thông tin phân trang */}
          {filteredTopics.length > 0 && (
            <div className="pagination-info">
              <p>
                Hiển thị {indexOfFirstTopic + 1} đến{" "}
                {Math.min(indexOfLastTopic, filteredTopics.length)} trong tổng
                số {filteredTopics.length} đề tài
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TopicRegistration;
