import React, { createContext, useContext, useState, useRef } from "react";
import { toast } from "react-toastify";
import { getUserIdFromToken } from "../auth/authUtils";
import notificationService from "../services/notification.service";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // tránh spam toast trên dev/StrictMode
  const summarizedRef = useRef(false);

  // Load thông báo từ API
  const loadNotifications = async (
    receiverId,
    params = {},
    options = { summarize: false }
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API thật để lấy thông báo
      const response = await notificationService.getNotifications(
        receiverId,
        params
      );

      // Xử lý response từ API
      const notifications =
        response?.data || response?.content || response || [];

      setNotifications(notifications);

      // Tùy chọn: hiển thị tóm tắt số lượng chưa đọc
      if (options?.summarize && !summarizedRef.current) {
        summarizedRef.current = true;
        try {
          const unread = notifications.filter((n) => !n?.isRead);
          const unreadCount = unread.length;

          if (unreadCount === 1) {
            const n = unread[0];
            const message = n?.message || n?.title || "Bạn có 1 thông báo mới";
            toast.info(message, { toastId: `notif-single-${n?.id || "x"}` });
          } else if (unreadCount > 1) {
            toast.info(`Bạn có ${unreadCount} thông báo chưa đọc`, {
              toastId: `notif-summary-${unreadCount}`,
            });
          }
        } catch {}
      }
      return {
        success: true,
        data: notifications,
        message: "Tải thông báo thành công",
      };
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
      setError("Không thể tải danh sách thông báo");
      return {
        success: false,
        message: "Không thể tải danh sách thông báo",
      };
    } finally {
      setLoading(false);
    }
  };

  // Đánh dấu tất cả thông báo đã đọc
  const markAllAsRead = async (receiverId) => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API để đánh dấu tất cả đã đọc
      const response = await notificationService.markAllAsRead(receiverId);

      // Kiểm tra response
      const isSuccess =
        response?.success === true ||
        response?.status === 200 ||
        response?.statusCode === 200 ||
        response?.message?.toLowerCase().includes("thành công");

      if (isSuccess) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        try {
          toast.success("Đã đánh dấu tất cả là đã đọc");
        } catch {}
        return true;
      } else {
        if (
          response?.data ||
          response?.status === 200 ||
          response?.statusCode === 200
        ) {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          try {
            toast.success("Đã đánh dấu tất cả là đã đọc");
          } catch {}
          return true;
        }

        setError(
          response?.message || "Không thể đánh dấu tất cả thông báo đã đọc"
        );
        try {
          toast.error("Không thể đánh dấu tất cả là đã đọc");
        } catch {}
        return false;
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả thông báo đã đọc:", error);
      setError("Đã xảy ra lỗi khi đánh dấu thông báo đã đọc");
      try {
        toast.error("Đã xảy ra lỗi khi đánh dấu tất cả là đã đọc");
      } catch {}
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Đánh dấu một thông báo đã đọc
  const markAsRead = async (notificationId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationService.markAsRead(notificationId);

      const isSuccess =
        response?.success === true ||
        response?.status === 200 ||
        response?.statusCode === 200 ||
        response?.data?.read === true ||
        response?.data?.isRead === true ||
        typeof response?.data?.id === "string";

      if (isSuccess) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        try {
          toast.success("Đã đánh dấu đã đọc");
        } catch {}
        return true;
      }

      setError(response?.message || "Không thể đánh dấu thông báo đã đọc");
      try {
        toast.error("Không thể đánh dấu đã đọc");
      } catch {}
      return false;
    } catch (error) {
      setError("Đã xảy ra lỗi khi đánh dấu thông báo đã đọc");
      return false;
    }
  };

  // Thêm thông báo mới (từ WebSocket) + quy tắc toast:
  // Luôn ưu tiên hiển thị chi tiết thông báo mới tới, bất kể có bao nhiêu chưa đọc.
  const addNotification = (notification) => {
    setNotifications((prev) => {
      const next = [notification, ...prev];
      try {
        if (!notification?.isRead) {
          const message =
            notification?.message ||
            notification?.title ||
            "Bạn có 1 thông báo mới";
          toast.info(message, {
            toastId: `notif-single-${notification?.id || Date.now()}`,
          });
        }
      } catch {}
      return next;
    });
  };

  // Cập nhật thông báo
  const updateNotification = (notificationId, updates) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, ...updates } : n))
    );
  };

  // Xóa thông báo
  const removeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    notifications,
    loading,
    error,
    loadNotifications,
    markAllAsRead,
    markAsRead,
    addNotification,
    updateNotification,
    removeNotification,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
