import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getUserIdFromToken } from "../../auth/authUtils";
import submissionService from "../../services/submission.service";

const FeedbackView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  // Auto-select submission from URL parameter
  useEffect(() => {
    const submissionId = searchParams.get("submission");
    if (submissionId && submissions.length > 0) {
      const submission = submissions.find(
        (s) => s.submissionId === parseInt(submissionId)
      );
      if (submission) {
        setSelectedSubmission(submission);
        loadFeedbacks(submission.submissionId);
      }
    }
  }, [submissions, searchParams]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const userId = getUserIdFromToken();
      const response = await submissionService.getSubmissionsByUser(userId);
      setSubmissions(response || []);
    } catch (error) {
      console.error("Error loading submissions:", error);
      setError("Không thể tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbacks = async (submissionId) => {
    try {
      const response = await submissionService.getFeedbacksBySubmission(
        submissionId
      );
      setFeedbacks(response || []);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
      setError("Không thể tải phản hồi");
    }
  };

  const handleSubmissionSelect = (submission) => {
    setSelectedSubmission(submission);
    loadFeedbacks(submission.submissionId);
  };

  const getFeedbackTypeName = (type) => {
    switch (type) {
      case 1:
        return "Nhận xét chung";
      case 2:
        return "Đánh giá chi tiết";
      case 3:
        return "Yêu cầu sửa đổi";
      default:
        return "Không xác định";
    }
  };

  const getFeedbackTypeColor = (type) => {
    switch (type) {
      case 1:
        return "bg-blue-100 text-blue-800";
      case 2:
        return "bg-green-100 text-green-800";
      case 3:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
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
            onClick={() => navigate("/student/submissions")}
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
            <span className="text-sm font-medium">Tài liệu của tôi</span>
          </button>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-sm font-medium text-gray-900">Phản hồi</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submissions List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Báo cáo đã nộp
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {submissions.length === 0 ? (
                <div className="px-6 py-4 text-center text-gray-500">
                  Chưa có báo cáo nào được nộp
                </div>
              ) : (
                submissions.map((submission) => (
                  <div
                    key={submission.submissionId}
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                      selectedSubmission?.submissionId ===
                      submission.submissionId
                        ? "bg-blue-50 border-r-4 border-blue-500"
                        : ""
                    }`}
                    onClick={() => handleSubmissionSelect(submission)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {submission.reportTitle || "Không có tiêu đề"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {submission.submissionTypeName || "Không xác định"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            submission.status === 3
                              ? "bg-green-100 text-green-800"
                              : submission.status === 4
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {submission.statusName || "Đang xem xét"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Feedback Details */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedSubmission.reportTitle || "Không có tiêu đề"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedSubmission.submissionTypeName} -{" "}
                      {formatDate(selectedSubmission.submittedAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedSubmission.status === 3
                          ? "bg-green-100 text-green-800"
                          : selectedSubmission.status === 4
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {selectedSubmission.statusName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                {feedbacks.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Chưa có phản hồi
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Giảng viên chưa đưa ra phản hồi cho báo cáo này
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {feedbacks.map((feedback) => (
                      <div
                        key={feedback.feedbackId}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFeedbackTypeColor(
                                feedback.feedbackType
                              )}`}
                            >
                              {getFeedbackTypeName(feedback.feedbackType)}
                            </span>
                            {feedback.isApproved && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Đã duyệt
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            {feedback.score !== null && (
                              <div
                                className={`text-2xl font-bold ${getScoreColor(
                                  feedback.score
                                )}`}
                              >
                                {feedback.score}/10
                              </div>
                            )}
                            <p className="text-xs text-gray-500">
                              {formatDate(feedback.createdAt)}
                            </p>
                          </div>
                        </div>

                        {feedback.content && (
                          <div className="bg-gray-50 rounded-md p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Nội dung phản hồi:
                            </h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {feedback.content}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-end text-xs text-gray-500">
                          {feedback.updatedAt !== feedback.createdAt && (
                            <span>
                              Cập nhật: {formatDate(feedback.updatedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Chọn báo cáo để xem phản hồi
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Nhấp vào một báo cáo ở danh sách bên trái để xem phản hồi từ
                  giảng viên
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackView;
