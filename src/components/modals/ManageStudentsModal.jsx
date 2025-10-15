import React, { useState, useEffect } from "react";
import { showToast } from "../../utils/toastHelper";
import { apiPost } from "../../services/mainHttpClient";
import importService from "../../services/import.service";
import ConfirmModal from "./ConfirmModal";
import studentAssignmentService from "../../services/studentAssignment.service";

const ManageStudentsModal = ({
  isOpen,
  onClose,
  periodId,
  periodName,
  periodStatus,
}) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState("imported"); // imported | incomplete

  useEffect(() => {
    if (isOpen && periodId) {
      // mặc định hiển thị danh sách đã nhập
      setViewMode("imported");
      loadStudents();
    }
  }, [isOpen, periodId]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const result = await importService.getStudentsByPeriod(periodId);
      if (result.success) {
        setStudents(result.data || []);
      } else {
        showToast(
          result.message || "Không thể tải danh sách sinh viên",
          "error"
        );
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách sinh viên:", error);
      showToast("Có lỗi xảy ra khi tải danh sách sinh viên", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (periodStatus === "CLOSED") {
      showToast("Đợt đăng ký đã kết thúc. Không thể gửi thông báo.", "warning");
      return;
    }
    if (students.length === 0) {
      showToast("Không có sinh viên nào để gửi thông báo", "warning");
      return;
    }

    try {
      setSendingEmail(true);

      const requestData = {
        periodId: periodId,
        periodName: periodName,
        subject: "[THÔNG BÁO] Mở đợt đăng ký khóa luận tốt nghiệp",
        targetDomain: "@st.phenikaa-uni.edu.vn",
        status: "Đang hoạt động",
        systemUrl: "https://phenikaa-thesis-management-fe.vercel.app/",
        supportEmail: "support@phenikaa-uni.edu.vn",
        supportPhone: "024.1234.5678",
      };

      const response = await apiPost(
        "/api/communication-service/admin/send-period-email",
        {
          ...requestData,
          type: viewMode === "incomplete" ? "REMINDER" : "ANNOUNCEMENT",
          reminderOnlyIncomplete: viewMode === "incomplete",
        }
      );

      // Debug logging
      console.log("Email API Response:", response);

      // Kiểm tra response có đúng format không
      if (!response || typeof response !== "object") {
        console.error("Invalid response format:", response);
        showToast(
          "Response không hợp lệ từ server. Vui lòng thử lại.",
          "error"
        );
        return;
      }

      // Kiểm tra xem có phải response từ service thật không
      if (
        !response.hasOwnProperty("success") &&
        !response.hasOwnProperty("totalSent") &&
        !response.hasOwnProperty("totalFailed")
      ) {
        console.error("Response không có các field cần thiết:", response);
        showToast(
          "Hệ thống đang bận hoặc chưa sẵn sàng. Vui lòng thử lại sau.",
          "error"
        );
        return;
      }

      if (response.success === true) {
        showToast(
          `Gửi email thành công! Đã gửi: ${
            response.totalSent || 0
          } email, Thất bại: ${response.totalFailed || 0} email`,
          "success"
        );
      } else {
        showToast(
          `Gửi email thất bại: ${response.message || "Lỗi không xác định"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Lỗi khi gửi email:", error);

      // Kiểm tra loại lỗi cụ thể
      if (
        error.code === "ECONNREFUSED" ||
        error.message?.includes("Network Error") ||
        error.message?.includes("ERR_NETWORK")
      ) {
        showToast(
          "Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ quản trị viên.",
          "error"
        );
      } else if (error.message?.includes("timeout")) {
        showToast("Request timeout. Vui lòng thử lại sau.", "error");
      } else if (error.response?.status === 503) {
        showToast("Hệ thống đang bận. Vui lòng thử lại sau.", "error");
      } else if (error.response?.status === 500) {
        showToast("Lỗi server. Vui lòng thử lại sau.", "error");
      } else if (error.response?.status === 404) {
        showToast(
          "API không tồn tại. Vui lòng liên hệ quản trị viên.",
          "error"
        );
      } else {
        showToast(
          `Có lỗi xảy ra khi gửi email: ${
            error.message || "Lỗi không xác định"
          }`,
          "error"
        );
      }
    } finally {
      setSendingEmail(false);
    }
  };

  const openConfirmAndSend = () => {
    if (periodStatus === "CLOSED") {
      showToast("Đợt đăng ký đã kết thúc. Không thể gửi thông báo.", "warning");
      return;
    }
    if (students.length === 0) {
      showToast("Chưa có sinh viên nào trong đợt để gửi thông báo.", "warning");
      return;
    }
    setConfirmOpen(true);
  };

  const openRemoveConfirm = (student) => {
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };

  const handleRemoveStudent = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      const result = await importService.removeStudentFromPeriod(
        studentToDelete.userId,
        periodId
      );
      if (result.success) {
        showToast("Xóa sinh viên khỏi đợt đăng ký thành công", "success");
        setDeleteConfirmOpen(false);
        setStudentToDelete(null);
        loadStudents();
      } else {
        showToast(result.message || "Không thể xóa sinh viên", "error");
      }
    } catch (error) {
      console.error("Lỗi khi xóa sinh viên:", error);
      showToast("Có lỗi xảy ra khi xóa sinh viên", "error");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.userId?.toString().includes(searchTerm.toLowerCase()) ||
      student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const loadIncompleteStudents = async () => {
    if (!periodId) return;
    setLoading(true);
    try {
      const res = await studentAssignmentService.getIncompleteStudentsByPeriod(
        periodId,
        0,
        1000
      );
      const content = res?.content || res || [];
      // Map về shape giống danh sách đã nhập để tái sử dụng UI
      const mapped = content.map((s) => {
        const studentCode =
          s.studentCode ||
          (s.username &&
          typeof s.username === "string" &&
          !s.username.includes("@")
            ? s.username
            : "");
        const email =
          s.username && s.username.includes("@")
            ? s.username
            : studentCode
            ? `${studentCode}@st.phenikaa-uni.edu.vn`
            : "";
        return {
          userId: s.studentId,
          fullName: s.fullName || `Sinh viên ${s.studentId}`,
          email,
          createdAt: null,
        };
      });
      setStudents(mapped);
      setViewMode("incomplete");
      setCurrentPage(1);
    } catch (e) {
      showToast("Không thể tải danh sách sinh viên chưa hoàn thiện", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 m-0">
            Quản lý sinh viên - {periodName}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setViewMode("imported");
                loadStudents();
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === "imported"
                  ? "bg-primary-500 text-white hover:bg-primary-400"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
              title="Xem tất cả sinh viên đã nhập"
            >
              Tất cả sinh viên
            </button>
            <button
              onClick={loadIncompleteStudents}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                viewMode === "imported"
                  ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  : "bg-primary-500 text-white hover:bg-primary-400"
              }`}
              title="Xem sinh viên chưa hoàn thiện"
            >
              Sinh viên chưa hoàn thiện
            </button>
            <button
              onClick={openConfirmAndSend}
              disabled={
                sendingEmail ||
                periodStatus === "CLOSED" ||
                students.length === 0
              }
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingEmail ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang gửi...
                </>
              ) : viewMode === "incomplete" ? (
                "Nhắc nhở"
              ) : (
                "Gửi thông báo"
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-600">
                Quản lý danh sách sinh viên trong đợt đăng ký
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm sinh viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Students table */}
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Họ tên
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    {viewMode !== "incomplete" && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày thêm
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStudents.map((student) => (
                    <tr key={student.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.userId}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.fullName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.email}
                      </td>
                      {viewMode !== "incomplete" && (
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(student.createdAt)}
                        </td>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => openRemoveConfirm(student)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Xóa khỏi đợt đăng ký"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {currentStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? "Không tìm thấy sinh viên nào"
                    : "Chưa có sinh viên nào trong đợt đăng ký này"}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} đến{" "}
                {Math.min(endIndex, filteredStudents.length)} trong tổng số{" "}
                {filteredStudents.length} sinh viên
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
      {/* Confirm send emails */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Xác nhận gửi thông báo"
        message={
          <div className="text-gray-700">
            <p className="mb-2">
              Bạn có chắc chắn muốn gửi email thông báo cho tất cả sinh viên
              trong đợt này?
            </p>
          </div>
        }
        confirmText="Gửi thông báo"
        cancelText="Hủy"
        confirmVariant="success"
        loading={sendingEmail}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await handleSendNotification();
        }}
      />

      {/* Confirm remove student */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Xác nhận xóa sinh viên"
        message={
          <div className="text-gray-700">
            <p className="mb-2">
              Bạn có chắc chắn muốn xóa sinh viên khỏi đợt đăng ký này?
            </p>
            {studentToDelete && (
              <p className="text-sm text-gray-600">
                Sinh viên:{" "}
                <span className="font-semibold">
                  {studentToDelete.fullName}
                </span>{" "}
                ({studentToDelete.email})
              </p>
            )}
          </div>
        }
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        loading={deleting}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setStudentToDelete(null);
        }}
        onConfirm={handleRemoveStudent}
      />
    </div>
  );
};

export default ManageStudentsModal;
