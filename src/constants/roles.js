// User Roles
export const USER_ROLES = {
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
};

// Role Labels (hiển thị cho người dùng)
export const ROLE_LABELS = {
  [USER_ROLES.STUDENT]: "Sinh viên",
  [USER_ROLES.TEACHER]: "Giảng viên",
  [USER_ROLES.ADMIN]: "Quản trị viên",
};

// Permissions cho từng role
export const ROLE_PERMISSIONS = {
  [USER_ROLES.STUDENT]: [
    "VIEW_OWN_THESIS",
    "CREATE_THESIS",
    "UPDATE_OWN_THESIS",
    "DELETE_OWN_THESIS",
    "UPLOAD_THESIS_FILE",
    "VIEW_TOPICS",
    "SELECT_TOPIC",
  ],
  [USER_ROLES.LECTURER]: [
    "VIEW_ALL_THESIS",
    "REVIEW_THESIS",
    "APPROVE_THESIS",
    "REJECT_THESIS",
    "CREATE_TOPIC",
    "UPDATE_TOPIC",
    "DELETE_TOPIC",
    "VIEW_STUDENTS",
    "ASSIGN_TOPIC",
  ],
  [USER_ROLES.ADMIN]: [
    "VIEW_ALL_THESIS",
    "MANAGE_USERS",
    "MANAGE_ROLES",
    "MANAGE_TOPICS",
    "VIEW_STATISTICS",
    "SYSTEM_SETTINGS",
    "BACKUP_DATA",
  ],
  [USER_ROLES.SUPERVISOR]: [
    "VIEW_ALL_THESIS",
    "REVIEW_THESIS",
    "APPROVE_THESIS",
    "REJECT_THESIS",
    "VIEW_STATISTICS",
    "MANAGE_TOPICS",
  ],
};

// Helper function để kiểm tra permission
export const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

// Helper function để kiểm tra role
export const hasRole = (userRole, requiredRole) => {
  return userRole === requiredRole;
};

// Helper function để kiểm tra có phải admin không
export const isAdmin = (userRole) => {
  return userRole === USER_ROLES.ADMIN;
};

// Helper function để kiểm tra có phải lecturer không
export const isLecturer = (userRole) => {
  return userRole === USER_ROLES.LECTURER;
};

// Helper function để kiểm tra có phải student không
export const isStudent = (userRole) => {
  return userRole === USER_ROLES.STUDENT;
};
