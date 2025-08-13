import React from "react";
import "../../styles/pages/lecturer/home.css";

const LecturerHome = () => {
  return (
    <div className="lecturer-home">
      <div className="page-header">
        <h1>Trang chủ - Giảng viên</h1>
        <p>Chào mừng bạn đến với hệ thống quản lý luận văn</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Đề tài đang hướng dẫn</h3>
            <span className="card-badge">5</span>
          </div>
          <div className="card-content">
            <p>Bạn đang hướng dẫn 5 đề tài luận văn</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Báo cáo chờ duyệt</h3>
            <span className="card-badge warning">3</span>
          </div>
          <div className="card-content">
            <p>Có 3 báo cáo tiến độ đang chờ bạn duyệt</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Lịch bảo vệ sắp tới</h3>
            <span className="card-badge info">2</span>
          </div>
          <div className="card-content">
            <p>Có 2 buổi bảo vệ luận văn trong tuần tới</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Thông báo mới</h3>
            <span className="card-badge success">8</span>
          </div>
          <div className="card-content">
            <p>Bạn có 8 thông báo mới chưa đọc</p>
          </div>
        </div>
      </div>

      <div className="recent-activities">
        <h2>Hoạt động gần đây</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">📝</div>
            <div className="activity-content">
              <p>Sinh viên Nguyễn Văn A đã nộp báo cáo tiến độ</p>
              <span className="activity-time">2 giờ trước</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📅</div>
            <div className="activity-content">
              <p>Lịch bảo vệ luận văn đã được cập nhật</p>
              <span className="activity-time">5 giờ trước</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <p>Bạn đã duyệt báo cáo của sinh viên Trần Thị B</p>
              <span className="activity-time">1 ngày trước</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerHome;
