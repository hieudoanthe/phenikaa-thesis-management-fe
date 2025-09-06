import React, { useState, useEffect } from "react";
import { getFinalScore } from "../../services/grading.service";
import { toast } from "react-toastify";

const AllFinalScoresView = ({ evaluations }) => {
  const [finalScores, setFinalScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState(new Set());

  useEffect(() => {
    if (evaluations && evaluations.length > 0) {
      loadAllFinalScores();
    }
  }, [evaluations]);

  const loadAllFinalScores = async () => {
    setLoading(true);
    try {
      const scores = {};

      // Lấy điểm cuối cùng cho từng đề tài
      for (const evaluation of evaluations) {
        try {
          const data = await getFinalScore(evaluation.topicId);
          scores[evaluation.topicId] = {
            ...data,
            topicTitle: evaluation.topicTitle,
            studentName: evaluation.studentName,
            studentId: evaluation.studentId,
          };
        } catch (error) {
          console.error(
            `Error loading final score for topic ${evaluation.topicId}:`,
            error
          );
          // Vẫn hiển thị đề tài nhưng không có điểm
          scores[evaluation.topicId] = {
            topicTitle: evaluation.topicTitle,
            studentName: evaluation.studentName,
            studentId: evaluation.studentId,
            finalScore: null,
            status: "NO_SCORE",
          };
        }
      }

      setFinalScores(scores);
    } catch (error) {
      toast.error("Lỗi khi tải điểm cuối cùng");
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score) => {
    return score ? score.toFixed(1) : "0.0";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "INCOMPLETE":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "NO_SCORE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "COMPLETED":
        return "Đã hoàn thành";
      case "INCOMPLETE":
        return "Chưa hoàn thành";
      case "PENDING":
        return "Chờ chấm điểm";
      case "NO_SCORE":
        return "Chưa có điểm";
      default:
        return status;
    }
  };

  const toggleTopicExpansion = (topicId) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const isTopicExpanded = (topicId) => {
    return expandedTopics.has(topicId);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Đang tải điểm...</p>
      </div>
    );
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có đề tài
        </h4>
        <p className="text-gray-600">
          Chưa có đề tài nào được gán để chấm điểm.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Kết quả điểm cuối cùng - Tất cả đề tài
        </h3>
        <span className="text-sm text-gray-500">
          {Object.keys(finalScores).length} đề tài
        </span>
      </div>

      {/* List of Final Scores */}
      <div className="space-y-4">
        {Object.entries(finalScores).map(([topicId, scoreData]) => (
          <div
            key={topicId}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            {/* Topic Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  {scoreData.topicTitle}
                </h4>
                <p className="text-sm text-gray-500">
                  Sinh viên: {scoreData.studentName} (ID: {scoreData.studentId})
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    scoreData.status
                  )}`}
                >
                  {getStatusLabel(scoreData.status)}
                </span>
                <button
                  onClick={() => toggleTopicExpansion(topicId)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isTopicExpanded(topicId) ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Thu gọn
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
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
                      Xem chi tiết
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Final Score Card - Show if available */}
            {scoreData.finalScore !== null && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white mb-4">
                <div className="text-center">
                  <h5 className="text-sm font-medium mb-1">Điểm tổng kết</h5>
                  <div className="text-3xl font-bold mb-1">
                    {formatScore(scoreData.finalScore)}
                  </div>
                  <p className="text-blue-100 text-xs">
                    Công thức: (GVHD × 1 + GVPB × 2 + HĐ × 1) ÷ 4
                  </p>
                </div>
              </div>
            )}

            {/* Show incomplete status if no final score */}
            {scoreData.finalScore === null && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <h5 className="text-sm font-medium text-yellow-800 mb-1">
                    Chưa có điểm tổng kết
                  </h5>
                  <p className="text-yellow-700 text-xs">
                    Cần đủ điểm từ tất cả vai trò để tính điểm cuối cùng
                  </p>
                </div>
              </div>
            )}

            {/* Detailed View - Only when expanded */}
            {isTopicExpanded(topicId) && (
              <>
                {/* Score Breakdown - Same as FinalScoreView */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* GVHD Score */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-center">
                      <h5 className="text-sm font-medium text-gray-500 mb-1">
                        Giảng viên hướng dẫn
                      </h5>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatScore(scoreData.supervisorScore)}
                      </div>
                      <div className="text-xs text-gray-500">Trọng số: 25%</div>
                    </div>
                  </div>

                  {/* GVPB Score */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-center">
                      <h5 className="text-sm font-medium text-gray-500 mb-1">
                        Giảng viên phản biện
                      </h5>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatScore(scoreData.reviewerScore)}
                      </div>
                      <div className="text-xs text-gray-500">Trọng số: 50%</div>
                    </div>
                  </div>

                  {/* Committee Score */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-center">
                      <h5 className="text-sm font-medium text-gray-500 mb-1">
                        Hội đồng chấm
                      </h5>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatScore(scoreData.committeeScore)}
                      </div>
                      <div className="text-xs text-gray-500">Trọng số: 25%</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Evaluations - Same as FinalScoreView */}
                {scoreData.evaluations && scoreData.evaluations.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Chi tiết đánh giá
                    </h4>
                    <div className="space-y-4">
                      {scoreData.evaluations.map((evaluation) => (
                        <div
                          key={evaluation.evaluationId}
                          className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h6 className="font-medium text-gray-900">
                                {evaluation.evaluationType === "SUPERVISOR" &&
                                  "Giảng viên hướng dẫn"}
                                {evaluation.evaluationType === "REVIEWER" &&
                                  "Giảng viên phản biện"}
                                {evaluation.evaluationType === "COMMITTEE" &&
                                  "Hội đồng chấm"}
                              </h6>
                              <p className="text-sm text-gray-500">
                                Đánh giá bởi: ID {evaluation.evaluatorId}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {formatScore(evaluation.totalScore)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Tổng điểm
                              </div>
                            </div>
                          </div>

                          {/* Score details - Same as FinalScoreView */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Nội dung:</span>
                              <span className="ml-1 font-medium">
                                {formatScore(evaluation.contentScore)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Thuyết trình:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatScore(evaluation.presentationScore)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Kỹ thuật:</span>
                              <span className="ml-1 font-medium">
                                {formatScore(evaluation.technicalScore)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Sáng tạo:</span>
                              <span className="ml-1 font-medium">
                                {formatScore(evaluation.innovationScore)}
                              </span>
                            </div>
                            {evaluation.defenseScore && (
                              <div>
                                <span className="text-gray-600">Bảo vệ:</span>
                                <span className="ml-1 font-medium">
                                  {formatScore(evaluation.defenseScore)}
                                </span>
                              </div>
                            )}
                          </div>

                          {evaluation.comments && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="text-sm text-gray-600">
                                Nhận xét:
                              </span>
                              <p className="text-sm text-gray-900 mt-1">
                                {evaluation.comments}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllFinalScoresView;
