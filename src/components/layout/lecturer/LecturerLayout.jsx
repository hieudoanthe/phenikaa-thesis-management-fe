import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SidebarOfLecturer from "./SidebarOfLecturer.jsx";
import { logout, getRefreshToken } from "../../../auth/authUtils";

const LecturerLayout = () => {
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
      case "/lecturer":
      case "/lecturer/home":
        return {
          title: "Trang chủ",
          subtitle: "Chào mừng bạn đến với hệ thống quản lý luận văn",
        };
      case "/lecturer/dashboard":
        return {
          title: "Dashboard",
          subtitle: "Chào mừng bạn đến với hệ thống quản lý luận văn",
        };
      case "/lecturer/thesis":
        return {
          title: "Quản lý Luận văn",
          subtitle: "Quản lý và tạo mới các đề tài luận văn",
        };
      case "/lecturer/students":
        return {
          title: "Quản lý Sinh viên",
          subtitle: "Theo dõi và quản lý sinh viên thực hiện luận văn",
        };
      case "/lecturer/reports":
        return {
          title: "Báo cáo & Thống kê",
          subtitle: "Xem báo cáo tiến độ và thống kê luận văn",
        };
      case "/lecturer/schedule":
        return {
          title: "Lịch trình",
          subtitle: "Quản lý lịch bảo vệ và họp hội đồng",
        };
      case "/lecturer/settings":
        return {
          title: "Cài đặt",
          subtitle: "Cấu hình tài khoản và hệ thống",
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
      console.log("📱 Screen size check:", {
        width: window.innerWidth,
        mobile,
        wasMobile: isMobile,
      });

      // Chỉ tự động đóng sidebar khi chuyển từ desktop sang mobile
      // Không tự động đóng khi đang ở mobile
      if (mobile && !isMobile && isSidebarOpen) {
        console.log("🔄 Auto-closing sidebar when switching to mobile");
        setIsSidebarOpen(false);
      }

      setIsMobile(mobile);
    };

    // Kiểm tra lần đầu
    checkScreenSize();

    // Lắng nghe sự kiện resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [isSidebarOpen, isMobile]);

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
    console.log("🍔 Hamburger clicked, current state:", isSidebarOpen);
    setIsSidebarOpen(!isSidebarOpen);
    console.log("🍔 New sidebar state:", !isSidebarOpen);
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
    console.log("🖱️ Overlay clicked, closing sidebar");
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // Đóng sidebar khi click vào menu item (chỉ trên mobile)
  const handleMenuItemClick = () => {
    console.log("📱 Menu item clicked, closing sidebar on mobile");
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
      title: "Báo cáo tiến độ mới",
      message: "Sinh viên Nguyễn Văn A đã nộp báo cáo tiến độ",
      time: "2 giờ trước",
      isRead: false,
    },
    {
      id: 2,
      title: "Lịch bảo vệ cập nhật",
      message: "Lịch bảo vệ luận văn đã được cập nhật",
      time: "5 giờ trước",
      isRead: false,
    },
    {
      id: 3,
      title: "Nhắc nhở chấm điểm",
      message: "Bạn có 3 bài báo cáo cần chấm điểm",
      time: "1 ngày trước",
      isRead: false,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed h-screen z-50 transition-all duration-500 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        } ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <SidebarOfLecturer
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          onMenuItemClick={handleMenuItemClick}
        />
      </div>

      {/* Overlay cho mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ease-in-out ${
          isCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              {/* Hamburger Menu Button - Chỉ hiện trên mobile */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 mr-4 text-gray-600"
                onClick={handleToggleSidebar}
                aria-label="Mở/đóng menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold text-gray-900 m-0 leading-tight">
                  {currentPage.title}
                </h1>
                <p className="text-sm text-gray-600 m-0 leading-relaxed mt-1">
                  {currentPage.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Notification Dropdown */}
              <div className="relative" ref={notificationRef}>
                <div
                  className="relative cursor-pointer p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
                  onClick={handleToggleNotification}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-gray-600"
                  >
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    3
                  </span>
                </div>

                {/* Notification Dropdown Menu */}
                {isNotificationOpen && (
                  <div className="absolute top-full right-0 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 mt-2 animate-fade-in-up">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-base font-semibold text-gray-900 m-0">
                        Thông báo
                      </h3>
                      <button className="text-info text-sm cursor-pointer px-2 py-1 rounded transition-colors duration-200 hover:bg-gray-100">
                        Đánh dấu tất cả đã đọc
                      </button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 flex items-start gap-3 transition-colors duration-200 hover:bg-gray-50 ${
                            !notification.isRead ? "bg-yellow-50" : ""
                          }`}
                        >
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 m-0 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 m-0 mb-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <span className="text-xs text-gray-500">
                              {notification.time}
                            </span>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-info rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-100 text-center">
                      <button className="text-info text-sm cursor-pointer px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100">
                        Xem tất cả thông báo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                <div
                  className="flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
                  onClick={handleToggleUserDropdown}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-info to-info-dark rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    DSW
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      Dr. Hieu Doan The
                    </div>
                    <div className="text-xs text-gray-600 leading-tight">
                      Senior Lecturer
                    </div>
                  </div>
                  <div className="text-gray-600 transition-transform duration-200">
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
                  <div className="absolute top-full right-0 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 mt-2 animate-fade-in-up">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-info to-info-dark rounded-full flex items-center justify-center text-white font-semibold text-base">
                        DSW
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 m-0 mb-1">
                          Dr. Hieu Doan The
                        </h4>
                        <p className="text-sm text-gray-600 m-0 mb-1">
                          Senior Lecturer
                        </p>
                        <span className="text-xs text-gray-500">
                          hieu.doan@phenikaa.edu.vn
                        </span>
                      </div>
                    </div>
                    <div className="py-2">
                      <button className="w-full flex items-center gap-3 px-4 py-3 bg-none border-none text-gray-700 text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-left">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-gray-600"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        Hồ sơ cá nhân
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-3 bg-none border-none text-gray-700 text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-left">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-gray-600"
                        >
                          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                        </svg>
                        Cài đặt
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-3 bg-none border-none text-gray-700 text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-left">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-gray-600"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        Trợ giúp
                      </button>
                      <div className="h-px bg-gray-200 my-2"></div>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 bg-none border-none text-error text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-left"
                        onClick={handleLogout}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-error"
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
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 bg-gray-50 text-secondary">
          <div className="px-6 py-6 min-h-[calc(100vh-80px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LecturerLayout;
