import React from "react";
import PropTypes from "prop-types";

/**
 * Component hiển thị trang "đang phát triển"
 * @param {Object} props
 * @param {string} props.title - Tiêu đề trang
 * @param {string} props.description - Mô tả trang
 */
const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <div className="placeholder-icon">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <h1 className="placeholder-title">{title}</h1>
        <p className="placeholder-description">{description}</p>
      </div>
    </div>
  );
};

PlaceholderPage.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default PlaceholderPage;
