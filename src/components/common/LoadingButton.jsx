import React from "react";

const LoadingButton = ({
  type = "button",
  isLoading = false,
  disabled = false,
  className = "",
  loadingText = "Đang xử lý...",
  children,
  onClick,
}) => {
  const finalDisabled = disabled || isLoading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={finalDisabled}
      className={className + (finalDisabled ? " cursor-not-allowed" : "")}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-white rounded-full animate-spin"></span>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
