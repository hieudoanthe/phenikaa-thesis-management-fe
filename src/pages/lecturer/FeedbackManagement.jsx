import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import submissionService from "../../services/submission.service";
import { getUserIdFromToken } from "../../auth/authUtils";

const FeedbackManagement = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filters, setFilters] = useState({
    submissionId: "",
    feedbackType: "",
    status: "",
  });

  // Form data for creating/editing feedback
  const [formData, setFormData] = useState({
    submissionId: "",
    reviewerId: null,
    content: "",
    score: "",
    feedbackType: 1, // 1: General, 2: Technical, 3: Content, 4: Format
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const lecturerId = getUserIdFromToken();

      // Load submissions assigned to this lecturer
      const submissionsResponse = await submissionService.filterSubmissions({
        reviewerId: lecturerId,
        page: 0,
        size: 100,
      });

      setSubmissions(submissionsResponse?.content || []);

      // Load feedbacks
      if (filters.submissionId) {
        const feedbacksResponse =
          await submissionService.getFeedbacksBySubmission(
            parseInt(filters.submissionId)
          );
        setFeedbacks(feedbacksResponse || []);
      } else {
        // Load all feedbacks by this lecturer
        const lecturerFeedbacksResponse =
          await submissionService.getFeedbacksByReviewer(lecturerId);
        setFeedbacks(lecturerFeedbacksResponse || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeedback = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const lecturerId = getUserIdFromToken();

      const feedbackData = {
        ...formData,
        reviewerId: lecturerId,
        score: formData.score ? parseFloat(formData.score) : null,
      };

      await submissionService.createFeedback(feedbackData);
      toast.success("Tạo phản hồi thành công");
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error creating feedback:", error);
      toast.error("Lỗi khi tạo phản hồi");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeedback = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const feedbackData = {
        ...formData,
        score: formData.score ? parseFloat(formData.score) : null,
      };

      await submissionService.updateFeedback(
        selectedFeedback.feedbackId,
        feedbackData
      );
      toast.success("Cập nhật phản hồi thành công");
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast.error("Lỗi khi cập nhật phản hồi");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phản hồi này?")) {
      try {
        setLoading(true);
        await submissionService.deleteFeedback(feedbackId);
        toast.success("Xóa phản hồi thành công");
        loadData();
      } catch (error) {
        console.error("Error deleting feedback:", error);
        toast.error("Lỗi khi xóa phản hồi");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApproveFeedback = async (feedbackId) => {
    try {
      setLoading(true);
      await submissionService.approveFeedback(feedbackId);
      toast.success("Duyệt phản hồi thành công");
      loadData();
    } catch (error) {
      console.error("Error approving feedback:", error);
      toast.error("Lỗi khi duyệt phản hồi");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      submissionId: "",
      reviewerId: null,
      content: "",
      score: "",
      feedbackType: 1,
    });
  };

  const openCreateModal = (submission) => {
    setSelectedSubmission(submission);
    setFormData({
      ...formData,
      submissionId: submission.submissionId,
    });
    setShowCreateModal(true);
  };

  const openEditModal = (feedback) => {
    setSelectedFeedback(feedback);
    setFormData({
      submissionId: feedback.submissionId,
      reviewerId: feedback.reviewerId,
      content: feedback.content,
      score: feedback.score?.toString() || "",
      feedbackType: feedback.feedbackType,
    });
    setShowEditModal(true);
  };

  const getFeedbackTypeText = (type) => {
    const typeMap = {
      1: "Tổng quát",
      2: "Kỹ thuật",
      3: "Nội dung",
      4: "Định dạng",
    };
    return typeMap[type] || "Không xác định";
  };

  const getFeedbackTypeColor = (type) => {
    const colorMap = {
      1: "bg-blue-100 text-blue-800",
      2: "bg-green-100 text-green-800",
      3: "bg-purple-100 text-purple-800",
      4: "bg-orange-100 text-orange-800",
    };
    return colorMap[type] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadge = (isApproved) => {
    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${
          isApproved
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {isApproved ? "Đã duyệt" : "Chờ duyệt"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-8 pt-0">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center mb-1">
          <button
            onClick={() => navigate("/lecturer/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-sm font-medium text-gray-900">
            Quản lý Phản hồi
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Báo cáo
            </label>
            <select
              value={filters.submissionId}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  submissionId: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả báo cáo</option>
              {submissions.map((submission) => (
                <option
                  key={submission.submissionId}
                  value={submission.submissionId}
                >
                  {submission.reportTitle} -{" "}
                  {submission.studentName || submission.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại phản hồi
            </label>
            <select
              value={filters.feedbackType}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  feedbackType: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả loại</option>
              <option value="1">Tổng quát</option>
              <option value="2">Kỹ thuật</option>
              <option value="3">Nội dung</option>
              <option value="4">Định dạng</option>
            </select>
          </div>
          <div className="shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="approved">Đã duyệt</option>
              <option value="pending">Chờ duyệt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedbacks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Báo cáo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm số
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nội dung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedbacks.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Không có phản hồi nào
                  </td>
                </tr>
              ) : (
                feedbacks.map((feedback) => (
                  <tr key={feedback.feedbackId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {feedback.submissionTitle || "Báo cáo"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {feedback.studentName || "Sinh viên"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${getFeedbackTypeColor(
                          feedback.feedbackType
                        )}`}
                      >
                        {getFeedbackTypeText(feedback.feedbackType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {feedback.score ? `${feedback.score}/10` : "Chưa chấm"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate">
                        {feedback.content?.substring(0, 100)}
                        {feedback.content?.length > 100 && "..."}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(feedback.isApproved)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(feedback.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(feedback)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Sửa
                        </button>
                        {!feedback.isApproved && (
                          <button
                            onClick={() =>
                              handleApproveFeedback(feedback.feedbackId)
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            Duyệt
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteFeedback(feedback.feedbackId)
                          }
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Feedback Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tạo phản hồi cho: {selectedSubmission?.reportTitle}
              </h3>
              <form onSubmit={handleCreateFeedback}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại phản hồi
                  </label>
                  <select
                    value={formData.feedbackType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feedbackType: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={1}>Tổng quát</option>
                    <option value={2}>Kỹ thuật</option>
                    <option value={3}>Nội dung</option>
                    <option value={4}>Định dạng</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm số (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.score}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        score: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập điểm số (tùy chọn)"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung phản hồi
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    required
                    placeholder="Nhập nội dung phản hồi..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Đang tạo..." : "Tạo phản hồi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Feedback Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Chỉnh sửa phản hồi
              </h3>
              <form onSubmit={handleUpdateFeedback}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại phản hồi
                  </label>
                  <select
                    value={formData.feedbackType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feedbackType: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={1}>Tổng quát</option>
                    <option value={2}>Kỹ thuật</option>
                    <option value={3}>Nội dung</option>
                    <option value={4}>Định dạng</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm số (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.score}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        score: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập điểm số (tùy chọn)"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung phản hồi
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        content: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    required
                    placeholder="Nhập nội dung phản hồi..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Đang cập nhật..." : "Cập nhật"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
