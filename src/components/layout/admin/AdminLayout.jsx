import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SidebarOfAdmin from "./SidebarOfAdmin.jsx";
import AdminHeader from "./AdminHeader.jsx";
import AdminFooter from "./AdminFooter.jsx";
import BackToTopButton from "../../common/BackToTopButton.jsx";
import { logout, getRefreshToken } from "../../../auth/authUtils";
import { useNotifications } from "../../../contexts/NotificationContext";
import { WS_ENDPOINTS } from "../../../config/api";

const AdminLayout = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const {
    notifications,
    loadNotifications,
    markAllAsRead,
    markAsRead,
    addNotification,
  } = useNotifications();

  const location = useLocation();
  const navigate = useNavigate();

  // WebSocket refs/state
  const wsRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const connectTimeRef = useRef(0);
  const bufferedCountRef = useRef(0);
  const bufferToastTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

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
  const handleToggleNotification = async () => {
    const next = !isNotificationOpen;
    setIsNotificationOpen(next);
    setIsUserDropdownOpen(false); // Đóng user dropdown nếu đang mở
    if (next) {
      // refresh list when opening
      try {
        await loadNotifications(1, {}, { summarize: false });
      } catch (_) {}
    }
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

  // Load notifications lần đầu
  useEffect(() => {
    loadNotifications(1, {}, { summarize: true });
  }, []);

  // --- WebSocket helpers (the same behavior as student/lecturer) ---
  const normalizeWsBaseUrl = (base) => {
    try {
      const url = new URL(base, window.location.origin);
      const isHttps = window.location.protocol === "https:";
      url.protocol = isHttps ? "wss:" : "ws:";
      return url.toString().replace(/\/$/, "");
    } catch (_) {
      if (typeof base === "string") {
        const scheme =
          window.location.protocol === "https:" ? "wss://" : "ws://";
        return base.replace(/^ws(s)?:\/\//, scheme).replace(/\/$/, "");
      }
      return base;
    }
  };

  const buildNotificationsWsUrl = (receiverId) => {
    const base = normalizeWsBaseUrl(WS_ENDPOINTS.NOTIFICATIONS);
    return `${base}?receiverId=${encodeURIComponent(receiverId)}`;
  };

  const clearHeartbeatTimer = () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  };

  const startHeartbeat = () => {
    clearHeartbeatTimer();
    heartbeatTimerRef.current = setInterval(() => {
      try {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      } catch (_) {}
    }, 25000);
  };

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const scheduleReconnect = () => {
    const attempt = reconnectAttemptsRef.current + 1;
    reconnectAttemptsRef.current = attempt;
    const delay = Math.min(8000, 1000 * Math.pow(2, attempt));
    clearReconnectTimer();
    reconnectTimerRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
  };

  const handleIncomingMessage = (evt) => {
    try {
      const raw = evt?.data;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw || {};

      const handleOne = (dataObj) => {
        if (!dataObj || typeof dataObj !== "object") return;

        const notifId =
          dataObj.id ||
          `${dataObj.senderId || ""}-${dataObj.createdAt || Date.now()}`;

        const messageText =
          dataObj.message ||
          dataObj.content ||
          dataObj.text ||
          "Bạn có thông báo mới";

        const createdAtMs =
          typeof dataObj.createdAt === "number"
            ? dataObj.createdAt
            : Date.now();

        const newNotification = {
          id: notifId,
          title: "Thông báo",
          message: messageText,
          time: new Date(createdAtMs).toLocaleString(),
          createdAt: createdAtMs,
          isRead: dataObj.read === true ? true : false,
        };

        // Đẩy vào context để UI cập nhật + toast theo quy tắc đã định
        addNotification(newNotification);

        // Buffer tổng hợp trong giai đoạn đầu (tuỳ chọn): nếu cần giống sinh viên
        const inInitialBuffer = Date.now() - connectTimeRef.current <= 800;
        if (inInitialBuffer && !newNotification.isRead) {
          bufferedCountRef.current += 1;
          if (bufferToastTimerRef.current) {
            clearTimeout(bufferToastTimerRef.current);
          }
          bufferToastTimerRef.current = setTimeout(() => {
            bufferedCountRef.current = 0;
            bufferToastTimerRef.current = null;
          }, 1000);
        }
      };

      if (Array.isArray(parsed)) {
        parsed.forEach((item) => handleOne(item));
      } else {
        handleOne(parsed);
      }
    } catch (_) {}
  };

  const connectWebSocket = () => {
    try {
      const receiverId = 1; // Admin ID cố định
      if (!receiverId) return;

      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        try {
          wsRef.current.close();
        } catch (_) {}
      }

      const url = buildNotificationsWsUrl(receiverId);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        clearReconnectTimer();
        connectTimeRef.current = Date.now();
        bufferedCountRef.current = 0;
        if (bufferToastTimerRef.current) {
          clearTimeout(bufferToastTimerRef.current);
          bufferToastTimerRef.current = null;
        }
        startHeartbeat();
      };

      ws.onmessage = (evt) => {
        handleIncomingMessage(evt);
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        scheduleReconnect();
        connectTimeRef.current = 0;
        clearHeartbeatTimer();
        if (bufferToastTimerRef.current) {
          clearTimeout(bufferToastTimerRef.current);
          bufferToastTimerRef.current = null;
        }
      };
    } catch (_) {
      scheduleReconnect();
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      try {
        if (wsRef.current) {
          wsRef.current.onopen = null;
          wsRef.current.onmessage = null;
          wsRef.current.onerror = null;
          wsRef.current.onclose = null;
          wsRef.current.close();
        }
        if (bufferToastTimerRef.current) {
          clearTimeout(bufferToastTimerRef.current);
          bufferToastTimerRef.current = null;
        }
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }
        clearReconnectTimer();
      } catch (_) {}
    };
  }, []);

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
          onRefreshNotifications={() => loadNotifications(1)}
          onMarkAllAsRead={() => markAllAsRead(1)}
          onMarkAsRead={markAsRead}
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
