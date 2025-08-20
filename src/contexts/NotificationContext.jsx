import React, { createContext, useContext, useState, useEffect } from "react";
import { getTeacherIdFromToken } from "../auth/authUtils";
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
  const loadNotifications = async (teacherId, params = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Tạm thời sử dụng dữ liệu mẫu
      const mockNotifications = [
        {
          id: 1,
          title: "Đề tài mới được đăng ký",
          message:
            "Sinh viên Nguyễn Văn A đã đăng ký đề tài 'Xây dựng hệ thống quản lý sinh viên'",
          read: false,
          studentId: "ST001",
          createdAt: Date.now() - 1000 * 60 * 30, // 30 phút trước
        },
        {
          id: 2,
          title: "Báo cáo tiến độ",
          message: "Sinh viên Trần Thị B đã nộp báo cáo tiến độ tháng 12",
          read: true,
          studentId: "ST002",
          createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 giờ trước
        },
        {
          id: 3,
          title: "Lịch bảo vệ",
          message: "Lịch bảo vệ luận văn đã được cập nhật cho tuần tới",
          read: false,
          createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 ngày trước
        },
        {
          id: 4,
          title: "Nhận xét đề tài",
          message: "Đề tài 'Phát triển ứng dụng mobile' đã được duyệt",
          read: true,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 ngày trước
        },
        {
          id: 5,
          title: "Thông báo họp",
          message: "Cuộc họp định kỳ giữa kỳ sẽ diễn ra vào thứ 6 tuần này",
          read: false,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 ngày trước
        },
      ];

      setNotifications(mockNotifications);
      return mockNotifications;
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
      setError("Đã xảy ra lỗi khi tải danh sách thông báo");
      setNotifications([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = async (teacherId) => {
    try {
      const response = await notificationService.markAllAsRead(teacherId);

      // Chấp nhận nhiều format response khác nhau
      const isSuccess =
        response?.success === true ||
        response?.status === 200 ||
        response?.statusCode === 200 ||
        response?.data !== undefined ||
        response?.message?.toLowerCase().includes("success") ||
        response?.message?.toLowerCase().includes("thành công");

      if (isSuccess) {
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

        setError(response?.message || "Không thể đánh dấu thông báo đã đọc");
        return false;
      }
    } catch (error) {
      setError("Đã xảy ra lỗi khi đánh dấu thông báo đã đọc");
      return false;
    }
  };

  // Đánh dấu một thông báo đã đọc
  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);

      // Chấp nhận nhiều format response khác nhau
      const isSuccess =
        response?.success === true ||
        response?.status === 200 ||
        response?.statusCode === 200 ||
        response?.data !== undefined ||
        response?.message?.toLowerCase().includes("success") ||
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
