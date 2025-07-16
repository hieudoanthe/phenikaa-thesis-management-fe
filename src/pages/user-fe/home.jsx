import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo, logout } from "../../auth/authUtils";

const Home = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy thông tin user từ token hoặc API
    fetchUserInfo();
  }, [navigate]);

  const fetchUserInfo = async () => {
    try {
      const userData = await getUserInfo();
      if (userData) {
        setUserInfo(userData);
      } else {
        // Token không hợp lệ, đăng xuất
        logout();
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const navigateToThesis = () => {
    navigate("/thesis");
  };

  const navigateToAdmin = () => {
    navigate("/admin/dashboard");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
        }}
      >
        Đang tải...
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          padding: "1rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h1>Chào mừng đến với Hệ thống Quản lý Đồ án Tốt nghiệp</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Đăng xuất
        </button>
      </div>

      {userInfo && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
          }}
        >
          <h3>Thông tin người dùng:</h3>
          <p>
            <strong>Tên:</strong> {userInfo.name || "Chưa có thông tin"}
          </p>
          <p>
            <strong>Email:</strong> {userInfo.email || "Chưa có thông tin"}
          </p>
          <p>
            <strong>Vai trò:</strong> {userInfo.role || "Chưa có thông tin"}
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
        }}
      >
        <div
          style={{
            padding: "2rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
            textAlign: "center",
            cursor: "pointer",
            transition: "transform 0.2s",
            backgroundColor: "#fff",
          }}
          onClick={navigateToThesis}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          <h3>📋 Quản lý Luận văn</h3>
          <p>Xem danh sách luận văn, thêm, sửa, xóa luận văn</p>
        </div>

        <div
          style={{
            padding: "2rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
            textAlign: "center",
            cursor: "pointer",
            transition: "transform 0.2s",
            backgroundColor: "#fff",
          }}
          onClick={navigateToAdmin}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          <h3>⚙️ Quản trị Hệ thống</h3>
          <p>Truy cập dashboard quản trị, quản lý người dùng và đề tài</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
