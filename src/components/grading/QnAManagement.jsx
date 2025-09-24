import React, { useState, useEffect } from "react";
import {
  addQuestion,
  updateAnswer,
  getQnAByTopic,
  checkSecretaryAccess,
  getCommitteeByTopic,
} from "../../services/grading.service";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import { getUserIdFromToken } from "../../auth/authUtils";

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

const QnAManagement = ({ topicId, studentId, topicTitle, studentName }) => {
  const { user } = useAuth();
  const [qnas, setQnas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSecretary, setIsSecretary] = useState(false);
  // Bắt đầu ở trạng thái đã kiểm tra = false để tránh treo khi user chưa sẵn sàng
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    questionerId: "",
    secretaryId: "",
    question: "",
    answer: "",
  });
  const [committeeMembers, setCommitteeMembers] = useState([]);

  useEffect(() => {
    const secId = user?.userId || getUserIdFromToken();
    if (!topicId || !secId) {
      setCheckingAccess(false);
      return;
    }
    setCheckingAccess(true);
    checkAccess(secId);
    loadQnAs();
  }, [topicId, user?.userId]);

  const checkAccess = async (secId) => {
    setCheckingAccess(true);
    try {
      const secretaryId = secId ?? user?.userId ?? getUserIdFromToken();
      const response = await checkSecretaryAccess(topicId, secretaryId);
      setIsSecretary(response.hasAccess);
    } catch (error) {
      console.error("Lỗi khi kiểm tra quyền thư ký:", error);
      setIsSecretary(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const loadQnAs = async () => {
    setLoading(true);
    try {
      const data = await getQnAByTopic(topicId);
      setQnas(data);
    } catch (error) {
      showToast("Lỗi khi tải danh sách Q&A");
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách thành viên hội đồng khi mở modal thêm câu hỏi
  const openAddModal = async () => {
    try {
      const list = await getCommitteeByTopic(topicId);
      setCommitteeMembers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("QnA | load committee error:", e);
      showToast("Không thể tải danh sách hội đồng", "error");
      setCommitteeMembers([]);
    }
    setNewQuestion((q) => ({ ...q, secretaryId: user.userId }));
    setShowAddModal(true);
  };

  const handleAddQuestion = async () => {
    try {
      const resolvedSecretaryId = user?.userId || getUserIdFromToken();
      const questionerIdNum = parseInt(newQuestion.questionerId, 10);

      if (!questionerIdNum || Number.isNaN(questionerIdNum)) {
        showToast("Vui lòng chọn người hỏi trong hội đồng", "warning");
        return;
      }
      if (!resolvedSecretaryId) {
        showToast(
          "Không xác định được tài khoản thư ký. Vui lòng đăng nhập lại.",
          "error"
        );
        return;
      }
      if (!newQuestion.question || !newQuestion.question.trim()) {
        showToast("Vui lòng nhập nội dung câu hỏi", "warning");
        return;
      }

      const qnaData = {
        topicId,
        studentId,
        questionerId: questionerIdNum,
        secretaryId: resolvedSecretaryId, // Sử dụng user ID hiện tại hoặc từ token
        question: newQuestion.question.trim(),
        answer: newQuestion.answer,
      };

      await addQuestion(qnaData);
      showToast("Thêm câu hỏi thành công!");
      setShowAddModal(false);
      setNewQuestion({
        questionerId: "",
        secretaryId: "",
        question: "",
        answer: "",
      });
      loadQnAs();
    } catch (error) {
      showToast("Lỗi khi thêm câu hỏi", "error");
    }
  };

  const handleUpdateAnswer = async (qnaId, answer) => {
    try {
      await updateAnswer(qnaId, { answer, secretaryId: user.userId });
      showToast("Cập nhật câu trả lời thành công!");
      loadQnAs();
    } catch (error) {
      showToast("Lỗi khi cập nhật câu trả lời", "error");
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return new Date(timeString).toLocaleString("vi-VN");
  };

  // Kiểm tra quyền truy cập
  if (checkingAccess) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  if (!isSecretary) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không có quyền truy cập
        </h3>
        <p className="text-gray-500">
          Chỉ có thư ký mới được phép sử dụng chức năng Q&A
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - only action button */}
      <div className="flex justify-end items-center">
        <button
          onClick={openAddModal}
          className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
          style={{ backgroundColor: "#ff6600" }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#e65c00")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#ff6600")
          }
        >
          Thêm câu hỏi
        </button>
      </div>

      {/* Q&A List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : qnas.length === 0 ? (
          <div className="text-center py-8">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có câu hỏi nào
            </h4>
            <p className="text-gray-600">
              Thêm câu hỏi đầu tiên cho buổi bảo vệ này.
            </p>
          </div>
        ) : (
          qnas.map((qna, index) => (
            <div
              key={qna.qnaId}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">
                      Người hỏi: ID {qna.questionerId} | Thư ký: ID{" "}
                      {qna.secretaryId}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(qna.questionTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Câu hỏi:</h5>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <p className="text-gray-800">{qna.question}</p>
                </div>
              </div>

              {/* Answer */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Câu trả lời:</h5>
                {qna.answer ? (
                  <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                    <p className="text-gray-800">{qna.answer}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Trả lời lúc: {formatTime(qna.answerTime)}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-l-4 border-gray-400 p-3 rounded">
                    <p className="text-gray-500 italic">Chưa có câu trả lời</p>
                    <button
                      onClick={() => {
                        const answer = prompt("Nhập câu trả lời:");
                        if (answer) {
                          handleUpdateAnswer(qna.qnaId, answer);
                        }
                      }}
                      className="mt-2 text-sm font-medium px-3 py-1 rounded"
                      style={{ color: "#ff6600" }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.color = "#e65c00")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.color = "#ff6600")
                      }
                    >
                      Thêm câu trả lời
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Thêm câu hỏi mới
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
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

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Người hỏi (thành viên hội đồng)
                    </label>
                    <select
                      value={newQuestion.questionerId}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          questionerId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn người hỏi --</option>
                      {committeeMembers.map((m) => (
                        <option
                          key={m.committeeId || `${m.lecturerId}-${m.role}`}
                          value={m.lecturerId}
                        >
                          {`GV ${m.lecturerId} - ${m.role}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thư ký
                    </label>
                    <input
                      type="text"
                      value={`ID ${user.userId}`}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Câu hỏi
                  </label>
                  <textarea
                    value={newQuestion.question}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        question: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập câu hỏi..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Câu trả lời (tùy chọn)
                  </label>
                  <textarea
                    value={newQuestion.answer}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, answer: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập câu trả lời (có thể để trống)..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
                  style={{ backgroundColor: "#ffe0cc", color: "#8a4500" }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ffcfad")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ffe0cc")
                  }
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                  style={{ backgroundColor: "#ff6600" }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e65c00")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ff6600")
                  }
                >
                  Thêm câu hỏi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QnAManagement;
