import React, { useState, useEffect } from "react";
import {
  submitEvaluation,
  getEvaluatorTasks,
} from "../../services/grading.service";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-toastify";

// Helper hiển thị toast sử dụng react-toastify
const showToast = (message, type = "success") => {
  try {
    if (type === "error") return toast.error(message);
    if (type === "warning") return toast.warn(message);
    if (type === "info") return toast.info(message);
    return toast.success(message);
  } catch (err) {
    console.error("Không thể hiển thị toast:", err);
    (type === "success" ? console.log : console.error)(message);
  }
};
import GradingModal from "../../components/grading/GradingModal";
import QnAManagement from "../../components/grading/QnAManagement";
import AllFinalScoresView from "../../components/grading/AllFinalScoresView";
import TopicDetailModal from "../../components/grading/TopicDetailModal";
import { getUserIdFromToken } from "../../auth/authUtils";
import userService from "../../services/user.service";
import Select from "react-select";

const GradingManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("grading");
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showTopicDetailModal, setShowTopicDetailModal] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedQnATopic, setSelectedQnATopic] = useState(null);
  const [studentProfiles, setStudentProfiles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 6;

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

  // Load fullName for students based on IDs (like ThesisManagement)
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const uniqueIds = Array.from(
          new Set((evaluations || []).map((e) => e.studentId).filter(Boolean))
        ).filter((id) => !studentProfiles[id]);

        if (uniqueIds.length === 0) return;

        const newProfiles = { ...studentProfiles };
        for (const id of uniqueIds) {
          try {
            const profile = await userService.getStudentProfileById(id);
            newProfiles[id] = {
              fullName: profile.fullName || profile.name || `SV ${id}`,
            };
          } catch (err) {
            newProfiles[id] = { fullName: `SV ${id}` };
          }
        }
        setStudentProfiles(newProfiles);
      } catch (err) {
        // ignore
      }
    };

    if (evaluations && evaluations.length > 0) {
      loadProfiles();
    }
  }, [evaluations]);

  const getStudentDisplayName = (studentId, fallbackName) => {
    return (
      studentProfiles[studentId]?.fullName ||
      fallbackName ||
      (studentId ? `SV ${studentId}` : "Sinh viên")
    );
  };

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

      // Debug: Log chi tiết từng task
      if (data && data.length > 0) {
        console.log("Task details:");
        data.forEach((task, index) => {
          console.log(`Task ${index + 1}:`, {
            id: task.id,
            topicId: task.topicId,
            studentId: task.studentId,
            evaluationType: task.evaluationType,
            studentName: task.studentName,
            topicTitle: task.topicTitle,
          });
        });
      }
      const normalized = (data || []).map((e, index) => ({
        id: e.evaluationId || `task_${e.topicId}_${e.evaluationType}_${index}`,
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

      // Debug: Log chi tiết từng normalized evaluation
      normalized.forEach((evaluation, index) => {
        console.log(`Normalized ${index + 1}:`, {
          id: evaluation.id,
          topicId: evaluation.topicId,
          evaluationType: evaluation.evaluationType,
          status: evaluation.status,
        });
      });
      setEvaluations(normalized);
    } catch (error) {
      showToast("Lỗi khi tải danh sách chấm điểm", "error");
      console.error("Error loading evaluations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGrading = (evaluation) => {
    const displayName = getStudentDisplayName(
      evaluation.studentId,
      evaluation.studentName
    );
    setSelectedEvaluation({ ...evaluation, studentName: displayName });
    setShowGradingModal(true);
  };

  const handleViewTopicDetails = (evaluation) => {
    setSelectedTopicId(evaluation.topicId);
    setShowTopicDetailModal(true);
  };

  // Auto-select first topic when switching to Q&A tab
  useEffect(() => {
    if (activeTab === "qna" && !selectedQnATopic && evaluations.length > 0) {
      const uniqueTopics = evaluations.filter(
        (evaluation, index, self) =>
          self.findIndex((e) => e.topicId === evaluation.topicId) === index
      );
      if (uniqueTopics.length > 0) {
        setSelectedQnATopic(uniqueTopics[0]);
      }
    }
  }, [activeTab, selectedQnATopic, evaluations]);

  const handleSubmitGrading = async (gradingForm) => {
    if (!selectedEvaluation) return;

    try {
      // Get evaluatorId with fallback
      const evaluatorId = user?.id || getUserIdFromToken();
      if (!evaluatorId) {
        showToast("Không thể xác định ID giảng viên", "error");
        return;
      }

      // Create evaluation data with role-specific fields
      const evaluationData = {
        topicId: selectedEvaluation.topicId,
        studentId: selectedEvaluation.studentId,
        evaluatorId: evaluatorId,
        evaluationType: selectedEvaluation.evaluationType,
        comments: gradingForm.comments,
        ...gradingForm, // Include all role-specific score fields
      };

      await submitEvaluation(evaluationData);
      showToast("Chấm điểm thành công!", "success");
      setShowGradingModal(false);
      loadEvaluations();
    } catch (error) {
      showToast("Lỗi khi chấm điểm", "error");
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
      return (
        item.status === "PENDING" ||
        item.status === "IN_PROGRESS" ||
        !item.status ||
        item.id.toString().startsWith("task_") || // Tasks chưa được chấm điểm
        item.status === "COMPLETED" // Hiển thị cả tasks đã chấm để có thể chấm lại
      );
    }
    return item.status === "COMPLETED";
  });

  console.log("All evaluations:", evaluations);
  console.log("Filtered evaluations:", filteredEvaluations);
  console.log("Active tab:", activeTab);

  // Sort so that evaluations of the same student (by ID) are grouped together
  const sortedEvaluations = [...filteredEvaluations].sort((a, b) => {
    const aId = a.studentId ?? 0;
    const bId = b.studentId ?? 0;
    if (aId !== bId) return aId - bId;
    const aTitle = String(a.topicTitle || "");
    const bTitle = String(b.topicTitle || "");
    return aTitle.localeCompare(bTitle);
  });

  const matchesSearch = (evaluation) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const title = String(evaluation.topicTitle || "").toLowerCase();
    const name = String(
      getStudentDisplayName(evaluation.studentId, evaluation.studentName) || ""
    ).toLowerCase();
    return title.includes(q) || name.includes(q);
  };

  const searchedEvaluations = sortedEvaluations.filter(matchesSearch);

  const totalClientPages = Math.max(
    1,
    Math.ceil(searchedEvaluations.length / pageSize)
  );
  const safeCurrentPage = Math.min(currentPage, totalClientPages - 1);
  const pagedEvaluations = searchedEvaluations.slice(
    safeCurrentPage * pageSize,
    safeCurrentPage * pageSize + pageSize
  );

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, evaluations, activeTab]);

  // Q&A topic options using react-select
  const qnaTopicOptions = [...evaluations]
    .sort((a, b) => {
      const aId = a.studentId ?? 0;
      const bId = b.studentId ?? 0;
      if (aId !== bId) return aId - bId;
      const aTitle = String(a.topicTitle || "");
      const bTitle = String(b.topicTitle || "");
      return aTitle.localeCompare(bTitle);
    })
    .filter(
      (evaluation, index, self) =>
        self.findIndex((e) => e.topicId === evaluation.topicId) === index
    )
    .map((evaluation) => ({
      value: evaluation.topicId,
      label: `${evaluation.topicTitle} - ${getStudentDisplayName(
        evaluation.studentId,
        evaluation.studentName
      )}`,
      data: evaluation,
    }));

  const selectTheme = (theme) => ({
    ...theme,
    colors: {
      ...theme.colors,
      primary: "#ff6600",
      primary25: "#ffe0cc",
      primary50: "#ffb380",
    },
  });

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "#ff6600" : base.borderColor,
      boxShadow: state.isFocused ? "0 0 0 1px #ff6600" : base.boxShadow,
      "&:hover": {
        borderColor: state.isFocused ? "#ff6600" : base.borderColor,
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#ff6600"
        : state.isFocused
        ? "#ffe0cc"
        : base.backgroundColor,
      color: state.isSelected ? "#fff" : base.color,
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? "#ff6600" : base.color,
      "&:hover": { color: "#ff6600" },
    }),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                {
                  key: "grading",
                  label: "Đề tài cần chấm",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                      />
                    </svg>
                  ),
                },
                {
                  key: "qna",
                  label: "Q&A",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-question-lg"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4.475 5.458c-.284 0-.514-.237-.47-.517C4.28 3.24 5.576 2 7.825 2c2.25 0 3.767 1.36 3.767 3.215 0 1.344-.665 2.288-1.79 2.973-1.1.659-1.414 1.118-1.414 2.01v.03a.5.5 0 0 1-.5.5h-.77a.5.5 0 0 1-.5-.495l-.003-.2c-.043-1.221.477-2.001 1.645-2.712 1.03-.632 1.397-1.135 1.397-2.028 0-.979-.758-1.698-1.926-1.698-1.009 0-1.71.529-1.938 1.402-.066.254-.278.461-.54.461h-.777ZM7.496 14c.622 0 1.095-.474 1.095-1.09 0-.618-.473-1.092-1.095-1.092-.606 0-1.087.474-1.087 1.091S6.89 14 7.496 14"
                      />
                    </svg>
                  ),
                },
                {
                  key: "results",
                  label: "Kết quả",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-check2-all"
                      viewBox="0 0 16 16"
                    >
                      <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0" />
                      <path d="m5.354 7.146.896.897-.707.707-.897-.896a.5.5 0 1 1 .708-.708" />
                    </svg>
                  ),
                },
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
                <div className="p-4 flex items-center gap-3">
                  <div className="relative w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm theo đề tài hoặc tên sinh viên..."
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-400 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
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
                    {pagedEvaluations.map((evaluation) => {
                      const displayName = getStudentDisplayName(
                        evaluation.studentId,
                        evaluation.studentName
                      );
                      return (
                        <tr key={evaluation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {displayName}
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
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              {getEvaluationTypeLabel(
                                evaluation.evaluationType
                              )}
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
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(
                                evaluation.status
                              )}`}
                            >
                              {getStatusLabel(evaluation.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleViewTopicDetails({
                                    ...evaluation,
                                    studentName: displayName,
                                  })
                                }
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                              >
                                Chi tiết
                              </button>
                              <button
                                onClick={() =>
                                  handleStartGrading({
                                    ...evaluation,
                                    studentName: displayName,
                                  })
                                }
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                              >
                                {evaluation.status === "PENDING"
                                  ? "Chấm điểm"
                                  : "Xem lại"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Client-side Pagination */}
                {totalClientPages > 1 && (
                  <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Trang{" "}
                      <span className="font-medium">{safeCurrentPage + 1}</span>{" "}
                      / {totalClientPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(0, safeCurrentPage - 1))
                        }
                        disabled={safeCurrentPage === 0}
                        className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(
                            Math.min(totalClientPages - 1, safeCurrentPage + 1)
                          )
                        }
                        disabled={safeCurrentPage === totalClientPages - 1}
                        className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "qna" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              {/* Topic Selection */}
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="qnaTopicSelect"
                >
                  Chọn đề tài để quản lý Q&A:
                </label>
                <Select
                  inputId="qnaTopicSelect"
                  classNamePrefix="rs"
                  options={qnaTopicOptions}
                  value={
                    selectedQnATopic
                      ? {
                          value: selectedQnATopic.topicId,
                          label: `${
                            selectedQnATopic.topicTitle
                          } - ${getStudentDisplayName(
                            selectedQnATopic.studentId,
                            selectedQnATopic.studentName
                          )}`,
                          data: selectedQnATopic,
                        }
                      : null
                  }
                  onChange={(opt) => setSelectedQnATopic(opt ? opt.data : null)}
                  placeholder="-- Chọn đề tài --"
                  isClearable={false}
                  theme={selectTheme}
                  styles={selectStyles}
                />
              </div>
            </div>

            {/* Q&A Management */}
            {selectedQnATopic ? (
              <QnAManagement
                topicId={selectedQnATopic.topicId}
                studentId={selectedQnATopic.studentId}
                topicTitle={selectedQnATopic.topicTitle}
                studentName={getStudentDisplayName(
                  selectedQnATopic.studentId,
                  selectedQnATopic.studentName
                )}
              />
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-question-lg"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.475 5.458c-.284 0-.514-.237-.47-.517C4.28 3.24 5.576 2 7.825 2c2.25 0 3.767 1.36 3.767 3.215 0 1.344-.665 2.288-1.79 2.973-1.1.659-1.414 1.118-1.414 2.01v.03a.5.5 0 0 1-.5.5h-.77a.5.5 0 0 1-.5-.495l-.003-.2c-.043-1.221.477-2.001 1.645-2.712 1.03-.632 1.397-1.135 1.397-2.028 0-.979-.758-1.698-1.926-1.698-1.009 0-1.71.529-1.938 1.402-.066.254-.278.461-.54.461h-.777ZM7.496 14c.622 0 1.095-.474 1.095-1.09 0-.618-.473-1.092-1.095-1.092-.606 0-1.087.474-1.087 1.091S6.89 14 7.496 14"
                  />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa chọn đề tài
                </h4>
                <p className="text-gray-600">
                  Vui lòng chọn một đề tài để quản lý Q&A.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div className="bg-white rounded-lg shadow p-6">
            <AllFinalScoresView
              evaluations={evaluations.map((e) => ({
                ...e,
                studentName: getStudentDisplayName(e.studentId, e.studentName),
              }))}
            />
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
          studentName={getStudentDisplayName(
            selectedEvaluation?.studentId,
            selectedEvaluation?.studentName
          )}
          topicTitle={selectedEvaluation?.topicTitle}
        />
      </div>
    </div>
  );
};

export default GradingManagement;
