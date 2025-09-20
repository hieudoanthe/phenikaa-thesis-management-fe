import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import PropTypes from "prop-types";

const SidebarOfAdmin = ({ isCollapsed, onToggleCollapse, onMenuItemClick }) => {
  const location = useLocation();

  const handleMenuClick = () => {
    if (onMenuItemClick) {
      onMenuItemClick();
    }
  };

  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // Menu items cho admin
  const menuItems = [
    {
      path: "/admin/statistics",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-clipboard-data-fill"
          viewBox="0 0 16 16"
        >
          <path d="M6.5 0A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0zm3 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1A2.5 2.5 0 0 1 9.5 5h-3A2.5 2.5 0 0 1 4 2.5zM10 8a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zm-6 4a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm4-3a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1" />
        </svg>
      ),
      text: "Thống kê",
      tooltip: "Thống kê",
    },
    {
      path: "/admin/user-management",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-person-fill-gear"
          viewBox="0 0 16 16"
        >
          <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4m9.886-3.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382zM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0" />
        </svg>
      ),
      text: "Quản lý người dùng",
      tooltip: "Quản lý người dùng",
    },

    {
      path: "/admin/academic-year",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-mortarboard-fill"
          viewBox="0 0 16 16"
        >
          <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917z" />
          <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466z" />
        </svg>
      ),
      text: "Quản lý năm học",
      tooltip: "Quản lý năm học",
    },

    {
      path: "/admin/student-period",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-people-fill"
          viewBox="0 0 16 16"
        >
          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
        </svg>
      ),
      text: "Quản lý sinh viên",
      tooltip: "Quản lý sinh viên",
    },
    {
      path: "/admin/notifications",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      ),
      text: "Thông báo",
      tooltip: "Thông báo",
    },
    {
      path: "/admin/settings",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
        </svg>
      ),
      text: "Cài đặt",
      tooltip: "Cài đặt",
    },
  ];

  // Chia menu thành 2 phần: trước nhóm và sau nhóm
  const firstBlockPaths = [
    "/admin/statistics",
    "/admin/user-management",
    "/admin/academic-year",
  ];
  const firstItems = menuItems.filter((m) => firstBlockPaths.includes(m.path));
  const restItems = menuItems.filter(
    (m) =>
      !firstBlockPaths.includes(m.path) && m.path !== "/admin/student-period"
  );

  return (
    <div
      className={`h-full flex flex-col bg-gradient-to-br from-secondary to-secondary-light text-white transition-all duration-500 ease-in-out overflow-visible ${
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
          {firstItems.map((item, index) => (
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

          {/* Nhóm: Quản lý đăng ký trực tuyến */}
          <li
            className="relative"
            onMouseEnter={() => {
              if (isCollapsed) setIsRegistrationOpen(true);
            }}
            onMouseLeave={() => {
              if (isCollapsed) setIsRegistrationOpen(false);
            }}
          >
            <button
              type="button"
              className={`w-full flex items-center rounded-lg transition-all duration-500 ease-in-out ${
                isCollapsed
                  ? "px-2 py-3 justify-center h-12"
                  : "px-3 py-3 gap-3 h-12"
              } ${
                [
                  "/admin/registration-period",
                  "/admin/defense-schedule",
                  "/admin/defense-sessions",
                ].includes(location.pathname)
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
              onClick={() => setIsRegistrationOpen((o) => !o)}
              title="Quản lý đăng ký trực tuyến"
            >
              <span className="flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 4h18v2H3V4zm0 6h18v2H3v-2zm0 6h18v2H3v-2z" />
                </svg>
              </span>
              <div
                className={`transition-all duration-500 ease-in-out transform ${
                  isCollapsed
                    ? "opacity-0 translate-x-2 scale-95 w-0 overflow-hidden"
                    : "opacity-100 translate-x-0 scale-100"
                }`}
              >
                <div className="block">Quản lý ĐKTT</div>
              </div>
              {!isCollapsed && (
                <span className="ml-auto text-white/80">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`${
                      isRegistrationOpen ? "rotate-180" : ""
                    } transition-transform`}
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </span>
              )}
            </button>

            {/* Dropdown items - expanded mode */}
            {!isCollapsed && isRegistrationOpen && (
              <ul className="mt-1 ml-4 border-l border-white/20">
                <li>
                  <NavLink
                    to="/admin/registration-period"
                    className={`flex items-center gap-3 pl-1 py-2 text-sm rounded-lg hover:bg-white/10 ${
                      location.pathname === "/admin/registration-period"
                        ? "bg-white/20 text-white"
                        : "text-white/80"
                    }`}
                    onClick={handleMenuClick}
                  >
                    <span className="w-2 h-2 rounded-full bg-white/70 -ml-2"></span>
                    <span>Quản lý đợt đăng ký</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/defense-schedule"
                    className={`flex items-center gap-3 pl-1 py-2 text-sm rounded-lg hover:bg-white/10 ${
                      location.pathname === "/admin/defense-schedule"
                        ? "bg-white/20 text-white"
                        : "text-white/80"
                    }`}
                    onClick={handleMenuClick}
                  >
                    <span className="w-2 h-2 rounded-full bg-white/70 -ml-2"></span>
                    <span>Quản lý lịch bảo vệ</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/defense-sessions"
                    className={`flex items-center gap-3 pl-1 py-2 text-sm rounded-lg hover:bg-white/10 ${
                      location.pathname === "/admin/defense-sessions"
                        ? "bg-white/20 text-white"
                        : "text-white/80"
                    }`}
                    onClick={handleMenuClick}
                  >
                    <span className="w-2 h-2 rounded-full bg-white/70 -ml-2"></span>
                    <span>Quản lý buổi bảo vệ</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/student-period"
                    className={`flex items-center gap-3 pl-1 py-2 text-sm rounded-lg hover:bg-white/10 ${
                      location.pathname === "/admin/student-period"
                        ? "bg-white/20 text-white"
                        : "text-white/80"
                    }`}
                    onClick={handleMenuClick}
                  >
                    <span className="w-2 h-2 rounded-full bg-white/70 -ml-2"></span>
                    <span>Quản lý sinh viên</span>
                  </NavLink>
                </li>
              </ul>
            )}

            {/* Dropdown items - collapsed hover flyout */}
            {/* Hover flyout with optional gap (bridge keeps it open) */}
            {isCollapsed && isRegistrationOpen && (
              <>
                {/* Invisible hover bridge so moving across the gap doesn't close */}
                <div
                  className="absolute left-full top-0 h-12 w-4 z-40"
                  onMouseEnter={() => setIsRegistrationOpen(true)}
                  onMouseLeave={() => setIsRegistrationOpen(false)}
                />
                <ul
                  className="absolute left-full top-0 ml-3 w-56 bg-secondary/95 text-white rounded-lg shadow-xl p-2 space-y-1 z-50"
                  onMouseEnter={() => setIsRegistrationOpen(true)}
                  onMouseLeave={() => setIsRegistrationOpen(false)}
                >
                  <li>
                    <NavLink
                      to="/admin/registration-period"
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-white/10 ${
                        location.pathname === "/admin/registration-period"
                          ? "bg-white/20 text-white"
                          : "text-white/80"
                      }`}
                      onClick={handleMenuClick}
                    >
                      <span className="w-2 h-2 rounded-full bg-white/70"></span>
                      <span>Quản lý đợt đăng ký</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/defense-schedule"
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-white/10 ${
                        location.pathname === "/admin/defense-schedule"
                          ? "bg-white/20 text-white"
                          : "text-white/80"
                      }`}
                      onClick={handleMenuClick}
                    >
                      <span className="w-2 h-2 rounded-full bg-white/70"></span>
                      <span>Quản lý lịch bảo vệ</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/defense-sessions"
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-white/10 ${
                        location.pathname === "/admin/defense-sessions"
                          ? "bg-white/20 text-white"
                          : "text-white/80"
                      }`}
                      onClick={handleMenuClick}
                    >
                      <span className="w-2 h-2 rounded-full bg-white/70"></span>
                      <span>Quản lý buổi bảo vệ</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/student-period"
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-white/10 ${
                        location.pathname === "/admin/student-period"
                          ? "bg-white/20 text-white"
                          : "text-white/80"
                      }`}
                      onClick={handleMenuClick}
                    >
                      <span className="w-2 h-2 rounded-full bg-white/70"></span>
                      <span>Quản lý sinh viên</span>
                    </NavLink>
                  </li>
                </ul>
              </>
            )}
          </li>

          {/* Phần còn lại sau nhóm */}
          {restItems.map((item, index) => (
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

SidebarOfAdmin.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  onMenuItemClick: PropTypes.func,
};

export default SidebarOfAdmin;
