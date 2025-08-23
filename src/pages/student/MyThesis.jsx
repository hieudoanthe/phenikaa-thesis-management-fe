import React, { useState, useEffect } from "react";
import { getUserIdFromToken } from "../../auth/authUtils";
import { API_ENDPOINTS } from "../../config/api";
import { apiGet } from "../../services/mainHttpClient";

/**
 * Trang theo dõi trạng thái đề tài của sinh viên
 * Hiển thị thông tin chi tiết về đề tài đã đăng ký và trạng thái xử lý
 */
const MyThesis = () => {
  const [thesisData, setThesisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Hàm lấy trạng thái hiển thị
  const getStatusDisplay = (status) => {
    const statusMap = {
      PENDING: "Chờ duyệt",
      APPROVED: "Đã duyệt",
      REJECTED: "Từ chối",
      IN_PROGRESS: "Đang thực hiện",
      COMPLETED: "Hoàn thành",
      DEFENDED: "Đã bảo vệ",
      // Thêm các trạng thái cho suggested topics
      SUGGESTED: "Đã đề xuất",
      UNDER_REVIEW: "Đang xem xét",
      NEEDS_REVISION: "Cần chỉnh sửa",
    };
    return statusMap[status] || "Không xác định";
  };

  // Hàm lấy màu trạng thái
  const getStatusColor = (status) => {
    const colorMap = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-blue-100 text-blue-800",
      REJECTED: "bg-red-100 text-red-800",
      IN_PROGRESS: "bg-green-100 text-green-800",
      COMPLETED: "bg-purple-100 text-purple-800",
      DEFENDED: "bg-indigo-100 text-indigo-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  // Hàm tính phần trăm tiến độ
  const getProgressPercentage = (status) => {
    const progressMap = {
      PENDING: 20,
      APPROVED: 40,
      IN_PROGRESS: 70,
      COMPLETED: 90,
      DEFENDED: 100,
      // Thêm tiến độ cho suggested topics
      SUGGESTED: 30,
      UNDER_REVIEW: 50,
      NEEDS_REVISION: 25,
    };
    return progressMap[status] || 0;
  };

  // Hàm refresh dữ liệu
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Hàm format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Không hợp lệ";
    }
  };

  // Lấy thông tin đề tài của sinh viên
  useEffect(() => {
    const fetchThesisData = async () => {
      try {
        setLoading(true);
        setError("");

        const userId = getUserIdFromToken();
        if (!userId) {
          throw new Error("Không thể xác định người dùng");
        }

        // Sử dụng API mới để lấy thông tin đề tài của sinh viên
        const endpoint = API_ENDPOINTS.GET_STUDENT_TOPIC.replace(
          "{studentId}",
          userId
        );
        const response = await apiGet(endpoint);

        // Debug: Log response để kiểm tra cấu trúc
        console.log("API Response:", response);

        // API trả về dữ liệu trực tiếp thông qua apiGet
        if (response) {
          const data = response;

          // Debug: Log data để kiểm tra cấu trúc
          console.log("Data content:", data?.content);
          console.log("Content length:", data?.content?.length);

          if (data && data.content && data.content.length > 0) {
            // Lấy đề tài đầu tiên (mới nhất theo createdAt)
            const studentTopic = data.content[0];

            // Debug: Log studentTopic để kiểm tra
            console.log("Student Topic:", studentTopic);
            console.log("Topic ID:", studentTopic?.topicId);
            console.log("Suggestion Status:", studentTopic?.suggestionStatus);

            // Kiểm tra xem có phải là đề tài đã được đề xuất không
            if (studentTopic.topicId && studentTopic.suggestionStatus) {
              // Kết hợp thông tin đề tài và trạng thái
              const thesisInfo = {
                ...studentTopic,
                // Sử dụng suggestionStatus thay vì status
                status: getStatusDisplay(studentTopic.suggestionStatus),
                statusColor: getStatusColor(studentTopic.suggestionStatus),
                progress: getProgressPercentage(studentTopic.suggestionStatus),
                // Sử dụng createdAt làm ngày đăng ký
                registrationDate: studentTopic.createdAt,
                // Các thông tin khác sẽ được lấy từ API đề tài nếu cần
                topicId: studentTopic.topicId,
                suggestedId: studentTopic.suggestedId,
                suggestedBy: studentTopic.suggestedBy,
                approvedBy: studentTopic.approvedBy,
              };

              console.log("Setting thesis data:", thesisInfo);
              setThesisData(thesisInfo);
            } else {
              // Chưa đề xuất đề tài nào
              console.log("Không có topicId hoặc suggestionStatus");
              setThesisData(null);
            }
          } else {
            // Chưa đề xuất đề tài nào
            console.log("Không có content hoặc content rỗng");
            setThesisData(null);
          }
        } else {
          throw new Error("Không có dữ liệu từ API");
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin đề tài:", err);
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          response: err.response,
        });

        // Hiển thị lỗi chi tiết hơn cho người dùng
        let errorMessage = "Có lỗi xảy ra khi tải dữ liệu";
        if (err.message) {
          errorMessage = err.message;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchThesisData();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải thông tin đề tài...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4 flex justify-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Có lỗi xảy ra
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!thesisData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-6">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Bạn chưa đề xuất đề tài nào
            </h2>
            <p className="text-gray-600 mb-6">
              Để theo dõi tiến độ đề tài, bạn cần đề xuất một đề tài luận văn
              trước.
            </p>
            <div className="space-y-3">
              <button
                onClick={() =>
                  (window.location.href = "/student/topic-registration")
                }
                className="w-full md:w-auto px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200 font-medium"
              >
                Đề xuất đề tài ngay
              </button>
              <button
                onClick={() => (window.location.href = "/student/topic")}
                className="w-full md:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Xem danh sách đề tài
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Đề tài đã đề xuất
              </h1>
              <p className="text-gray-600 mt-2">
                Theo dõi tiến độ và trạng thái đề tài đã đề xuất
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              Làm mới
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Tiến độ thực hiện
              </h3>
              <span className="text-sm font-medium text-gray-600">
                {thesisData.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-secondary h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${thesisData.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Đề xuất</span>
              <span>Xem xét</span>
              <span>Duyệt</span>
              <span>Thực hiện</span>
              <span>Hoàn thành</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thông tin đề tài */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Thông tin đề tài
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${thesisData.statusColor}`}
                >
                  {thesisData.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Đề tài
                  </label>
                  <p className="text-gray-900 font-medium">
                    {thesisData.topicId || "Chưa cập nhật"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Đề xuất
                  </label>
                  <p className="text-gray-900">
                    {thesisData.suggestedId || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Người đề xuất
                    </label>
                    <p className="text-gray-900">
                      {thesisData.suggestedBy || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Người duyệt
                    </label>
                    <p className="text-gray-900">
                      {thesisData.approvedBy || "Chưa phân công"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái đề xuất
                    </label>
                    <p className="text-gray-900 font-medium">
                      {thesisData.status || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiến độ
                    </label>
                    <p className="text-gray-900">{thesisData.progress || 0}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin đăng ký và timeline */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin đăng ký
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày đề xuất
                  </label>
                  <p className="text-gray-900">
                    {formatDate(thesisData.createdAt)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <p className="text-gray-900">{thesisData.status}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người duyệt
                  </label>
                  <p className="text-gray-900">
                    {thesisData.approvedBy || "Chưa có người duyệt"}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Quy trình đề xuất
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Đề xuất đề tài
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        thesisData.progress >= 30
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-600">Xem xét</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        thesisData.progress >= 50
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-600">Duyệt</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        thesisData.progress >= 70
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-600">Thực hiện</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        thesisData.progress >= 100
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-600">Hoàn thành</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {thesisData && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Hành động
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => (window.location.href = "/student/chat")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Chat với giảng viên
              </button>
              <button
                onClick={() => (window.location.href = "/student/profile")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cập nhật hồ sơ
              </button>
              <button
                onClick={() =>
                  (window.location.href = "/student/notifications")
                }
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Xem thông báo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyThesis;
