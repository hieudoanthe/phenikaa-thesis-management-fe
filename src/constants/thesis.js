// Thesis Status
export const THESIS_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// Status Labels (hiển thị cho người dùng)
export const STATUS_LABELS = {
  [THESIS_STATUS.DRAFT]: 'Bản nháp',
  [THESIS_STATUS.SUBMITTED]: 'Đã nộp',
  [THESIS_STATUS.UNDER_REVIEW]: 'Đang thẩm định',
  [THESIS_STATUS.APPROVED]: 'Đã duyệt',
  [THESIS_STATUS.REJECTED]: 'Từ chối',
  [THESIS_STATUS.COMPLETED]: 'Hoàn thành',
  [THESIS_STATUS.CANCELLED]: 'Đã hủy',
};

// Status Colors (cho UI)
export const STATUS_COLORS = {
  [THESIS_STATUS.DRAFT]: 'gray',
  [THESIS_STATUS.SUBMITTED]: 'blue',
  [THESIS_STATUS.UNDER_REVIEW]: 'yellow',
  [THESIS_STATUS.APPROVED]: 'green',
  [THESIS_STATUS.REJECTED]: 'red',
  [THESIS_STATUS.COMPLETED]: 'green',
  [THESIS_STATUS.CANCELLED]: 'gray',
};

// Thesis Types
export const THESIS_TYPES = {
  BACHELOR: 'BACHELOR',
  MASTER: 'MASTER',
  DOCTORAL: 'DOCTORAL',
};

// Thesis Type Labels
export const THESIS_TYPE_LABELS = {
  [THESIS_TYPES.BACHELOR]: 'Cử nhân',
  [THESIS_TYPES.MASTER]: 'Thạc sĩ',
  [THESIS_TYPES.DOCTORAL]: 'Tiến sĩ',
};

// File Types được phép upload
export const ALLOWED_FILE_TYPES = {
  THESIS: ['.pdf', '.doc', '.docx'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif'],
  ALL: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'],
};

// File Size Limits (bytes)
export const FILE_SIZE_LIMITS = {
  THESIS: 10 * 1024 * 1024, // 10MB
  IMAGE: 5 * 1024 * 1024, // 5MB
  ALL: 20 * 1024 * 1024, // 20MB
};

// Helper function để kiểm tra status có thể edit không
export const canEditStatus = (currentStatus) => {
  return [
    THESIS_STATUS.DRAFT,
    THESIS_STATUS.SUBMITTED,
    THESIS_STATUS.REJECTED,
  ].includes(currentStatus);
};

// Helper function để kiểm tra status có thể delete không
export const canDeleteStatus = (currentStatus) => {
  return [
    THESIS_STATUS.DRAFT,
    THESIS_STATUS.SUBMITTED,
    THESIS_STATUS.REJECTED,
  ].includes(currentStatus);
};

// Helper function để lấy next status có thể chuyển đến
export const getNextPossibleStatuses = (currentStatus, userRole) => {
  const statusTransitions = {
    [THESIS_STATUS.DRAFT]: [THESIS_STATUS.SUBMITTED],
    [THESIS_STATUS.SUBMITTED]: [THESIS_STATUS.UNDER_REVIEW, THESIS_STATUS.REJECTED],
    [THESIS_STATUS.UNDER_REVIEW]: [THESIS_STATUS.APPROVED, THESIS_STATUS.REJECTED],
    [THESIS_STATUS.APPROVED]: [THESIS_STATUS.COMPLETED],
    [THESIS_STATUS.REJECTED]: [THESIS_STATUS.SUBMITTED],
  };

  return statusTransitions[currentStatus] || [];
};

// Helper function để kiểm tra file type có hợp lệ không
export const isValidFileType = (fileName, allowedTypes) => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return allowedTypes.includes(extension);
};

// Helper function để kiểm tra file size có hợp lệ không
export const isValidFileSize = (fileSize, maxSize) => {
  return fileSize <= maxSize;
}; 