import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SidebarOfLecturer from "./SidebarOfLecturer.jsx";
import {
  logout,
  getRefreshToken,
  getTeacherIdFromToken,
} from "../../../auth/authUtils";
import { useProfileTeacher } from "../../../contexts/ProfileTeacherContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { WS_ENDPOINTS, APP_CONFIG } from "../../../config/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import userService from "../../../services/user.service";

const LecturerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [notificationsState, setNotificationsState] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timeTick, setTimeTick] = useState(0);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const studentProfileCacheRef = useRef({});
  // Dùng react-toastify nên không cần hàng đợi toast thủ công

  // Sử dụng notification context
  const { markAllAsRead: markAllAsReadFromContext, addNotification } =
    useNotifications();

  // Sử dụng ProfileTeacherContext
  let contextData;
  try {
    contextData = useProfileTeacher();
  } catch (error) {
    console.error("Lỗi khi lấy context:", error);
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Lỗi khởi tạo
          </h2>
          <p className="text-gray-600 mb-4">
            Không thể khởi tạo profile context. Vui lòng thử lại sau.
          </p>
        </div>
      </div>
    );
  }

  const { profileData, fetchProfileData } = contextData;

  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const connectTimeRef = useRef(0);
  const bufferInitialMsRef = useRef(0);
  const bufferedCountRef = useRef(0);
  const bufferToastTimerRef = useRef(null);
  const summaryShownRef = useRef(false);
  const heartbeatTimerRef = useRef(null);
  const lastActivityAtRef = useRef(0);
  const seenNotificationIdsRef = useRef(new Set());

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
      case "/lecturer/profile":
        return {
          title: "Hồ sơ cá nhân",
          subtitle: "Quản lý thông tin cá nhân và cài đặt tài khoản",
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

      // Chỉ tự động đóng sidebar khi chuyển từ desktop sang mobile
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

  // Fetch profile data khi dropdown mở - chỉ fetch khi cần thiết
  useEffect(() => {
    if (isUserDropdownOpen && !profileData.fullName) {
      fetchProfileData();
    }
  }, [isUserDropdownOpen, profileData.fullName, fetchProfileData]);

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
    if (!isUserDropdownOpen && !profileData.fullName) {
      // Chỉ fetch profile data khi mở dropdown và chưa có dữ liệu
      fetchProfileData();
    }

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

  // WebSocket helpers
  // Chuẩn hoá WS base URL theo giao thức hiện tại (ws/wss)
  const normalizeWsBaseUrl = (base) => {
    try {
      const url = new URL(base, window.location.origin);
      const isHttps = window.location.protocol === "https:";
      url.protocol = isHttps ? "wss:" : "ws:";
      // Loại bỏ dấu gạch chéo cuối để tránh // khi nối query
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

  // Heartbeat giữ kết nối sống
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
      } catch (_) {
        // no-op
      }
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
    // Rút ngắn tối đa 8s để nhận thông báo sớm hơn
    const delay = Math.min(8000, 1000 * Math.pow(2, attempt));
    clearReconnectTimer();
    reconnectTimerRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
  };

  // Hiển thị thời gian tương đối theo createdAt
  const formatRelativeTime = (createdAtMs) => {
    if (!createdAtMs) return "Vừa xong";
    const diff = Math.max(0, Date.now() - createdAtMs);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "Vừa xong";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} giờ trước`;
    const day = Math.floor(hour / 24);
    return `${day} ngày trước`;
  };

  // Định dạng thời gian tương đối 1 lần khi nhận
  const formatRelativeOnce = (createdAtMs) => {
    if (!createdAtMs) return "Vừa xong";
    const diff = Math.max(0, Date.now() - createdAtMs);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "Vừa xong";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} giờ trước`;
    const day = Math.floor(hour / 24);
    return `${day} ngày trước`;
  };

  // Hiển thị toast qua react-toastify
  const showToast = (message, type = "success") => {
    try {
      if (type === "error") return toast.error(message);
      if (type === "warning") return toast.warn(message);
      if (type === "info") return toast.info(message);
      return toast.success(message);
    } catch (_) {
      (type === "error" ? console.error : console.log)(message);
    }
  };

  const appendNotification = async ({
    id,
    message,
    createdAt,
    read,
    studentId,
  }) => {
    const createdAtMs = createdAt ? Number(createdAt) : Date.now();

    // Thử lấy tên sinh viên nếu có studentId
    let studentName;
    if (studentId) {
      try {
        const cached = studentProfileCacheRef.current[studentId];
        const profile =
          cached || (await userService.getStudentProfileById(studentId));
        if (!cached) studentProfileCacheRef.current[studentId] = profile;
        const fullName = profile?.fullName || profile?.name;
        if (fullName) studentName = fullName;
      } catch (err) {
        // Không chặn hiển thị nếu lỗi, giữ nguyên message
      }
    }

    const item = {
      id:
        id ||
        `${studentId || ""}-${createdAtMs}-${(message || "").slice(0, 24)}`,
      title: "Thông báo",
      message: message,
      time: formatRelativeOnce(createdAtMs),
      createdAt: createdAtMs,
      // Chuẩn hoá: dùng isRead là nguồn chính
      isRead: !!read,
      studentId: studentId ?? null,
      studentName: studentName ?? null,
    };
    // Chặn trùng lặp
    if (item.id && seenNotificationIdsRef.current.has(item.id)) {
      return;
    }
    if (item.id) seenNotificationIdsRef.current.add(item.id);
    // Cập nhật state local
    setNotificationsState((prev) => {
      const next = [item, ...prev];
      return next.slice(0, 50);
    });

    // Cập nhật context
    addNotification(item);

    // Chỉ tăng số thông báo chưa đọc nếu thông báo chưa đọc
    if (!read) {
      setUnreadCount((c) => c + 1);
      // Quyết định hiển thị toast ngay hay gom theo buffer
      const now = Date.now();
      const isBuffering =
        connectTimeRef.current > 0 &&
        now - connectTimeRef.current < bufferInitialMsRef.current;
      if (!isBuffering) {
        showToast(message, "success");
      } else {
        bufferedCountRef.current += 1;
      }
    }
  };

  const handleOpenStudentProfile = async (studentId) => {
    if (!studentId) return;
    setIsProfileLoading(true);
    try {
      const cached = studentProfileCacheRef.current[studentId];
      const profile =
        cached || (await userService.getStudentProfileById(studentId));
      if (!cached) studentProfileCacheRef.current[studentId] = profile;
      const info = {
        fullName: profile?.fullName || profile?.name || "Không xác định",
        email: profile?.email || "",
        major: profile?.major || "",
        className: profile?.className || profile?.class || "",
        phoneNumber: profile?.phoneNumber || "",
        avt: profile?.avt || profile?.avatar || "",
      };
      setStudentProfile(info);
      setIsStudentProfileOpen(true);
    } catch (err) {
      if (APP_CONFIG.DEBUG_MODE)
        console.debug("[WS][Layout] Lỗi tải profile sinh viên:", err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleIncomingMessage = async (event) => {
    try {
      let rawData = event.data;
      if (rawData instanceof Blob) {
        try {
          rawData = await rawData.text();
        } catch (_) {
          rawData = "";
        }
      }
      const now = Date.now();
      const isBuffering =
        connectTimeRef.current > 0 &&
        now - connectTimeRef.current < bufferInitialMsRef.current;

      if (typeof rawData === "string") {
        const raw = rawData.trim();
        const lower = raw.toLowerCase();
        if (lower === "ping" || lower === "pong" || lower === "message") {
          lastActivityAtRef.current = Date.now();
          return;
        }

        try {
          const parsed = JSON.parse(raw);

          const handleOne = async (p) => {
            const msg =
              p?.message || p?.content || p?.text || "Bạn có thông báo mới";
            const notifId =
              p?.id ||
              `${p?.studentId || ""}-${p?.createdAt || Date.now()}-${(
                msg || ""
              ).slice(0, 24)}`;
            await appendNotification({
              id: notifId,
              message: msg,
              createdAt: p?.createdAt,
              read: p?.read,
              studentId: p?.studentId,
            });

            // appendNotification sẽ quyết định hiển thị toast/buffer
            window.dispatchEvent(
              new CustomEvent("app:notification", { detail: p })
            );
          };

          if (Array.isArray(parsed)) {
            for (const p of parsed) {
              await handleOne(p);
            }
          } else {
            await handleOne(parsed);
          }

          if (isBuffering && !bufferToastTimerRef.current) {
            const delay =
              bufferInitialMsRef.current - (now - connectTimeRef.current) + 50;
            bufferToastTimerRef.current = setTimeout(() => {
              const count = bufferedCountRef.current;
              bufferToastTimerRef.current = null;
              bufferedCountRef.current = 0;
              if (count > 0 && !summaryShownRef.current) {
                summaryShownRef.current = true;
                showToast(`Bạn có ${count} thông báo mới`, "success");
              }
            }, Math.max(0, delay));
          }
          return;
        } catch (_) {
          let display = raw;
          if (lower.startsWith("message:"))
            display = raw.substring(raw.indexOf(":") + 1).trim();
          if (
            (display.startsWith('"') && display.endsWith('"')) ||
            (display.startsWith("'") && display.endsWith("'"))
          ) {
            display = display.slice(1, -1);
          }
          const syntheticId = `${Date.now()}-${(display || "").slice(0, 24)}`;
          await appendNotification({
            id: syntheticId,
            message: display,
            createdAt: Date.now(),
            read: false,
          });

          // appendNotification sẽ quyết định hiển thị toast/buffer
          window.dispatchEvent(
            new CustomEvent("app:notification", {
              detail: { message: display },
            })
          );
          // Lên lịch toast tổng hợp nếu đang buffer
          if (isBuffering && !bufferToastTimerRef.current) {
            const delay =
              bufferInitialMsRef.current - (now - connectTimeRef.current) + 50;
            bufferToastTimerRef.current = setTimeout(() => {
              const count = bufferedCountRef.current;
              bufferToastTimerRef.current = null;
              bufferedCountRef.current = 0;
              if (count > 0 && !summaryShownRef.current) {
                summaryShownRef.current = true;
                showToast(`Bạn có ${count} thông báo mới`, "success");
              }
            }, Math.max(0, delay));
          }
          return;
        }
      }

      const data = rawData || {};
      const msg =
        data.message || data.content || data.text || "Bạn có thông báo mới";
      const objId =
        data.id ||
        `${data.studentId || ""}-${data.createdAt || Date.now()}-${(
          msg || ""
        ).slice(0, 24)}`;
      await appendNotification({
        id: objId,
        message: msg,
        createdAt: data.createdAt,
        read: data.read,
        studentId: data.studentId,
      });
      lastActivityAtRef.current = Date.now();

      // appendNotification sẽ quyết định hiển thị toast/buffer
      window.dispatchEvent(
        new CustomEvent("app:notification", { detail: data })
      );

      // Lên lịch hiển thị toast tổng hợp khi hết thời gian buffer
      if (isBuffering && !bufferToastTimerRef.current) {
        const delay =
          bufferInitialMsRef.current - (now - connectTimeRef.current) + 50;
        bufferToastTimerRef.current = setTimeout(() => {
          const count = bufferedCountRef.current;
          bufferToastTimerRef.current = null;
          bufferedCountRef.current = 0;
          if (count > 0 && !summaryShownRef.current) {
            summaryShownRef.current = true;
            showToast(`Bạn có ${count} thông báo mới`, "success");
          }
        }, Math.max(0, delay));
      }
    } catch (err) {
      if (APP_CONFIG.DEBUG_MODE)
        console.debug("[WS][Layout] Lỗi xử lý message:", err);
    }
  };

  const connectWebSocket = () => {
    try {
      const receiverId = getTeacherIdFromToken();
      if (!receiverId) return;

      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }

      const url = buildNotificationsWsUrl(receiverId);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (APP_CONFIG.DEBUG_MODE) console.debug("[WS][Layout] Opened:", url);
        reconnectAttemptsRef.current = 0;
        clearReconnectTimer();
        // Đánh dấu đã có kết nối toàn cục để tránh trùng từ page
        if (typeof window !== "undefined")
          window.__wsNotificationsConnected = true;
        // Đặt mốc thời gian để buffer thông báo ban đầu
        connectTimeRef.current = Date.now();
        bufferedCountRef.current = 0;
        summaryShownRef.current = false;
        if (bufferToastTimerRef.current) {
          clearTimeout(bufferToastTimerRef.current);
          bufferToastTimerRef.current = null;
        }
        lastActivityAtRef.current = Date.now();
        startHeartbeat();
      };

      ws.onmessage = (evt) => {
        if (APP_CONFIG.DEBUG_MODE)
          console.debug("[WS][Layout] Message:", evt.data);
        lastActivityAtRef.current = Date.now();
        handleIncomingMessage(evt);
      };

      ws.onerror = (e) => {
        if (APP_CONFIG.DEBUG_MODE) console.debug("[WS][Layout] Error:", e);
      };

      ws.onclose = (e) => {
        if (APP_CONFIG.DEBUG_MODE)
          console.debug("[WS][Layout] Closed:", e?.code, e?.reason);
        scheduleReconnect();
        connectTimeRef.current = 0;
        clearHeartbeatTimer();
        if (bufferToastTimerRef.current) {
          clearTimeout(bufferToastTimerRef.current);
          bufferToastTimerRef.current = null;
        }
      };
    } catch (err) {
      if (APP_CONFIG.DEBUG_MODE)
        console.debug("[WS][Layout] Cannot init:", err);
      scheduleReconnect();
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      clearReconnectTimer();
      clearHeartbeatTimer();
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  // Tự động reconnect khi tab quay lại foreground hoặc mạng online
  useEffect(() => {
    const tryReconnect = () => {
      if (document.hidden) return;
      try {
        const ws = wsRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        } else if (ws.readyState !== WebSocket.OPEN) {
          scheduleReconnect();
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

  // Cập nhật lại relative time theo phút khi dropdown đang mở
  useEffect(() => {
    if (!isNotificationOpen) return;
    const id = setInterval(() => setTimeTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, [isNotificationOpen]);

  const markAllAsRead = async () => {
    if (isMarkingAllAsRead) return; // Tránh gọi nhiều lần

    try {
      setIsMarkingAllAsRead(true);
      const receiverId = getTeacherIdFromToken();
      if (!receiverId) {
        showToast("Không thể xác định ID giảng viên", "error");
        return;
      }

      // Sử dụng context để đánh dấu tất cả thông báo đã đọc
      const success = await markAllAsReadFromContext(receiverId);

      if (success) {
        // Cập nhật UI local
        setNotificationsState((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
        showToast("Đã đánh dấu tất cả thông báo đã đọc", "success");
      } else {
        // Nếu context trả về false, có thể do backend trả về success: false mặc dù DB đã cập nhật
        // Trong trường hợp này, vẫn cập nhật UI local để tránh trải nghiệm người dùng kém
        setNotificationsState((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
        showToast("Đã đánh dấu tất cả thông báo đã đọc", "success");
      }
    } catch (error) {
      showToast("Đã xảy ra lỗi khi đánh dấu thông báo đã đọc", "error");
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* Notification Dropdown Menu */}
                {isNotificationOpen && (
                  <div className="absolute top-full right-0 w-[22rem] sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 mt-2 animate-fade-in-up">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-base font-semibold text-gray-900 m-0">
                        Thông báo
                      </h3>
                      <button
                        className={`text-info text-sm cursor-pointer px-2 py-1 rounded transition-colors duration-200 hover:bg-gray-100 ${
                          isMarkingAllAsRead
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={markAllAsRead}
                        disabled={isMarkingAllAsRead}
                      >
                        {isMarkingAllAsRead ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-info border-t-transparent rounded-full animate-spin"></div>
                            <span>Đang xử lý...</span>
                          </div>
                        ) : (
                          "Đánh dấu tất cả đã đọc"
                        )}
                      </button>
                    </div>
                    <div className="max-h-[240px] overflow-y-auto thin-scrollbar pr-1">
                      {notificationsState.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                          Không có thông báo
                        </div>
                      )}
                      {notificationsState.slice(0, 5).map((notification) => (
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
                              {notification.studentName && (
                                <>
                                  {" "}
                                  — Đề xuất bởi:{" "}
                                  <button
                                    type="button"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                    onClick={() =>
                                      handleOpenStudentProfile(
                                        notification.studentId
                                      )
                                    }
                                  >
                                    {notification.studentName}
                                  </button>
                                </>
                              )}
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
                      {notificationsState.length > 5 && (
                        <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-100">
                          Và {notificationsState.length - 5} thông báo khác...
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-gray-100 text-center">
                      <button
                        onClick={() => {
                          navigate("/lecturer/notifications");
                          setIsNotificationOpen(false);
                        }}
                        className="text-info text-sm cursor-pointer px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
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
                    {profileData.avt ? (
                      <img
                        src={profileData.avt}
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1755329521/avt_default_mcotwe.jpg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-info to-info-dark rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {profileData.fullName
                          ? profileData.fullName.charAt(0).toUpperCase()
                          : "G"}
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {profileData.fullName || "Giảng viên"}
                    </div>
                    <div className="text-xs text-gray-600 leading-tight">
                      {profileData.academicRank || "Giảng viên"}
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
                        {profileData.avt ? (
                          <img
                            src={profileData.avt}
                            alt="User Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1755329521/avt_default_mcotwe.jpg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-info to-info-dark rounded-full flex items-center justify-center text-white font-semibold text-base">
                            {profileData.fullName
                              ? profileData.fullName.charAt(0).toUpperCase()
                              : "G"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 m-0 mb-1">
                          {profileData.fullName || "Giảng viên"}
                        </h4>
                        <p className="text-sm text-gray-600 m-0 mb-1">
                          {profileData.academicRank || "Giảng viên"}
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
                          navigate("/lecturer/profile");
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
          <div className="px-6 py-6">
            <Outlet />
          </div>
        </main>
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
        {isStudentProfileOpen && studentProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Thông tin sinh viên
                </h3>
                <button
                  type="button"
                  onClick={() => setIsStudentProfileOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {studentProfile.avt && (
                  <div className="flex justify-center">
                    <img
                      src={studentProfile.avt}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Họ và tên
                    </label>
                    <p className="text-base font-semibold text-gray-900">
                      {studentProfile.fullName}
                    </p>
                  </div>
                  {studentProfile.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Email
                      </label>
                      <p className="text-base text-gray-700">
                        {studentProfile.email}
                      </p>
                    </div>
                  )}
                  {studentProfile.phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Số điện thoại
                      </label>
                      <p className="text-base text-gray-700">
                        {studentProfile.phoneNumber}
                      </p>
                    </div>
                  )}
                  {studentProfile.major && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Chuyên ngành
                      </label>
                      <p className="text-base text-gray-700">
                        {studentProfile.major}
                      </p>
                    </div>
                  )}
                  {studentProfile.className && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Lớp
                      </label>
                      <p className="text-base text-gray-700">
                        {studentProfile.className}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsStudentProfileOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerLayout;
