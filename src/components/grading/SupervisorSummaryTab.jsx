import React, { useEffect, useRef, useState } from "react";
import {
  getSupervisorSummary,
  upsertSupervisorSummary,
} from "../../services/grading.service";
import { useAuth } from "../../contexts/AuthContext";
import { getUserIdFromToken } from "../../auth/authUtils";
import { toast } from "react-toastify";

const SupervisorSummaryTab = ({ topicId, isSupervisor }) => {
  const { user } = useAuth?.() || { user: null };
  const [loading, setLoading] = useState(false);

  // Structured fields
  const [part1, setPart1] = useState(""); // I. Nhận xét ĐAKLTN
  const [part2, setPart2] = useState(""); // II. Nhận xét tinh thần & thái độ
  const [part3, setPart3] = useState(""); // III. Kết quả đạt được
  const [conclusionApprove, setConclusionApprove] = useState(null); // true/false
  const [conclusionNote, setConclusionNote] = useState("");

  // Lightweight rich editor reused from Reviewer tab style
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
      </div>
    );
  };

  const RichInput = ({ value, onChange, minHeight = 120 }) => {
    const ref = useRef(null);
    const [focused, setFocused] = useState(false);
    const [html, setHtml] = useState("");
    const [active, setActive] = useState({});
    const savedRange = useRef(null);

    useEffect(() => {
      const next = value || "";
      if (!focused) {
        setHtml(next);
        if (ref.current && ref.current.innerHTML !== next)
          ref.current.innerHTML = next;
      }
    }, [value, focused]);

    const handleInput = () => setHtml(ref.current?.innerHTML || "");
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
        {richStyles}
        <div
          ref={ref}
          className="p-2 outline-none rich-content"
          style={{ minHeight: `${minHeight}px` }}
          contentEditable
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

  useEffect(() => {
    const load = async () => {
      if (!topicId) return;
      setLoading(true);
      try {
        const data = await getSupervisorSummary(topicId);
        const raw = data?.content;
        if (raw) {
          try {
            const obj = JSON.parse(raw);
            setPart1(obj.part1 || "");
            setPart2(obj.part2 || "");
            setPart3(obj.part3 || "");
            if (typeof obj.conclusionApprove === "boolean") {
              setConclusionApprove(obj.conclusionApprove);
            }
            setConclusionNote(obj.conclusionNote || "");
          } catch (e) {
            // Fallback: put raw text into part1
            setPart1(String(raw));
          }
        } else {
          setPart1("");
          setPart2("");
          setPart3("");
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
      const supervisorId = Number(user?.userId || getUserIdFromToken());
      const payload = JSON.stringify({
        part1,
        part2,
        part3,
        conclusionApprove,
        conclusionNote,
      });
      await upsertSupervisorSummary(topicId, supervisorId, payload);
      toast.success("Đã lưu nhận xét hướng dẫn thành công!");
    } catch (error) {
      toast.error("Lưu nhận xét hướng dẫn thất bại!");
      console.error("Error saving supervisor summary:", error);
    }
  };

  if (loading)
    return <div className="text-center py-8 text-gray-600">Đang tải...</div>;

  if (!isSupervisor) {
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
          Chỉ Giảng viên hướng dẫn được phép sử dụng chức năng này
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">I. Nhận xét ĐAKLTN</h3>
        <RichInput value={part1} onChange={setPart1} minHeight={140} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">
          II. Nhận xét tinh thần và thái độ làm việc của sinh viên
        </h3>
        <RichInput value={part2} onChange={setPart2} minHeight={140} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">III. Kết quả đạt được</h3>
        <RichInput value={part3} onChange={setPart3} minHeight={140} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">IV. Kết luận</h3>
        <div className="flex items-center gap-6 mb-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="sv_conclusion"
              checked={conclusionApprove === true}
              onChange={() => setConclusionApprove(true)}
            />
            <span>Đồng ý cho bảo vệ</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="sv_conclusion"
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

export default SupervisorSummaryTab;
