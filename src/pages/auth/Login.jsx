import React, { useState } from "react";
import {
  validateEmailBasic,
  validatePasswordLogin,
} from "../../utils/validation";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuthHook from "../../hooks/useAuth";
import Select from "react-select";
import { toast } from "react-toastify";
import ForgotPasswordModal from "../../components/modals/ForgotPasswordModal";
import ChangePasswordModal from "../../components/modals/ChangePasswordModal";

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

const PhenikaaLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuthHook();
  const [role, setRole] = useState("STUDENT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Live validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const BASE_URL = import.meta.env.VITE_MAIN_API_BASE_URL;

  const toggleShowPassword = () => setShowPassword(!showPassword);

  // Validators
  const validateEmail = validateEmailBasic;
  const validatePassword = validatePasswordLogin;

  // Helper function để chuyển đổi role thành tên hiển thị
  const getRoleDisplayName = (role) => {
    switch (role) {
      case "STUDENT":
        return "Sinh viên";
      case "TEACHER":
        return "Giảng viên";
      case "ADMIN":
        return "Phòng ban";
      default:
        return "Người dùng";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Final validate before submit
    const emailErr = validateEmail(username);
    const passErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passErr);
    if (emailErr || passErr) {
      setError("Vui lòng kiểm tra lại thông tin đăng nhập");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        username,
        password,
        role,
      });

      let accessToken, refreshToken, user;

      if (response.data.accessToken) {
        accessToken = response.data.accessToken;
      } else if (response.data.token) {
        accessToken = response.data.token;
      } else {
        throw new Error("Không tìm thấy access token trong response");
      }

      if (response.data.refreshToken) {
        refreshToken = response.data.refreshToken;
      }

      if (response.data.user) {
        user = response.data.user;
      } else if (response.data.data) {
        user = response.data.data;
      } else {
        // Tạo user object từ thông tin có sẵn
        user = {
          username: username,
          role: role,
          email: username,
        };
      }

      const loginResult = await login(
        accessToken,
        user,
        refreshToken,
        rememberMe
      );

      showToast("Đăng nhập thành công!");

      const userRole = user?.role || role;

      // Điều hướng ngay; ToastContainer nằm global nên toast vẫn hiển thị
      if (userRole === "ADMIN") {
        navigate("/admin/statistics");
      } else if (userRole === "TEACHER") {
        navigate("/lecturer/dashboard");
      } else if (userRole === "STUDENT") {
        navigate("/student/home");
      } else {
        navigate("/home");
      }
    } catch (err) {
      let errorMessage = "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";

      // Debug: Log thông tin lỗi để kiểm tra

      // Lấy message từ server (có thể là string hoặc object)
      const serverMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.response?.data?.error;

      if (serverMessage) {
        // Xử lý các trường hợp lỗi cụ thể dựa trên message từ server
        if (
          serverMessage.toLowerCase().includes("quyền") ||
          serverMessage.toLowerCase().includes("vai trò") ||
          serverMessage.toLowerCase().includes("role")
        ) {
          const roleDisplayName = getRoleDisplayName(role);
          errorMessage = `Vui lòng chọn đúng vai trò của bạn!`;
        } else if (
          serverMessage.toLowerCase().includes("password") ||
          serverMessage.toLowerCase().includes("mật khẩu") ||
          serverMessage.toLowerCase().includes("credentials") ||
          serverMessage.toLowerCase().includes("invalid") ||
          serverMessage.toLowerCase().includes("sai")
        ) {
          errorMessage = "Sai mật khẩu! Vui lòng kiểm tra lại mật khẩu.";
        } else if (
          serverMessage.toLowerCase().includes("username") ||
          serverMessage.toLowerCase().includes("tên đăng nhập") ||
          serverMessage.toLowerCase().includes("user") ||
          serverMessage.toLowerCase().includes("not found") ||
          serverMessage.toLowerCase().includes("không tồn tại")
        ) {
          errorMessage = "Tên đăng nhập không tồn tại! Vui lòng kiểm tra lại.";
        } else if (
          serverMessage.toLowerCase().includes("account") ||
          serverMessage.toLowerCase().includes("tài khoản") ||
          serverMessage.toLowerCase().includes("locked") ||
          serverMessage.toLowerCase().includes("disabled") ||
          serverMessage.toLowerCase().includes("khóa")
        ) {
          errorMessage = "Tài khoản không tồn tại hoặc đã bị khóa!";
        } else {
          errorMessage = serverMessage;
        }
      } else if (err.response?.status) {
        switch (err.response.status) {
          case 401:
            errorMessage = "Thông tin đăng nhập không chính xác!";
            break;
          case 403:
            errorMessage = "Vui lòng kiểm tra lại thông tin đăng nhập!";
            break;
          case 404:
            errorMessage = "Tài khoản không tồn tại!";
            break;
          case 500:
            errorMessage = "Lỗi server! Vui lòng thử lại sau.";
            break;
          default:
            errorMessage = `Lỗi ${err.response.status}: ${err.response.statusText}`;
        }
      }

      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: "STUDENT", label: "Sinh viên" },
    { value: "TEACHER", label: "Giảng viên" },
    { value: "ADMIN", label: "Phòng ban" },
  ];

  const getOptionBgColor = (state) => {
    if (state.isSelected) return "#1e3286";
    if (state.isFocused) return "#e6eaf6";
    return "#fff";
  };

  const handleImageError = (e) => {
    e.currentTarget.style.display = "none";
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  const handleKeyDown = (e, action) => {
    if (e.key === "Enter") {
      action();
    }
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "#1e3286" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px #1e328633" : "",
      borderRadius: 8,
      minHeight: 44,
      fontWeight: 600,
      fontSize: "16px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: getOptionBgColor(state),
      color: state.isSelected ? "#fff" : "#1e3286",
      fontWeight: state.isSelected ? 700 : 500,
      padding: 12,
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af",
      fontWeight: 500,
    }),
    singleValue: (base) => ({
      ...base,
      color: "#374151",
      fontWeight: 600,
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    }),
    menuList: (base) => ({
      ...base,
      borderRadius: 3,
      padding: 0,
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: "#9ca3af",
      fontWeight: 500,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <>
      <style>
        {`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #f9fafb inset !important;
            -webkit-text-fill-color: #374151 !important;
          }
          
          /* Ngăn zoom trên iOS Safari */
          input[type="email"],
          input[type="password"],
          input[type="text"],
          select,
          textarea {
            font-size: 16px !important;
            -webkit-text-size-adjust: 100%;
            -webkit-appearance: none;
          }
          
          /* Đảm bảo Select component không bị zoom */
          .react-select__control {
            font-size: 16px !important;
          }
          
          .react-select__input {
            font-size: 16px !important;
          }
          
          .react-select__single-value {
            font-size: 16px !important;
          }
          
          .react-select__placeholder {
            font-size: 16px !important;
          }
        `}
      </style>
      <main className="flex flex-col lg:flex-row min-h-screen w-full">
        {/* Left Side - Introduction (chỉ hiển thị trên desktop) */}
        <section
          className="hidden lg:flex flex-1 bg-secondary text-white flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 lg:py-16 min-h-screen lg:min-w-[380px] relative order-2 lg:order-1"
          aria-label="Introduction and illustration"
        >
          <h2 className="m-0 font-bold text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl leading-tight sm:leading-tight md:leading-tight lg:leading-tight xl:leading-tight tracking-wide max-w-none mb-6 sm:mb-8 lg:mb-12 outline-none px-2">
            Hệ thống quản lý đồ án tốt nghiệp
          </h2>
          <img
            src="./students.svg"
            alt="Illustration of four students standing inside a school hallway near lockers, carrying books and backpacks, having a casual discussion"
            className="w-full max-w-[280px] sm:max-w-[350px] md:max-w-[420px] lg:max-w-[480px] xl:max-w-[520px] h-auto outline-none pointer-events-none"
            onError={handleImageError}
          />
        </section>

        {/* Right Side - Login Form (full width trên mobile, half width trên desktop) */}
        <section
          className="flex-1 bg-gray-50 flex justify-center items-center p-2 sm:p-6 md:p-8 lg:p-12 xl:p-16 min-h-screen order-1 lg:order-2"
          aria-label="Login form"
        >
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-card w-full max-w-[95vw] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[450px] p-3 sm:p-8 md:p-10 lg:p-10 xl:p-12 pb-4 sm:pb-10 lg:pb-12 flex flex-col items-center fade-in"
            style={{ animationDelay: "0.05s" }}
          >
            {/* Logo */}
            <div
              className="mb-4 sm:mb-6 fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <img
                src="./logo.png"
                alt="Phenikaa University logo in blue and orange"
                className="w-[120px] sm:w-[160px] md:w-[180px] lg:w-[200px] h-auto pointer-events-none outline-none"
                onError={handleImageError}
              />
            </div>

            {/* Title */}
            <h1
              className="font-bold text-sm sm:text-lg md:text-xl lg:text-lg xl:text-xl mb-1 outline-none text-gray-900 fade-in text-center"
              id="loginTitle"
              style={{ animationDelay: "0.15s" }}
            >
              PHENIKAAHUB
            </h1>

            {/* Info Text */}
            <p
              className="text-xs sm:text-sm text-red-500 italic text-center mb-4 sm:mb-6 outline-none fade-in px-2"
              aria-live="polite"
              aria-atomic="true"
              style={{ animationDelay: "0.2s" }}
            >
              (Người dùng sử dụng tài khoản nội bộ để đăng nhập và sử dụng hệ
              thống)
            </p>

            {/* Login Form */}
            <form
              onSubmit={handleSubmit}
              className="w-full"
              aria-describedby="formInstructions"
              aria-labelledby="loginTitle"
            >
              {/* Role Selection */}
              <div
                className="relative mb-4 sm:mb-5 fade-in"
                style={{ animationDelay: "0.25s" }}
              >
                <Select
                  id="roleSelect"
                  name="roleSelect"
                  options={roleOptions}
                  value={roleOptions.find((option) => option.value === role)}
                  onChange={(option) => setRole(option.value)}
                  placeholder="Chọn vai trò của bạn"
                  menuPortalTarget={document.body}
                  styles={{
                    ...selectStyles,
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused ? "#1e3286" : "#d1d5db",
                      boxShadow: state.isFocused ? "0 0 0 2px #1e328633" : "",
                      borderRadius: 8,
                      minHeight: "44px",
                      height: "44px",
                      fontWeight: 600,
                      fontSize: "16px",
                    }),
                  }}
                />
                <label
                  htmlFor="roleSelect"
                  className="absolute -top-2 text-xs sm:text-sm text-gray-600 font-semibold bg-white px-1"
                >
                  Chọn vai trò của bạn
                </label>
              </div>

              {/* Username Input */}
              <div
                className="relative mb-4 sm:mb-5 fade-in"
                style={{ animationDelay: "0.3s" }}
              >
                <input
                  type="email"
                  id="usernameInput"
                  name="username"
                  aria-required="true"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUsername(value);
                    setEmailError(validateEmail(value));
                  }}
                  autoComplete="username"
                  spellCheck="false"
                  placeholder=" "
                  className="w-full h-11 px-3 sm:px-4 py-2.5 sm:py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-info focus:shadow-focus bg-gray-50 peer autofill:bg-gray-50"
                  style={{ fontSize: "16px" }}
                />
                <label
                  htmlFor="usernameInput"
                  className="absolute top-2.5 sm:top-3 left-3 sm:left-4 text-sm sm:text-base text-gray-600 transition-all duration-200 pointer-events-none bg-gray-50 px-1 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600 peer-[:not(:placeholder-shown)]:font-semibold"
                >
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                {emailError && (
                  <p className="mt-1 text-xs sm:text-sm text-red-500">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div
                className="relative mb-4 sm:mb-5 fade-in"
                style={{ animationDelay: "0.35s" }}
              >
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="passwordInput"
                    name="password"
                    aria-required="true"
                    value={password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPassword(value);
                      setPasswordError(validatePassword(value));
                    }}
                    autoComplete="current-password"
                    spellCheck="false"
                    aria-describedby="passwordToggleDesc"
                    placeholder=" "
                    className="w-full h-11 px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-info focus:shadow-focus bg-white peer autofill:bg-white"
                    style={{ fontSize: "16px" }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 sm:top-2.5 bg-transparent border-none cursor-pointer text-sm sm:text-base text-gray-500 outline-none"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={toggleShowPassword}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
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
                        className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                  <label
                    htmlFor="passwordInput"
                    className="absolute top-2.5 sm:top-3 left-3 sm:left-4 text-sm sm:text-base text-gray-600 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600 peer-[:not(:placeholder-shown)]:font-semibold"
                  >
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                </div>
                {passwordError && (
                  <p className="mt-1 text-xs sm:text-sm text-red-500">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-xs sm:text-sm mb-3 sm:mb-4 text-center">
                  {error}
                </p>
              )}

              {/* Remember Me */}
              <div
                className="w-full mb-3 sm:mb-4 flex justify-start fade-in"
                style={{ animationDelay: "0.35s" }}
              >
                <label className="flex items-center cursor-pointer text-xs sm:text-sm text-gray-500 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2 w-3 h-3 sm:w-4 sm:h-4 accent-primary cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-gray-500">
                    Ghi nhớ đăng nhập
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                aria-label="Đăng nhập"
                className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg cursor-pointer transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed fade-in relative"
                style={{ animationDelay: "0.4s" }}
                disabled={
                  loading ||
                  !!emailError ||
                  !!passwordError ||
                  !username ||
                  !password
                }
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
                {loading && (
                  <span className="inline-block w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px] border-2 border-gray-100 border-t-white border-r-white rounded-full animate-spin ml-3 sm:ml-4 md:ml-5 align-middle"></span>
                )}
              </button>
            </form>

            {/* Additional Links */}
            <nav
              className="flex flex-col sm:flex-row justify-center sm:justify-between gap-3 sm:gap-4 md:gap-6 lg:gap-8 mt-4 sm:mt-6 text-sm sm:text-base text-info w-full px-2 sm:px-5 fade-in"
              aria-label="Additional options"
              style={{ animationDelay: "0.45s" }}
            >
              <button
                type="button"
                className="bg-none border-none cursor-pointer text-xs sm:text-sm md:text-base p-0 m-0 transition-colors duration-200 hover:text-secondary text-center sm:text-left"
                onClick={handleChangePassword}
                onKeyDown={(e) => handleKeyDown(e, handleChangePassword)}
                tabIndex={0}
              >
                Đổi mật khẩu
              </button>
              <button
                type="button"
                className="bg-none border-none cursor-pointer text-xs sm:text-sm md:text-base p-0 m-0 transition-colors duration-200 hover:text-secondary text-center sm:text-left"
                onClick={handleForgotPassword}
                onKeyDown={(e) => handleKeyDown(e, handleForgotPassword)}
                tabIndex={0}
              >
                Quên mật khẩu?
              </button>
            </nav>

            {/* Footer */}
            <p
              className="text-[10px] sm:text-xs text-gray-500 mt-6 sm:mt-8 text-center fade-in px-2"
              aria-live="polite"
              aria-atomic="true"
              style={{ animationDelay: "0.5s" }}
            >
              Copyright © 2025. Phenikaa University. All rights. Developed by
              HieuDoanThe
            </p>
            <address
              className="text-[10px] sm:text-xs mt-1 text-gray-700 text-center not-italic fade-in px-2"
              style={{ animationDelay: "0.55s" }}
            >
              Trường CNTT Phenikaa - Địa chỉ: Tầng 15, Tòa nhà A9, Đại học
              Phenikaa, Nguyễn Trác, Hà Đông, Hà Nội
            </address>

            {/* Social Icons */}
            <div
              className="mt-5 sm:mt-7 flex justify-center gap-5 sm:gap-7 fade-in"
              aria-label="Contact methods"
              style={{ animationDelay: "0.6s" }}
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer fill-gray-700 transition-colors duration-300 hover:fill-secondary select-none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                tabIndex={0}
              >
                <title id="phoneTitle">Phone icon</title>
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.45 12.45 0 00.7 2.81 2 2 0 01-.45 2.11L9.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.45 12.45 0 002.81.7 2 2 0 011.72 2z"></path>
              </svg>
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer fill-gray-700 transition-colors duration-300 hover:fill-secondary select-none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                tabIndex={0}
              >
                <title id="chatTitle">Chat messages icon</title>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
              </svg>
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer fill-gray-700 transition-colors duration-300 hover:fill-secondary select-none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                tabIndex={0}
              >
                <title id="emailTitle">Email envelope icon</title>
                <path d="M22 12V7a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 002 2h16a2 2 0 002-2z"></path>
                <polyline points="22 7 12 13 2 7"></polyline>
              </svg>
            </div>
          </div>
        </section>

        {/* Toasts hiển thị qua ToastContainer (global) */}
      </main>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
  );
};

export default PhenikaaLogin;
