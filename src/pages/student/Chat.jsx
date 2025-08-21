import React, { useEffect, useMemo, useRef, useState } from "react";

// Trang Chat của Sinh viên - giao diện giống Slack/Teams, học thuật
const StudentChat = () => {
  // CSS reset để đảm bảo không có margin/padding không mong muốn
  useEffect(() => {
    // Không cần reset body nữa vì sẽ hiển thị trong layout
    // Chỉ cần đảm bảo container có chiều cao đúng
  }, []);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | unread | archived
  const [search, setSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const messageEndRef = useRef(null);

  // Lấy thông báo realtime làm nguồn cho panel bên phải (nếu có)
  const [notifications, setNotifications] = useState([]);

  // Khởi tạo dữ liệu mẫu hội thoại (group theo topic)
  useEffect(() => {
    const sample = [
      {
        id: "cv1",
        topic: "CS101 - Introduction to Programming",
        unread: 1,
        archived: false,
        members: 24,
        lastMessageAt: Date.now() - 1000 * 60 * 10,
        messages: [
          {
            id: "m1",
            sender: "Dr. Smith",
            time: Date.now() - 1000 * 60 * 15,
            text: "Good morning everyone! Today we'll be covering loops and iteration in Python.",
            mine: false,
            read: true,
          },
          {
            id: "m2",
            sender: "Sarah Johnson",
            time: Date.now() - 1000 * 60 * 12,
            text: "Thank you for the detailed explanation yesterday about functions!",
            mine: false,
            read: true,
          },
          {
            id: "m3",
            sender: "You",
            time: Date.now() - 1000 * 60 * 7,
            text: "I've uploaded the assignment materials to the course website. Please review them before next week's class.",
            mine: true,
            read: true,
          },
        ],
      },
      {
        id: "cv2",
        topic: "MATH202 - Advanced Calculus",
        unread: 0,
        archived: false,
        members: 18,
        lastMessageAt: Date.now() - 1000 * 60 * 60 * 5,
        messages: [
          {
            id: "n1",
            sender: "Lecturer A",
            time: Date.now() - 1000 * 60 * 60 * 5,
            text: "Please check problem set #3.",
            mine: false,
            read: true,
          },
        ],
      },
      {
        id: "cv3",
        topic: "ENG301 - Technical Writing",
        unread: 2,
        archived: false,
        members: 12,
        lastMessageAt: Date.now() - 1000 * 60 * 60 * 26,
        messages: [
          {
            id: "e1",
            sender: "Emma Davis",
            time: Date.now() - 1000 * 60 * 60 * 26,
            text: "Next week we will review abstracts and summaries.",
            mine: false,
            read: false,
          },
        ],
      },
    ];
    setConversations(sample);
    setActiveConvId(sample[0]?.id || null);
  }, []);

  // Đồng bộ thông báo từ StudentLayout (dropdown chuông)
  useEffect(() => {
    try {
      const initial = Array.isArray(window.__studentNotifications)
        ? window.__studentNotifications
        : [];
      setNotifications(initial);
    } catch (_) {}
    const handler = (evt) => {
      const list = evt?.detail;
      if (Array.isArray(list)) setNotifications(list);
    };
    window.addEventListener("app:student-notifications", handler);
    return () =>
      window.removeEventListener("app:student-notifications", handler);
  }, []);

  const formatRelative = (ms) => {
    const diff = Math.max(0, Date.now() - ms);
    const s = Math.floor(diff / 1000);
    if (s < 60) return "Vừa xong";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    return `${d} ngày trước`;
  };

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (filter === "unread") list = list.filter((c) => c.unread > 0);
    if (filter === "archived") list = list.filter((c) => c.archived);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.topic.toLowerCase().includes(q));
    }
    return list;
  }, [conversations, filter, search]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  useEffect(() => {
    try {
      if (messageEndRef.current)
        messageEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
    } catch (_) {}
  }, [activeConvId, activeConv?.messages?.length]);

  const handleSend = () => {
    const text = messageInput.trim();
    if (!text || !activeConv) return;
    const msg = {
      id: `local-${Date.now()}`,
      sender: "You",
      time: Date.now(),
      text,
      mine: true,
      read: false,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, messages: [...c.messages, msg], lastMessageAt: msg.time }
          : c
      )
    );
    setMessageInput("");
  };

  return (
    <div
      className="flex w-full bg-gray-50 overflow-hidden"
      style={{
        height: "calc(100vh - 138px)",
        maxHeight: "calc(100vh - 138px)",
      }}
    >
      {/* Sidebar hội thoại - Fixed height, scrollable content */}
      <aside className="hidden md:flex md:w-72 lg:w-80 xl:w-96 flex-col border-r border-gray-200 bg-white">
        {/* Header cố định */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Conversations
            </h2>
            <div className="flex gap-1">
              <button
                className={`text-xs px-2 py-1 rounded ${
                  filter === "all"
                    ? "bg-secondary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`text-xs px-2 py-1 rounded ${
                  filter === "unread"
                    ? "bg-secondary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setFilter("unread")}
              >
                Unread
              </button>
              <button
                className={`text-xs px-2 py-1 rounded ${
                  filter === "archived"
                    ? "bg-secondary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setFilter("archived")}
              >
                Archived
              </button>
            </div>
          </div>
          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Scrollable conversations list */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-2">
          {filteredConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              className={`w-full text-left p-3 rounded-lg border mb-2 transition hover:bg-gray-50 ${
                activeConvId === c.id
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {c.topic}
                </div>
                <div className="text-[11px] text-gray-500 whitespace-nowrap">
                  {formatRelative(c.lastMessageAt)}
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="text-xs text-gray-500">{c.members} members</div>
                {c.unread > 0 && (
                  <span className="text-[10px] bg-blue-600 text-white rounded-full px-2 py-0.5">
                    {c.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Khung chat trung tâm - Fixed height, scrollable messages */}
      <section className="flex-1 flex flex-col min-h-0">
        {/* Header cố định */}
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {activeConv?.topic || "Select a conversation"}
            </div>
            {!!activeConv && (
              <div className="text-xs text-gray-500">
                {activeConv.members} members
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button className="text-xs px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
              Group
            </button>
            <button className="text-xs px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
              Direct
            </button>
          </div>
        </div>

        {/* Messages area - Scrollable, takes remaining height */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 bg-gray-50 min-h-0">
          {!activeConv ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Chọn một hội thoại để bắt đầu trò chuyện
            </div>
          ) : (
            <div className="space-y-4">
              {activeConv.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm shadow ${
                      m.mine
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    {!m.mine && (
                      <div className="text-[11px] font-semibold mb-0.5 opacity-80">
                        {m.sender}
                      </div>
                    )}
                    <div>{m.text}</div>
                    <div
                      className={`mt-1 flex items-center gap-1 text-[10px] ${
                        m.mine ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      <span>{formatRelative(m.time)}</span>
                      {m.mine && (
                        <span className="inline-flex items-center gap-0.5">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="opacity-80"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                          Đã đọc
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>
          )}
        </div>

        {/* Input cố định */}
        <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
              title="Đính kèm"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 7v10a5 5 0 0 0 10 0V7a3 3 0 0 0-6 0v9a1 1 0 0 0 2 0V7h2v9a3 3 0 0 1-6 0V7a5 5 0 1 1 10 0v10a7 7 0 0 1-14 0V7h2z" />
              </svg>
            </button>
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleSend}
              className="px-3 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover text-sm"
            >
              Send
            </button>
          </div>
        </div>
      </section>

      {/* Panel thông báo bên phải - Fixed height, scrollable content */}
      <aside className="hidden xl:flex w-80 flex-col border-l border-gray-200 bg-white">
        {/* Header cố định */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          <div className="flex gap-1">
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">All</span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
              Unread
            </span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
              Archived
            </span>
          </div>
        </div>

        {/* Scrollable notifications list */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-3 min-h-0">
          {notifications.length === 0 ? (
            <div className="text-xs text-gray-500 text-center mt-8">
              Không có thông báo
            </div>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div
                key={n.id}
                className="p-3 border border-gray-200 rounded-lg mb-2"
              >
                <div className="text-xs text-gray-500 mb-1">
                  {formatRelative(n.createdAt || Date.now())}
                </div>
                <div className="text-sm text-gray-900">{n.message}</div>
                <div className="mt-2 flex gap-2">
                  <button className="text-[11px] px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    Mark as read
                  </button>
                  <button className="text-[11px] px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    Archive
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};

export default StudentChat;
