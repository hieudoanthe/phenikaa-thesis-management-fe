import React, { useEffect, useRef, useState } from "react";
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
  const currentTopicRef = useRef(null);

  // Rich text editor (same UX as Reviewer tab)
  const Toolbar = ({ targetRef, active, restoreSelection }) => {
    const exec = (e, cmd, val = null) => {
      e.preventDefault();
      if (!targetRef?.current) return;
      try {
        restoreSelection?.();
      } catch {}
      targetRef.current.focus();
      document.execCommand(cmd, false, val);
    };
    const btn = (key, label, cmd) => (
      <button
        type="button"
        onMouseDown={(e) => exec(e, cmd)}
        className={`px-2 py-0.5 rounded ${
          active?.[key] ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
        }`}
      >
        {label}
      </button>
    );
    return (
      <div className="flex flex-wrap gap-2 text-sm border rounded-t px-2 py-1 bg-gray-50">
        {btn("bold", <span className="font-semibold">B</span>, "bold")}
        {btn("italic", <span className="italic">I</span>, "italic")}
        {btn("underline", <span className="underline">U</span>, "underline")}
        <span className="mx-1 w-px bg-gray-300" />
        {btn("ul", "• List", "insertUnorderedList")}
        {btn("ol", "1. List", "insertOrderedList")}
        <button
          type="button"
          onMouseDown={(e) => exec(e, "indent")}
          className="px-2 py-0.5 hover:bg-gray-100 rounded"
        >
          →
        </button>
        <button
          type="button"
          onMouseDown={(e) => exec(e, "outdent")}
          className="px-2 py-0.5 hover:bg-gray-100 rounded"
        >
          ←
        </button>
        <span className="mx-1 w-px bg-gray-300" />
        <button
          type="button"
          onMouseDown={(e) => exec(e, "undo")}
          className="px-2 py-0.5 hover:bg-gray-100 rounded"
        >
          ↶
        </button>
        <button
          type="button"
          onMouseDown={(e) => exec(e, "redo")}
          className="px-2 py-0.5 hover:bg-gray-100 rounded"
        >
          ↷
        </button>
      </div>
    );
  };

  const RichInput = ({ value, onChange, minHeight = 80, readOnly = false }) => {
    const ref = useRef(null);
    const [focused, setFocused] = useState(false);
    const [html, setHtml] = useState("");
    const [active, setActive] = useState({});
    const savedRange = useRef(null);

    useEffect(() => {
      const next = value || "";
      if (!focused) {
        setHtml(next);
        if (ref.current && ref.current.innerHTML !== next) {
          ref.current.innerHTML = next;
        }
      }
    }, [value, focused]);

    const handleInput = () => {
      const next = ref.current?.innerHTML || "";
      setHtml(next);
    };

    const commit = () => onChange?.(html);

    useEffect(() => {
      const handler = () => {
        if (!focused) return;
        try {
          const sel = window.getSelection();
          const node = sel?.anchorNode;
          if (!node || !ref.current) return;
          const within = ref.current.contains(
            node.nodeType === 3 ? node.parentNode : node
          );
          if (!within) return;
          if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0);
          setActive({
            bold: document.queryCommandState("bold"),
            italic: document.queryCommandState("italic"),
            underline: document.queryCommandState("underline"),
            ul: document.queryCommandState("insertUnorderedList"),
            ol: document.queryCommandState("insertOrderedList"),
          });
        } catch {}
      };
      document.addEventListener("selectionchange", handler);
      return () => document.removeEventListener("selectionchange", handler);
    }, [focused]);

    const richStyles = (
      <style>{`
        .rich-content ul { list-style: disc; margin-left: 1.25rem; padding-left: 1.25rem; }
        .rich-content ol { list-style: decimal; margin-left: 1.25rem; padding-left: 1.25rem; }
        .rich-content li { list-style-position: outside; }
      `}</style>
    );

    return (
      <div className="border rounded">
        {!readOnly && (
          <Toolbar
            targetRef={ref}
            active={active}
            restoreSelection={() => {
              const sel = window.getSelection();
              if (savedRange.current && sel) {
                sel.removeAllRanges();
                sel.addRange(savedRange.current);
              }
            }}
          />
        )}
        {richStyles}
        <div
          ref={ref}
          className="p-2 outline-none rich-content"
          style={{ minHeight: `${minHeight}px` }}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            commit();
          }}
        />
      </div>
    );
  };

  const load = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getCouncilSummary(id);
      // Ensure we are still on the same topic before applying state
      if (currentTopicRef.current !== id) return;

      if (data && data.content) {
        setContent(data.content || "");
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
          } else {
            setForm({
              significance: "",
              structure: "",
              methodology: "",
              results: "",
              prosCons: "",
            });
          }
        } catch (_) {
          // Not JSON — put raw into prosCons as fallback
          setForm({
            significance: "",
            structure: "",
            methodology: "",
            results: "",
            prosCons: data.content || "",
          });
        }
      } else {
        // No data for this topic -> clear form
        setContent("");
        setForm({
          significance: "",
          structure: "",
          methodology: "",
          results: "",
          prosCons: "",
        });
      }
    } catch (e) {
      // Not found or error -> clear form for new topic
      if (currentTopicRef.current !== id) return;
      setContent("");
      setForm({
        significance: "",
        structure: "",
        methodology: "",
        results: "",
        prosCons: "",
      });
    } finally {
      if (currentTopicRef.current === id) setLoading(false);
    }
  };

  useEffect(() => {
    // When topic changes, clear current content immediately to avoid showing stale data
    currentTopicRef.current = topicId || null;
    setContent("");
    setForm({
      significance: "",
      structure: "",
      methodology: "",
      results: "",
      prosCons: "",
    });
    if (topicId) {
      load(topicId);
    }
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
              <RichInput
                value={form.significance}
                onChange={(v) => setForm({ ...form, significance: v })}
                minHeight={80}
                readOnly={!isChairman}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2. Về nội dung, kết cấu của đồ án/khóa luận
              </label>
              <RichInput
                value={form.structure}
                onChange={(v) => setForm({ ...form, structure: v })}
                minHeight={80}
                readOnly={!isChairman}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3. Phương pháp nghiên cứu
              </label>
              <RichInput
                value={form.methodology}
                onChange={(v) => setForm({ ...form, methodology: v })}
                minHeight={80}
                readOnly={!isChairman}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                4. Các kết quả nghiên cứu đạt được
              </label>
              <RichInput
                value={form.results}
                onChange={(v) => setForm({ ...form, results: v })}
                minHeight={120}
                readOnly={!isChairman}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                5. Ưu điểm, nhược điểm và nội dung cần bổ sung, chỉnh sửa
              </label>
              <RichInput
                value={form.prosCons}
                onChange={(v) => setForm({ ...form, prosCons: v })}
                minHeight={120}
                readOnly={!isChairman}
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
