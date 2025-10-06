import React, { useEffect, useState } from "react";
import {
  getCouncilSummary,
  upsertCouncilSummary,
} from "../../services/grading.service";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import { getUserIdFromToken } from "../../auth/authUtils";

const CouncilSummaryTab = ({ topicId, isChairman }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [form, setForm] = useState({
    significance: "",
    structure: "",
    methodology: "",
    results: "",
    prosCons: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!topicId) return;
    setLoading(true);
    try {
      const data = await getCouncilSummary(topicId);
      if (data && data.content) {
        setContent(data.content);
        try {
          const parsed = JSON.parse(data.content);
          if (parsed && typeof parsed === "object") {
            setForm({
              significance: parsed.significance || "",
              structure: parsed.structure || "",
              methodology: parsed.methodology || "",
              results: parsed.results || "",
              prosCons: parsed.prosCons || "",
            });
          }
        } catch (_) {
          setForm((f) => ({ ...f, prosCons: data.content }));
        }
      }
    } catch (e) {
      // ignore not found
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [topicId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = JSON.stringify(form);
      const chairmanId = user?.userId || getUserIdFromToken();
      if (!chairmanId) {
        toast.error("Không thể xác định ID giảng viên.");
        return;
      }
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.log("[CouncilSummary] Save request:", {
          topicId,
          chairmanId,
          payload,
        });
      }
      const res = await upsertCouncilSummary(topicId, chairmanId, payload);
      toast.success("Đã lưu nội dung hội đồng");
    } catch (e) {
      toast.error("Lưu nội dung thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (!topicId) {
    return <div className="text-gray-500">Vui lòng chọn đề tài.</div>;
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8 text-gray-600">Đang tải...</div>
      ) : (
        <>
          {!isChairman && (
            <div className="text-center py-12">
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
                Chỉ Chủ tịch hội đồng được phép sử dụng chức năng này
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1. Ý nghĩa của đồ án/khóa luận
              </label>
              <textarea
                rows={2}
                value={form.significance}
                onChange={(e) =>
                  setForm({ ...form, significance: e.target.value })
                }
                readOnly={!isChairman}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !isChairman ? "bg-gray-50" : ""
                }`}
                placeholder="Ví dụ: có ý nghĩa thực tiễn..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2. Về nội dung, kết cấu của đồ án/khóa luận
              </label>
              <textarea
                rows={2}
                value={form.structure}
                onChange={(e) =>
                  setForm({ ...form, structure: e.target.value })
                }
                readOnly={!isChairman}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !isChairman ? "bg-gray-50" : ""
                }`}
                placeholder="Ví dụ: đảm bảo kết cấu 3 chương..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3. Phương pháp nghiên cứu
              </label>
              <textarea
                rows={2}
                value={form.methodology}
                onChange={(e) =>
                  setForm({ ...form, methodology: e.target.value })
                }
                readOnly={!isChairman}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !isChairman ? "bg-gray-50" : ""
                }`}
                placeholder="Ví dụ: đảm bảo..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                4. Các kết quả nghiên cứu đạt được
              </label>
              <textarea
                rows={3}
                value={form.results}
                onChange={(e) => setForm({ ...form, results: e.target.value })}
                readOnly={!isChairman}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !isChairman ? "bg-gray-50" : ""
                }`}
                placeholder="Ví dụ: Xây dựng được ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                5. Ưu điểm, nhược điểm và nội dung cần bổ sung, chỉnh sửa
              </label>
              <textarea
                rows={3}
                value={form.prosCons}
                onChange={(e) => setForm({ ...form, prosCons: e.target.value })}
                readOnly={!isChairman}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !isChairman ? "bg-gray-50" : ""
                }`}
                placeholder="Ví dụ: ưu điểm..., nhược điểm..., cần chỉnh sửa..."
              />
            </div>
          </div>
          {isChairman && (
            <div className="flex justify-end">
              <button
                className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                style={{ backgroundColor: "#ff6600" }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e65c00")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ff6600")
                }
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu nội dung"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CouncilSummaryTab;
