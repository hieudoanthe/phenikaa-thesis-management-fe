import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

/**
 * Modal xác nhận dùng chung
 * - Sử dụng Tailwind CSS để đồng bộ giao diện với các modal khác
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  confirmVariant = "success",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation();
  // Đóng bằng phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[1100] flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h3
            id="confirm-modal-title"
            className="m-0 text-xl font-bold text-gray-900"
          >
            {title || t("common.confirmAction")}
          </h3>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="m-0 text-gray-600 text-base leading-relaxed">
            {message || t("common.confirmMessage")}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            className="px-6 py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText || t("common.cancel")}
          </button>
          <button
            type="button"
            className={`px-6 py-2.5 text-base font-medium text-white rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
              confirmVariant === "danger"
                ? "bg-error-500 hover:bg-error-600"
                : "bg-success-500 hover:bg-success-600"
            }`}
            onClick={onConfirm}
            disabled={loading}
            aria-label={confirmText}
          >
            {loading
              ? t("common.processing")
              : confirmText || t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmVariant: PropTypes.oneOf(["success", "danger"]),
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  loading: PropTypes.bool,
};
