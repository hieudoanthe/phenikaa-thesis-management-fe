import React, { useState, useEffect } from "react";
import Select from "react-select";

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

  // Reset form khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fullName: "",
        username: "",
        password: "",
        roles: [],
      });
      setShowPassword(false);
    }
  }, [isOpen]);

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
      className="admin-modal-overlay"
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
        className="admin-modal-box admin-add-user-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="admin-modal-title">Thêm người dùng mới</h2>

        <form className="admin-modal-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            {/* Left Column */}
            <div className="admin-form-column">
              <div className="admin-form-group">
                <div className="admin-floating-input-group">
                  <input
                    id="fullName"
                    type="text"
                    className="admin-modal-input"
                    placeholder=" "
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    required
                  />
                  <label htmlFor="fullName" className="admin-floating-label">
                    Họ và tên
                  </label>
                </div>
              </div>

              <div className="admin-form-group">
                <div className="admin-floating-input-group">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="admin-modal-input"
                    placeholder=" "
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    required
                  />
                  <label htmlFor="password" className="admin-floating-label">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    className="admin-password-toggle"
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
            <div className="admin-form-column">
              <div className="admin-form-group">
                <div className="admin-floating-input-group">
                  <input
                    id="username"
                    type="text"
                    className="admin-modal-input"
                    placeholder=" "
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    required
                  />
                  <label htmlFor="username" className="admin-floating-label">
                    Tên đăng nhập
                  </label>
                </div>
              </div>

              <div className="admin-form-group">
                <Select
                  classNamePrefix="admin-role-select"
                  value={formData.roles}
                  onChange={(selectedOptions) =>
                    handleInputChange("roles", selectedOptions || [])
                  }
                  options={roleOptions}
                  isMulti={true}
                  closeMenuOnSelect={false}
                  blurInputOnSelect={false}
                  hideSelectedOptions={true}
                  placeholder="Chọn vai trò..."
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  menuPlacement="auto"
                  menuShouldScrollIntoView={false}
                  maxMenuHeight={160}
                  isClearable
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 2000 }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 2000,
                      marginTop: 6,
                      maxHeight: 160,
                    }),
                    menuList: (base) => ({
                      ...base,
                      paddingTop: 4,
                      paddingBottom: 4,
                    }),
                    option: (base) => ({
                      ...base,
                      padding: "6px 10px",
                      fontSize: "0.9rem",
                    }),
                    control: (base) => ({
                      ...base,
                      minHeight: 44,
                      height: "auto",
                    }),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="admin-modal-btn-row">
            <button
              type="button"
              className="admin-modal-btn cancel"
              onClick={handleCancel}
            >
              Hủy
            </button>
            <button
              type="button"
              className="admin-modal-btn create"
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
