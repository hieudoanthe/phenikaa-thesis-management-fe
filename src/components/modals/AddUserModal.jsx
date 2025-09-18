import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from "react-toastify";

// Helper hiển thị toast sử dụng react-toastify
const showToast = (message, type = "success") => {
  try {
    if (type === "error") return toast.error(message);
    if (type === "warning") return toast.warn(message);
    if (type === "info") return toast.info(message);
    return toast.success(message);
  } catch (err) {
    console.error("Không thể hiển thị toast:", err);
    (type === "success" ? console.log : console.error)(message);
  }
};

// Mapping role theo yêu cầu: STUDENT(1) -> ADMIN(2) -> TEACHER(3)
const roleOptions = [
  { value: 1, label: "Sinh viên", role: "STUDENT" },
  { value: 2, label: "Phòng ban", role: "ADMIN" },
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
  const [submitting, setSubmitting] = useState(false);

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
        setSubmitting(true);
        // Gọi onAddUser và chờ kết quả
        await onAddUser(userData);

        // Reset form
        setFormData({
          fullName: "",
          username: "",
          password: "",
          roles: [],
        });

        // Hiển thị toast thành công và đóng modal ngay
        showToast("Thêm người dùng thành công!");
        onClose();
      } catch (error) {
        // Nếu có lỗi, không đóng modal và hiển thị toast lỗi
        console.error("Lỗi khi thêm người dùng:", error);
        showToast("Có lỗi xảy ra khi thêm người dùng!");
      } finally {
        setSubmitting(false);
      }
    } else {
      // Hiển thị thông báo lỗi nếu form không hợp lệ
      showToast("Vui lòng điền đầy đủ thông tin!");
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
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900 m-0">
            Thêm người dùng mới
          </h2>
        </div>

        {/* Form */}
        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  placeholder=" "
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  required
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-secondary focus:shadow-focus bg-white peer"
                />
                <label
                  htmlFor="fullName"
                  className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Họ và tên <span className="text-error-600">*</span>
                </label>
              </div>

              <div className="relative">
                <input
                  id="username"
                  type="text"
                  placeholder=" "
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  required
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-secondary focus:shadow-focus bg-white peer"
                />
                <label
                  htmlFor="username"
                  className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Tên đăng nhập <span className="text-error-600">*</span>
                </label>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div className="relative">
                <Select
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
                  className="custom-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: "48px",
                      height: "51px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: state.isFocused ? "0 0 0 1px #ff6600" : "none",
                      borderColor: state.isFocused ? "#ff6600" : "#e2e8f0",
                      "&:hover": {
                        borderColor: state.isFocused ? "#ff6600" : "#cbd5e0",
                      },
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#ff6600"
                        : state.isFocused
                        ? "#fff5f0"
                        : "#fff",
                      color: state.isSelected ? "#fff" : "#4a5568",
                      fontWeight: state.isSelected ? 500 : 400,
                      "&:hover": {
                        backgroundColor: state.isSelected
                          ? "#ff6600"
                          : "#fff5f0",
                        color: state.isSelected ? "#fff" : "#4a5568",
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      zIndex: 2000,
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 2000 }),
                  }}
                />
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-secondary focus:shadow-focus bg-white peer pr-12"
                />
                <label
                  htmlFor="password"
                  className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:text-primary-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:font-medium"
                >
                  Mật khẩu <span className="text-error-600">*</span>
                </label>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 rounded-lg hover:bg-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }
                  }}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-200"
                  >
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 text-base font-medium text-gray-600 bg-gray-100 rounded-lg border-none cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 min-w-[100px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2.5 text-base font-medium text-white bg-primary-500 rounded-lg border-none cursor-pointer transition-all duration-200 min-w-[120px] ${
                submitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-primary-400"
              }`}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang thêm...
                </span>
              ) : (
                "Thêm người dùng"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;

