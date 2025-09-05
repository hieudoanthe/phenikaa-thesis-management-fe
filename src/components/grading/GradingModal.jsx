import React, { useState } from "react";

const GradingModal = ({ isOpen, onClose, evaluation, onSubmit }) => {
  const [gradingForm, setGradingForm] = useState({
    contentScore: "",
    presentationScore: "",
    technicalScore: "",
    innovationScore: "",
    defenseScore: "",
    comments: "",
  });

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

  if (!isOpen || !evaluation) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
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

          {/* Grading Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm nội dung (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={gradingForm.contentScore}
                  onChange={(e) =>
                    setGradingForm({
                      ...gradingForm,
                      contentScore: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm thuyết trình (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={gradingForm.presentationScore}
                  onChange={(e) =>
                    setGradingForm({
                      ...gradingForm,
                      presentationScore: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm kỹ thuật (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={gradingForm.technicalScore}
                  onChange={(e) =>
                    setGradingForm({
                      ...gradingForm,
                      technicalScore: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm sáng tạo (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={gradingForm.innovationScore}
                  onChange={(e) =>
                    setGradingForm({
                      ...gradingForm,
                      innovationScore: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* Defense Score - chỉ hiển thị cho hội đồng */}
            {evaluation.evaluationType === "COMMITTEE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm bảo vệ (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={gradingForm.defenseScore}
                  onChange={(e) =>
                    setGradingForm({
                      ...gradingForm,
                      defenseScore: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhận xét
              </label>
              <textarea
                value={gradingForm.comments}
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
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
