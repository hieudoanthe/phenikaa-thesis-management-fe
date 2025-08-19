import React, { useEffect } from "react";
import { getSessionId, getSessionKey } from "../../auth/authUtils";

/**
 * Component quản lý session cho từng tab
 * Đảm bảo mỗi tab có session ID riêng biệt
 */
const SessionManager = ({ children }) => {
  useEffect(() => {
    // Khởi tạo session ID cho tab hiện tại
    const sessionId = getSessionId();

    // Lưu session ID vào session storage để tracking
    sessionStorage.setItem("currentSessionId", sessionId);

    // Cleanup khi tab đóng
    const handleBeforeUnload = () => {
      // Có thể thêm logic cleanup ở đây nếu cần
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return <>{children}</>;
};

export default SessionManager;
