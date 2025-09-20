import React from "react";
import { NavLink, useLocation } from "react-router-dom";
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
      path: "/student/topic-registration",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      ),
      text: "Đăng ký đề tài",
      tooltip: "Đăng ký đề tài",
    },
    {
      path: "/student/my-thesis",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      ),
      text: "Đề tài của tôi",
      tooltip: "Đề tài của tôi",
    },
    {
      path: "/student/submissions",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-file-earmark-pdf-fill"
          viewBox="0 0 16 16"
        >
          <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z" />
          <path
            fill-rule="evenodd"
            d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"
          />
        </svg>
      ),
      text: "Tài liệu của tôi",
      tooltip: "Tài liệu của tôi",
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
      path: "/student/chat",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
        </svg>
      ),
      text: "Nhắn tin",
      tooltip: "Nhắn tin nội bộ",
    },
    {
      path: "/student/notifications",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      ),
      text: "Thông báo",
      tooltip: "Thông báo",
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
    <div
      className={`h-full flex flex-col bg-gradient-to-br from-secondary to-secondary-light text-white transition-all duration-500 ease-in-out overflow-hidden ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div
        className={`flex items-center justify-between border-b border-white/20 transition-all duration-500 ease-in-out ${
          isCollapsed ? "p-3" : "p-6"
        }`}
      >
        <h1
          className={`font-bold text-lg transition-all duration-500 ease-in-out transform ${
            isCollapsed
              ? "opacity-0 translate-x-2 scale-95 w-0 overflow-hidden"
              : "opacity-100 translate-x-0 scale-100"
          }`}
          style={{
            transitionDelay: isCollapsed ? "0ms" : "100ms",
          }}
        >
          PHENIKAA HUB
        </h1>
        <button
          className={`rounded-lg hover:bg-white/10 transition-all duration-500 ease-in-out ${
            isCollapsed ? "p-1.5" : "p-2"
          }`}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav
        className={`transition-all duration-500 ease-in-out mt-4 transform ${
          isCollapsed ? "px-2" : "px-4"
        }`}
        style={{
          transitionDelay: isCollapsed ? "0ms" : "50ms",
        }}
      >
        <ul
          className={`transition-all duration-500 ease-in-out ${
            isCollapsed ? "space-y-1" : "space-y-2"
          }`}
        >
          {menuItems.map((item, index) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={`flex items-center rounded-lg transition-all duration-500 ease-in-out hover:bg-white/10 ${
                  isCollapsed
                    ? "px-2 py-3 justify-center h-12"
                    : "px-3 py-3 gap-3 h-12"
                } ${
                  location.pathname === item.path
                    ? "bg-white/20 text-white font-semibold"
                    : "text-white/80 hover:text-white"
                }`}
                onClick={handleMenuClick}
                title={item.tooltip}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span
                  className={`transition-all duration-500 ease-in-out transform ${
                    isCollapsed
                      ? "opacity-0 translate-x-2 scale-95 w-0 overflow-hidden"
                      : "opacity-100 translate-x-0 scale-100"
                  }`}
                  style={{
                    transitionDelay: isCollapsed ? "0ms" : `${index * 50}ms`,
                  }}
                >
                  {item.text}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logo Section */}
      <div
        className={`mt-auto p-4 border-t border-white/20 ${
          isCollapsed ? "px-2" : "px-4"
        }`}
      >
        <div
          className={`flex items-center justify-center ${
            isCollapsed ? "flex-col" : "flex-row gap-3"
          }`}
        >
          <img
            src="/phenikaa.png"
            alt="Phenikaa Logo"
            className={`${
              isCollapsed ? "w-12 h-12" : "w-16 h-16"
            } object-contain`}
          />
        </div>
      </div>
    </div>
  );
};

SidebarOfStudent.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  onMenuItemClick: PropTypes.func,
};

export default SidebarOfStudent;
