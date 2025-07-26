import React, { useState, useEffect } from "react";
import "../../styles/pages/student/topic_registration.css";
import registrationService from "../../services/registrationService";

const difficultyMap = {
  ADVANCED: { label: "Khó", class: "advanced" },
  INTERMEDIATE: { label: "Trung bình", class: "intermediate" },
  BEGINNER: { label: "Dễ", class: "beginner" },
};

const TopicRegistration = () => {
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeringId, setRegisteringId] = useState(null);

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
      return (
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.topicCode.toLowerCase().includes(search.toLowerCase())
      );
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
      alert(res.message || "Đăng ký thành công");
      
    } catch (err) {
      alert("Đã xảy ra lỗi khi đăng ký đề tài");
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="topic-registration-page">
      <div className="filters-bar">
        <div className="filter-group search-group">
          <label>Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tìm theo tên đề tài hoặc mã đề tài"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", margin: "32px 0" }}>
          Đang tải danh sách đề tài...
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", color: "red", margin: "32px 0" }}>
          {error}
        </div>
      ) : (
        <div className="topics-grid">
          {filterTopics().map((topic) => (
            <div className="topic-card" key={topic.topicId}>
              <div className="topic-title">{topic.title}</div>
              <div className="topic-desc">{topic.description}</div>
              <div className="topic-meta">
                <span className="topic-code">Mã: {topic.topicCode}</span>
                <span className="slots">
                  {topic.currentStudents}/{topic.maxStudents} sinh viên
                </span>
                <span
                  className={`difficulty-tag ${
                    difficultyMap[topic.difficultyLevel]?.class || ""
                  }`}
                >
                  {difficultyMap[topic.difficultyLevel]?.label ||
                    topic.difficultyLevel}
                </span>
                <span className="supervisor">
                  GVHD ID: {topic.supervisorId}
                </span>
              </div>
              <button
                className={`register-btn ${getStatusColor(topic.status)}`}
                disabled={
                  topic.status === "Approved" ||
                  topic.status === "Pending" ||
                  registeringId === topic.topicId
                }
                onClick={() => handleRegister(topic.topicId)}
              >
                {registeringId === topic.topicId
                  ? "Đang đăng ký..."
                  : topic.status === "Approved"
                  ? "Đã duyệt"
                  : topic.status === "Pending"
                  ? "Chờ duyệt"
                  : "Đăng ký"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicRegistration;
