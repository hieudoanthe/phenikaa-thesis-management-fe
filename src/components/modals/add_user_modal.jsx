import React, { useState } from "react";
import Select from "react-select";
import "../../styles/pages/admin/style.css";

const roleOptions = [
  { value: "Student", label: "Sinh viên" },
  { value: "Lecturer", label: "Giảng viên" },
  { value: "Admin", label: "Admin" },
];

const AddUserModal = ({ isOpen, onClose, onAddUser }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    role: null,
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      formData.fullName &&
      formData.username &&
      formData.password &&
      formData.role
    ) {
      onAddUser(formData);
      setFormData({
        fullName: "",
        username: "",
        password: "",
        role: null,
      });
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: "",
      username: "",
      password: "",
      role: null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div
        className="modal-box add-user-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Thêm người dùng mới</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            {/* Left Column */}
            <div className="form-column">
              <div className="form-group">
                <div className="floating-input-group">
                  <input
                    id="fullName"
                    type="text"
                    className="modal-input"
                    placeholder=" "
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    required
                  />
                  <label htmlFor="fullName" className="floating-label">
                    Họ và tên
                  </label>
                </div>
              </div>

              <div className="form-group">
                <div className="floating-input-group">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="modal-input"
                    placeholder=" "
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    required
                  />
                  <label htmlFor="password" className="floating-label">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowPassword(!showPassword);
                      }
                    }}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <i
                      className={`bi bi-eye${showPassword ? "-slash" : ""}`}
                    ></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column">
              <div className="form-group">
                <div className="floating-input-group">
                  <input
                    id="username"
                    type="text"
                    className="modal-input"
                    placeholder=" "
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    required
                  />
                  <label htmlFor="username" className="floating-label">
                    Tên đăng nhập
                  </label>
                </div>
              </div>

              <div className="form-group">
                <Select
                  classNamePrefix="role-select"
                  value={formData.role}
                  onChange={(option) => handleInputChange("role", option)}
                  options={roleOptions}
                  placeholder="Chọn vai trò"
                  isSearchable={false}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: 8,
                      minHeight: 44,
                      fontSize: "1rem",
                      borderColor: "#d1d5db",
                      boxShadow: "none",
                      backgroundColor: "#fff",
                    }),
                    option: (base, state) => {
                      const getBgColor = (state) => {
                        if (state.isSelected) return "#ff6600";
                        if (state.isFocused) return "#f3f4f6";
                        return "#fff";
                      };

                      return {
                        ...base,
                        fontSize: "1rem",
                        backgroundColor: getBgColor(state),
                        color: state.isSelected ? "#fff" : "#222b45",
                        cursor: "pointer",
                      };
                    },
                    singleValue: (base) => ({
                      ...base,
                      color: "#374151",
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: 8,
                      zIndex: 20,
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "#6b7280",
                    }),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="modal-btn-row">
            <button
              type="button"
              className="modal-btn cancel"
              onClick={handleCancel}
            >
              Hủy
            </button>
            <button type="button" className="modal-btn create">
              Thêm người dùng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
