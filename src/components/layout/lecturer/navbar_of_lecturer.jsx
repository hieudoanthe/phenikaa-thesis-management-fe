import React, { useState } from "react";
import "../../../styles/layout/lecturer/navbar_of_lecturer.css";

// Icons cho navbar
const HamburgerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
);

const NotificationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 10l5 5 5-5z" />
  </svg>
);

const NavbarOfLecturer = ({ onToggleSidebar, unreadNotifications = 3 }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);

  // Mock user data - có thể lấy từ context hoặc props
  const userProfile = {
    name: "Dr. Sarah Wilson",
    title: "Senior Lecturer",
    avatar: "/api/avatars/sarah-wilson.jpg", // Fallback sẽ được xử lý trong CSS
    email: "sarah.wilson@university.edu",
  };

  const handleProfileToggle = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    setIsNotificationDropdownOpen(false); // Đóng notification dropdown
  };

  const handleNotificationToggle = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    setIsProfileDropdownOpen(false); // Đóng profile dropdown
  };

  const handleLogout = () => {
    // Xử lý logout logic
    console.log("Đăng xuất...");
    setIsProfileDropdownOpen(false);
  };

  const handleProfileSettings = () => {
    // Xử lý profile settings
    console.log("Mở cài đặt profile...");
    setIsProfileDropdownOpen(false);
  };

  return (
    <nav className="lecturer-navbar">
      {/* Left section - Hamburger menu */}
      <div className="navbar-left">
        <button
          className="hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar menu"
        >
          <HamburgerIcon />
        </button>
      </div>

      {/* Center section - Empty space */}
      <div className="navbar-center">
        {/* Có thể thêm breadcrumb hoặc page title ở đây */}
      </div>

      {/* Right section - Notifications and Profile */}
      <div className="navbar-right">
        {/* Notification Bell */}
        <div className="notification-container">
          <button
            className="notification-btn"
            onClick={handleNotificationToggle}
            aria-label="Notifications"
          >
            <NotificationIcon />
            {unreadNotifications > 0 && (
              <span className="notification-badge">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationDropdownOpen && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h3>Thông báo</h3>
                <button className="mark-all-read">Đánh dấu đã đọc</button>
              </div>
              <div className="notification-list">
                <div className="notification-item unread">
                  <div className="notification-content">
                    <p>Sinh viên Nguyễn Văn A đã nộp báo cáo tiến độ</p>
                    <span className="notification-time">2 giờ trước</span>
                  </div>
                </div>
                <div className="notification-item unread">
                  <div className="notification-content">
                    <p>Lịch bảo vệ luận văn đã được cập nhật</p>
                    <span className="notification-time">5 giờ trước</span>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-content">
                    <p>Nhắc nhở: Họp khoa vào ngày mai</p>
                    <span className="notification-time">1 ngày trước</span>
                  </div>
                </div>
              </div>
              <div className="dropdown-footer">
                <button className="view-all-notifications">
                  Xem tất cả thông báo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="profile-container">
          <button
            className="profile-btn"
            onClick={handleProfileToggle}
            aria-label="User profile menu"
          >
            <div className="profile-avatar">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="avatar-fallback">
                {userProfile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            </div>
            <div className="profile-info">
              <span className="profile-name">{userProfile.name}</span>
              <span className="profile-title">{userProfile.title}</span>
            </div>
            <ChevronDownIcon />
          </button>

          {/* Profile Dropdown */}
          {isProfileDropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="profile-summary">
                  <div className="profile-avatar-small">
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <div className="avatar-fallback-small">
                      {userProfile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  </div>
                  <div className="profile-details">
                    <span className="profile-name-small">
                      {userProfile.name}
                    </span>
                    <span className="profile-email">{userProfile.email}</span>
                  </div>
                </div>
              </div>
              <div className="dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={handleProfileSettings}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  Hồ sơ cá nhân
                </button>
                <button className="dropdown-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                  </svg>
                  Cài đặt
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay để đóng dropdown khi click outside */}
      {(isProfileDropdownOpen || isNotificationDropdownOpen) && (
        <div
          className="dropdown-overlay"
          onClick={() => {
            setIsProfileDropdownOpen(false);
            setIsNotificationDropdownOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default NavbarOfLecturer;
