import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SidebarOfAdmin from "./SidebarOfAdmin.jsx";
import AdminHeader from "./AdminHeader.jsx";
import AdminFooter from "./AdminFooter.jsx";
import BackToTopButton from "../../common/BackToTopButton.jsx";
import { logout, getRefreshToken } from "../../../auth/authUtils";

const AdminLayout = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Hàm lấy tiêu đề dựa trên route hiện tại
  const getPageTitle = () => {
    const path = location.pathname;

    switch (path) {
      case "/admin":
      case "/admin/dashboard":
        return {
          title: t("admin.pages.dashboard.title"),
          subtitle: t("admin.pages.dashboard.subtitle"),
        };
      case "/admin/user-management":
        return {
          title: t("admin.pages.userManagement.title"),
          subtitle: t("admin.pages.userManagement.subtitle"),
        };

      case "/admin/assignments":
        return {
          title: t("admin.pages.assignments.title"),
          subtitle: t("admin.pages.assignments.subtitle"),
        };
      case "/admin/academic-year":
        return {
          title: t("admin.pages.academicYear.title"),
          subtitle: t("admin.pages.academicYear.subtitle"),
        };
      case "/admin/registration-period":
        return {
          title: t("admin.pages.registrationPeriod.title"),
          subtitle: t("admin.pages.registrationPeriod.subtitle"),
        };
      case "/admin/student-period":
        return {
          title: t("admin.pages.studentPeriod.title"),
          subtitle: t("admin.pages.studentPeriod.subtitle"),
        };
      case "/admin/defense-schedule":
        return {
          title: t("admin.pages.defenseSchedule.title"),
          subtitle: t("admin.pages.defenseSchedule.subtitle"),
        };
      case "/admin/defense-sessions":
        return {
          title: t("admin.pages.defenseSessions.title"),
          subtitle: t("admin.pages.defenseSessions.subtitle"),
        };
      case "/admin/statistics":
        return {
          title: t("admin.pages.statistics.title"),
          subtitle: t("admin.pages.statistics.subtitle"),
        };
      case "/admin/notifications":
        return {
          title: t("admin.pages.notifications.title"),
          subtitle: t("admin.pages.notifications.subtitle"),
        };
      case "/admin/settings":
        return {
          title: t("admin.pages.settings.title"),
          subtitle: t("admin.pages.settings.subtitle"),
        };
      default:
        return {
          title: t("admin.pages.dashboard.title"),
          subtitle: t("admin.pages.dashboard.subtitle"),
        };
    }
  };

  const currentPage = getPageTitle();

  // Kiểm tra kích thước màn hình để responsive
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;

      // Không tự động đóng khi đang ở mobile
      if (mobile && !isMobile && isSidebarOpen) {
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
      console.error(t("common.errorLogout"), error);
    }
  };

  // Mock data cho notifications
  const notifications = [
    {
      id: 1,
      title: t("admin.notifications.newTeacher"),
      message: t("admin.notifications.newTeacherMessage"),
      time: t("admin.notifications.twoHoursAgo"),
      isRead: false,
    },
    {
      id: 2,
      title: t("admin.notifications.topicsNeedApproval"),
      message: t("admin.notifications.topicsNeedApprovalMessage"),
      time: t("admin.notifications.fiveHoursAgo"),
      isRead: false,
    },
    {
      id: 3,
      title: t("admin.notifications.systemReport"),
      message: t("admin.notifications.systemReportMessage"),
      time: t("admin.notifications.oneDayAgo"),
      isRead: false,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed h-screen z-50 transition-all duration-500 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        } ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <SidebarOfAdmin
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
        className={`flex-1 flex flex-col h-screen transition-all duration-500 ease-in-out ${
          isCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        {/* Header */}
        <AdminHeader
          currentPage={currentPage}
          isNotificationOpen={isNotificationOpen}
          isUserDropdownOpen={isUserDropdownOpen}
          notifications={notifications}
          onToggleSidebar={handleToggleSidebar}
          onToggleNotification={handleToggleNotification}
          onToggleUserDropdown={handleToggleUserDropdown}
          onLogout={handleLogout}
        />

        {/* Main content */}
        <main className="flex-1 bg-gray-50 text-secondary overflow-y-auto pb-18 custom-scrollbar">
          <div
            className={`${
              location.pathname === "/admin/user-management"
                ? "px-6 py-6"
                : "px-6 py-0"
            }`}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Fixed Footer */}
      <div
        className={`fixed bottom-0 right-0 z-40 transition-all duration-500 ease-in-out ${
          isCollapsed ? "md:left-16" : "md:left-64"
        } left-0`}
      >
        <AdminFooter />
      </div>

      {/* Back to Top Button */}
      <BackToTopButton />
    </div>
  );
};

export default AdminLayout;
