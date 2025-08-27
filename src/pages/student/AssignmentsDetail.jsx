import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assignmentService } from "../../services";
import { getUserIdFromToken } from "../../auth/authUtils";

const AssignmentsDetail = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      <div className="max-w-full mx-auto p-2 h-full flex flex-col">
        {/* Header - Giảm margin và padding */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900 m-0">
              Nhiệm vụ của đề tài #{topicId}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              ← Quay lại
            </button>
          </div>
        </div>

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
