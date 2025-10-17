import React, { useState, useEffect } from "react";
import { getEvaluationsByTopic } from "../../services/grading.service";
import { getUserIdFromToken } from "../../auth/authUtils";
import { toast } from "react-toastify";

const GradingModal = ({ isOpen, onClose, evaluation, onSubmit }) => {
  const [gradingForm, setGradingForm] = useState({});
  const [loading, setLoading] = useState(false);

  // Load existing evaluation data when modal opens
  useEffect(() => {
    const loadExistingEvaluation = async () => {
      if (!evaluation || !isOpen) return;

      setLoading(true);
      try {
        // Get evaluator ID
        const evaluatorId = getUserIdFromToken();
        if (!evaluatorId) {
          toast.error("Không thể xác định ID giảng viên");
          return;
        }

        // Load existing evaluations for this topic
        const evaluations = await getEvaluationsByTopic(evaluation.topicId);

        // Find the evaluation for this evaluator and type
        const existingEvaluation = evaluations?.find(
          (evaluationItem) =>
            evaluationItem.evaluatorId === parseInt(evaluatorId) &&
            evaluationItem.evaluationType === evaluation.evaluationType
        );

        if (existingEvaluation) {
          // Load existing data directly from backend (now includes role-specific fields)
          const existingForm = {
            comments: existingEvaluation.comments || "",
            // Use role-specific fields directly from backend
            presentationClarityScore:
              existingEvaluation.presentationClarityScore || "",
            reviewerQaScore: existingEvaluation.reviewerQaScore || "",
            committeeQaScore: existingEvaluation.committeeQaScore || "",
            attitudeScore: existingEvaluation.attitudeScore || "",
            contentImplementationScore:
              existingEvaluation.contentImplementationScore || "",
            relatedIssuesScore: existingEvaluation.relatedIssuesScore || "",
            formatScore: existingEvaluation.formatScore || "",
            contentQualityScore: existingEvaluation.contentQualityScore || "",
            relatedIssuesReviewerScore:
              existingEvaluation.relatedIssuesReviewerScore || "",
            practicalApplicationScore:
              existingEvaluation.practicalApplicationScore || "",
            bonusScore: existingEvaluation.bonusScore || "",
            studentAttitudeScore: existingEvaluation.studentAttitudeScore || "",
            problemSolvingScore: existingEvaluation.problemSolvingScore || "",
            formatSupervisorScore:
              existingEvaluation.formatSupervisorScore || "",
            contentImplementationSupervisorScore:
              existingEvaluation.contentImplementationSupervisorScore || "",
            relatedIssuesSupervisorScore:
              existingEvaluation.relatedIssuesSupervisorScore || "",
            practicalApplicationSupervisorScore:
              existingEvaluation.practicalApplicationSupervisorScore || "",
          };
          setGradingForm(existingForm);
        } else {
          // Initialize empty form if no existing evaluation
          initializeEmptyForm();
        }
      } catch (error) {
        console.error("Error loading existing evaluation:", error);
        toast.error("Không thể tải dữ liệu chấm điểm");
        initializeEmptyForm();
      } finally {
        setLoading(false);
      }
    };

    loadExistingEvaluation();
  }, [evaluation, isOpen]);

  const initializeEmptyForm = () => {
    if (!evaluation) return;

    const initialForm = {};

    if (evaluation.evaluationType === "COMMITTEE") {
      // Hội đồng: 6 tiêu chí
      initialForm.presentationClarityScore = "";
      initialForm.reviewerQaScore = "";
      initialForm.committeeQaScore = "";
      initialForm.attitudeScore = "";
      initialForm.contentImplementationScore = "";
      initialForm.relatedIssuesScore = "";
    } else if (evaluation.evaluationType === "REVIEWER") {
      // Giảng viên phản biện: 5 tiêu chí
      initialForm.formatScore = "";
      initialForm.contentQualityScore = "";
      initialForm.relatedIssuesReviewerScore = "";
      initialForm.practicalApplicationScore = "";
      initialForm.bonusScore = "";
    } else if (evaluation.evaluationType === "SUPERVISOR") {
      // Giảng viên hướng dẫn: 6 tiêu chí
      initialForm.studentAttitudeScore = "";
      initialForm.problemSolvingScore = "";
      initialForm.formatSupervisorScore = "";
      initialForm.contentImplementationSupervisorScore = "";
      initialForm.relatedIssuesSupervisorScore = "";
      initialForm.practicalApplicationSupervisorScore = "";
    }

    initialForm.comments = "";
    setGradingForm(initialForm);
  };

  const handleSubmit = () => {
    onSubmit(gradingForm);
  };

  const getEvaluationTypeLabel = (type) => {
    switch (type) {
      case "SUPERVISOR":
        return "Giảng viên hướng dẫn";
      case "REVIEWER":
        return "Giảng viên phản biện";
      case "COMMITTEE":
        return "Hội đồng chấm";
      default:
        return type;
    }
  };

  const getRoleSpecificCriteria = () => {
    if (evaluation?.evaluationType === "COMMITTEE") {
      return [
        {
          key: "presentationClarityScore",
          label: "Trình bày nội dung",
          max: 0.5,
          description: "Slide rõ ràng, ngắn gọn, đầy đủ, đúng giờ",
        },
        {
          key: "reviewerQaScore",
          label: "Trả lời câu hỏi GVPB",
          max: 1.5,
          description: "Trả lời câu hỏi của giảng viên phản biện",
        },
        {
          key: "committeeQaScore",
          label: "Trả lời câu hỏi hội đồng",
          max: 1.5,
          description: "Trả lời các câu hỏi của thành viên hội đồng",
        },
        {
          key: "attitudeScore",
          label: "Tinh thần, thái độ",
          max: 1.0,
          description: "Tinh thần, thái độ và cách ứng xử",
        },
        {
          key: "contentImplementationScore",
          label: "Thực hiện nội dung đề tài",
          max: 4.5,
          description:
            "Nội dung chuyên môn, phương pháp nghiên cứu, mức độ sáng tạo",
        },
        {
          key: "relatedIssuesScore",
          label: "Mối liên hệ vấn đề liên quan",
          max: 1.0,
          description: "Cơ sở lý thuyết và các hướng nghiên cứu khác",
        },
      ];
    } else if (evaluation?.evaluationType === "REVIEWER") {
      return [
        {
          key: "formatScore",
          label: "Hình thức trình bày",
          max: 1.5,
          description: "Quyển, thuyết minh và bản vẽ",
        },
        {
          key: "contentQualityScore",
          label: "Thực hiện nội dung đề tài",
          max: 4.0,
          description: "Thực hiện các nội dung của đề tài",
        },
        {
          key: "relatedIssuesReviewerScore",
          label: "Mối liên hệ vấn đề liên quan",
          max: 2.0,
          description: "Mối liên hệ với những vấn đề liên quan",
        },
        {
          key: "practicalApplicationScore",
          label: "Tính ứng dụng thực tiễn",
          max: 2.0,
          description: "Tính ứng dụng thực tiễn",
        },
        {
          key: "bonusScore",
          label: "Điểm thưởng",
          max: 0.5,
          description: "Có giải thưởng nghiên cứu khoa học, báo báo...",
        },
      ];
    } else if (evaluation?.evaluationType === "SUPERVISOR") {
      return [
        {
          key: "studentAttitudeScore",
          label: "Ý thức, thái độ sinh viên",
          max: 1.0,
          description: "Trong quá trình thực hiện đề tài",
        },
        {
          key: "problemSolvingScore",
          label: "Khả năng xử lý vấn đề",
          max: 1.0,
          description: "Của sinh viên trong thực hiện đề tài",
        },
        {
          key: "formatSupervisorScore",
          label: "Hình thức trình bày",
          max: 1.5,
          description: "Quyển, thuyết minh và bản vẽ",
        },
        {
          key: "contentImplementationSupervisorScore",
          label: "Thực hiện nội dung đề tài",
          max: 4.5,
          description: "Thực hiện các nội dung của đề tài",
        },
        {
          key: "relatedIssuesSupervisorScore",
          label: "Mối liên hệ vấn đề liên quan",
          max: 1.0,
          description: "Mối liên hệ với những vấn đề liên quan",
        },
        {
          key: "practicalApplicationSupervisorScore",
          label: "Tính ứng dụng thực tiễn",
          max: 1.0,
          description: "Tính ứng dụng thực tiễn",
        },
      ];
    }
    return [];
  };

  const calculateTotalScore = () => {
    const criteria = getRoleSpecificCriteria();
    let total = 0;
    let hasAllScores = true;

    criteria.forEach((criterion) => {
      const score = parseFloat(gradingForm[criterion.key]) || 0;
      total += score;
      if (!gradingForm[criterion.key]) {
        hasAllScores = false;
      }
    });

    return { total: total.toFixed(1), hasAllScores };
  };

  if (!isOpen || !evaluation) return null;

  const criteria = getRoleSpecificCriteria();
  const { total, hasAllScores } = calculateTotalScore();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col relative">
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Đang tải dữ liệu...</span>
            </div>
          </div>
        )}

        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            Chấm điểm - {evaluation.studentName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Student Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">
              Thông tin sinh viên
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Sinh viên:</span>
                <span className="ml-2 font-medium">
                  {evaluation.studentName}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Đề tài:</span>
                <span className="ml-2 font-medium">
                  {evaluation.topicTitle}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Loại đánh giá:</span>
                <span className="ml-2 font-medium">
                  {getEvaluationTypeLabel(evaluation.evaluationType)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Lịch bảo vệ:</span>
                <span className="ml-2 font-medium">
                  {evaluation.defenseDate} - {evaluation.defenseTime}
                </span>
              </div>
            </div>
          </div>

          {/* Role-specific Criteria */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 mb-4">
              Tiêu chí chấm điểm -{" "}
              {getEvaluationTypeLabel(evaluation.evaluationType)}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criteria.map((criterion) => (
                <div key={criterion.key} className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {criterion.label}
                    </label>
                    <span className="text-xs text-gray-500">
                      (0 - {criterion.max} điểm)
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    {criterion.description}
                  </p>
                  <input
                    type="number"
                    min="0"
                    max={criterion.max}
                    step="0.1"
                    value={gradingForm[criterion.key] || ""}
                    onChange={(e) =>
                      setGradingForm({
                        ...gradingForm,
                        [criterion.key]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.0"
                  />
                </div>
              ))}
            </div>

            {/* Total Score Display */}
            <div className="bg-green-50 rounded-lg p-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">
                  Tổng điểm:
                </span>
                <span
                  className={`text-2xl font-bold ${
                    hasAllScores ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {total} / 10.0
                </span>
              </div>
              {!hasAllScores && (
                <p className="text-sm text-gray-600 mt-1">
                  Vui lòng nhập đầy đủ tất cả các tiêu chí
                </p>
              )}
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhận xét
              </label>
              <textarea
                value={gradingForm.comments || ""}
                onChange={(e) =>
                  setGradingForm({ ...gradingForm, comments: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập nhận xét về bài làm của sinh viên..."
              />
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasAllScores}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              hasAllScores
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Lưu điểm
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradingModal;
