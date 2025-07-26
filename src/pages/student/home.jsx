import React from "react";
import "../../styles/pages/student/home.css";

const StudentHome = () => {
  return (
    <div className="student-home">
      <div className="welcome-section">
        <h1>Chào mừng bạn đến với Hệ thống Quản lý Luận văn</h1>
        <p>Trang chủ dành cho sinh viên</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-icon">📋</div>
          <div className="card-content">
            <h3>Đăng ký đề tài</h3>
            <p>Đăng ký và chọn đề tài luận văn phù hợp</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📝</div>
          <div className="card-content">
            <h3>Đề xuất đề tài</h3>
            <p>Đề xuất đề tài mới cho giảng viên hướng dẫn</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Quản lý nhóm</h3>
            <p>Theo dõi thông tin nhóm và thành viên</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Báo cáo tiến độ</h3>
            <p>Nộp và theo dõi báo cáo tiến độ luận văn</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">💬</div>
          <div className="card-content">
            <h3>Tin nhắn</h3>
            <p>Trao đổi với giảng viên và nhóm</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">⚙️</div>
          <div className="card-content">
            <h3>Cài đặt</h3>
            <p>Cấu hình tài khoản cá nhân</p>
          </div>
        </div>
      </div>

      <div className="quick-stats">
        <div className="stat-item">
          <div className="stat-number">1</div>
          <div className="stat-label">Đề tài đã đăng ký</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">3</div>
          <div className="stat-label">Báo cáo đã nộp</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">85%</div>
          <div className="stat-label">Tiến độ hoàn thành</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">2</div>
          <div className="stat-label">Tin nhắn chưa đọc</div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
