import React, { useState } from "react";
import Select from "react-select";
import "../../styles/pages/admin/style.css";

const roleOptions = [
  { value: 1, label: "Sinh viên", role: "USER" },
  { value: 2, label: "Quản trị viên", role: "ADMIN" },
  { value: 3, label: "Giảng viên", role: "TEACHER" },
];

const AddUserModal = ({ isOpen, onClose, onAddUser }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    roles: [],
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      formData.fullName &&
      formData.username &&
      formData.password &&
      formData.roles.length > 0
    ) {
      // Chuyển đổi roles thành format phù hợp cho backend
      const userData = {
        ...formData,
        roleIds: formData.roles.map((role) => role.value),
        roles: formData.roles.map((role) => role.role),
      };

      try {
        // Gọi onAddUser và chờ kết quả
        await onAddUser(userData);

        // Reset form
        setFormData({
          fullName: "",
          username: "",
          password: "",
          roles: [],
        });

        // Đóng modal sau khi thành công
        onClose();
      } catch (error) {
        // Nếu có lỗi, không đóng modal và hiển thị toast lỗi
        if (window.addToast) {
          window.addToast("Có lỗi xảy ra khi thêm người dùng!", "error");
        }
      }
    } else {
      // Hiển thị thông báo lỗi nếu form không hợp lệ
      if (window.addToast) {
        window.addToast("Vui lòng điền đầy đủ thông tin!", "error");
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: "",
      username: "",
      password: "",
      roles: [],
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
                  value={formData.roles}
                  onChange={(selectedOptions) =>
                    handleInputChange("roles", selectedOptions || [])
                  }
                  options={roleOptions}
                  isMulti={true}
                  closeMenuOnSelect={false}
                  blurInputOnSelect={false}
                  hideSelectedOptions={false}
                  placeholder="Chọn vai trò..."
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
                        padding: "12px 16px",
                        "&:hover": {
                          backgroundColor: state.isSelected
                            ? "#ff6600"
                            : "#f3f4f6",
                        },
                      };
                    },
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#ff6600",
                      color: "#fff",
                      borderRadius: 6,
                      margin: "2px 4px 2px 0",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#fff",
                      fontWeight: 500,
                      padding: "4px 8px",
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: "#fff",
                      padding: "0 4px",
                      "&:hover": {
                        backgroundColor: "#e65c00",
                        color: "#fff",
                      },
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      padding: "8px 12px",
                      minHeight: "28px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                    }),
                    input: (base) => ({
                      ...base,
                      margin: "0",
                      padding: "0",
                      minWidth: "60px",
                    }),
                    indicatorsContainer: (base) => ({
                      ...base,
                      padding: "0 8px",
                    }),
                    indicatorSeparator: (base) => ({
                      ...base,
                      display: "none",
                    }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      color: "#6b7280",
                      "&:hover": {
                        color: "#ff6600",
                      },
                    }),
                    clearIndicator: (base) => ({
                      ...base,
                      color: "#6b7280",
                      "&:hover": {
                        color: "#ff6600",
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: 8,
                      zIndex: 20,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      border: "1px solid #e5e7eb",
                    }),
                    menuList: (base) => ({
                      ...base,
                      padding: "4px 0",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "#6b7280",
                      fontSize: "1rem",
                    }),
                    noOptionsMessage: (base) => ({
                      ...base,
                      color: "#6b7280",
                      fontSize: "1rem",
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
            <button
              type="button"
              className="modal-btn create"
              onClick={handleSubmit}
            >
              Thêm người dùng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
