import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AdminHeader = ({
  currentPage,
  isNotificationOpen,
  isUserDropdownOpen,
  notifications,
  onToggleSidebar,
  onToggleNotification,
  onToggleUserDropdown,
  onLogout,
  onMarkAllAsRead,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Chỉ xử lý khi dropdown đang mở
      if (
        isNotificationOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        onToggleNotification();
      }
      if (
        isUserDropdownOpen &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        onToggleUserDropdown();
      }
    };

    // Chỉ add listener khi có dropdown mở
    if (isNotificationOpen || isUserDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isNotificationOpen,
    isUserDropdownOpen,
    onToggleNotification,
    onToggleUserDropdown,
  ]);

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n?.isRead).length
    : 0;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          {/* Hamburger Menu Button - Chỉ hiện trên mobile */}
          <button
            className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 mr-2 sm:mr-3 md:mr-4 text-gray-600"
            onClick={onToggleSidebar}
            aria-label={t("common.toggleMenu")}
          >
            <svg
              width="20"
              height="20"
              className="sm:w-6 sm:h-6 md:w-6 md:h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="animate-fade-in-up min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 m-0 leading-tight truncate">
              {currentPage.title}
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-gray-600 m-0 leading-relaxed mt-0.5 sm:mt-1 truncate">
              {currentPage.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-6 flex-shrink-0">
          {/* Notification Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              className="relative cursor-pointer p-1.5 sm:p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 border-none bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                onToggleNotification();
              }}
              aria-label={t("common.notifications")}
            >
              <svg
                width="20"
                height="20"
                className="sm:w-5 sm:h-5 md:w-5 md:h-5 text-gray-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-full min-w-[16px] sm:min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {isNotificationOpen && (
              <div className="fixed top-20 left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-200 ring-1 ring-black/5 z-50 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:w-96 sm:mt-3 animate-fade-in-up">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 m-0">
                    {t("common.notifications")}
                  </h3>
                  <button
                    className="text-primary-500 text-xs sm:text-sm cursor-pointer px-2 py-1 rounded-md transition-colors duration-200 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof onMarkAllAsRead === "function")
                        onMarkAllAsRead();
                    }}
                  >
                    {t("common.markAllAsRead")}
                  </button>
                </div>
                <div className="max-h-[60vh] sm:max-h-[240px] overflow-y-auto thin-scrollbar divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      {t("common.noNotifications")}
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 flex items-start gap-3 transition-colors duration-200 hover:bg-gray-50 ${
                          !notification.isRead ? "bg-yellow-50/40" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 m-0 mb-0.5 truncate">
                            {notification.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 m-0 mb-1 leading-relaxed break-words">
                            {notification.message}
                          </p>
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            {notification.time}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-info rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 text-center">
                  <button
                    className="text-primary-500 text-xs sm:text-sm cursor-pointer px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof onToggleNotification === "function") {
                        onToggleNotification();
                      }
                      navigate("/admin/notifications");
                    }}
                  >
                    {t("common.viewAllNotifications")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              type="button"
              className="flex items-center gap-2 sm:gap-3 cursor-pointer p-1.5 sm:p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 border-none bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                onToggleUserDropdown();
              }}
              aria-label={t("common.userMenu")}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-info to-info-dark rounded-full flex items-center justify-center text-white font-semibold text-sm">
                AD
              </div>
              <div className="hidden sm:block">
                <div className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                  Admin System
                </div>
                <div className="text-[10px] sm:text-xs text-gray-600 leading-tight">
                  Quản trị viên
                </div>
              </div>
              <div className="text-gray-600 transition-transform duration-200">
                <svg
                  width="14"
                  height="14"
                  className="sm:w-4 sm:h-4 md:w-4 md:h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute top-full right-0 w-64 sm:w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 mt-2 animate-fade-in-up">
                <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gradient-to-br from-info to-info-dark rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-sm md:text-base">
                    AD
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-sm md:text-base font-semibold text-gray-900 m-0 mb-1">
                      Admin System
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 m-0 mb-1">
                      {t("common.admin")}
                    </p>
                    <span className="text-[10px] sm:text-xs text-gray-500">
                      admin@phenikaa.edu.vn
                    </span>
                  </div>
                </div>
                <div className="py-2">
                  <button
                    className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-none border-none text-gray-700 text-xs sm:text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-left"
                    onClick={() => navigate("/admin/profile")}
                  >
                    <svg
                      width="14"
                      height="14"
                      className="sm:w-4 sm:h-4 md:w-4 md:h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    {t("common.profile")}
                  </button>
                  <button className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-none border-none text-gray-700 text-xs sm:text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-left">
                    <svg
                      width="14"
                      height="14"
                      className="sm:w-4 sm:h-4 md:w-4 md:h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                    </svg>
                    {t("common.settings")}
                  </button>
                  <button className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-none border-none text-gray-700 text-xs sm:text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-left">
                    <svg
                      width="14"
                      height="14"
                      className="sm:w-4 sm:h-4 md:w-4 md:h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    {t("common.help")}
                  </button>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <button
                    className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-none border-none text-error text-xs sm:text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-left"
                    onClick={onLogout}
                  >
                    <svg
                      width="14"
                      height="14"
                      className="sm:w-4 sm:h-4 md:w-4 md:h-4 text-error"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                    {t("common.logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
