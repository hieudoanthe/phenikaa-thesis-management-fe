import React from "react";
import "../styles/pages/admin/style.css";
import PropTypes from "prop-types";
import "bootstrap-icons/font/bootstrap-icons.css";

const Navbar = ({ onHamburgerClick, welcomeText }) => {
  return (
    <header className="navbar-modern">
      <div className="navbar-left-group">
        <button
          className="navbar-hamburger navbar-hamburger-desktop"
          onClick={onHamburgerClick}
          type="button"
          style={{
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 0,
          }}
          aria-label="Mở menu"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#fff6f0" />
            <rect x="8" y="10" width="12" height="2" rx="1" fill="#ff6600" />
            <rect x="8" y="13" width="12" height="2" rx="1" fill="#ff6600" />
            <rect x="8" y="16" width="12" height="2" rx="1" fill="#ff6600" />
          </svg>
        </button>
        <div className="navbar-welcome">{welcomeText || "Welcome, Admin"}</div>
      </div>
      <div className="navbar-actions">
        <span className="navbar-bell" title="Notifications">
          <i className="bi bi-bell-fill"></i>
        </span>
        <span className="navbar-avatar">
          <img src="https://i.pravatar.cc/32" alt="avatar" />
        </span>
      </div>
    </header>
  );
};

Navbar.propTypes = {
  onHamburgerClick: PropTypes.func.isRequired,
  welcomeText: PropTypes.string,
};

export default Navbar;
