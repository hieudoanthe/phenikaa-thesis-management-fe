import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <LoadingSpinner
        size="large"
        text="Đang kiểm tra đăng nhập..."
        className="min-h-screen"
      />
    );
  }

  // Redirect về trang đăng nhập nếu chưa đăng nhập
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
