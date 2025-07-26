import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import "../../../styles/layout/student/sidebar_of_student.css";
import PropTypes from "prop-types";

const SidebarOfStudent = ({
  isCollapsed,
  onToggleCollapse,
  onMenuItemClick,
}) => {
  const location = useLocation();

  const handleMenuClick = () => {
    if (onMenuItemClick) {
      onMenuItemClick();
    }
  };

  // Menu items cho sinh viên
  const menuItems = [
    {
      path: "/student/home",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      ),
      text: "Trang chủ",
      tooltip: "Trang chủ",
    },
    {
      path: "/student/topic",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      ),
      text: "Đề tài",
      tooltip: "Đề tài",
    },
    {
      path: "/student/topic-registration",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      ),
      text: "Đăng ký đề tài",
      tooltip: "Đăng ký đề tài",
    },
    {
      path: "/student/group",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
      text: "Nhóm",
      tooltip: "Nhóm",
    },
    {
      path: "/student/report",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
        </svg>
      ),
      text: "Báo cáo",
      tooltip: "Báo cáo",
    },
    {
      path: "/student/message",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
        </svg>
      ),
      text: "Tin nhắn",
      tooltip: "Tin nhắn",
    },
    {
      path: "/student/settings",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
        </svg>
      ),
      text: "Cài đặt",
      tooltip: "Cài đặt",
    },
  ];

  return (
    <div className={`student-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <h1 className="sidebar-title">THESIS MANAGER</h1>
        <button
          className="collapse-btn"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="menu-list">
          {menuItems.map((item, index) => (
            <li
              key={item.path}
              className={`menu-item ${
                location.pathname === item.path ? "active" : ""
              }`}
              data-tooltip={item.tooltip}
            >
              <NavLink
                to={item.path}
                className="menu-link"
                onClick={handleMenuClick}
                title={item.tooltip}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.text}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

SidebarOfStudent.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  onMenuItemClick: PropTypes.func,
};

export default SidebarOfStudent;
