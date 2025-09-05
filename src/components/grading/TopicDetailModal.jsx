import React, { useState, useEffect } from "react";
import { getTopicDetails } from "../../services/grading.service";

const TopicDetailModal = ({
  isOpen,
  onClose,
  topicId,
  studentName,
  topicTitle,
}) => {
  const [topicDetails, setTopicDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && topicId) {
      loadTopicDetails();
    }
  }, [isOpen, topicId]);

  const loadTopicDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTopicDetails(topicId);
      if (response.success) {
        setTopicDetails(response.data);
      } else {
        setError(response.error || "Không thể tải thông tin đề tài");
      }
    } catch (err) {
      setError("Lỗi khi tải thông tin đề tài");
      console.error("Error loading topic details:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "Chưa xác định";
    return new Date(dateTime).toLocaleString("vi-VN");
  };

  const formatDate = (date) => {
    if (!date) return "Chưa xác định";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Chi tiết đề tài - {studentName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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

          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải thông tin...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
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
                  <h3 className="text-sm font-medium text-red-800">
                    Lỗi tải dữ liệu
                  </h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {topicDetails && !loading && (
            <div className="space-y-6">
              {/* Thông tin đề tài */}
              {topicDetails.topic && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Thông tin đề tài
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tên đề tài:</span>
                      <span className="ml-2 font-medium">
                        {topicDetails.topic.title || topicTitle}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Mã đề tài:</span>
                      <span className="ml-2 font-medium">
                        {topicDetails.topic.topicId || topicId}
                      </span>
                    </div>
                    {topicDetails.topic.description && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600">Mô tả:</span>
                        <p className="mt-1 text-gray-900">
                          {topicDetails.topic.description}
                        </p>
                      </div>
                    )}
                    {topicDetails.topic.requirements && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600">Yêu cầu:</span>
                        <p className="mt-1 text-gray-900">
                          {topicDetails.topic.requirements}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thông tin sinh viên */}
              {topicDetails.student && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Thông tin sinh viên
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tên sinh viên:</span>
                      <span className="ml-2 font-medium">
                        {topicDetails.student.studentName || studentName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Mã sinh viên:</span>
                      <span className="ml-2 font-medium">
                        {topicDetails.student.studentId}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Chuyên ngành:</span>
                      <span className="ml-2 font-medium">
                        {topicDetails.student.studentMajor || "Chưa xác định"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Trạng thái bảo vệ:</span>
                      <span className="ml-2 font-medium">
                        {topicDetails.student.status || "Chưa xác định"}
                      </span>
                    </div>
                    {topicDetails.student.defenseOrder && (
                      <div>
                        <span className="text-gray-600">Thứ tự bảo vệ:</span>
                        <span className="ml-2 font-medium">
                          {topicDetails.student.defenseOrder}
                        </span>
                      </div>
                    )}
                    {topicDetails.student.durationMinutes && (
                      <div>
                        <span className="text-gray-600">Thời gian bảo vệ:</span>
                        <span className="ml-2 font-medium">
                          {topicDetails.student.durationMinutes} phút
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thông tin buổi bảo vệ */}
              {topicDetails.student?.defenseSession && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Thông tin buổi bảo vệ
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tên buổi:</span>
                      <span className="ml-2 font-medium">
                        {topicDetails.student.defenseSession.sessionName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Ngày bảo vệ:</span>
                      <span className="ml-2 font-medium">
                        {formatDate(
                          topicDetails.student.defenseSession.defenseDate
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Giờ bắt đầu:</span>
                      <span className="ml-2 font-medium">
                        {formatDateTime(
                          topicDetails.student.defenseSession.startTime
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Giờ kết thúc:</span>
                      <span className="ml-2 font-medium">
                        {formatDateTime(
                          topicDetails.student.defenseSession.endTime
                        )}
                      </span>
                    </div>
                    {topicDetails.student.defenseSession.location && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600">Địa điểm:</span>
                        <span className="ml-2 font-medium">
                          {topicDetails.student.defenseSession.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Điểm số hiện tại */}
              {topicDetails.evaluations &&
                topicDetails.evaluations.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Điểm số hiện tại
                    </h4>
                    <div className="space-y-2">
                      {topicDetails.evaluations.map((evaluation, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-white rounded border"
                        >
                          <div>
                            <span className="font-medium">
                              {evaluation.evaluationType === "SUPERVISOR"
                                ? "Giảng viên hướng dẫn"
                                : evaluation.evaluationType === "REVIEWER"
                                ? "Giảng viên phản biện"
                                : "Hội đồng chấm"}
                            </span>
                            {evaluation.totalScore && (
                              <span className="ml-2 text-sm text-gray-600">
                                (Tổng: {evaluation.totalScore.toFixed(1)})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {evaluation.evaluationStatus === "COMPLETED"
                              ? "Đã chấm"
                              : evaluation.evaluationStatus === "IN_PROGRESS"
                              ? "Đang chấm"
                              : "Chưa chấm"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Điểm cuối cùng */}
              {topicDetails.finalScore && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Điểm cuối cùng
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {topicDetails.finalScore.supervisorScore && (
                      <div>
                        <span className="text-gray-600">Điểm GVHD:</span>
                        <span className="ml-2 font-medium">
                          {topicDetails.finalScore.supervisorScore.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {topicDetails.finalScore.reviewerScore && (
                      <div>
                        <span className="text-gray-600">Điểm GVPB:</span>
                        <span className="ml-2 font-medium">
                          {topicDetails.finalScore.reviewerScore.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {topicDetails.finalScore.committeeScore && (
                      <div>
                        <span className="text-gray-600">Điểm HĐ:</span>
                        <span className="ml-2 font-medium">
                          {topicDetails.finalScore.committeeScore.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {topicDetails.finalScore.finalScore && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600 font-bold">
                          Điểm tổng kết:
                        </span>
                        <span className="ml-2 font-bold text-lg text-indigo-600">
                          {topicDetails.finalScore.finalScore.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicDetailModal;
