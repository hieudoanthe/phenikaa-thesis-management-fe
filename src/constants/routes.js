// Application Routes
export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",

  // User routes
  USER_HOME: "/home",
  USER_PROFILE: "/profile",
  USER_SETTINGS: "/settings",

  // Thesis routes
  THESIS_LIST: "/thesis",
  THESIS_DETAIL: (id) => `/thesis/${id}`,
  THESIS_CREATE: "/thesis/create",
  THESIS_EDIT: (id) => `/thesis/${id}/edit`,

  // Admin routes
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_TOPICS: "/admin/topics",
  ADMIN_THESIS: "/admin/thesis",
  ADMIN_SETTINGS: "/admin/settings",
  ADMIN_STATISTICS: "/admin/statistics",

  // Lecturer routes
  LECTURER_DASHBOARD: "/lecturer/dashboard",
  LECTURER_THESIS: "/lecturer/thesis",
  LECTURER_TOPICS: "/lecturer/topics",
  LECTURER_STUDENTS: "/lecturer/students",
};

// Navigation menu items
export const NAVIGATION_ITEMS = {
  STUDENT: [
    {
      label: "Trang chủ",
      path: ROUTES.USER_HOME,
      icon: "home",
    },
    {
      label: "Luận văn",
      path: ROUTES.THESIS_LIST,
      icon: "document",
    },
    {
      label: "Hồ sơ",
      path: ROUTES.USER_PROFILE,
      icon: "user",
    },
  ],
  LECTURER: [
    {
      label: "Dashboard",
      path: ROUTES.LECTURER_DASHBOARD,
      icon: "dashboard",
    },
    {
      label: "Quản lý luận văn",
      path: ROUTES.LECTURER_THESIS,
      icon: "document",
    },
    {
      label: "Quản lý đề tài",
      path: ROUTES.LECTURER_TOPICS,
      icon: "folder",
    },
    {
      label: "Sinh viên",
      path: ROUTES.LECTURER_STUDENTS,
      icon: "users",
    },
  ],
  ADMIN: [
    {
      label: "Dashboard",
      path: ROUTES.ADMIN_DASHBOARD,
      icon: "dashboard",
    },
    {
      label: "Quản lý người dùng",
      path: ROUTES.ADMIN_USERS,
      icon: "users",
    },
    {
      label: "Quản lý đề tài",
      path: ROUTES.ADMIN_TOPICS,
      icon: "folder",
    },
    {
      label: "Quản lý luận văn",
      path: ROUTES.ADMIN_THESIS,
      icon: "document",
    },
    {
      label: "Thống kê",
      path: ROUTES.ADMIN_STATISTICS,
      icon: "chart",
    },
    {
      label: "Cài đặt",
      path: ROUTES.ADMIN_SETTINGS,
      icon: "settings",
    },
  ],
};

// Breadcrumb items
export const BREADCRUMB_ITEMS = {
  [ROUTES.USER_HOME]: [{ label: "Trang chủ", path: ROUTES.USER_HOME }],
  [ROUTES.THESIS_LIST]: [
    { label: "Trang chủ", path: ROUTES.USER_HOME },
    { label: "Luận văn", path: ROUTES.THESIS_LIST },
  ],
  [ROUTES.ADMIN_DASHBOARD]: [
    { label: "Dashboard", path: ROUTES.ADMIN_DASHBOARD },
  ],
  [ROUTES.ADMIN_USERS]: [
    { label: "Dashboard", path: ROUTES.ADMIN_DASHBOARD },
    { label: "Quản lý người dùng", path: ROUTES.ADMIN_USERS },
  ],
};

// Helper function để lấy navigation items theo role
export const getNavigationItems = (userRole) => {
  return NAVIGATION_ITEMS[userRole] || [];
};

// Helper function để lấy breadcrumb items
export const getBreadcrumbItems = (path) => {
  return BREADCRUMB_ITEMS[path] || [];
};

// Helper function để kiểm tra route có phải public không
export const isPublicRoute = (path) => {
  const publicRoutes = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.REGISTER];
  return publicRoutes.includes(path);
};

// Helper function để kiểm tra route có phải admin không
export const isAdminRoute = (path) => {
  return path.startsWith("/admin");
};

// Helper function để kiểm tra route có phải lecturer không
export const isLecturerRoute = (path) => {
  return path.startsWith("/lecturer");
};
