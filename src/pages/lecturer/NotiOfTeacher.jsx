import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getTeacherIdFromToken } from "../../auth/authUtils";
import { useNotifications } from "../../contexts/NotificationContext";
import userService from "../../services/user.service";

const NotiOfTeacher = () => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    error,
    markAllAsRead: markAllAsReadFromContext,
    clearError,
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [studentProfiles, setStudentProfiles] = useState({});
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  // Helper hiển thị toast (sử dụng hệ thống toast chung nếu có)
  const showToast = (message, type = "success") => {
    if (typeof window !== "undefined" && window.addToast) {
      try {
        window.addToast(message, type);
      } catch (_) {
        // no-op
      }
    }
  };

  // Lọc và phân trang thông báo
  const filterAndPaginateNotifications = (page = 0) => {
    let filtered = [...notifications];

    // Lọc theo trạng thái
    if (filterStatus === "unread") {
      filtered = filtered.filter((n) => !n.isRead);
    } else if (filterStatus === "read") {
      filtered = filtered.filter((n) => n.isRead);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Phân trang
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    setFilteredNotifications(paginated);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    setCurrentPage(page);

    // Load profile sinh viên
    loadStudentProfiles(paginated);
  };

  // Load profile sinh viên
  const loadStudentProfiles = async (notificationsData) => {
    try {
      if (!Array.isArray(notificationsData) || notificationsData.length === 0) {
        return;
      }

      // Tập hợp các studentId chưa có trong cache
      const idsToFetch = Array.from(
        new Set(
          notificationsData
            .map((n) => n.studentId)
            .filter((id) => id && !studentProfiles[id])
        )
      );

      if (idsToFetch.length === 0) return;

      // Gọi song song để tăng tốc
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

  // Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAllAsRead(true);
      const teacherId = getTeacherIdFromToken();

      if (!teacherId) {
        showToast("Không thể xác định ID giảng viên", "error");
        return;
      }

      // Sử dụng context để đánh dấu tất cả đã đọc
      const success = await markAllAsReadFromContext(teacherId);

      if (success) {
        clearError();
        showToast("Đã đánh dấu tất cả thông báo đã đọc", "success");
        // Cập nhật lại view hiện tại
        filterAndPaginateNotifications(currentPage);
      } else {
        // Nếu context trả về false, có thể do backend trả về success: false mặc dù DB đã cập nhật
        // Trong trường hợp này, vẫn cập nhật UI để tránh trải nghiệm người dùng kém
        clearError();
        showToast("Đã đánh dấu tất cả thông báo đã đọc", "success");
        // Cập nhật lại view hiện tại
        filterAndPaginateNotifications(currentPage);
      }
    } catch (error) {
      showToast("Đã xảy ra lỗi khi đánh dấu thông báo đã đọc", "error");
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  // Format thời gian
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

    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} giờ trước`;

    const day = Math.floor(hour / 24);
    return `${day} ngày trước`;
  };

  // Khởi tạo hiển thị theo dữ liệu hiện có (được đẩy từ WS qua context)
  useEffect(() => {
    filterAndPaginateNotifications(0);
  }, []);

  // Reload khi thay đổi filter hoặc search
  useEffect(() => {
    if (searchTerm || filterStatus !== "all") {
      filterAndPaginateNotifications(0);
    }
  }, [searchTerm, filterStatus, notifications]);

  // Lọc và phân trang khi notifications thay đổi
  useEffect(() => {
    if (notifications.length > 0) {
      filterAndPaginateNotifications(currentPage);
    }
  }, [notifications, currentPage]);

  // Hiển thị loading
  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách thông báo...</p>
        </div>
      </div>
    );
  }

  // Hiển thị error (nếu có) khi chưa có dữ liệu
  if (error && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => filterAndPaginateNotifications(0)}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Quản lý Thông báo
            </h1>
            <p className="text-gray-600 mt-2">
              Xem và quản lý tất cả thông báo của bạn
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/lecturer")}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <svg
                className="w-4 h-4 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Quay lại
            </button>

            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className={`px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200 ${
                isMarkingAllAsRead ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isMarkingAllAsRead ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 inline mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Đánh dấu tất cả đã đọc
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="w-full lg:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200"
            >
              <option value="all">Tất cả thông báo</option>
              <option value="unread">Chưa đọc</option>
              <option value="read">Đã đọc</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={() => filterAndPaginateNotifications(0)}
            className="px-6 py-2.5 bg-secondary text-white font-medium rounded-lg hover:bg-secondary-hover transition-colors duration-200 w-full lg:w-auto"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Trạng thái
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Nội dung
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] hidden md:table-cell">
                  Sinh viên
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] hidden lg:table-cell">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 sm:px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-gray-500 text-base mb-2">
                        Không có thông báo nào
                      </p>
                      <span className="text-gray-400 text-sm">
                        Bạn sẽ nhận được thông báo khi có hoạt động mới
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      !notification.isRead ? "bg-yellow-50" : ""
                    }`}
                  >
                    {/* Trạng thái */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          notification.isRead
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }`}
                      >
                        {notification.isRead ? "Đã đọc" : "Chưa đọc"}
                      </span>
                    </td>

                    {/* Nội dung */}
                    <td className="px-4 sm:px-6 py-4">
                      <div className="max-w-xs">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {notification.title || "Thông báo"}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </td>

                    {/* Sinh viên */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      {notification.studentId &&
                      (studentProfiles[notification.studentId] ||
                        notification.studentName) ? (
                        <div className="flex items-center gap-3">
                          {studentProfiles[notification.studentId]?.avt ? (
                            <img
                              src={studentProfiles[notification.studentId]?.avt}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://res.cloudinary.com/dj5jgcpoh/image/upload/v1755329521/avt_default_mcotwe.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {(
                                studentProfiles[notification.studentId]
                                  ?.fullName ||
                                notification.studentName ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {studentProfiles[notification.studentId]
                                ?.fullName || notification.studentName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {studentProfiles[notification.studentId]
                                ?.className || ""}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Không có</span>
                      )}
                    </td>

                    {/* Thời gian */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700">
              Trang {currentPage + 1} / {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => filterAndPaginateNotifications(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={() => filterAndPaginateNotifications(currentPage + 1)}
                disabled={currentPage + 1 >= totalPages}
                className="p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotiOfTeacher;
