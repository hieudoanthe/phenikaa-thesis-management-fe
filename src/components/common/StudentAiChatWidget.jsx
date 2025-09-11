import React, { useState, useRef, useEffect } from "react";
import aiChatService from "../../services/aiChat.service";
import { getUserIdFromToken } from "../../auth/authUtils";

const StudentAiChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userId = getUserIdFromToken() || "student";
    const sessionId = "student-session";

    const userMsg = { role: "user", content: input.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const data = await aiChatService.chat({
        message: userMsg.content,
        userId,
        sessionId,
      });
      const aiText = data?.message || "Xin lỗi, tôi chưa có phản hồi.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiText, ts: Date.now(), raw: data },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Đã xảy ra lỗi. Vui lòng thử lại.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        className="fixed bottom-6 right-6 z-[1000] rounded-full bg-info text-white w-14 h-14 shadow-lg flex items-center justify-center hover:opacity-90"
        onClick={() => setOpen(true)}
        aria-label="Open AI Chat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C7.03 3 3 6.58 3 11c0 2.08.86 3.98 2.28 5.45L4 21l4.76-1.52C9.74 19.82 10.85 20 12 20c4.97 0 9-3.58 9-8s-4.03-9-9-9z" />
        </svg>
      </button>

      {/* Chat dialog */}
      {open && (
        <div className="fixed inset-0 z-[1100] flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white w-full md:w-[520px] h-[70vh] md:h-[70vh] rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">Trợ lý AI luận văn</div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4 h-[calc(70vh-120px)] overflow-y-auto space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-gray-600">
                  Hãy đặt câu hỏi như: "Gợi ý đề tài về ứng dụng mobile", "Giảng
                  viên nào còn chỗ trống?", "Giảng viên Hoàng Thiên Bảo còn bao
                  nhiêu chỗ?"
                </div>
              )}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-info text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t bg-white flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="flex-1 resize-none border rounded-xl px-3 py-2 text-sm h-10 focus:outline-none focus:ring-2 focus:ring-info/40"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-info text-white text-sm disabled:opacity-60"
              >
                {loading ? "Đang gửi..." : "Gửi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentAiChatWidget;
