import React, { createContext, useContext, useState, useEffect } from "react";
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

  // Load thông báo từ API (tạm thời sử dụng dữ liệu mẫu vì API chưa có)
  const loadNotifications = async (receiverId, params = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Tạm thời sử dụng dữ liệu mẫu
      const mockNotifications = [
        {
          id: 1,
          title: "Thông báo mới",
          message: "Bạn có thông báo mới từ hệ thống",
          time: "2 phút trước",
          createdAt: Date.now() - 2 * 60 * 1000,
          isRead: false,
        },
        {
          id: 2,
          title: "Cập nhật đề tài",
          message: "Đề tài của bạn đã được cập nhật",
          time: "1 giờ trước",
          createdAt: Date.now() - 60 * 60 * 1000,
          isRead: true,
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setNotifications(mockNotifications);
      return {
        success: true,
        data: mockNotifications,
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
        // Cập nhật state local
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        return true;
      } else {
        // Kiểm tra xem có phải do backend trả về success: false mặc dù DB đã cập nhật không
        // Nếu response có data hoặc status 200, coi như thành công
        if (
          response?.data ||
          response?.status === 200 ||
          response?.statusCode === 200
        ) {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          return true;
        }

        setError(
          response?.message || "Không thể đánh dấu tất cả thông báo đã đọc"
        );
        return false;
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả thông báo đã đọc:", error);
      setError("Đã xảy ra lỗi khi đánh dấu thông báo đã đọc");
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

      // Gọi API để đánh dấu đã đọc
      const response = await notificationService.markAsRead(notificationId);

      // Kiểm tra response
      const isSuccess =
        response?.success === true ||
        response?.status === 200 ||
        response?.statusCode === 200 ||
        response?.message?.toLowerCase().includes("thành công");

      if (isSuccess) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        return true;
      } else {
        // Kiểm tra xem có phải do backend trả về success: false mặc dù DB đã cập nhật không
        // Nếu response có data hoặc status 200, coi như thành công
        if (
          response?.data ||
          response?.status === 200 ||
          response?.statusCode === 200
        ) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          );
          return true;
        }

        setError(response?.message || "Không thể đánh dấu thông báo đã đọc");
        return false;
      }
    } catch (error) {
      setError("Đã xảy ra lỗi khi đánh dấu thông báo đã đọc");
      return false;
    }
  };

  // Thêm thông báo mới (từ WebSocket)
  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
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

  // Clear error
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
