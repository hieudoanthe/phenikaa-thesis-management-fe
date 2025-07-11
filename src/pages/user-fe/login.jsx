import React, { useState } from "react";
import "./static/css/login.css";
const PhenikaaLogin = () => {
  const [role, setRole] = useState("Sinh viên");
  const [username, setUsername] = useState("21012067@st.phenikaa-uni.edu.vn");
  const [password, setPassword] = useState("**********");
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <main className="container">
      <section className="left-side" aria-label="Introduction and illustration">
        <h2>Phenikaa Thesis Management System</h2>
        <img
          src="./students.svg"
          alt="Illustration of four students standing inside a school hallway near lockers, carrying books and backpacks, having a casual discussion"
          className="students-image"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
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
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
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
            onSubmit={(e) => e.preventDefault()}
            aria-describedby="formInstructions"
            aria-labelledby="loginTitle"
          >
            <div
              className="input-group fade-in"
              style={{ animationDelay: "0.25s" }}
            >
              <select
                id="roleSelect"
                name="roleSelect"
                aria-required="true"
                aria-describedby="formInstructions"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Sinh viên">Sinh viên</option>
                <option value="Giảng viên">Giảng viên</option>
                <option value="Nhân viên">Nhân viên</option>
              </select>
              <label htmlFor="roleSelect">Chọn vai trò của bạn</label>
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

            <button
              type="submit"
              aria-label="Đăng nhập"
              className="fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              Đăng nhập
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
              onClick={() =>
                alert("Chức năng Đổi mật khẩu chưa được lập trình.")
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                alert("Chức năng Đổi mật khẩu chưa được lập trình.")
              }
              tabIndex={0}
            >
              Đổi mật khẩu
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() =>
                alert("Chức năng Quên mật khẩu chưa được lập trình.")
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                alert("Chức năng Quên mật khẩu chưa được lập trình.")
              }
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
            Copyright © 2025. Phenikaa University. All rights. Developed by PHX
            Smart School
          </p>
          <address
            className="footer-address fade-in"
            style={{ animationDelay: "0.55s" }}
          >
            Phòng Công tác sinh viên - Địa chỉ: Tầng 3, Tòa nhà A9, Trường Đại
            học Phenikaa, Nguyễn Trác, Hà Đông, Hà Nội
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
    </main>
  );
};

export default PhenikaaLogin;
