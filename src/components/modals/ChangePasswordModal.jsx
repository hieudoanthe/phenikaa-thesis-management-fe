import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [changePasswordData, setChangePasswordData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const BASE_URL = import.meta.env.VITE_MAIN_API_BASE_URL;

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

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case "current":
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case "new":
        setShowNewPassword(!showNewPassword);
        break;
      case "confirm":
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  const validatePasswords = () => {
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      showToast("Mật khẩu mới và xác nhận mật khẩu không khớp!", "error");
      return false;
    }
    if (changePasswordData.newPassword.length < 6) {
      showToast("Mật khẩu mới phải có ít nhất 6 ký tự!", "error");
      return false;
    }
    if (changePasswordData.currentPassword === changePasswordData.newPassword) {
      showToast("Mật khẩu mới phải khác mật khẩu hiện tại!", "error");
      return false;
    }
    return true;
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    setChangePasswordLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      let response;
      if (token) {
        // Đổi mật khẩu khi đã đăng nhập
        response = await axios.put(
          `${BASE_URL}/api/auth/change-password`,
          {
            currentPassword: changePasswordData.currentPassword,
            newPassword: changePasswordData.newPassword,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Đổi mật khẩu trực tiếp tại màn login (xác thực bằng email + mật khẩu hiện tại)
        response = await axios.put(
          `${BASE_URL}/api/auth/change-password-direct`,
          {
            email: changePasswordData.email,
            currentPassword: changePasswordData.currentPassword,
            newPassword: changePasswordData.newPassword,
          }
        );
      }

      showToast("Đổi mật khẩu thành công!", "success");
      onClose();
      setChangePasswordData({
        email: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      let errorMessage = "Không thể đổi mật khẩu. Vui lòng thử lại!";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = "Mật khẩu hiện tại không đúng!";
      } else if (err.response?.status === 400) {
        errorMessage = "Dữ liệu không hợp lệ!";
      }

      showToast(errorMessage, "error");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const closeModal = () => {
    onClose();
    setChangePasswordData({
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Đổi mật khẩu</h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Đóng modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Nhập email, mật khẩu hiện tại và mật khẩu mới để thay đổi mật khẩu của
          bạn.
        </p>

        <form onSubmit={handleChangePasswordSubmit}>
          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={changePasswordData.email}
              onChange={(e) =>
                setChangePasswordData((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="Nhập email của bạn"
              className="w-full h-11 px-3 py-2.5 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-info focus:shadow-focus bg-white"
              style={{ fontSize: "16px" }}
              required
            />
          </div>
          {/* Current Password */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={changePasswordData.currentPassword}
                onChange={(e) =>
                  setChangePasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full h-11 px-3 py-2.5 pr-10 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-info focus:shadow-focus bg-white"
                style={{ fontSize: "16px" }}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-2.5 bg-transparent border-none cursor-pointer text-gray-500 outline-none"
                onClick={() => togglePasswordVisibility("current")}
                aria-label={
                  showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                }
              >
                {showCurrentPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94a10 10 0 01-11.88 0" />
                    <path d="M9.88 9.88A3 3 0 0114.12 14.12" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={changePasswordData.newPassword}
                onChange={(e) =>
                  setChangePasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="Nhập mật khẩu mới"
                className="w-full h-11 px-3 py-2.5 pr-10 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-info focus:shadow-focus bg-white"
                style={{ fontSize: "16px" }}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-2.5 bg-transparent border-none cursor-pointer text-gray-500 outline-none"
                onClick={() => togglePasswordVisibility("new")}
                aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showNewPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94a10 10 0 01-11.88 0" />
                    <path d="M9.88 9.88A3 3 0 0114.12 14.12" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={changePasswordData.confirmPassword}
                onChange={(e) =>
                  setChangePasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Nhập lại mật khẩu mới"
                className="w-full h-11 px-3 py-2.5 pr-10 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-info focus:shadow-focus bg-white"
                style={{ fontSize: "16px" }}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-2.5 bg-transparent border-none cursor-pointer text-gray-500 outline-none"
                onClick={() => togglePasswordVisibility("confirm")}
                aria-label={
                  showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                }
              >
                {showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94a10 10 0 01-11.88 0" />
                    <path d="M9.88 9.88A3 3 0 0114.12 14.12" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              disabled={changePasswordLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-secondary hover:bg-secondary-hover text-white font-bold py-2.5 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                changePasswordLoading ||
                !changePasswordData.currentPassword.trim() ||
                !changePasswordData.newPassword.trim() ||
                !changePasswordData.confirmPassword.trim()
              }
            >
              {changePasswordLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
              {changePasswordLoading && (
                <span className="inline-block w-4 h-4 border-2 border-gray-100 border-t-white border-r-white rounded-full animate-spin ml-2"></span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
