import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SidebarOfStudent from "./SidebarOfStudent.jsx";
import {
  logout,
  getRefreshToken,
  getUserIdFromToken,
} from "../../../auth/authUtils";
import { useProfileStudent } from "../../../contexts/ProfileStudentContext";
import { WS_ENDPOINTS } from "../../../config/api";
import notificationService from "../../../services/notification.service";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StudentLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);

  // Sử dụng ProfileStudentContext
  const { profileData, fetchProfileData } = useProfileStudent();

  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const seenNotificationIdsRef = useRef(new Set());
  const connectTimeRef = useRef(0);
  const bufferInitialMsRef = useRef(300);
  const bufferedCountRef = useRef(0);
  const summaryShownRef = useRef(false);
  const bufferToastTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [timeTick, setTimeTick] = useState(0);

  // Sử dụng hàm getUserIdFromToken từ authUtils
  // const getUserIdFromToken = () => { ... } - Đã xóa, sử dụng từ authUtils

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
      case "/student/profile":
        return {
          title: "Hồ sơ cá nhân",
          subtitle: "Quản lý thông tin cá nhân và tài khoản",
        };
      case "/student/my-thesis":
        return {
          title: "Đề tài của tôi",
          subtitle: "Theo dõi tiến độ và trạng thái đề tài luận văn",
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

  // Cập nhật lại relative time theo phút khi dropdown đang mở (giống Lecturer)
  useEffect(() => {
    if (!isNotificationOpen) return;
    const id = setInterval(() => setTimeTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, [isNotificationOpen]);

  // Không cần force re-render avatar nữa vì header đã hoạt động tốt
  // useEffect(() => {
  //   setAvatarKey((prev) => prev + 1);
  // }, [profileData.avt]);

  // Chỉ fetch profile data khi dropdown mở, không force refresh avatar
  useEffect(() => {
    if (isUserDropdownOpen) {
      fetchProfileData();
    }
  }, [isUserDropdownOpen, fetchProfileData]);

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
    setIsUserDropdownOpen(false);
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

  // Function để refresh profile data (không force refresh avatar)
  const refreshProfileData = async () => {
    try {
      await fetchProfileData();
    } catch (error) {
      console.error("Lỗi khi refresh profile data:", error);
    }
  };

  // Function để toggle dropdown (không force refresh avatar)
  const handleToggleUserDropdown = () => {
    if (!isUserDropdownOpen) {
      // Chỉ fetch profile data, không force refresh avatar
      fetchProfileData();
    }

    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsNotificationOpen(false);
  };

  // State danh sách thông báo (khởi tạo rỗng, nhận qua WebSocket)
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = async () => {
    if (isMarkingAllAsRead) return;
    try {
      setIsMarkingAllAsRead(true);
      const receiverId = getUserIdFromToken();
      if (!receiverId) {
        toast.error("Không xác định được người dùng");
        return;
      }
      const res = await notificationService.markAllAsRead(receiverId);
      const statusOk =
        (typeof res?.status === "number" &&
          res.status >= 200 &&
          res.status < 300) ||
        (typeof res?.statusCode === "number" &&
          res.statusCode >= 200 &&
          res.statusCode < 300);
      const success =
        res === true ||
        res === "" ||
        res?.success === true ||
        statusOk ||
        res?.data === true ||
        res?.data?.success === true ||
        res?.message?.toLowerCase?.().includes("thành công") ||
        res?.message?.toLowerCase?.().includes("success");
      if (success) {
        setNotifications((prev) => {
          const updated = prev.map((n) => ({ ...n, isRead: true }));
          try {
            window.__studentNotifications = updated;
            window.dispatchEvent(
              new CustomEvent("app:student-notifications", { detail: updated })
            );
          } catch (_) {}
          return updated;
        });
        toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
      } else {
        toast.error(res?.message || "Không thể đánh dấu tất cả đã đọc");
      }
    } catch (err) {
      toast.error("Có lỗi khi đánh dấu tất cả đã đọc");
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  const buildNotificationsWsUrl = (receiverId) => {
    const base = WS_ENDPOINTS.NOTIFICATIONS.replace(/\/$/, "");
    return `${base}?receiverId=${encodeURIComponent(receiverId)}`;
  };

  // Hiển thị thời gian tương đối theo createdAt (giống Lecturer)
  const formatRelativeTime = (createdAtMs) => {
    if (!createdAtMs) return "Vừa xong";
    const diff = Math.max(0, Date.now() - createdAtMs);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "Vừa xong";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} giờ trước`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} ngày trước`;
    const week = Math.floor(day / 7);
    if (week < 4) return `${week} tuần trước`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month} tháng trước`;
    const year = Math.floor(day / 365);
    return `${year} năm trước`;
  };

  // Định dạng một lần khi nhận (để hiển thị tức thì)
  const formatRelativeOnce = (createdAtMs) => {
    if (!createdAtMs) return "Vừa xong";
    const diff = Math.max(0, Date.now() - createdAtMs);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "Vừa xong";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} giờ trước`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} ngày trước`;
    const week = Math.floor(day / 7);
    if (week < 4) return `${week} tuần trước`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month} tháng trước`;
    const year = Math.floor(day / 365);
    return `${year} năm trước`;
  };

  const connectWebSocket = () => {
    try {
      const receiverId = getUserIdFromToken();
      if (!receiverId) return;

      // Đóng kết nối cũ nếu có
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        try {
          wsRef.current.close();
        } catch (_) {}
      }

      const url = buildNotificationsWsUrl(receiverId);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        connectTimeRef.current = Date.now();
        bufferedCountRef.current = 0;
        summaryShownRef.current = false;
        // Chỉ hiển thị 1 toast tổng hợp sau giai đoạn buffer ban đầu
        if (bufferToastTimerRef.current) {
          clearTimeout(bufferToastTimerRef.current);
          bufferToastTimerRef.current = null;
        }
        // Heartbeat keep-alive
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }
        heartbeatTimerRef.current = setInterval(() => {
          try {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send("ping");
            }
          } catch (_) {}
        }, 30000);
        // Lên lịch hiển thị 1 toast tổng hợp nếu có nhiều thông báo ban đầu
        bufferToastTimerRef.current = setTimeout(() => {
          const count = bufferedCountRef.current;
          bufferToastTimerRef.current = null;
          bufferedCountRef.current = 0;
          if (count > 0 && !summaryShownRef.current) {
            summaryShownRef.current = true;
            toast.success(`Bạn có ${count} thông báo mới`);
          }
        }, bufferInitialMsRef.current + 100);
      };

      ws.onmessage = (evt) => {
        try {
          const raw = evt?.data;
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw || {};

          const handleOne = (dataObj) => {
            if (!dataObj || typeof dataObj !== "object") return;

            // Chỉ xử lý nếu đúng người nhận (nếu server có receiverId)
            const receiverId = getUserIdFromToken();
            if (
              dataObj.receiverId &&
              String(dataObj.receiverId) !== String(receiverId)
            ) {
              return;
            }

            const notifId =
              dataObj.id ||
              `${dataObj.senderId || ""}-${dataObj.createdAt || Date.now()}`;
            if (notifId && seenNotificationIdsRef.current.has(notifId)) {
              return; // tránh trùng lặp khi reconnect
            }
            if (notifId) seenNotificationIdsRef.current.add(notifId);

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
              time: formatRelativeOnce(createdAtMs),
              createdAt: createdAtMs,
              isRead: dataObj.read === true ? true : false,
            };

            // Sử dụng setTimeout để tránh setState trong render
            setTimeout(() => {
              setNotifications((prev) => {
                const updated = [newNotification, ...prev];
                try {
                  window.__studentNotifications = updated;
                  window.dispatchEvent(
                    new CustomEvent("app:student-notifications", {
                      detail: updated,
                    })
                  );
                } catch (_) {}
                return updated;
              });
            }, 0);

            const now = Date.now();
            const inInitialBuffer =
              now - connectTimeRef.current <= bufferInitialMsRef.current;

            if (!newNotification.isRead) {
              if (inInitialBuffer) {
                bufferedCountRef.current += 1;
              } else {
                toast.success(messageText);
              }
            }

            try {
              window.dispatchEvent(
                new CustomEvent("app:notification", { detail: dataObj })
              );
            } catch (_) {}
          };

          if (Array.isArray(parsed)) {
            parsed.forEach((item) => handleOne(item));
          } else {
            handleOne(parsed);
          }
        } catch (_) {
          // ignore
        }
      };

      ws.onerror = () => {
        // no-op
      };

      ws.onclose = () => {
        // Tự động thử kết nối lại sau một khoảng thời gian ngắn
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }
        setTimeout(() => {
          connectWebSocket();
        }, 2000);
      };
    } catch (_) {
      // ignore
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
      } catch (_) {}
    };
  }, []);

  // Tự reconnect/ping khi tab trở lại foreground hoặc mạng online
  useEffect(() => {
    const tryReconnect = () => {
      try {
        if (document.hidden) return;
        const ws = wsRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        } else if (ws.readyState !== WebSocket.OPEN) {
          setTimeout(connectWebSocket, 500);
        } else {
          try {
            ws.send("ping");
          } catch (_) {}
        }
      } catch (_) {}
    };

    const handleVisibilityChange = () => tryReconnect();
    const handleOnline = () => tryReconnect();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div
          className={`fixed h-screen z-50 transition-all duration-500 ease-in-out ${
            isCollapsed ? "w-16" : "w-64"
          } ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
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
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={handleOverlayClick}
          />
        )}

        {/* Main content area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${
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
                      {unreadCount}
                    </span>
                  </div>

                  {/* Notification Dropdown Menu */}
                  {isNotificationOpen && (
                    <div className="absolute top-full right-0 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 mt-2 animate-fade-in-up">
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-base font-semibold text-gray-900 m-0">
                          Thông báo
                        </h3>
                        <button
                          className="text-info text-sm cursor-pointer px-2 py-1 rounded transition-colors duration-200 hover:bg-gray-100"
                          onClick={handleMarkAllAsRead}
                        >
                          Đánh dấu tất cả đã đọc
                        </button>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto thin-scrollbar pr-1">
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
                                {formatRelativeTime(
                                  notification.createdAt,
                                  timeTick
                                )}
                              </span>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-info rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t border-gray-100 text-center">
                        <button
                          className="text-info text-sm cursor-pointer px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
                          onClick={() => {
                            setIsNotificationOpen(false);
                            navigate("/student/notifications");
                          }}
                        >
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
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img
                        key={`header-avatar-${avatarKey}`}
                        src={
                          profileData.avt ||
                          "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1755329521/avt_default_mcotwe.jpg"
                        }
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1755329521/avt_default_mcotwe.jpg";
                        }}
                      />
                    </div>
                    <div className="hidden md:block">
                      <div className="text-sm font-semibold text-gray-900 leading-tight">
                        {profileData.fullName || "Sinh viên"}
                      </div>
                      <div className="text-xs text-gray-600 leading-tight">
                        {profileData.major || "Sinh viên"}
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
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          <img
                            key={`dropdown-avatar-${avatarKey}`}
                            src={
                              profileData.avt ||
                              "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1755329521/avt_default_mcotwe.jpg"
                            }
                            alt="User Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1755329521/avt_default_mcotwe.jpg";
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-gray-900 m-0 mb-1">
                            {profileData.fullName || "Sinh viên"}
                          </h4>
                          <p className="text-sm text-gray-600 m-0 mb-1">
                            {profileData.major || "Sinh viên"}
                          </p>
                          <span className="text-xs text-gray-500">
                            {profileData.email || "Chưa cập nhật email"}
                          </span>
                        </div>
                      </div>
                      <div className="py-2">
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 bg-none border-none text-gray-700 text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-left"
                          onClick={() => {
                            navigate("/student/profile");
                            setIsUserDropdownOpen(false);
                          }}
                        >
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
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 bg-none border-none text-gray-700 text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-left"
                          onClick={() => {
                            navigate("/student/my-thesis");
                            setIsUserDropdownOpen(false);
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-gray-600"
                          >
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                          </svg>
                          Đề tài của tôi
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
          <main className="flex-1 bg-gray-50 text-secondary overflow-auto">
            <div
              className={`px-6 ${
                location.pathname === "/student/my-thesis" ? "py-2" : "py-6"
              }`}
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
        limit={3}
      />
    </>
  );
};

export default StudentLayout;
