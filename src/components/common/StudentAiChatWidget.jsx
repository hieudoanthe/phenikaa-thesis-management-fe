import React, { useState, useRef, useEffect } from "react";
import aiChatService from "../../services/aiChat.service";
import { getUserIdFromToken } from "../../auth/authUtils";

const StudentAiChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // home | messages | help
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

  const renderHome = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-b from-[#0c2a2f] to-[#0a2226] text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="Logo" className="w-7 h-7 rounded" />
            <div className="flex -space-x-2">
              <img
                src="/logo.png"
                alt="agent"
                className="w-6 h-6 rounded-full border border-white/20"
              />
              <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20" />
            </div>
            <button
              className="ml-auto text-white/70 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
          <div className="text-xl font-semibold leading-snug">
            Xin chào!
            <br />
            Chúng tôi có thể giúp gì cho bạn?
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b">
            <div className="text-sm font-medium text-gray-900">
              Tin nhắn gần đây
            </div>
          </div>
          <button className="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100">
              <img
                src="/logo.png"
                alt="agent"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-900 line-clamp-1">
                Xin chào, tôi là trợ lý AI của bạn.
              </div>
              <div className="text-xs text-gray-500">Vừa xong</div>
            </div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-gray-400"
            >
              <path d="M10 17l5-5-5-5v10z" />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
          <div className="text-green-600 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              Status: All Systems Operational
            </div>
            <div className="text-gray-500">
              Cập nhật {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-gray-500"
            >
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Tìm kiếm sự trợ giúp"
            />
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <button className="text-left text-sm text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg">
              Gợi ý đề tài về ứng dụng mobile
            </button>
            <button className="text-left text-sm text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg">
              Giảng viên nào còn chỗ trống?
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMessages = () => {
    return (
      <>
        <div className="p-4 h-[calc(70vh-168px)] overflow-y-auto space-y-3 bg-white">
          {messages.length === 0 && (
            <div className="text-sm text-gray-600">
              Hãy đặt câu hỏi như: "Gợi ý đề tài về ứng dụng mobile", "Giảng
              viên nào còn chỗ trống?"
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
                    ? "bg-[#0ea5e9] text-white"
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
            className="px-4 py-2 rounded-xl bg-[#0ea5e9] text-white text-sm disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Floating button */}
      <button
        className="fixed bottom-6 right-6 z-[1000] rounded-full bg-[#0ea5e9] text-white w-14 h-14 shadow-lg flex items-center justify-center hover:opacity-90"
        onClick={() => {
          setOpen(true);
          setActiveTab("home");
        }}
        aria-label="Open AI Chat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C7.03 3 3 6.58 3 11c0 2.08.86 3.98 2.28 5.45L4 21l4.76-1.52C9.74 19.82 10.85 20 12 20c4.97 0 9-3.58 9-8s-4.03-9-9-9z" />
        </svg>
      </button>

      {/* Chat dialog */}
      {open && (
        <div className="fixed z-[1100] right-4 bottom-24 md:right-6 md:bottom-6 w-[92vw] max-w-[420px]">
          <div className="relative bg-white w-full h-[70vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
            {/* Header */}
            <div className="bg-[#0b1f23] text-white px-4 py-3 flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 rounded" />
              <div className="text-sm font-medium">Trợ lý AI luận văn</div>
              <button
                className="ml-auto text-white/70 hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "home" && (
                <div className="pb-20">{renderHome()}</div>
              )}
              {activeTab === "messages" && renderMessages()}
              {activeTab === "help" && (
                <div className="p-4 text-sm text-gray-600 pb-20">
                  Vui lòng mô tả vấn đề của bạn. Chúng tôi sẽ hỗ trợ sớm nhất.
                </div>
              )}
            </div>

            {/* Bottom Tabs */}
            <div className="border-t bg-white">
              <div className="flex items-center justify-between px-4 py-2">
                <button
                  className={`flex flex-col items-center text-xs ${
                    activeTab === "home" ? "text-emerald-600" : "text-gray-600"
                  }`}
                  onClick={() => setActiveTab("home")}
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                  </span>
                  Trang chủ
                </button>
                <button
                  className={`flex flex-col items-center text-xs ${
                    activeTab === "messages" ? "text-sky-600" : "text-gray-600"
                  }`}
                  onClick={() => setActiveTab("messages")}
                >
                  <span className="w-6 h-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                    </svg>
                  </span>
                  Tin nhắn
                </button>
                <button
                  className={`flex flex-col items-center text-xs ${
                    activeTab === "help" ? "text-gray-900" : "text-gray-600"
                  }`}
                  onClick={() => setActiveTab("help")}
                >
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center mb-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                    </svg>
                  </span>
                  Giúp đỡ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentAiChatWidget;
