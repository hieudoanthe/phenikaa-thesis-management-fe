import React, { useState, useEffect } from "react";
import {
  getFinalScore,
  generateCommitteeEvaluationPDF,
} from "../../services/grading.service";
import { toast } from "react-toastify";

const FinalScoreView = ({ topicId }) => {
  const [finalScore, setFinalScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (topicId) {
      loadFinalScore();
    }
  }, [topicId]);

  const loadFinalScore = async () => {
    setLoading(true);
    try {
      const data = await getFinalScore(topicId);
      setFinalScore(data);
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
      default:
        return status;
    }
  };

  const handleExportPDF = async () => {
    if (!topicId) {
      toast.error("Không tìm thấy thông tin đề tài");
      return;
    }

    setPdfLoading(true);
    try {
      await generateCommitteeEvaluationPDF(topicId);
      toast.success("Xuất PDF thành công!");
    } catch (error) {
      toast.error("Lỗi khi xuất PDF");
      console.error("Error exporting PDF:", error);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Đang tải điểm...</p>
      </div>
    );
  }

  if (!finalScore) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">Chưa có điểm</h4>
        <p className="text-gray-600">Điểm sẽ được hiển thị khi có đánh giá.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Kết quả điểm cuối cùng
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang xuất...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Xuất PDF
              </>
            )}
          </button>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              finalScore.status
            )}`}
          >
            {getStatusLabel(finalScore.status)}
          </span>
        </div>
      </div>

      {/* Final Score Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="text-center">
          <h4 className="text-lg font-medium mb-2">Điểm tổng kết</h4>
          <div className="text-4xl font-bold mb-2">
            {formatScore(finalScore.finalScore)}
          </div>
          <p className="text-blue-100 text-sm">
            Công thức: (GVHD × 1 + GVPB × 2 + HĐ × 1) ÷ 4
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GVHD Score */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <h5 className="text-sm font-medium text-gray-500 mb-1">
              Giảng viên hướng dẫn
            </h5>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatScore(finalScore.supervisorScore)}
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
              {formatScore(finalScore.reviewerScore)}
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
              {formatScore(finalScore.committeeScore)}
            </div>
            <div className="text-xs text-gray-500">Trọng số: 25%</div>
          </div>
        </div>
      </div>

      {/* Detailed Evaluations */}
      {finalScore.evaluations && finalScore.evaluations.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Chi tiết đánh giá
          </h4>
          <div className="space-y-4">
            {finalScore.evaluations.map((evaluation) => (
              <div
                key={evaluation.evaluationId}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {evaluation.evaluationType === "SUPERVISOR" &&
                        "Giảng viên hướng dẫn"}
                      {evaluation.evaluationType === "REVIEWER" &&
                        "Giảng viên phản biện"}
                      {evaluation.evaluationType === "COMMITTEE" &&
                        "Hội đồng chấm"}
                    </h5>
                    <p className="text-sm text-gray-500">
                      Đánh giá bởi: ID {evaluation.evaluatorId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatScore(evaluation.totalScore)}
                    </div>
                    <div className="text-xs text-gray-500">Tổng điểm</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Nội dung:</span>
                    <span className="ml-1 font-medium">
                      {formatScore(evaluation.contentScore)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Thuyết trình:</span>
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
                    <span className="text-sm text-gray-600">Nhận xét:</span>
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
    </div>
  );
};

export default FinalScoreView;
