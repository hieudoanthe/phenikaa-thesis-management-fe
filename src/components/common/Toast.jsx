import React from "react";

const Toast = ({ message, type = "success", duration = 3500, onClose }) => {
  const isSuccess = type === "success" || message.includes("thành công");

  return (
    <div
      style={{
        background: isSuccess ? "#4caf50" : "#e53935",
        color: "#fff",
        borderRadius: 8,
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        fontWeight: 500,
        fontSize: "1rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        minWidth: 320,
        marginTop: 8,
        animation: "fadeInUp 0.3s",
      }}
    >
      {isSuccess ? (
        <svg
          style={{ marginRight: 12 }}
          width="22"
          height="22"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#fff"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22,4 12,14.01 9,11.01" />
        </svg>
      ) : (
        <svg
          style={{ marginRight: 12 }}
          width="22"
          height="22"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#fff"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" fill="#e53935" />
          <line x1="8" y1="8" x2="16" y2="16" stroke="#fff" strokeWidth="2" />
          <line x1="16" y1="8" x2="8" y2="16" stroke="#fff" strokeWidth="2" />
        </svg>
      )}
      {message}
    </div>
  );
};

export default Toast;
