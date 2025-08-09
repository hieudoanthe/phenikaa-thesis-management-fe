import React, { useEffect } from "react";
import PropTypes from "prop-types";
import "../../styles/modal/confirm_modal.css";

/**
 * Modal xác nhận dùng chung
 * - Sử dụng các lớp `.admin-modal-*` sẵn có để đồng bộ giao diện
 */
const ConfirmModal = ({
  isOpen,
  title = "Xác nhận hành động",
  message = "Bạn có chắc chắn muốn thực hiện hành động này?",
  confirmText = "Đồng ý",
  cancelText = "Hủy",
  confirmVariant = "success",
  onConfirm,
  onCancel,
  loading = false,
}) => {
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
    <div className="confirm-modal-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal-box">
        <div className="confirm-modal-header">
          <h3 id="confirm-modal-title" className="confirm-modal-title">
            {title}
          </h3>
        </div>

        <div className="confirm-modal-content">
          <p className="confirm-modal-message">{message}</p>
        </div>

        <div className="confirm-modal-btn-row">
          <button
            type="button"
            className="confirm-modal-btn outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-modal-btn ${confirmVariant}`}
            onClick={onConfirm}
            disabled={loading}
            aria-label={confirmText}
          >
            {loading ? "Đang xử lý..." : confirmText}
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
