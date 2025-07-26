import React, { useState } from "react";
import "../../styles/pages/student/thesis_register.css";
import { suggestTopicForStudent } from "../../services/suggestService";

const lecturersMock = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    email: "sjohnson@university.edu",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    specialization: "Artificial Intelligence",
    assigned: 2,
    max: 5,
    status: "Available",
  },
  {
    id: 2,
    name: "Prof. Michael Chen",
    email: "m.chen@university.edu",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    specialization: "Data Science",
    assigned: 5,
    max: 5,
    status: "Full",
  },
];

const initialForm = {
  tieuDe: "",
  moTa: "",
  mucTieu: "",
  phuongPhap: "",
  ketQuaDuKien: "",
  giangVien: null, // sẽ lấy id khi submit
  lyDo: "",
};

const fields = [
  { name: "tieuDe", label: "Tên đề tài", type: "text", required: true },
  {
    name: "moTa",
    label: "Mô tả đề tài",
    type: "textarea",
    required: true,
  },
  { name: "mucTieu", label: "Mục tiêu", type: "textarea", required: true },
  {
    name: "phuongPhap",
    label: "Phương pháp thực hiện",
    type: "textarea",
    required: true,
  },
  {
    name: "ketQuaDuKien",
    label: "Kết quả dự kiến",
    type: "textarea",
    required: true,
  },
];

const fieldsOfStudy = [
  "Computer Science",
  "Information Systems",
  "Software Engineering",
  "Cybersecurity",
  "Data Science",
];

const ThesisRegister = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [timGiangVien, setTimGiangVien] = useState("");

  // Xử lý thay đổi trường nhập liệu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Chọn giảng viên
  const handleLecturerSelect = (giangVien) => {
    setForm((prev) => ({ ...prev, giangVien }));
  };

  // Xử lý submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    // Chuẩn bị dữ liệu đúng với SuggestTopicDTO
    const data = {
      title: form.tieuDe,
      description: form.moTa,
      objectives: form.mucTieu,
      methodology: form.phuongPhap,
      expectedOutcome: form.ketQuaDuKien,
      supervisorId: form.giangVien?.id || null,
      reason: form.lyDo,
    };
    try {
      await suggestTopicForStudent(data);
      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Lọc giảng viên theo tên hoặc email
  const filteredLecturers = lecturersMock.filter(
    (l) =>
      l.name.toLowerCase().includes(timGiangVien.toLowerCase()) ||
      l.email.toLowerCase().includes(timGiangVien.toLowerCase())
  );

  return (
    <div className="thesis-register-layout">
      <form className="thesis-form-card" onSubmit={handleSubmit}>
        <h2 className="form-title">Đề xuất đề tài khóa luận</h2>
        <p className="form-desc">
          Vui lòng điền đầy đủ các trường bắt buộc bên dưới
        </p>
        <div className="notice-box">
          <span className="notice-icon">⚠️</span>
          <span className="notice-text">
            Bạn chỉ được đề xuất 1 đề tài tại một thời điểm. Hãy kiểm tra kỹ
            thông tin trước khi gửi.
          </span>
        </div>
        {fields.map((f) => (
          <div className="form-group" key={f.name}>
            {f.type === "textarea" ? (
              <textarea
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                required={f.required}
                className={form[f.name] ? "has-value" : ""}
              />
            ) : (
              <input
                type={f.type}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                required={f.required}
                className={form[f.name] ? "has-value" : ""}
              />
            )}
            <label className={form[f.name] ? "float" : ""}>{f.label}</label>
          </div>
        ))}
        <div className="form-group">
          <div className="lecturer-autocomplete">
            <input
              type="text"
              placeholder="Tìm kiếm giảng viên"
              value={timGiangVien}
              onChange={(e) => setTimGiangVien(e.target.value)}
              className={form.giangVien ? "has-value" : ""}
            />
            <label className={form.giangVien ? "float" : ""}>
              Giảng viên hướng dẫn mong muốn
            </label>
            <div className="lecturer-list" style={{ display: "none" }}>
              {filteredLecturers.map((l) => (
                <div
                  key={l.id}
                  className={`lecturer-item ${
                    form.giangVien?.id === l.id ? "selected" : ""
                  }`}
                  onClick={() => handleLecturerSelect(l)}
                >
                  <img
                    src={l.avatar}
                    alt={l.name}
                    className="lecturer-avatar"
                  />
                  <div className="lecturer-info">
                    <div className="lecturer-name">{l.name}</div>
                    <div className="lecturer-email">{l.email}</div>
                  </div>
                  <span
                    className={`lecturer-status ${
                      l.status === "Available" ? "available" : "full"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
              ))}
              {filteredLecturers.length === 0 && (
                <div className="lecturer-item empty">
                  Không tìm thấy giảng viên
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="form-group">
          <textarea
            name="lyDo"
            value={form.lyDo}
            onChange={handleChange}
            className={form.lyDo ? "has-value" : ""}
            placeholder="Lý do đề xuất đề tài này"
            required
          />
          <label className={form.lyDo ? "float" : ""}>
            Lý do đề xuất <span style={{ color: "red" }}>*</span>
          </label>
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? <span className="loading-spinner"></span> : "Gửi đề xuất"}
        </button>
        {success && (
          <div className="success-message">Đề xuất đề tài thành công!</div>
        )}
        {error && (
          <div className="error-message" style={{ color: "red", marginTop: 8 }}>
            {error}
          </div>
        )}
      </form>
      <div className="lecturer-preview-card">
        <div className="preview-title">Giảng viên đã chọn</div>
        {form.giangVien ? (
          <div className="lecturer-profile">
            <img
              src={form.giangVien.avatar}
              alt={form.giangVien.name}
              className="lecturer-profile-avatar"
            />
            <div className="lecturer-profile-name">{form.giangVien.name}</div>
            <div className="lecturer-profile-email">{form.giangVien.email}</div>
            <div className="lecturer-profile-specialization">
              {form.giangVien.specialization}
            </div>
            <div className="lecturer-profile-assign">
              {form.giangVien.assigned}/{form.giangVien.max} đề tài
            </div>
            <span
              className={`lecturer-profile-status ${
                form.giangVien.status === "Available" ? "available" : "full"
              }`}
            >
              {form.giangVien.status === "Available" ? "Còn nhận" : "Đã đủ"}
            </span>
          </div>
        ) : (
          <div className="lecturer-profile-empty">
            <div className="lecturer-profile-avatar-empty">
              <svg width="48" height="48" fill="#d1d5db" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M12 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" />
              </svg>
            </div>
            <div className="lecturer-profile-empty-text">
              Chưa chọn giảng viên
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThesisRegister;
