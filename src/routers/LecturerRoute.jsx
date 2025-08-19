import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PropTypes from "prop-types";

/**
 * Component bảo vệ route chỉ cho TEACHER role
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component con
 */
const LecturerRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <LoadingSpinner
        size="large"
        text="Đang kiểm tra quyền truy cập..."
        className="min-h-screen"
      />
    );
  }

  // Redirect về trang đăng nhập nếu chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Kiểm tra role - chỉ cho phép TEACHER
  const userRole = user?.role;
  if (userRole !== "TEACHER") {
    // Redirect về trang tương ứng với role của user
    if (userRole === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "STUDENT") {
      return <Navigate to="/student/home" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

LecturerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default LecturerRoute;
