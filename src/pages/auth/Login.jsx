import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuthHook from "../../hooks/useAuth";
import Select from "react-select";

const PhenikaaLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuthHook();
  const [role, setRole] = useState("USER");
  const [username, setUsername] = useState("21012067@st.phenikaa-uni.edu.vn");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [rememberMe, setRememberMe] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  // Helper function để chuyển đổi role thành tên hiển thị
  const getRoleDisplayName = (role) => {
    switch (role) {
      case "USER":
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
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        { username, password, role }
      );

      console.log("Response từ server:", response.data);
      console.log("Response có refreshToken:", !!response.data.refreshToken);
      console.log("RefreshToken value:", response.data.refreshToken);

      // Xử lý linh hoạt response data từ server
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

      console.log("Dữ liệu được extract:", { accessToken, refreshToken, user });

      console.log("Đăng nhập thành công:", { accessToken, user, role });

      const loginResult = await login(
        accessToken,
        user,
        refreshToken,
        rememberMe
      );
      console.log("Kết quả login:", loginResult);

      addToast("Đăng nhập thành công!");

      // Chuyển hướng dựa trên role từ user data (ưu tiên) hoặc role từ form
      const userRole = user?.role || role;
      console.log(
        "Bắt đầu chuyển hướng với user role:",
        userRole,
        "form role:",
        role
      );

      // Thêm delay 1.5 giây trước khi chuyển hướng
      setTimeout(() => {
        if (userRole === "ADMIN") {
          console.log("Chuyển hướng đến /admin/dashboard");
          navigate("/admin/dashboard");
        } else if (userRole === "TEACHER") {
          console.log("Chuyển hướng đến /lecturer/home");
          navigate("/lecturer/home");
        } else if (userRole === "USER") {
          console.log("Chuyển hướng đến /student/home");
          navigate("/student/home");
        } else {
          console.log("Chuyển hướng đến /home (default)");
          navigate("/home");
        }
      }, 1500);
    } catch (err) {
      let errorMessage = "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";

      // Debug: Log thông tin lỗi để kiểm tra
      console.log("Error response:", err.response);
      console.log("Error data:", err.response?.data);
      console.log("Error message:", err.response?.data?.message);
      console.log("Error status:", err.response?.status);

      // Lấy message từ server (có thể là string hoặc object)
      const serverMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.response?.data?.error;

      console.log("Server message:", serverMessage);

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
          // Nếu không khớp với các pattern trên, hiển thị message gốc từ server
          errorMessage = serverMessage;
        }
      } else if (err.response?.status) {
        // Chỉ xử lý theo HTTP status code khi không có message cụ thể từ server
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

      addToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearOldToasts = () => {
    setToasts((prev) => prev.filter((t) => Date.now() - t.id < 3500));
  };

  React.useEffect(() => {
    const timer = setTimeout(clearOldToasts, 3500);
    return () => clearTimeout(timer);
  }, [toasts]);

  const roleOptions = [
    { value: "USER", label: "Sinh viên" },
    { value: "TEACHER", label: "Giảng viên" },
    { value: "ADMIN", label: "Phòng ban" },
  ];

  const getOptionBgColor = (state) => {
    if (state.isSelected) return "#1e3286";
    if (state.isFocused) return "#e6eaf6";
    return "#fff";
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      const newToasts = [...prev, { id, message }];
      return newToasts.length > 3 ? newToasts.slice(1) : newToasts;
    });
    setTimeout(() => removeToast(id), 3500);
  };

  const handleImageError = (e) => {
    e.currentTarget.style.display = "none";
  };

  const handleChangePassword = () => {
    alert("Chức năng Đổi mật khẩu chưa được lập trình.");
  };

  const handleForgotPassword = () => {
    alert("Chức năng Quên mật khẩu chưa được lập trình.");
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
      fontSize: "1rem",
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
    <main className="flex h-screen w-screen overflow-hidden">
      {/* Left Side - Introduction */}
      <section
        className="flex-1 bg-secondary text-white flex flex-col justify-center items-center text-center px-0 min-w-[380px] relative"
        aria-label="Introduction and illustration"
      >
        <h2 className="m-0 font-bold text-4xl leading-12 tracking-wide max-w-none mb-12 outline-none">
          Hệ thống quản lý đồ án tốt nghiệp
        </h2>
        <img
          src="./students.svg"
          alt="Illustration of four students standing inside a school hallway near lockers, carrying books and backpacks, having a casual discussion"
          className="w-full max-w-[520px] h-auto outline-none pointer-events-none"
          onError={handleImageError}
        />
      </section>

      {/* Right Side - Login Form */}
      <section
        className="flex-1 bg-gray-50 flex justify-center items-center p-16 px-6 min-w-[380px]"
        aria-label="Login form"
      >
        <div
          className="bg-white rounded-2xl shadow-card w-full max-w-[450px] p-10 px-8 pb-12 flex flex-col items-center fade-in"
          style={{ animationDelay: "0.05s" }}
        >
          {/* Logo */}
          <div className="mb-6 fade-in" style={{ animationDelay: "0.1s" }}>
            <img
              src="./logo.png"
              alt="Phenikaa University logo in blue and orange"
              className="w-[200px] h-auto pointer-events-none outline-none"
              onError={handleImageError}
            />
          </div>

          {/* Title */}
          <h1
            className="font-bold text-lg mb-1 outline-none text-gray-900 fade-in"
            id="loginTitle"
            style={{ animationDelay: "0.15s" }}
          >
            Thesis Management System
          </h1>

          {/* Info Text */}
          <p
            className="text-sm text-error italic text-center mb-6 outline-none fade-in"
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
              className="relative mb-5 fade-in"
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
                styles={selectStyles}
              />
              <label
                htmlFor="roleSelect"
                className="absolute -top-2 text-xs text-secondary font-semibold bg-white px-1"
              >
                Chọn vai trò của bạn
              </label>
            </div>

            {/* Username Input */}
            <div
              className="relative mb-5 fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <input
                type="email"
                id="usernameInput"
                name="username"
                aria-required="true"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                spellCheck="false"
                placeholder=" "
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-info focus:shadow-focus bg-white peer"
              />
              <label
                htmlFor="usernameInput"
                className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-secondary peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-secondary peer-[:not(:placeholder-shown)]:font-semibold"
              >
                Tên đăng nhập *
              </label>
            </div>

            {/* Password Input */}
            <div
              className="relative mb-5 fade-in"
              style={{ animationDelay: "0.35s" }}
            >
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  id="passwordInput"
                  name="password"
                  aria-required="true"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  spellCheck="false"
                  aria-describedby="passwordToggleDesc"
                  placeholder=" "
                  className="w-full px-4 py-3 pr-12 text-base border-2 border-gray-300 rounded-lg outline-none transition-all duration-200 focus:border-info focus:shadow-focus bg-white peer"
                />
                <button
                  type="button"
                  className="absolute right-2 top-2.5 bg-transparent border-none cursor-pointer text-base text-gray-500 outline-none"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={toggleShowPassword}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
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
                      width="20"
                      height="20"
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
                  className="absolute top-3 left-4 text-base text-gray-500 transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-info peer-focus:font-semibold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-info peer-[:not(:placeholder-shown)]:font-semibold"
                >
                  Mật khẩu *
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Remember Me */}
            <div
              className="w-full mb-4 flex justify-start fade-in"
              style={{ animationDelay: "0.35s" }}
            >
              <label className="flex items-center cursor-pointer text-sm text-gray-500 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-sm text-gray-500">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              aria-label="Đăng nhập"
              className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-3 rounded-lg cursor-pointer transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed fade-in relative"
              style={{ animationDelay: "0.4s" }}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
              {loading && (
                <span className="inline-block w-[18px] h-[18px] border-2 border-gray-100 border-t-white border-r-white rounded-full animate-spin ml-5 align-middle"></span>
              )}
            </button>
          </form>

          {/* Additional Links */}
          <nav
            className="flex justify-between gap-8 mt-6 text-base text-info w-full px-5 fade-in"
            aria-label="Additional options"
            style={{ animationDelay: "0.45s" }}
          >
            <button
              type="button"
              className="bg-none border-none cursor-pointer text-base p-0 m-0 transition-colors duration-200 hover:text-secondary"
              onClick={handleChangePassword}
              onKeyDown={(e) => handleKeyDown(e, handleChangePassword)}
              tabIndex={0}
            >
              Đổi mật khẩu
            </button>
            <button
              type="button"
              className="bg-none border-none cursor-pointer text-base p-0 m-0 transition-colors duration-200 hover:text-secondary"
              onClick={handleForgotPassword}
              onKeyDown={(e) => handleKeyDown(e, handleForgotPassword)}
              tabIndex={0}
            >
              Quên mật khẩu?
            </button>
          </nav>

          {/* Footer */}
          <p
            className="text-xs text-gray-500 mt-8 text-center fade-in"
            aria-live="polite"
            aria-atomic="true"
            style={{ animationDelay: "0.5s" }}
          >
            Copyright © 2025. Phenikaa University. All rights. Developed by
            HieuDoanThe
          </p>
          <address
            className="text-xs mt-1 text-gray-700 text-center not-italic fade-in"
            style={{ animationDelay: "0.55s" }}
          >
            Trường CNTT Phenikaa - Địa chỉ: Tầng 15, Tòa nhà A9, Đại học
            Phenikaa, Nguyễn Trác, Hà Đông, Hà Nội
          </address>

          {/* Social Icons */}
          <div
            className="mt-7 flex justify-center gap-7 fade-in"
            aria-label="Contact methods"
            style={{ animationDelay: "0.6s" }}
          >
            <svg
              className="w-6 h-6 cursor-pointer fill-gray-700 transition-colors duration-300 hover:fill-secondary select-none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              tabIndex={0}
            >
              <title id="phoneTitle">Phone icon</title>
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.45 12.45 0 00.7 2.81 2 2 0 01-.45 2.11L9.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.45 12.45 0 002.81.7 2 2 0 011.72 2z"></path>
            </svg>
            <svg
              className="w-6 h-6 cursor-pointer fill-gray-700 transition-colors duration-300 hover:fill-secondary select-none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              tabIndex={0}
            >
              <title id="chatTitle">Chat messages icon</title>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
            </svg>
            <svg
              className="w-6 h-6 cursor-pointer fill-gray-700 transition-colors duration-300 hover:fill-secondary select-none"
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

      {/* Toast Notifications */}
      <div className="fixed right-5 bottom-8 z-[9999] flex flex-col-reverse gap-4 max-w-[550px]">
        {toasts
          .slice()
          .reverse()
          .map((toast) => (
            <div
              key={toast.id}
              className={`rounded-lg p-4 px-6 flex items-center font-medium text-base shadow-toast min-w-80 mt-2 animate-fade-in-up ${
                toast.message.includes("thành công")
                  ? "bg-success-500 text-white"
                  : "bg-error-500 text-white"
              }`}
            >
              {toast.message.includes("thành công") ? (
                <svg
                  className="mr-3"
                  width="22"
                  height="22"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22,4 12,14.01 9,11.01" />
                </svg>
              ) : (
                <svg
                  className="mr-3"
                  width="22"
                  height="22"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="white"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" fill="#e53935" />
                  <line
                    x1="8"
                    y1="8"
                    x2="16"
                    y2="16"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <line
                    x1="16"
                    y1="8"
                    x2="8"
                    y2="16"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
              )}
              {toast.message}
            </div>
          ))}
      </div>
    </main>
  );
};

export default PhenikaaLogin;
