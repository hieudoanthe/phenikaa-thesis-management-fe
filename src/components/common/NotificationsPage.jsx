import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { useNotifications } from "../../contexts/NotificationContext";

const NotificationsPage = ({ receiverId }) => {
  const { notifications, loadNotifications, markAllAsRead, markAsRead } =
    useNotifications();

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [effectiveList, setEffectiveList] = useState([]);

  useEffect(() => {
    loadNotifications(receiverId, {}, { summarize: false });
  }, [receiverId]);

  // Fallback hiển thị danh sách từ WS (student/lecturer) nếu context chưa có dữ liệu
  useEffect(() => {
    const getWindowList = () => {
      try {
        if (Array.isArray(window.__studentNotifications))
          return window.__studentNotifications;
      } catch {}
      try {
        if (Array.isArray(window.__lecturerNotifications))
          return window.__lecturerNotifications;
      } catch {}
      return [];
    };

    if (Array.isArray(notifications) && notifications.length > 0) {
      setEffectiveList(notifications);
    } else {
      setEffectiveList(getWindowList());
    }

    const onStudent = (evt) => {
      const list = evt?.detail;
      if (
        Array.isArray(list) &&
        (!notifications || notifications.length === 0)
      ) {
        setEffectiveList(list);
      }
    };
    const onLecturer = (evt) => {
      const list = evt?.detail;
      if (
        Array.isArray(list) &&
        (!notifications || notifications.length === 0)
      ) {
        setEffectiveList(list);
      }
    };

    window.addEventListener("app:student-notifications", onStudent);
    window.addEventListener("app:lecturer-notifications", onLecturer);
    return () => {
      window.removeEventListener("app:student-notifications", onStudent);
      window.removeEventListener("app:lecturer-notifications", onLecturer);
    };
  }, [notifications]);

  const filtered = useMemo(() => {
    let list =
      Array.isArray(notifications) && notifications.length > 0
        ? notifications
        : effectiveList || [];
    if (filterStatus === "unread") list = list.filter((n) => !n?.isRead);
    if (filterStatus === "read") list = list.filter((n) => n?.isRead);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (n) =>
          n?.title?.toLowerCase().includes(q) ||
          n?.message?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [notifications, effectiveList, filterStatus, searchTerm]);

  const unreadCount = (
    Array.isArray(notifications) && notifications.length > 0
      ? notifications
      : effectiveList || []
  ).filter((n) => !n?.isRead).length;

  const handleMarkAll = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    try {
      setIsMarkingAll(true);
      await markAllAsRead(receiverId);
      setEffectiveList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-gray-700"
            >
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 m-0">
              Thông báo
            </h2>
            <span className="ml-2 text-sm text-gray-500">
              ({unreadCount} chưa đọc)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500/60 focus:border-primary-500/60"
            />
            <div className="w-44">
              <Select
                value={[
                  { value: "all", label: "Tất cả" },
                  { value: "unread", label: "Chưa đọc" },
                  { value: "read", label: "Đã đọc" },
                ].find((o) => o.value === filterStatus)}
                onChange={(opt) => setFilterStatus(opt?.value || "all")}
                options={[
                  { value: "all", label: "Tất cả" },
                  { value: "unread", label: "Chưa đọc" },
                  { value: "read", label: "Đã đọc" },
                ]}
                isSearchable={false}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: 40,
                    borderColor: state.isFocused ? "#ea580c" : "#d1d5db",
                    boxShadow: state.isFocused
                      ? "0 0 0 1px rgba(234,88,12,0.6)"
                      : "none",
                    "&:hover": { borderColor: "#ea580c" },
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#ea580c"
                      : state.isFocused
                      ? "#fed7aa"
                      : "white",
                    color: state.isSelected ? "white" : "#374151",
                  }),
                }}
                classNamePrefix="notiSelect"
                placeholder="Lọc"
              />
            </div>
            <button
              onClick={handleMarkAll}
              disabled={isMarkingAll || unreadCount === 0}
              className="px-3 py-2 bg-secondary text-white rounded-lg disabled:opacity-50"
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto thin-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Không có thông báo
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={`p-4 border-b border-gray-100 ${
                  !n.isRead ? "bg-yellow-50" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {n.title || "Thông báo"}
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {n.message}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {n.time}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
