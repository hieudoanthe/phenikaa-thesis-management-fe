import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assignmentService } from "../../services";
import { getUserIdFromToken } from "../../auth/authUtils";
import * as submissionService from "../../services/submission.service";
import { toast } from "react-toastify";

// Helper hiển thị toast sử dụng react-toastify
const showToast = (message, type = "success") => {
  try {
    if (type === "error") return showToast(message);
    if (type === "warning") return toast.warn(message);
    if (type === "info") return toast.info(message);
    return showToast(message);
  } catch (err) {
    console.error("Không thể hiển thị toast:", err);
    (type === "success" ? console.log : console.error)(message);
  }
};

const AssignmentsDetail = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    topicId: "",
    reportTitle: "",
    description: "",
    submissionType: 1,
    deadline: "",
    file: null,
    submittedBy: null,
  });

  const query = new URLSearchParams(window.location.search);
  const topicId = query.get("topicId");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      if (!topicId) {
        setError("Thiếu topicId");
        setAssignments([]);
        return;
      }
      const res = await assignmentService.getAssignmentsByTopic(topicId);
      if (res.success) {
        setAssignments(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.message || "Không thể tải assignments");
      }
    } catch (e) {
      setError("Có lỗi khi tải assignments");
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      await assignmentService.updateTask(taskId, { status: 3, progress: 100 });
      await loadData();
    } catch (_) {}
  };

  useEffect(() => {
    loadData();
    if (topicId) {
      setFormData((prev) => ({ ...prev, topicId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  const handleCreateSubmission = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const studentId = getUserIdFromToken();
      const payload = { ...formData, submittedBy: studentId, topicId };
      await submissionService.createSubmission(payload);
      setShowCreateModal(false);
      setFormData((prev) => ({
        ...prev,
        reportTitle: "",
        description: "",
        file: null,
      }));
      // Suppress aggregated notification toast briefly to avoid duplicate toasts
      try {
        window.__suppressNotificationToastUntil = Date.now() + 3000;
      } catch (_) {}
      showToast("Tạo báo cáo thành công");
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Lỗi khi tạo báo cáo";
      showToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      <div className="max-w-full mx-auto p-2 h-full flex flex-col">
        {/* Header - Giảm margin và padding */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900 m-0">
              Nhiệm vụ của đề tài #{topicId}
            </h1>
            <div className="flex items-center gap-2">
              {topicId && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 text-sm rounded text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)",
                  }}
                  title="Tạo báo cáo"
                >
                  Tạo báo cáo
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                ← Quay lại
              </button>
            </div>
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-16 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 m-0">
                    Tạo báo cáo mới
                  </h3>
                </div>
                <form onSubmit={handleCreateSubmission}>
                  <div className="mb-4 relative">
                    <input
                      id="create-title"
                      type="text"
                      placeholder=" "
                      value={formData.reportTitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reportTitle: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                      required
                    />
                    <label
                      htmlFor="create-title"
                      className="absolute left-2 bg-white px-1 text-gray-500 transition-all duration-200 top-2.5 text-sm peer-focus:-top-2 peer-focus:text-xs peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm"
                    >
                      Tiêu đề báo cáo <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="mb-4 relative">
                    <textarea
                      id="create-desc"
                      placeholder=" "
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                      rows="3"
                    />
                    <label
                      htmlFor="create-desc"
                      className="absolute left-2 bg-white px-1 text-gray-500 transition-all duration-200 top-2.5 text-sm peer-focus:-top-2 peer-focus:text-xs peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm"
                    >
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="mb-4 relative">
                    <select
                      id="create-type"
                      value={formData.submissionType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          submissionType: parseInt(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                    >
                      <option value={1}>Báo cáo tiến độ</option>
                      <option value={2}>Báo cáo cuối kỳ</option>
                      <option value={3}>Báo cáo khác</option>
                    </select>
                    <label
                      htmlFor="create-type"
                      className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                    >
                      Loại báo cáo <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="mb-4 relative">
                    <input
                      id="create-file"
                      type="file"
                      onChange={(e) =>
                        setFormData({ ...formData, file: e.target.files[0] })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white peer"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                    />
                    <label
                      htmlFor="create-file"
                      className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500"
                    >
                      File đính kèm <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Hỗ trợ: PDF, Word, Excel, PowerPoint, TXT, ZIP, RAR, JPG,
                      PNG, GIF (Tối đa 50MB)
                    </p>
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
                      disabled={submitting}
                      className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 transition-all duration-300 hover:opacity-90"
                      style={{
                        background:
                          "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)",
                      }}
                    >
                      {submitting ? "Đang tạo..." : "Tạo báo cáo"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có assignment nào.</p>
          ) : (
            <div className="space-y-4 overflow-y-auto h-full">
              {assignments.map((a) => (
                <div
                  key={a.assignmentId}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {a.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        Hạn chót: {a.dueDate || "Không có"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      Tiến độ:{" "}
                      {Array.isArray(a.tasks) && a.tasks.length > 0
                        ? Math.round(
                            a.tasks.reduce(
                              (s, t) =>
                                s +
                                (typeof t.progress === "number"
                                  ? t.progress
                                  : 0),
                              0
                            ) / a.tasks.length
                          )
                        : 0}
                      %
                    </div>
                  </div>
                  <div className="mt-2 space-y-2">
                    {(a.tasks || []).map((t) => {
                      const isCompleted = t.status === 3;
                      const currentUserId = getUserIdFromToken();
                      // So sánh string với string để tránh vấn đề kiểu dữ liệu
                      const isMine =
                        String(t.assignedTo) === String(currentUserId);

                      return (
                        <div
                          key={t.taskId}
                          className="flex items-center justify-between bg-gray-50 rounded p-2 border border-gray-200"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {t.taskName}
                            </div>
                            <div className="text-[11px] text-gray-600">
                              Hạn: {t.endDate || "Không có"} • Trạng thái:{" "}
                              {t.status === 3
                                ? "Hoàn thành"
                                : t.status === 2
                                ? "Đang thực hiện"
                                : "Đang chờ xử lý"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{
                                  width: `${
                                    typeof t.progress === "number"
                                      ? t.progress
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-700 w-8 text-right">
                              {typeof t.progress === "number" ? t.progress : 0}%
                            </span>
                            <button
                              disabled={!isMine || isCompleted}
                              onClick={() => completeTask(t.taskId)}
                              className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                                isMine && !isCompleted
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600"
                                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              }`}
                            >
                              Hoàn thành
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentsDetail;
