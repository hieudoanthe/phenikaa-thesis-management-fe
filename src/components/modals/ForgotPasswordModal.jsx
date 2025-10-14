import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: "",
  });
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

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

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/forgot-password`,
        null,
        {
          params: {
            email: forgotPasswordData.email,
          },
        }
      );

      if (response.data.success) {
        showToast(response.data.message, "success");
        onClose();
        setForgotPasswordData({ email: "" });
      } else {
        showToast(
          response.data.message || "Không thể gửi email đặt lại mật khẩu!",
          "error"
        );
      }
    } catch (err) {
      let errorMessage =
        "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại!";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = "Không tìm thấy tài khoản với email này!";
      } else if (err.response?.status === 400) {
        errorMessage = "Email không hợp lệ!";
      }

      showToast(errorMessage, "error");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const closeModal = () => {
    onClose();
    setForgotPasswordData({ email: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Quên mật khẩu</h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Nhập email của bạn để nhận link đặt lại mật khẩu qua email.
        </p>

        <form onSubmit={handleForgotPasswordSubmit}>
          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={forgotPasswordData.email}
              onChange={(e) =>
                setForgotPasswordData((prev) => ({
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

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              disabled={forgotPasswordLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-secondary hover:bg-secondary-hover text-white font-bold py-2.5 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                forgotPasswordLoading || !forgotPasswordData.email.trim()
              }
            >
              {forgotPasswordLoading ? "Đang gửi..." : "Gửi link đặt lại"}
              {forgotPasswordLoading && (
                <span className="inline-block w-4 h-4 border-2 border-gray-100 border-t-white border-r-white rounded-full animate-spin ml-2"></span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
