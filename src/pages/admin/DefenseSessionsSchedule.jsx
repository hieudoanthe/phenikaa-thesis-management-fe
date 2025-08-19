import React, { useState, useEffect } from "react";
import Select from "react-select";
import "../../styles/common/design-tokens.css";
import "../../styles/pages/admin/defense_sessions_schedule.css";

const DefenseSessionsSchedule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState({
    value: "This Week",
    label: "This Week",
  });
  const [selectedDepartment, setSelectedDepartment] = useState({
    value: "All Departments",
    label: "All Departments",
  });
  const [selectedStatus, setSelectedStatus] = useState({
    value: "All Status",
    label: "All Status",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dữ liệu mẫu cho demo
  const mockSessions = [
    {
      id: 1,
      day: "Mon",
      time: "10:00 AM",
      status: "upcoming",
      room: "Room 301",
      topic: "Machine Learning Applications in Healthcare",
      committeeMembers: 3,
      date: "2024-01-15",
    },
    {
      id: 2,
      day: "Fri",
      time: "11:00 AM",
      status: "completed",
      room: "Room 401",
      topic: "Blockchain Technology in Supply Chain",
      committeeMembers: 3,
      date: "2024-01-19",
    },
  ];

  // Tạo time slots từ 9:00 AM đến 5:00 PM
  const timeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];

  // Tạo days of week
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  // Options cho react-select
  const periodOptions = [
    { value: "This Week", label: "This Week" },
    { value: "Next Week", label: "Next Week" },
    { value: "This Month", label: "This Month" },
  ];

  const departmentOptions = [
    { value: "All Departments", label: "All Departments" },
    { value: "Computer Science", label: "Computer Science" },
    { value: "Information Technology", label: "Information Technology" },
  ];

  const statusOptions = [
    { value: "All Status", label: "All Status" },
    { value: "Upcoming", label: "Upcoming" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
  ];

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      // Sử dụng dữ liệu mẫu cho demo
      setSessions(mockSessions);
    } catch (error) {
      console.error("Lỗi khi tải danh sách session:", error);
      if (window.addToast) {
        window.addToast("Lỗi khi tải danh sách session!", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const getSessionForTimeSlot = (day, time) => {
    return sessions.find(
      (session) => session.day === day && session.time === time
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "var(--color-info-light)";
      case "completed":
        return "var(--color-gray-100)";
      case "in-progress":
        return "var(--color-warning-light)";
      default:
        return "var(--color-gray-100)";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "upcoming":
        return "var(--color-info)";
      case "completed":
        return "var(--color-gray-600)";
      case "in-progress":
        return "var(--color-warning)";
      default:
        return "var(--color-gray-600)";
    }
  };

  const handleCreateSchedule = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalSubmit = (formData) => {
    // TODO: Gọi API để tạo lịch bảo vệ

    // Thêm session mới vào danh sách (demo)
    const newSession = {
      id: Date.now(),
      day: new Date(formData.date).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      time: formData.time,
      status: formData.status,
      room: formData.room,
      topic: formData.topic,
      committeeMembers: formData.committeeMembers.length,
      date: formData.date,
    };

    setSessions([...sessions, newSession]);

    if (window.addToast) {
      window.addToast("Tạo lịch bảo vệ thành công!", "success");
    }
  };

  const handleExport = () => {
    // TODO: Export dữ liệu
    if (window.addToast) {
      window.addToast("Chức năng export sẽ được phát triển!", "info");
    }
  };

  if (loading) {
    return (
      <div className="defense-sessions-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="defense-sessions-schedule">
      {/* Header Section */}
      <div className="schedule-header">
        <div className="header-filters">
          <div className="filter-group">
            <Select
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              options={periodOptions}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select Period"
              isSearchable={false}
            />
          </div>

          <div className="filter-group">
            <Select
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              options={departmentOptions}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select Department"
              isSearchable={false}
            />
          </div>

          <div className="filter-group">
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusOptions}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select Status"
              isSearchable={false}
            />
          </div>
        </div>

        <div className="header-actions">
          <div className="search-container">
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
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z" />
              </svg>
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            </button>
          </div>

          <button className="export-btn" onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Export
          </button>

          <button
            className="create-schedule-btn"
            onClick={handleCreateSchedule}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Create Schedule
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-container">
        <div className="calendar-grid">
          {/* Time column */}
          <div className="time-column">
            <div className="time-header"></div>
            {timeSlots.map((time, index) => (
              <div key={index} className="time-slot">
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="day-column">
              <div className="day-header">{day}</div>
              {timeSlots.map((time, timeIndex) => {
                const session = getSessionForTimeSlot(day, time);
                return (
                  <div key={timeIndex} className="calendar-cell">
                    {session && (
                      <div
                        className="session-card"
                        style={{
                          backgroundColor: getStatusColor(session.status),
                        }}
                      >
                        <div className="session-status">
                          {session.status === "upcoming"
                            ? "UPCOMING"
                            : session.status === "completed"
                            ? "COMPLETED"
                            : "IN PROGRESS"}
                        </div>
                        <div className="session-time">{session.time}</div>
                        <div className="session-location">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                          {session.room}
                        </div>
                        <div className="session-topic">{session.topic}</div>
                        <div className="session-committee">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-3.7 4.99c-.56.76-.56 1.76 0 2.52l3.7 4.99c.47.63 1.21 1 2.01 1h1.54c.8 0 1.54-.37 2.01-1L20.5 22H16z" />
                          </svg>
                          {session.committeeMembers} Committee Members
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="summary-footer">
        <div className="summary-card">
          <div className="summary-icon calendar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-number">24</div>
            <div className="summary-label">Total Sessions</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon clock">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-number">12</div>
            <div className="summary-label">Upcoming</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon chart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-number">4</div>
            <div className="summary-label">In Progress</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon person">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-number">8</div>
            <div className="summary-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Create Schedule Modal */}
      <CreateScheduleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

// Create Schedule Modal Component
const CreateScheduleModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    room: "",
    topic: "",
    committeeMembers: [],
    status: "upcoming",
  });

  const [selectedTeachers, setSelectedTeachers] = useState([]);

  // Mock data cho teachers
  const teacherOptions = [
    { value: "teacher1", label: "Dr. Nguyễn Văn A" },
    { value: "teacher2", label: "Dr. Trần Thị B" },
    { value: "teacher3", label: "Dr. Lê Văn C" },
    { value: "teacher4", label: "Dr. Phạm Thị D" },
  ];

  const roomOptions = [
    { value: "room301", label: "Room 301" },
    { value: "room401", label: "Room 401" },
    { value: "room501", label: "Room 501" },
    { value: "room601", label: "Room 601" },
  ];

  const timeOptions = [
    { value: "09:00", label: "09:00 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "14:00", label: "02:00 PM" },
    { value: "15:00", label: "03:00 PM" },
    { value: "16:00", label: "04:00 PM" },
  ];

  const statusOptions = [
    { value: "upcoming", label: "Upcoming" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      committeeMembers: selectedTeachers,
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      date: "",
      time: "",
      room: "",
      topic: "",
      committeeMembers: [],
      status: "upcoming",
    });
    setSelectedTeachers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-schedule-modal">
        <div className="modal-header">
          <h3>Tạo lịch bảo vệ mới</h3>
          <button className="close-btn" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="date-input">
                Ngày *
              </label>
              <input
                id="date-input"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="form-input"
                placeholder="dd/mm/yyyy"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="time-select">
                Thời gian *
              </label>
              <Select
                inputId="time-select"
                value={timeOptions.find(
                  (option) => option.value === formData.time
                )}
                onChange={(option) =>
                  setFormData({ ...formData, time: option.value })
                }
                options={timeOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn thời gian"
                isSearchable={false}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="room-select">
                Phòng *
              </label>
              <Select
                inputId="room-select"
                value={roomOptions.find(
                  (option) => option.value === formData.room
                )}
                onChange={(option) =>
                  setFormData({ ...formData, room: option.value })
                }
                options={roomOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn phòng"
                isSearchable={false}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="status-select">
                Trạng thái *
              </label>
              <Select
                inputId="status-select"
                value={statusOptions.find(
                  (option) => option.value === formData.status
                )}
                onChange={(option) =>
                  setFormData({ ...formData, status: option.value })
                }
                options={statusOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn trạng thái"
                isSearchable={false}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="topic-textarea">
                Chủ đề bảo vệ *
              </label>
              <textarea
                id="topic-textarea"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                className="form-textarea"
                placeholder="Nhập chủ đề bảo vệ..."
                rows="3"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="committee-select">
                Thành viên hội đồng *
              </label>
              <Select
                inputId="committee-select"
                value={selectedTeachers}
                onChange={setSelectedTeachers}
                options={teacherOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Chọn thành viên hội đồng"
                isMulti
                isSearchable={true}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              Hủy
            </button>
            <button type="submit" className="submit-btn">
              Tạo lịch bảo vệ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DefenseSessionsSchedule;
