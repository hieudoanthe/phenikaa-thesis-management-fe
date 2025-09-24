import { toast } from "react-toastify";

// Helper hiển thị toast sử dụng react-toastify
export const showToast = (message, type = "success") => {
  try {
    if (type === "error") return toast.error(message);
    if (type === "warning") return toast.warn(message);
    if (type === "info") return toast.info(message);
    return toast.success(message);
  } catch (err) {
    console.error("Không thể hiển thị toast:", err);
    (type === "success" ? console.log : console.error)(message);
  }
};

// Helper để clear tất cả toast trước khi hiển thị toast mới
export const clearAndShowToast = (message, type = "success") => {
  toast.dismiss(); // Clear tất cả toast hiện tại
  showToast(message, type);
};

// Helper để hiển thị toast với auto close
export const showToastWithAutoClose = (
  message,
  type = "success",
  autoClose = 3000
) => {
  const toastId = showToast(message, type);
  if (toastId) {
    setTimeout(() => {
      toast.dismiss(toastId);
    }, autoClose);
  }
};
