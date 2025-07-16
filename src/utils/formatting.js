// Formatting utilities

/**
 * Format date sang định dạng Việt Nam
 * @param {Date|string} date - Date cần format
 * @param {string} format - Format mong muốn ('short', 'long', 'time')
 * @returns {string} - Date đã format
 */
export const formatDate = (date, format = "short") => {
  if (!date) return "";

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) return "";

  const options = {
    short: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
    long: {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
    time: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  };

  return dateObj.toLocaleDateString("vi-VN", options[format] || options.short);
};

/**
 * Format time sang định dạng Việt Nam
 * @param {Date|string} time - Time cần format
 * @returns {string} - Time đã format
 */
export const formatTime = (time) => {
  if (!time) return "";

  const timeObj = new Date(time);

  if (isNaN(timeObj.getTime())) return "";

  return timeObj.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format datetime sang định dạng Việt Nam
 * @param {Date|string} datetime - Datetime cần format
 * @returns {string} - Datetime đã format
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return "";

  const dateObj = new Date(datetime);

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format relative time (ví dụ: "2 giờ trước")
 * @param {Date|string} date - Date cần format
 * @returns {string} - Relative time
 */
export const formatRelativeTime = (date) => {
  if (!date) return "";

  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) {
    return "Vừa xong";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
};

/**
 * Format số tiền sang định dạng Việt Nam
 * @param {number} amount - Số tiền cần format
 * @param {string} currency - Đơn vị tiền tệ
 * @returns {string} - Số tiền đã format
 */
export const formatCurrency = (amount, currency = "VND") => {
  if (amount === null || amount === undefined) return "";

  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
  });

  return formatter.format(amount);
};

/**
 * Format số với dấu phẩy ngăn cách
 * @param {number} number - Số cần format
 * @returns {string} - Số đã format
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return "";

  return new Intl.NumberFormat("vi-VN").format(number);
};

/**
 * Format text thành title case
 * @param {string} text - Text cần format
 * @returns {string} - Text đã format
 */
export const formatTitleCase = (text) => {
  if (!text) return "";

  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Truncate text với ellipsis
 * @param {string} text - Text cần truncate
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} - Text đã truncate
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + "...";
};

/**
 * Format phone number
 * @param {string} phone - Phone number cần format
 * @returns {string} - Phone number đã format
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  // Loại bỏ tất cả ký tự không phải số
  const cleaned = phone.replace(/\D/g, "");

  // Format theo định dạng Việt Nam
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  }

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
  }

  return phone;
};

/**
 * Format student ID
 * @param {string} studentId - Student ID cần format
 * @returns {string} - Student ID đã format
 */
export const formatStudentId = (studentId) => {
  if (!studentId) return "";

  // Loại bỏ tất cả ký tự không phải số
  const cleaned = studentId.replace(/\D/g, "");

  // Format theo định dạng 8 số
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{4})(\d{4})/, "$1-$2");
  }

  return studentId;
};

/**
 * Capitalize first letter
 * @param {string} text - Text cần capitalize
 * @returns {string} - Text đã capitalize
 */
export const capitalize = (text) => {
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
