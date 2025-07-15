import React, { useState } from "react";
import axios from "axios";
import "./static/css/login.css";
import Select from "react-select";

const PhenikaaLogin = () => {
  const [role, setRole] = useState("Sinh viên");
  const [username, setUsername] = useState("21012067@st.phenikaa-uni.edu.vn"); //21012067@st.phenikaa-uni.edu.vn
  const [password, setPassword] = useState("123456"); //
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8081/api/auth/login",
        { username, password }
      );
      const { accessToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      setError("");
      alert("Đăng nhập thành công!");
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      addToast("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
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
    { value: "Sinh viên", label: "Sinh viên" },
    { value: "Giảng viên", label: "Giảng viên" },
    { value: "Phòng ban", label: "Phòng ban" },
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
    <main className="container">
      <section className="left-side" aria-label="Introduction and illustration">
        <h2>Hệ thống quản lý đồ án tốt nghiệp</h2>
        <img
          src="./students.svg"
          alt="Illustration of four students standing inside a school hallway near lockers, carrying books and backpacks, having a casual discussion"
          className="students-image"
          onError={handleImageError}
        />
      </section>
      <section className="right-side" aria-label="Login form">
        <div className="login-card fade-in" style={{ animationDelay: "0.05s" }}>
          <div
            className="logo fade-in"
            aria-hidden="true"
            style={{ animationDelay: "0.1s" }}
          >
            <img
              src="./logo.png"
              alt="Phenikaa University logo in blue and orange"
              onError={handleImageError}
            />
          </div>
          <h1
            className="title fade-in"
            id="loginTitle"
            style={{ animationDelay: "0.15s" }}
          >
            Thesis Management System
          </h1>
          <p
            className="info-text fade-in"
            aria-live="polite"
            aria-atomic="true"
            style={{ animationDelay: "0.2s" }}
          >
            (Người dùng sử dụng tài khoản nội bộ để đăng nhập và sử dụng hệ
            thống)
          </p>
          <form
            onSubmit={handleSubmit}
            aria-describedby="formInstructions"
            aria-labelledby="loginTitle"
          >
            <div
              className="input-group fade-in"
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
                style={{
                  top: -8,
                  fontSize: "0.75rem",
                  color: "#2c3e72",
                  fontWeight: 600,
                  background: "#fff",
                  padding: "0 4px",
                }}
              >
                Chọn vai trò của bạn
              </label>
            </div>

            <div
              className="input-group fade-in"
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
              />
              <label htmlFor="usernameInput">Tên đăng nhập *</label>
            </div>

            <div
              className="input-group fade-in"
              style={{ animationDelay: "0.35s" }}
            >
              <div className="password-container">
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
                />
                <button
                  type="button"
                  className="show-password-toggle"
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
                <label htmlFor="passwordInput">Mật khẩu *</label>
              </div>
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <button
              type="submit"
              aria-label="Đăng nhập"
              className="fade-in"
              style={{ animationDelay: "0.4s", position: "relative" }}
              disabled={loading}
            >
              Đăng nhập
              {loading && (
                <span className="spinner" style={{ marginLeft: 20 }}></span>
              )}
            </button>
          </form>
          <nav
            className="links fade-in"
            aria-label="Additional options"
            style={{ animationDelay: "0.45s" }}
          >
            <button
              type="button"
              className="link-button"
              onClick={handleChangePassword}
              onKeyDown={(e) => handleKeyDown(e, handleChangePassword)}
              tabIndex={0}
            >
              Đổi mật khẩu
            </button>
            <button
              type="button"
              className="link-button"
              onClick={handleForgotPassword}
              onKeyDown={(e) => handleKeyDown(e, handleForgotPassword)}
              tabIndex={0}
            >
              Quên mật khẩu?
            </button>
          </nav>
          <p
            className="footer-text fade-in"
            aria-live="polite"
            aria-atomic="true"
            style={{ animationDelay: "0.5s" }}
          >
            Copyright © 2025. Phenikaa University. All rights. Developed by
            HieuDoanThe
          </p>
          <address
            className="footer-address fade-in"
            style={{ animationDelay: "0.55s" }}
          >
            Trường CNTT Phenikaa - Địa chỉ: Tầng 15, Tòa nhà A9, Đại học
            Phenikaa, Nguyễn Trác, Hà Đông, Hà Nội
          </address>
          <div
            className="social-icons fade-in"
            aria-label="Contact methods"
            style={{ animationDelay: "0.6s" }}
          >
            <svg
              className="social-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              tabIndex={0}
            >
              <title id="phoneTitle">Phone icon</title>
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.45 12.45 0 00.7 2.81 2 2 0 01-.45 2.11L9.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.45 12.45 0 002.81.7 2 2 0 011.72 2z"></path>
            </svg>
            <svg
              className="social-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              tabIndex={0}
            >
              <title id="chatTitle">Chat messages icon</title>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
            </svg>
            <svg
              className="social-icon"
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
      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: 32,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column-reverse", 
          gap: 16,
          maxWidth: 550,
        }}
      >
        {toasts
          .slice()
          .reverse()
          .map((toast) => (
            <div
              key={toast.id}
              style={{
                background: "#e53935",
                color: "#fff",
                borderRadius: 8,
                padding: "14px 24px",
                display: "flex",
                alignItems: "center",
                fontWeight: 500,
                fontSize: "1rem",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                minWidth: 320,
                marginTop: 8,
                animation: "fadeInUp 0.3s",
              }}
            >
              <svg
                style={{ marginRight: 12 }}
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#fff"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" fill="#e53935" />
                <line
                  x1="8"
                  y1="8"
                  x2="16"
                  y2="16"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <line
                  x1="16"
                  y1="8"
                  x2="8"
                  y2="16"
                  stroke="#fff"
                  strokeWidth="2"
                />
              </svg>
              {toast.message}
            </div>
          ))}
      </div>
    </main>
  );
};

export default PhenikaaLogin;
