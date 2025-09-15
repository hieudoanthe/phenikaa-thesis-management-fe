import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { getUserIdFromToken } from "../../auth/authUtils";
import { useNotifications } from "../../contexts/NotificationContext";
import userService from "../../services/user.service";

const NotiOfTeacher = () => {
  const {
    notifications,
    loading,
    error,
    markAllAsRead: markAllAsReadFromContext,
    clearError,
  } = useNotifications();

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [timeTick, setTimeTick] = useState(0);
  const [studentProfiles, setStudentProfiles] = useState({});

  // Helper hiển thị toast
  const showToast = (message, type = "success") => {
    if (typeof window !== "undefined" && window.addToast) {
      try {
        window.addToast(message, type);
      } catch (_) {
        // no-op
      }
    }
  };

  // Load profile sinh viên
  const loadStudentProfiles = async (notificationsData) => {
    try {
      if (!Array.isArray(notificationsData) || notificationsData.length === 0) {
        return;
      }

      const idsToFetch = Array.from(
        new Set(
          notificationsData
            .map((n) => n.studentId)
            .filter((id) => id && !studentProfiles[id])
        )
      );

      if (idsToFetch.length === 0) return;

      const results = await Promise.allSettled(
        idsToFetch.map(async (id) => {
          try {
            const profile = await userService.getStudentProfileById(id);
            return [
              id,
              {
                fullName:
                  profile?.fullName || profile?.name || "Không xác định",
                email: profile?.email || "",
                major: profile?.major || "",
                className: profile?.className || profile?.class || "",
                avt: profile?.avt || profile?.avatar || "",
              },
            ];
          } catch (_err) {
            return [
              id,
              {
                fullName: "Không xác định",
                email: "",
                major: "",
                className: "",
                avt: "",
              },
            ];
          }
        })
      );

      const merged = {};
      for (const r of results) {
        if (r.status === "fulfilled" && Array.isArray(r.value)) {
          const [id, data] = r.value;
          merged[id] = data;
        }
      }

      if (Object.keys(merged).length > 0) {
        setStudentProfiles((prev) => ({ ...prev, ...merged }));
      }
    } catch (error) {
      console.error("Lỗi khi load profiles sinh viên:", error);
    }
  };

  // Format thời gian tương đối
  const formatRelativeTime = (createdAt) => {
    if (!createdAt) return "Vừa xong";

    const now = Date.now();
    const createdAtMs =
      typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt;
    const diff = Math.max(0, now - createdAtMs);
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

  // Lọc thông báo
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

  // Load profiles khi filtered thay đổi
  useEffect(() => {
    loadStudentProfiles(filtered);
  }, [filtered]);

  // Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    if (isMarkingAll) return;
    try {
      setIsMarkingAll(true);
      const receiverId = getUserIdFromToken();

      if (!receiverId) {
        showToast("Không thể xác định ID người nhận", "error");
        return;
      }

      // Gọi API đánh dấu tất cả đã đọc
      await markAllAsReadFromContext(receiverId);
      clearError();
      showToast("Đã đánh dấu tất cả thông báo là đã đọc", "success");
    } catch (error) {
      showToast("Đã xảy ra lỗi khi đánh dấu thông báo đã đọc", "error");
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Cập nhật timeTick mỗi phút
  useEffect(() => {
    const id = setInterval(() => setTimeTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

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

  const statusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "unread", label: "Chưa đọc" },
    { value: "read", label: "Đã đọc" },
  ];

  const selectTheme = (theme) => ({
    ...theme,
    colors: {
      ...theme.colors,
      primary: "#ff6600",
      primary25: "#ffe0cc",
      primary50: "#ffb380",
    },
  });

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "#ff6600" : base.borderColor,
      boxShadow: state.isFocused ? "0 0 0 1px #ff6600" : base.boxShadow,
      "&:hover": {
        borderColor: state.isFocused ? "#ff6600" : base.borderColor,
      },
      minWidth: "160px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#ff6600"
        : state.isFocused
        ? "#ffe0cc"
        : base.backgroundColor,
      color: state.isSelected ? "#fff" : base.color,
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? "#ff6600" : base.color,
      "&:hover": { color: "#ff6600" },
    }),
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
              className="block w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <Select
              inputId="notiStatusSelect"
              classNamePrefix="rs"
              options={statusOptions}
              value={statusOptions.find((o) => o.value === filterStatus)}
              onChange={(opt) => setFilterStatus(opt ? opt.value : "all")}
              isClearable={false}
              theme={selectTheme}
              styles={selectStyles}
            />
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
                    {/* Hiển thị thông tin sinh viên nếu có */}
                    {n.studentId &&
                      (studentProfiles[n.studentId] || n.studentName) && (
                        <div className="mt-2 flex items-center gap-2">
                          {studentProfiles[n.studentId]?.avt ? (
                            <img
                              src={studentProfiles[n.studentId]?.avt}
                              alt="Avatar"
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1755329521/avt_default_mcotwe.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {(
                                studentProfiles[n.studentId]?.fullName ||
                                n.studentName ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            {studentProfiles[n.studentId]?.fullName ||
                              n.studentName}
                            {studentProfiles[n.studentId]?.className &&
                              ` • ${studentProfiles[n.studentId]?.className}`}
                          </span>
                        </div>
                      )}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {formatRelativeTime(n.createdAt)}
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

export default NotiOfTeacher;
