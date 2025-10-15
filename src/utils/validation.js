// Validation utilities

/**
 * Kiểm tra email có hợp lệ không
 * @param {string} email - Email cần kiểm tra
 * @returns {boolean} - Email có hợp lệ không
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Kiểm tra password có đủ mạnh không
 * @param {string} password - Password cần kiểm tra
 * @returns {Object} - { isValid, errors }
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push("Mật khẩu không được để trống");
  } else {
    if (password.length < 8) {
      errors.push("Mật khẩu phải có ít nhất 8 ký tự");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Mật khẩu phải có ít nhất 1 chữ hoa");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Mật khẩu phải có ít nhất 1 chữ thường");
    }
    if (!/\d/.test(password)) {
      errors.push("Mật khẩu phải có ít nhất 1 số");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Kiểm tra phone number có hợp lệ không
 * @param {string} phone - Phone number cần kiểm tra
 * @returns {boolean} - Phone number có hợp lệ không
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone);
};

/**
 * Kiểm tra student ID có hợp lệ không
 * @param {string} studentId - Student ID cần kiểm tra
 * @returns {boolean} - Student ID có hợp lệ không
 */
export const isValidStudentId = (studentId) => {
  const studentIdRegex = /^[0-9]{8,10}$/;
  return studentIdRegex.test(studentId);
};

/**
 * Kiểm tra tên có hợp lệ không
 * @param {string} name - Tên cần kiểm tra
 * @returns {Object} - { isValid, errors }
 */
export const validateName = (name) => {
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push("Tên không được để trống");
  } else {
    if (name.trim().length < 2) {
      errors.push("Tên phải có ít nhất 2 ký tự");
    }
    if (name.trim().length > 50) {
      errors.push("Tên không được quá 50 ký tự");
    }
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(name)) {
      errors.push("Tên chỉ được chứa chữ cái và khoảng trắng");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Kiểm tra thesis title có hợp lệ không
 * @param {string} title - Title cần kiểm tra
 * @returns {Object} - { isValid, errors }
 */
export const validateThesisTitle = (title) => {
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push("Tiêu đề không được để trống");
  } else {
    if (title.trim().length < 10) {
      errors.push("Tiêu đề phải có ít nhất 10 ký tự");
    }
    if (title.trim().length > 200) {
      errors.push("Tiêu đề không được quá 200 ký tự");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Kiểm tra thesis description có hợp lệ không
 * @param {string} description - Description cần kiểm tra
 * @returns {Object} - { isValid, errors }
 */
export const validateThesisDescription = (description) => {
  const errors = [];

  if (!description || description.trim().length === 0) {
    errors.push("Mô tả không được để trống");
  } else {
    if (description.trim().length < 20) {
      errors.push("Mô tả phải có ít nhất 20 ký tự");
    }
    if (description.trim().length > 1000) {
      errors.push("Mô tả không được quá 1000 ký tự");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Kiểm tra file có hợp lệ không
 * @param {File} file - File cần kiểm tra
 * @param {Array} allowedTypes - Các loại file được phép
 * @param {number} maxSize - Kích thước tối đa (bytes)
 * @returns {Object} - { isValid, errors }
 */
export const validateFile = (
  file,
  allowedTypes = [],
  maxSize = 10 * 1024 * 1024
) => {
  const errors = [];

  if (!file) {
    errors.push("Vui lòng chọn file");
  } else {
    // Kiểm tra file type
    if (allowedTypes.length > 0) {
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        errors.push(
          `File không đúng định dạng. Chỉ chấp nhận: ${allowedTypes.join(", ")}`
        );
      }
    }

    // Kiểm tra file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      errors.push(`File quá lớn. Kích thước tối đa: ${maxSizeMB}MB`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format file size từ bytes sang human readable
 * @param {number} bytes - Kích thước file (bytes)
 * @returns {string} - Kích thước đã format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Validators with error-message outputs for form live validation
export const validateEmailBasic = (email) => {
  if (!email) return "Vui lòng nhập email";
  const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  if (!simpleEmailRegex.test(email)) return "Email không hợp lệ";
  return "";
};

export const validatePasswordLogin = (password) => {
  if (!password) return "Vui lòng nhập mật khẩu";
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Mật khẩu phải chứa chữ và số";
  }
  return "";
};
