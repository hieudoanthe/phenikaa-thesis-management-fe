import React, { useEffect, useRef, useState } from "react";
import {
  getReviewerSummary,
  upsertReviewerSummary,
} from "../../services/grading.service";
import { useAuth } from "../../contexts/AuthContext";
import { getUserIdFromToken } from "../../auth/authUtils";
import { toast } from "react-toastify";

const ReviewerSummaryTab = ({ topicId, isReviewer }) => {
  const { user } = useAuth?.() || { user: null };
  const [loading, setLoading] = useState(false);

  // Structured fields
  const [presentation, setPresentation] = useState(""); // Bố cục, hình thức trình bày
  const [necessity, setNecessity] = useState(""); // Tính cấp thiết, hiện đại, không trùng lặp
  const [general, setGeneral] = useState(""); // Nhận xét chung
  const [goals, setGoals] = useState("");
  const [scope, setScope] = useState("");
  const [audience, setAudience] = useState("");
  const [techFrontend, setTechFrontend] = useState("");
  const [techBackend, setTechBackend] = useState("");
  const [techDatabase, setTechDatabase] = useState("");
  const [reportStructure, setReportStructure] = useState("");
  const [implementationLevel, setImplementationLevel] = useState("");
  const [results, setResults] = useState("");
  const [prosCons, setProsCons] = useState("");
  const [conclusionApprove, setConclusionApprove] = useState(null);
  const [conclusionNote, setConclusionNote] = useState("");

  // Load existing content
  useEffect(() => {
    const load = async () => {
      if (!topicId) return;
      setLoading(true);
      try {
        const data = await getReviewerSummary(topicId);
        const raw = data?.content;
        if (raw) {
          try {
            const obj = JSON.parse(raw);
            setPresentation(obj.presentation || "");
            setNecessity(obj.necessity || "");
            setGeneral(obj.general || "");
            setGoals(obj.goals || "");
            setScope(obj.scope || "");
            setAudience(obj.audience || "");
            setTechFrontend(obj.techFrontend || "");
            setTechBackend(obj.techBackend || "");
            setTechDatabase(obj.techDatabase || "");
            setReportStructure(obj.reportStructure || "");
            setImplementationLevel(obj.implementationLevel || "");
            setResults(obj.results || "");
            setProsCons(obj.prosCons || "");
            if (typeof obj.conclusionApprove === "boolean") {
              setConclusionApprove(obj.conclusionApprove);
            } else if (typeof obj.conclusion === "string") {
              const lower = obj.conclusion.toLowerCase();
              if (lower.includes("đồng ý")) setConclusionApprove(true);
              else if (lower.includes("không")) setConclusionApprove(false);
            }
            setConclusionNote(obj.conclusionNote || "");
          } catch (e) {
            // Fallback: treat as a single block -> put into general
            setGeneral(String(raw));
          }
        } else {
          // reset
          setPresentation("");
          setNecessity("");
          setGeneral("");
          setGoals("");
          setScope("");
          setAudience("");
          setTechFrontend("");
          setTechBackend("");
          setTechDatabase("");
          setReportStructure("");
          setImplementationLevel("");
          setResults("");
          setProsCons("");
          setConclusionApprove(null);
          setConclusionNote("");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [topicId]);

  const handleSave = async () => {
    try {
      const reviewerId = Number(user?.userId || getUserIdFromToken());
      const payload = JSON.stringify({
        presentation,
        necessity,
        general,
        goals,
        scope,
        audience,
        techFrontend,
        techBackend,
        techDatabase,
        reportStructure,
        implementationLevel,
        results,
        prosCons,
        conclusionApprove,
        conclusionNote,
      });
      await upsertReviewerSummary(topicId, reviewerId, payload);
      toast.success("Đã lưu nhận xét phản biện thành công!");
    } catch (error) {
      toast.error("Lưu nhận xét phản biện thất bại!");
      console.error("Error saving reviewer summary:", error);
    }
  };

  // Lightweight rich text input
  const Toolbar = ({ targetRef, active, restoreSelection }) => {
    const exec = (e, cmd, val = null) => {
      e.preventDefault();
      if (!targetRef?.current) return;
      // Restore caret/selection before applying command
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

  const RichInput = ({ value, onChange, minHeight = 80, placeholder }) => {
    const ref = useRef(null);
    const [focused, setFocused] = useState(false);
    const [html, setHtml] = useState("");
    const [active, setActive] = useState({});
    const savedRange = useRef(null);

    // initialize / sync from prop when not focused
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

    // Commit change to parent only on blur to avoid re-render each keystroke
    const commit = () => {
      onChange?.(html);
    };

    // Track formatting state to highlight toolbar buttons
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
          if (sel && sel.rangeCount > 0) {
            savedRange.current = sel.getRangeAt(0);
          }
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
    return (
      <div className="border rounded">
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
        <div
          ref={ref}
          className="p-2 outline-none rich-content"
          style={{ minHeight: `${minHeight}px` }}
          contentEditable
          suppressContentEditableWarning
          placeholder={placeholder}
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

  if (loading)
    return <div className="text-center py-8 text-gray-600">Đang tải...</div>;

  if (!isReviewer) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm-2 14a2 2 0 104 0H8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không có quyền truy cập
        </h3>
        <p className="text-gray-500">
          Chỉ Giảng viên phản biện được phép sử dụng chức năng này
        </p>
      </div>
    );
  }

  const richStyles = (
    <style>{`
      .rich-content ul { list-style: disc; margin-left: 1.25rem; padding-left: 1.25rem; }
      .rich-content ol { list-style: decimal; margin-left: 1.25rem; padding-left: 1.25rem; }
      .rich-content li { list-style-position: outside; }
    `}</style>
  );

  return (
    <div className="space-y-6">
      {richStyles}
      <div>
        <h3 className="font-semibold mb-2">I. Nhận xét ĐAKLTN</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              - Bố cục, hình thức trình bày
            </label>
            <RichInput
              value={presentation}
              onChange={setPresentation}
              minHeight={80}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              - Đảm bảo tính cấp thiết, hiện đại, không trùng lặp
            </label>
            <RichInput
              value={necessity}
              onChange={setNecessity}
              minHeight={80}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              - Nội dung: Nhận xét chung
            </label>
            <RichInput value={general} onChange={setGeneral} minHeight={80} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                - Mục tiêu
              </label>
              <RichInput value={goals} onChange={setGoals} minHeight={60} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                - Phạm vi
              </label>
              <RichInput value={scope} onChange={setScope} minHeight={60} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                - Đối tượng sử dụng
              </label>
              <RichInput
                value={audience}
                onChange={setAudience}
                minHeight={60}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              - Công nghệ sử dụng
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  + Frontend
                </label>
                <RichInput
                  value={techFrontend}
                  onChange={setTechFrontend}
                  minHeight={60}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  + Backend
                </label>
                <RichInput
                  value={techBackend}
                  onChange={setTechBackend}
                  minHeight={60}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  + Cơ sở dữ liệu
                </label>
                <RichInput
                  value={techDatabase}
                  onChange={setTechDatabase}
                  minHeight={60}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              - Bố cục báo cáo
            </label>
            <RichInput
              value={reportStructure}
              onChange={setReportStructure}
              minHeight={80}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              - Mức độ thực hiện
            </label>
            <RichInput
              value={implementationLevel}
              onChange={setImplementationLevel}
              minHeight={80}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">II. Kết quả đạt được</h3>
        <RichInput value={results} onChange={setResults} minHeight={120} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">III. Ưu nhược điểm</h3>
        <RichInput value={prosCons} onChange={setProsCons} minHeight={120} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">IV. Kết luận</h3>
        <div className="flex items-center gap-6 mb-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="conclusion"
              checked={conclusionApprove === true}
              onChange={() => setConclusionApprove(true)}
            />
            <span>Đồng ý cho bảo vệ</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="conclusion"
              checked={conclusionApprove === false}
              onChange={() => setConclusionApprove(false)}
            />
            <span>Không đồng ý cho bảo vệ</span>
          </label>
        </div>
        <label className="block text-sm text-gray-700 mb-1">
          Ghi chú (tuỳ chọn)
        </label>
        <textarea
          className="w-full border rounded p-2 min-h-[80px]"
          value={conclusionNote}
          onChange={(e) => setConclusionNote(e.target.value)}
          placeholder="Lý do/ghi chú nếu có"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Lưu
        </button>
      </div>
    </div>
  );
};

export default ReviewerSummaryTab;
