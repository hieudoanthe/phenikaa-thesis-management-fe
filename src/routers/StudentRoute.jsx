import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PropTypes from "prop-types";

/**
 * Component bảo vệ route chỉ cho USER (sinh viên)
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component con
 */
const StudentRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Debug: Log thông tin user
  console.log("StudentRoute - User info:", user);
  console.log("StudentRoute - User role:", user?.role);
  console.log("StudentRoute - Is authenticated:", isAuthenticated);

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
    console.log("StudentRoute - User not authenticated, redirecting to /");
    return <Navigate to="/" replace />;
  }

  // Kiểm tra role - chỉ cho phép USER (sinh viên)
  const userRole = user?.role;
  console.log("StudentRoute - Checking user role:", userRole);

  if (userRole !== "USER") {
    console.log(
      "StudentRoute - User không có quyền truy cập student layout:",
      userRole
    );
    // Redirect về trang tương ứng với role của user
    if (userRole === "ADMIN") {
      console.log("StudentRoute - Redirecting ADMIN to /admin/dashboard");
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "TEACHER") {
      console.log("StudentRoute - Redirecting TEACHER to /lecturer/home");
      return <Navigate to="/lecturer/home" replace />;
    } else {
      console.log("StudentRoute - Unknown role, redirecting to /");
      return <Navigate to="/" replace />;
    }
  }

  console.log("StudentRoute - User has access to student layout");
  return children;
};

StudentRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default StudentRoute;
