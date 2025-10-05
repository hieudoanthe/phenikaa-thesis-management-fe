import React, { useEffect, useState, useMemo } from "react";
import Select from "react-select";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [timeTick, setTimeTick] = useState(0);

  useEffect(() => {
    try {
      const initial = Array.isArray(window.__studentNotifications)
        ? window.__studentNotifications
        : [];
      setNotifications(initial);
      setLoading(false);
    } catch (_) {
      setLoading(false);
    }

    const handler = (evt) => {
      const list = evt?.detail;
      if (Array.isArray(list)) setNotifications(list);
    };
    window.addEventListener("app:student-notifications", handler);
    return () =>
      window.removeEventListener("app:student-notifications", handler);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTimeTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const formatRelativeTime = (createdAtMs) => {
    if (!createdAtMs) return "Vừa xong";
    const diff = Math.max(0, Date.now() - createdAtMs);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "Vừa xong";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} giờ trước`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} ngày trước`;
    const week = Math.floor(day / 7);
    if (week < 4) return `${week} tuần trước`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month} tháng trước`;
    const year = Math.floor(day / 365);
    return `${year} năm trước`;
  };

  const filtered = useMemo(() => {
    let list = notifications;
    if (filterStatus === "unread") list = list.filter((n) => !n.isRead);
    if (filterStatus === "read") list = list.filter((n) => n.isRead);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [notifications, filterStatus, searchTerm]);

  const handleMarkAllAsRead = async () => {
    if (isMarkingAll) return;
    try {
      setIsMarkingAll(true);
      // Không gọi API, phát sự kiện để StudentLayout xử lý nếu cần; ở đây chỉ cập nhật local
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, isRead: true }));
        try {
          window.__studentNotifications = updated;
          window.dispatchEvent(
            new CustomEvent("app:student-notifications", { detail: updated })
          );
        } catch (_) {}
        if (typeof window !== "undefined" && window.addToast) {
          window.addToast("Đã đánh dấu tất cả thông báo là đã đọc", "success");
        }
        return updated;
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách thông báo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-error-500 mb-4">
            Không thể tải danh sách thông báo
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
              onClick={handleMarkAllAsRead}
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
                      {n.title}
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {n.message}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {formatRelativeTime(n.createdAt, timeTick)}
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

export default Notifications;
