import React, { useState, useRef, useEffect } from "react";
import aiChatService from "../../services/aiChat.service";
import suggestionsService from "../../services/suggestions.service";
import { getUserIdFromToken } from "../../auth/authUtils";

const StudentAiChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // home | messages | help
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const [hasSentWelcome, setHasSentWelcome] = useState(false);
  const [likedTitles, setLikedTitles] = useState(() => {
    try {
      const raw = localStorage.getItem("aiLikedTopics");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) {
      return new Set();
    }
  });

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const persistLiked = (nextSet) => {
    try {
      localStorage.setItem(
        "aiLikedTopics",
        JSON.stringify(Array.from(nextSet))
      );
    } catch (_) {}
  };

  const scrollToBottom = () => {
    try {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (_) {}
  };

  const formatRelative = (ts) => {
    if (!ts) return "Vừa xong";
    const diff = Math.max(0, Date.now() - ts);
    const s = Math.floor(diff / 1000);
    if (s < 60) return "Vừa xong";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    return `${d} ngày trước`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userId = getUserIdFromToken() || "student";
    const sessionId = "student-session";

    const userMsg = { role: "user", content: input.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setIsTyping(true);
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
      setIsTyping(false);
    }
  };

  const sendAssistantAuto = async (text) => {
    const content = (
      text || "Xin chào, tôi cần hỗ trợ về đồ án tốt nghiệp."
    ).trim();
    if (!content || loading) return;
    const userId = getUserIdFromToken() || "student";
    const sessionId = "student-session";

    setLoading(true);
    setIsTyping(true);
    try {
      const data = await aiChatService.chat({
        message: content,
        userId,
        sessionId,
      });
      const aiText =
        data?.message || "Xin chào! Tôi có thể giúp gì cho bạn về ĐATN?";
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
      setIsTyping(false);
    }
  };

  const sendUserPrompt = async (text) => {
    const content = (text || "").trim();
    if (!content || loading) return;
    const userId = getUserIdFromToken() || "student";
    const sessionId = "student-session";

    // Hiển thị bong bóng người dùng trước
    const userMsg = { role: "user", content, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    setIsTyping(true);
    try {
      const data = await aiChatService.chat({
        message: content,
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
      setIsTyping(false);
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
        <div className="bg-[#273C62] text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div className="flex -space-x-2">
              <img
                src="/logo.png"
                alt="agent"
                className="w-6 h-6 rounded-full border border-white/20"
              />
              <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20" />
            </div>
            {/* Close button removed as requested */}
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
          <div className="max-h-56 overflow-y-auto thin-scrollbar">
            {messages && messages.length > 0 ? (
              [...messages]
                .slice(-2)
                .reverse()
                .map((m, i) => (
                  <button
                    key={`${m.ts}-${i}`}
                    className="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 border-b last:border-b-0"
                    onClick={() => {
                      setActiveTab("messages");
                      setTimeout(() => {
                        try {
                          bottomRef.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                        } catch (_) {}
                      }, 50);
                    }}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        m.role === "user"
                          ? "bg-primary-100 text-primary-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {m.role === "user" ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      ) : (
                        <img
                          src="/logo.png"
                          alt="agent"
                          className="w-5 h-5 object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 line-clamp-1">
                        {m.content}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRelative(m.ts)}
                      </div>
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
                ))
            ) : (
              <div className="p-4 text-sm text-gray-500">Chưa có tin nhắn</div>
            )}
          </div>
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
            <button
              className="text-left text-sm text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg"
              onClick={() => {
                setActiveTab("messages");
                sendUserPrompt("Gợi ý đề tài về ứng dụng mobile");
              }}
            >
              Gợi ý đề tài về ứng dụng mobile
            </button>
            <button
              className="text-left text-sm text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg"
              onClick={() => {
                setActiveTab("messages");
                sendUserPrompt("Giảng viên nào còn chỗ trống?");
              }}
            >
              Giảng viên nào còn chỗ trống?
            </button>
            <button
              className="text-left text-sm text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg"
              onClick={() => {
                setActiveTab("messages");
                showHistory();
              }}
            >
              Xem lịch sử gợi ý
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMessages = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 flex-1 min-h-0 overflow-y-auto thin-scrollbar space-y-3 bg-white">
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
              {m.role === "user" ? (
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap bg-[#0ea5e9] text-white`}
                >
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-gray-100 text-gray-800">
                  {renderAssistantContent(m)}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-gray-100 text-gray-500">
                <span className="animate-pulse">AI đang soạn…</span>
              </div>
            </div>
          )}
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
            className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm disabled:opacity-60 transition-colors"
          >
            Gửi
          </button>
        </div>
      </div>
    );
  };

  const renderAssistantContent = (m) => {
    const data = m?.raw;
    const type = data?.responseType;
    if (
      type === "topic_suggestion" &&
      Array.isArray(data?.topicSuggestions) &&
      data.topicSuggestions.length
    ) {
      const sorted = [...data.topicSuggestions].sort((a, b) => {
        const la = likedTitles.has(a.title);
        const lb = likedTitles.has(b.title);
        if (la === lb) return 0;
        return la ? -1 : 1;
      });
      return (
        <div className="space-y-3">
          <div className="font-semibold">Gợi ý đề tài phù hợp</div>
          <div className="space-y-3">
            {sorted.map((sug, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div className="font-medium text-gray-900">
                  {sug.title || `Đề tài #${i + 1}`}
                </div>
                {likedTitles.has(sug.title) && (
                  <div className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <span>Ưu tiên (đã thích)</span>
                  </div>
                )}
                {sug.description && (
                  <div className="text-gray-700 text-sm mt-1">
                    {sug.description}
                  </div>
                )}
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                  {sug.objectives && (
                    <div>
                      <span className="text-gray-500">Mục tiêu:</span>{" "}
                      {sug.objectives}
                    </div>
                  )}
                  {sug.methodology && (
                    <div>
                      <span className="text-gray-500">Phương pháp:</span>{" "}
                      {sug.methodology}
                    </div>
                  )}
                  {sug.technologies && (
                    <div>
                      <span className="text-gray-500">Công nghệ:</span>{" "}
                      {sug.technologies}
                    </div>
                  )}
                  {sug.difficultyLevel && (
                    <div>
                      <span className="text-gray-500">Độ khó:</span>{" "}
                      {sug.difficultyLevel}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="px-2 py-1 text-xs rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    onClick={() => handleRateSuggestion(sug.title, "LIKE")}
                  >
                    Thích
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                    onClick={() => handleRateSuggestion(sug.title, "NEUTRAL")}
                  >
                    Bình thường
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
                    onClick={() => handleRateSuggestion(sug.title, "DISLIKE")}
                  >
                    Không thích
                  </button>
                  <button
                    className="ml-auto px-2 py-1 text-xs rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200"
                    onClick={() => handleFindSimilar(sug.title)}
                  >
                    Tìm tương tự
                  </button>
                </div>
              </div>
            ))}
          </div>
          {likedTitles.size > 0 && (
            <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3">
              <div className="text-sm font-medium text-gray-900 mb-2">
                Đề tài bạn đã thích
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(likedTitles)
                  .slice(0, 10)
                  .map((t, idx) => (
                    <button
                      key={idx}
                      className="text-xs px-2 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100"
                      onClick={() => handleFindSimilar(t)}
                      title={t}
                    >
                      Tương tự: {t.length > 24 ? t.slice(0, 24) + "…" : t}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    if (
      type === "lecturer_suggestion" &&
      Array.isArray(data?.lecturerSuggestions) &&
      data.lecturerSuggestions.length
    ) {
      return (
        <div className="space-y-3">
          <div className="font-semibold">Giảng viên phù hợp</div>
          <div className="space-y-2">
            {data.lecturerSuggestions.map((lec, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div className="font-medium text-gray-900">
                  {lec.lecturerName || `Giảng viên #${i + 1}`}
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  Chuyên môn: {lec.specialization || "N/A"}
                </div>
                <div className="text-sm text-gray-700">
                  Còn trống: {lec.remainingCapacity ?? "?"}
                </div>
                {lec.phone && (
                  <div className="text-sm text-gray-700">
                    Liên hệ: {lec.phone}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (type === "general_help") {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#273C62] text-white p-4 shadow-sm">
            <div className="text-lg font-semibold mb-1">
              Xin chào! Tôi là trợ lý AI đồ án
            </div>
            <div className="text-white/80 text-sm">
              Tôi hỗ trợ bạn trong toàn bộ quá trình làm đồ án tốt nghiệp.
            </div>
          </div>

          <div className="space-y-3">
            <Section
              title="1) Gợi ý đề tài đồ án chi tiết"
              items={[
                "Phân tích sở thích và chuyên ngành",
                "Gợi ý đề tài phù hợp trình độ và thời gian",
                "Cung cấp mục tiêu nghiên cứu cụ thể",
                "Đề xuất phương pháp nghiên cứu",
                "Đánh giá mức độ khó",
                "Dự đoán kết quả mong đợi",
              ]}
              examples={[
                "Tôi muốn làm đề tài về trí tuệ nhân tạo",
                "Gợi ý đề tài về blockchain cho sinh viên CNTT",
                "Tôi thích lập trình web, có đề tài nào phù hợp?",
              ]}
            />

            <Section
              title="2) Tìm giảng viên phù hợp thông minh"
              items={[
                "Tìm kiếm theo chuyên môn và lĩnh vực",
                "Kiểm tra capacity còn trống",
                "Thông tin liên hệ chi tiết",
                "Đánh giá mức độ phù hợp",
                "Gợi ý giảng viên có kinh nghiệm",
              ]}
              examples={[
                "Tìm giảng viên chuyên về machine learning",
                "Ai có thể hướng dẫn tôi về database?",
                "Giảng viên nào có kinh nghiệm về AI?",
              ]}
            />

            <Section
              title="3) Kiểm tra chỗ trống của giảng viên"
              items={[
                "Xem số lượng sinh viên hiện tại",
                "Kiểm tra chỗ trống còn lại",
                "Thông tin capacity chi tiết",
                "Cập nhật theo thời gian thực",
              ]}
              examples={["Giảng viên ABC còn nhận được bao nhiêu sinh viên?"]}
            />

            <Section
              title="4) Tư vấn chung toàn diện"
              items={[
                "Quy trình đăng ký đồ án",
                "Tiêu chí đánh giá & yêu cầu",
                "Cách chọn đề tài phù hợp",
                "Hướng dẫn viết đề cương",
                "Timeline & deadline",
                "Phương pháp nghiên cứu",
                "Trình bày & bảo vệ",
              ]}
              examples={[
                "Quy trình đăng ký đồ án như thế nào?",
                "Làm sao để viết đề cương nghiên cứu tốt?",
                "Timeline làm đồ án trong bao lâu?",
                "Cần chuẩn bị gì cho buổi bảo vệ?",
              ]}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="font-medium text-gray-900">
              Cách sử dụng hiệu quả
            </div>
            <ul className="mt-2 text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Gõ câu hỏi tự nhiên bằng tiếng Việt</li>
              <li>Mô tả chi tiết yêu cầu để nhận gợi ý tốt</li>
              <li>Có thể hỏi theo nhiều cách khác nhau</li>
              <li>Tôi sẽ tự động hiểu và phân loại câu hỏi</li>
            </ul>
            <div className="mt-3 text-sm text-gray-900">
              <span className="font-medium">Bắt đầu ngay:</span> Hãy cho tôi
              biết bạn đang gặp khó khăn gì.
            </div>
          </div>
        </div>
      );
    }
    if (type === "student_period_check") {
      return (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
          <div className="text-sm font-medium">
            Thông tin đợt đăng ký của bạn
          </div>
          <div className="text-sm mt-1 whitespace-pre-wrap">{m.content}</div>
        </div>
      );
    }
    // Mặc định hiển thị nội dung văn bản
    return <div className="whitespace-pre-wrap">{m.content}</div>;
  };

  const Section = ({ title, items = [], examples = [] }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="font-semibold text-gray-900 mb-2">{title}</div>
      {items.length > 0 && (
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          {items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
      {examples.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-500 mb-1">Ví dụ:</div>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            {examples.map((ex, i) => (
              <li key={i} className="italic">
                “{ex}”
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const handleRateSuggestion = async (title, feedback) => {
    try {
      const studentId = getUserIdFromToken();
      if (!studentId) return;
      await suggestionsService.rate({ studentId, topicTitle: title, feedback });
      setLikedTitles((prev) => {
        const next = new Set(prev);
        if (feedback === "LIKE") next.add(title);
        if (feedback === "DISLIKE") next.delete(title);
        persistLiked(next);
        return next;
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Đã lưu đánh giá của bạn cho đề tài: "${title}" (${feedback}).`,
          ts: Date.now(),
        },
      ]);
    } catch (_) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Không thể lưu đánh giá lúc này.",
          ts: Date.now(),
        },
      ]);
    }
  };

  const handleFindSimilar = async (title) => {
    try {
      const list = await suggestionsService.findSimilar({
        topicTitle: title,
        limit: 5,
      });
      if (Array.isArray(list) && list.length) {
        const lines = list
          .map(
            (t, i) => `- ${t.title || t.name || `Đề tài tương tự #${i + 1}`}`
          )
          .join("\n");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Các đề tài tương tự với "${title}":\n${lines}`,
            ts: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Chưa tìm thấy đề tài tương tự cho "${title}".`,
            ts: Date.now(),
          },
        ]);
      }
    } catch (_) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Không thể tìm đề tài tương tự lúc này.",
          ts: Date.now(),
        },
      ]);
    }
  };

  const showHistory = async () => {
    try {
      const studentId = getUserIdFromToken();
      if (!studentId) return;
      const page = await suggestionsService.getHistory({
        studentId,
        page: 0,
        size: 5,
      });
      const items = page?.content || [];
      if (!items.length) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Chưa có lịch sử gợi ý.",
            ts: Date.now(),
          },
        ]);
        return;
      }
      const lines = items
        .map((it) => {
          const d = it.createdAt ? new Date(it.createdAt).toLocaleString() : "";
          const req = it.requestText || "(không có yêu cầu)";
          return `- ${d}: ${req}`;
        })
        .join("\n");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Lịch sử gợi ý gần đây:\n${lines}\n\nMẹo: Hãy nhập lại yêu cầu cũ hoặc chọn đề tài đã thích để tìm tương tự.`,
          ts: Date.now(),
        },
      ]);
    } catch (_) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Không thể tải lịch sử gợi ý.",
          ts: Date.now(),
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating button (docked tab) */}
      {!open && (
        <button
          className="fixed bottom-6 right-0 z-[1000] translate-x-1/2 hover:translate-x-0 transition-transform rounded-l-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg flex items-center gap-2 px-3 py-2"
          onClick={() => {
            setOpen(true);
            setActiveTab("home");
            setHasSentWelcome(false);
          }}
          aria-label="Open AI Chat"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="flex-shrink-0"
          >
            <path d="M12 2a1 1 0 0 1 1 1v1.05A7.002 7.002 0 0 1 19 11v4a3 3 0 0 1-3 3h-1.18a3.001 3.001 0 0 1-5.64 0H8a3 3 0 0 1-3-3v-4a7.002 7.002 0 0 1 6-6.95V3a1 1 0 0 1 1-1zm-4 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 15h8a1 1 0 1 0 0-2H8a1 1 0 1 0 0 2z" />
          </svg>
          <span className="text-xs font-semibold pr-1">AI Chat</span>
        </button>
      )}

      {/* Chat dialog */}
      {open && (
        <div className="fixed z-[1100] right-4 bottom-24 md:right-6 md:bottom-6 w-[92vw] max-w-[420px]">
          <div className="relative bg-white w-full h-[70vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
            {/* Header */}
            <div className="bg-primary-600 text-white px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-6 h-6 object-contain"
                />
              </div>
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
            <div className="flex-1 min-h-0 flex flex-col">
              {activeTab === "home" && (
                <div className="h-full overflow-y-auto thin-scrollbar">
                  <div className="pb-20">{renderHome()}</div>
                </div>
              )}
              {activeTab === "messages" && renderMessages()}
              {activeTab === "help" && (
                <div className="h-full overflow-y-auto thin-scrollbar p-4 text-sm text-gray-600 pb-20">
                  Vui lòng mô tả vấn đề của bạn. Chúng tôi sẽ hỗ trợ sớm nhất.
                </div>
              )}
            </div>

            {/* Bottom Tabs */}
            <div className="border-t bg-white pt-1">
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
                  onClick={() => {
                    setActiveTab("messages");
                    if (!hasSentWelcome) {
                      setHasSentWelcome(true);
                      sendAssistantAuto(
                        "Xin chào! Tôi có thể giúp gì cho bạn?"
                      );
                    }
                    setTimeout(() => {
                      try {
                        bottomRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      } catch (_) {}
                    }, 50);
                  }}
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
