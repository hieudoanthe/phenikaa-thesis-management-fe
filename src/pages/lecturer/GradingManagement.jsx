import React, { useState, useEffect } from "react";
import {
  submitEvaluation,
  getEvaluatorTasks,
  createEvaluationData,
} from "../../services/grading.service";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-toastify";
import GradingModal from "../../components/grading/GradingModal";
import QnAManagement from "../../components/grading/QnAManagement";
import FinalScoreView from "../../components/grading/FinalScoreView";
import TopicDetailModal from "../../components/grading/TopicDetailModal";
import { getUserIdFromToken } from "../../auth/authUtils";

const GradingManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("grading");
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showTopicDetailModal, setShowTopicDetailModal] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(null);

  // Mock data
  const mockEvaluations = [
    {
      id: 1,
      topicId: 1,
      studentId: 201,
      studentName: "Nguyễn Văn A",
      topicTitle: "Hệ thống quản lý thư viện",
      evaluationType: "SUPERVISOR",
      status: "PENDING",
      defenseDate: "2024-05-15",
      defenseTime: "10:00 AM",
    },
    {
      id: 2,
      topicId: 102,
      studentId: 202,
      studentName: "Trần Thị B",
      topicTitle: "Ứng dụng AI trong y tế",
      evaluationType: "REVIEWER",
      status: "PENDING",
      defenseDate: "2024-05-16",
      defenseTime: "2:00 PM",
    },
    {
      id: 3,
      topicId: 103,
      studentId: 203,
      studentName: "Lê Văn C",
      topicTitle: "Blockchain trong tài chính",
      evaluationType: "COMMITTEE",
      status: "COMPLETED",
      defenseDate: "2024-05-17",
      defenseTime: "9:00 AM",
    },
  ];

  useEffect(() => {
    loadEvaluations();
  }, [user]);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const lecturerId = user?.id || user?.userId || getUserIdFromToken();
      console.log("User ID:", lecturerId);
      if (!lecturerId) {
        setEvaluations([]);
        return;
      }

      // Load tasks

      const data = await getEvaluatorTasks(lecturerId, null, "all");
      console.log("Raw API data:", data);
      const normalized = (data || []).map((e) => ({
        id: e.evaluationId,
        topicId: e.topicId,
        studentId: e.studentId,
        studentName: e.studentName || `SV ${e.studentId}`,
        topicTitle: e.topicTitle || `Topic ${e.topicId}`,
        evaluationType: e.evaluationType,
        status: e.evaluationStatus || "PENDING",
        defenseDate: e.defenseDate || "",
        defenseTime: e.defenseTime || "",
      }));
      console.log("Normalized evaluations:", normalized);
      setEvaluations(normalized);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách chấm điểm");
      console.error("Error loading evaluations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGrading = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowGradingModal(true);
  };

  const handleViewTopicDetails = (evaluation) => {
    setSelectedTopicId(evaluation.topicId);
    setShowTopicDetailModal(true);
  };

  const handleSubmitGrading = async (gradingForm) => {
    if (!selectedEvaluation) return;

    // Validate form
    const scores = {
      content: parseFloat(gradingForm.contentScore),
      presentation: parseFloat(gradingForm.presentationScore),
      technical: parseFloat(gradingForm.technicalScore),
      innovation: parseFloat(gradingForm.innovationScore),
      defense: parseFloat(gradingForm.defenseScore),
    };

    // Validate scores
    for (const [key, value] of Object.entries(scores)) {
      if (isNaN(value) || value < 0 || value > 10) {
        toast.error(`Điểm ${key} phải từ 0 đến 10`);
        return;
      }
    }

    try {
      const evaluationData = createEvaluationData(
        selectedEvaluation.topicId,
        selectedEvaluation.studentId,
        user.id,
        selectedEvaluation.evaluationType,
        scores,
        gradingForm.comments
      );

      await submitEvaluation(evaluationData);
      toast.success("Chấm điểm thành công!");
      setShowGradingModal(false);
      loadEvaluations();
    } catch (error) {
      toast.error("Lỗi khi chấm điểm");
      console.error("Error submitting evaluation:", error);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "Chờ chấm";
      case "IN_PROGRESS":
        return "Đang chấm";
      case "COMPLETED":
        return "Đã chấm";
      default:
        return status;
    }
  };

  const filteredEvaluations = evaluations.filter((item) => {
    if (activeTab === "grading") {
      // Hiển thị tất cả các đề tài cần chấm điểm (PENDING, IN_PROGRESS, hoặc chưa có status)
      return (
        item.status === "PENDING" ||
        item.status === "IN_PROGRESS" ||
        !item.status
      );
    }
    return item.status === "COMPLETED";
  });

  console.log("All evaluations:", evaluations);
  console.log("Filtered evaluations:", filteredEvaluations);
  console.log("Active tab:", activeTab);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý chấm điểm
          </h1>
          <p className="text-gray-600">
            Chấm điểm và đánh giá các đề tài được gán cho bạn trong buổi bảo vệ
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: "grading", label: "Đề tài cần chấm", icon: "📝" },
                { key: "qna", label: "Q&A", icon: "❓" },
                { key: "results", label: "Kết quả", icon: "📊" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.key === "grading" && (
                    <span
                      className={`py-0.5 px-2 rounded-full text-xs ${
                        activeTab === tab.key
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {evaluations.filter((e) => e.status === "PENDING").length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "grading" && (
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có đề tài nào cần chấm điểm
                </h3>
                <p className="text-gray-600">
                  Hiện tại không có đề tài nào được gán cho bạn để chấm điểm.
                  Vui lòng liên hệ admin để được gán vào buổi bảo vệ.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sinh viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đề tài
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vai trò chấm điểm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lịch bảo vệ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEvaluations.map((evaluation) => (
                      <tr key={evaluation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {evaluation.studentName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {evaluation.studentName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {evaluation.studentId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {evaluation.topicTitle}
                          </div>
                          <div className="text-sm text-gray-500">
                            Topic ID: {evaluation.topicId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getEvaluationTypeLabel(evaluation.evaluationType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{evaluation.defenseDate}</div>
                          <div className="text-gray-500">
                            {evaluation.defenseTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              evaluation.status
                            )}`}
                          >
                            {getStatusLabel(evaluation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewTopicDetails(evaluation)}
                              className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => handleStartGrading(evaluation)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                            >
                              {evaluation.status === "PENDING"
                                ? "Chấm điểm"
                                : "Xem lại"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "qna" && (
          <div className="bg-white rounded-lg shadow p-6">
            <QnAManagement
              topicId={selectedEvaluation?.topicId || 1}
              studentId={selectedEvaluation?.studentId || 201}
            />
          </div>
        )}

        {activeTab === "results" && (
          <div className="bg-white rounded-lg shadow p-6">
            <FinalScoreView topicId={selectedEvaluation?.topicId || 1} />
          </div>
        )}

        {/* Grading Modal */}
        <GradingModal
          isOpen={showGradingModal}
          onClose={() => setShowGradingModal(false)}
          evaluation={selectedEvaluation}
          onSubmit={handleSubmitGrading}
        />

        {/* Topic Detail Modal */}
        <TopicDetailModal
          isOpen={showTopicDetailModal}
          onClose={() => setShowTopicDetailModal(false)}
          topicId={selectedTopicId}
          studentName={selectedEvaluation?.studentName}
          topicTitle={selectedEvaluation?.topicTitle}
        />
      </div>
    </div>
  );
};

export default GradingManagement;
