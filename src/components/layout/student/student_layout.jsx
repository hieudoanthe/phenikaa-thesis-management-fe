import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SidebarOfStudent from "./sidebar_of_student";
import { logout, getRefreshToken } from "../../../auth/authUtils";
import "../../../styles/layout/student/student_layout.css";

const StudentLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Hàm lấy tiêu đề dựa trên route hiện tại
  const getPageTitle = () => {
    const path = location.pathname;

    switch (path) {
      case "/student":
      case "/student/home":
        return {
          title: "Trang chủ",
          subtitle: "Chào mừng bạn đến với hệ thống quản lý luận văn",
        };
      case "/student/topic":
        return {
          title: "Đề tài",
          subtitle: "Quản lý và đăng ký đề tài luận văn",
        };
      case "/student/topic-registration":
        return {
          title: "Đăng ký đề tài",
          subtitle: "Đăng ký và chọn đề tài luận văn",
        };
      case "/student/group":
        return {
          title: "Nhóm",
          subtitle: "Quản lý nhóm thực hiện luận văn",
        };
      case "/student/report":
        return {
          title: "Báo cáo",
          subtitle: "Nộp và theo dõi tiến độ báo cáo",
        };
      case "/student/message":
        return {
          title: "Tin nhắn",
          subtitle: "Trao đổi với giảng viên và nhóm",
        };
      case "/student/settings":
        return {
          title: "Cài đặt",
          subtitle: "Cấu hình tài khoản cá nhân",
        };
      default:
        return {
          title: "Trang chủ",
          subtitle: "Chào mừng bạn đến với hệ thống quản lý luận văn",
        };
    }
  };

  const currentPage = getPageTitle();

  // Kiểm tra kích thước màn hình để responsive
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Tự động đóng sidebar trên mobile
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    // Kiểm tra lần đầu
    checkScreenSize();

    // Lắng nghe sự kiện resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [isSidebarOpen]);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle sidebar collapse
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Toggle sidebar (cho mobile)
  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle notification dropdown
  const handleToggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsUserDropdownOpen(false); // Đóng user dropdown nếu đang mở
  };

  // Toggle user dropdown
  const handleToggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsNotificationOpen(false); // Đóng notification dropdown nếu đang mở
  };

  // Đóng sidebar khi click outside (chỉ trên mobile)
  const handleOverlayClick = () => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // Đóng sidebar khi click vào menu item (chỉ trên mobile)
  const handleMenuItemClick = () => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // Hàm xử lý logout
  const handleLogout = async () => {
    try {
      const refreshToken = getRefreshToken();
      await logout(refreshToken);
      navigate("/login"); // Chuyển về trang đăng nhập
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  // Mock data cho notifications
  const notifications = [
    {
      id: 1,
      title: "Phản hồi từ giảng viên",
      message: "Giảng viên đã phản hồi báo cáo tiến độ của bạn",
      time: "1 giờ trước",
      isRead: false,
    },
    {
      id: 2,
      title: "Nhắc nhở nộp báo cáo",
      message: "Hạn nộp báo cáo tiến độ tuần này sắp đến",
      time: "2 ngày trước",
      isRead: false,
    },
    {
      id: 3,
      title: "Cập nhật đề tài",
      message: "Đề tài của bạn đã được cập nhật thông tin mới",
      time: "3 ngày trước",
      isRead: false,
    },
  ];

  return (
    <div className="student-layout">
      {/* Sidebar */}
      <div
        className={`student-sidebar ${isSidebarOpen ? "open" : "closed"} ${
          isCollapsed ? "collapsed" : ""
        }`}
      >
        <SidebarOfStudent
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          onMenuItemClick={handleMenuItemClick}
        />
      </div>

      {/* Overlay cho mobile */}
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={handleOverlayClick} />
      )}

      {/* Main content area */}
      <div className="student-main-content">
        {/* Header */}
        <header className="student-header">
          <div className="header-left">
            <div className="student-page-title-section">
              <h1 className="student-page-title">{currentPage.title}</h1>
              <p className="student-page-subtitle">{currentPage.subtitle}</p>
            </div>
          </div>

          <div className="header-right">
            {/* Notification Dropdown */}
            <div className="header-notifications" ref={notificationRef}>
              <div
                className="notification-icon"
                onClick={handleToggleNotification}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                <span className="notification-badge">3</span>
              </div>

              {/* Notification Dropdown Menu */}
              {isNotificationOpen && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h3>Thông báo</h3>
                    <button className="mark-all-read">
                      Đánh dấu tất cả đã đọc
                    </button>
                  </div>
                  <div className="notification-list">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`notification-item ${
                          !notification.isRead ? "unread" : ""
                        }`}
                      >
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="notification-time">
                            {notification.time}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <div className="unread-dot"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="dropdown-footer">
                    <button className="view-all">Xem tất cả thông báo</button>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="header-user" ref={userDropdownRef}>
              <div
                className="user-info-container"
                onClick={handleToggleUserDropdown}
              >
                <div className="user-avatar">
                  <span>SV</span>
                </div>
                <div className="user-info">
                  <div className="user-name">Nguyễn Văn Sinh Viên</div>
                  <div className="user-role">Sinh viên</div>
                </div>
                <div className="user-dropdown">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </div>
              </div>

              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      <span>SV</span>
                    </div>
                    <div className="dropdown-user-details">
                      <h4>Nguyễn Văn Sinh Viên</h4>
                      <p>Sinh viên</p>
                      <span>sinhvien@phenikaa.edu.vn</span>
                    </div>
                  </div>
                  <div className="dropdown-menu-items">
                    <button className="dropdown-item">
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
                    <button className="dropdown-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      Trợ giúp
                    </button>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
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
        </header>

        {/* Main content */}
        <main className="student-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
