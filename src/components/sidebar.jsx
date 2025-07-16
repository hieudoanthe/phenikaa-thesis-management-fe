import React from "react";
import "../styles/pages/admin/style.css";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const sidebarItems = [
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <rect
          x="2.5"
          y="2.5"
          width="15"
          height="15"
          rx="3"
          fill="currentColor"
        />
        <rect x="6" y="6" width="3" height="3" rx="1" fill="#fff" />
        <rect x="11" y="6" width="3" height="3" rx="1" fill="#fff" />
        <rect x="6" y="11" width="3" height="3" rx="1" fill="#fff" />
        <rect x="11" y="11" width="3" height="3" rx="1" fill="#fff" />
      </svg>
    ),
    label: "Dashboard",
    route: "/admin/dashboard",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <path
          d="M10 10a3 3 0 100-6 3 3 0 000 6zM3 16a7 7 0 0114 0v1H3v-1z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Users",
    route: "/admin/user-management",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <rect x="3" y="5" width="14" height="10" rx="2" fill="currentColor" />
        <rect x="6" y="8" width="8" height="4" rx="1" fill="#fff" />
      </svg>
    ),
    label: "Topics",
    route: "/admin/topic-management",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <path d="M5 8a5 5 0 1110 0v2a5 5 0 01-10 0V8z" fill="currentColor" />
        <rect x="4" y="14" width="12" height="2" rx="1" fill="currentColor" />
      </svg>
    ),
    label: "Groups",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <rect x="3" y="4" width="14" height="12" rx="2" fill="currentColor" />
        <rect x="6" y="7" width="8" height="2" rx="1" fill="#fff" />
        <rect x="6" y="11" width="5" height="2" rx="1" fill="#fff" />
      </svg>
    ),
    label: "Assignments",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path
          d="M10 5v5l3 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    label: "Defense Schedule",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <rect x="3" y="3" width="14" height="14" rx="2" fill="currentColor" />
        <rect x="7" y="7" width="6" height="6" rx="1" fill="#fff" />
      </svg>
    ),
    label: "Statistics",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <path
          d="M10 2a8 8 0 100 16 8 8 0 000-16zM10 14v.01M10 6v4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    label: "Notifications",
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path
          d="M10 6v4l3 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    label: "Settings",
  },
];

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <aside
      className={`sidebar sidebar-modern${
        collapsed ? " sidebar-collapsed" : ""
      }`}
    >
      <div className="sidebar-header-modern">
        <span className="sidebar-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <ellipse
              cx="16"
              cy="24"
              rx="12"
              ry="4"
              fill="#fff"
              fillOpacity="0.2"
            />
            <path
              d="M16 4l12 6-12 6-12-6 12-6z"
              fill="#fff"
              stroke="#fff"
              strokeWidth="1.5"
            />
            <circle
              cx="16"
              cy="10"
              r="2.5"
              fill="#ff6600"
              stroke="#fff"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        {!collapsed && <span className="sidebar-title">GradProject Admin</span>}
      </div>
      <nav className="sidebar-nav-modern">
        <ul>
          {sidebarItems.map((item, idx) => {
            const isActive = item.route === location.pathname;
            return (
              <li key={item.label} className={isActive ? "active" : ""}>
                {item.route ? (
                  <button
                    type="button"
                    onClick={() => navigate(item.route)}
                    className="sidebar-btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="sidebar-icon-svg">{item.icon}</span>
                    {!collapsed && (
                      <span className="sidebar-label">{item.label}</span>
                    )}
                  </button>
                ) : (
                  <>
                    <span className="sidebar-icon-svg">{item.icon}</span>
                    {!collapsed && (
                      <span className="sidebar-label">{item.label}</span>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

Sidebar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
};

export default Sidebar;
