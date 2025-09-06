import React, { useState, useEffect } from "react";

const GradingModal = ({ isOpen, onClose, evaluation, onSubmit }) => {
  const [gradingForm, setGradingForm] = useState({});

  // Initialize form based on evaluation type
  useEffect(() => {
    if (evaluation) {
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
    }
  }, [evaluation]);

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Chấm điểm - {evaluation.studentName}
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

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
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
    </div>
  );
};

export default GradingModal;
