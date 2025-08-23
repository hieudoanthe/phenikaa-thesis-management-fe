import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUserIdFromToken } from "../../auth/authUtils";
import { WS_ENDPOINTS } from "../../config/api";
import userService from "../../services/user.service";

// Trang Chat của Giảng viên - nhận tin nhắn từ sinh viên
const LecturerChat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | unread | archived
  const [search, setSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const messageEndRef = useRef(null);

  // WebSocket chat - sử dụng useRef để tránh tạo lại connection
  const wsConnectionRef = useRef(null);
  const wsConnectingRef = useRef(false); // Flag để tránh tạo connection duplicate
  const [wsConnection, setWsConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Danh sách sinh viên đang chat
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorStudents, setErrorStudents] = useState("");

  // Lấy thông báo realtime làm nguồn cho panel bên phải
  const [notifications, setNotifications] = useState([]);

  // Sử dụng useRef để lưu conversations và tránh bị reset khi component re-render
  const conversationsRef = useRef([]);

  // Ref để tránh duplicate WebSocket messages
  const processedMessagesRef = useRef(new Set());

  // Sync conversationsRef với conversations state
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Khởi tạo WebSocket chat và conversations
  useEffect(() => {
    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("Không thể lấy userId từ token");
      return;
    }

    // Kiểm tra xem đã có connection chưa để tránh tạo lại
    if (
      wsConnectionRef.current &&
      wsConnectionRef.current.readyState === WebSocket.OPEN
    ) {
      return;
    }

    // Kiểm tra xem đang trong quá trình kết nối không
    if (wsConnectingRef.current) {
      return;
    }

    // Set flag để tránh tạo connection duplicate
    wsConnectingRef.current = true;

    // Kết nối WebSocket để nhận tin nhắn từ sinh viên
    // Giảng viên kết nối với userId của chính mình để nhận tin nhắn
    const wsUrl = `${WS_ENDPOINTS.CHAT}?userId=${encodeURIComponent(userId)}`;

    const ws = new WebSocket(wsUrl);
    wsConnectionRef.current = ws; // Lưu vào useRef
    setWsConnection(ws);

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionStatus("connected");
      wsConnectingRef.current = false; // Reset flag khi kết nối thành công
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Lỗi khi parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setConnectionStatus("disconnected");
      wsConnectingRef.current = false; // Reset flag khi connection đóng
    };

    ws.onerror = (error) => {
      setConnectionStatus("error");
      wsConnectingRef.current = false; // Reset flag khi có lỗi
    };

    // Cleanup khi component unmount
    return () => {
      if (
        wsConnectionRef.current &&
        wsConnectionRef.current.readyState === WebSocket.OPEN
      ) {
        wsConnectionRef.current.close();
      }
      // Xóa tất cả processed messages
      processedMessagesRef.current.clear();
    };
  }, []);

  // Xử lý message từ WebSocket
  const handleWebSocketMessage = (data) => {
    // API response format: { id, senderId, receiverId, content, timestamp }
    if (data.content && data.senderId) {
      // Tạo unique key cho message để tránh duplicate
      const messageKey = `${data.id || data.senderId}_${data.content}_${
        data.timestamp
      }`;

      // Kiểm tra xem message đã được xử lý chưa
      if (processedMessagesRef.current.has(messageKey)) {
        return; // Bỏ qua nếu đã xử lý
      }

      // Đánh dấu message đã được xử lý
      processedMessagesRef.current.add(messageKey);

      // Xử lý message
      handleChatMessage(data);

      // Xóa message key sau 10 giây để tránh memory leak
      setTimeout(() => {
        processedMessagesRef.current.delete(messageKey);
      }, 10000);
    }
  };

  // Xử lý tin nhắn chat - Logic giống StudentChat để tránh tin nhắn bị đè lên
  const handleChatMessage = async (data) => {
    const { id, senderId, receiverId, content, timestamp } = data;
    const userId = getUserIdFromToken();

    // Tìm conversation của sinh viên gửi tin nhắn - sử dụng conversationsRef để tránh bị reset
    const studentConversation = conversationsRef.current.find(
      (conv) => conv.studentId === senderId
    );

    // Nếu đã có conversation, thêm tin nhắn mới vào conversation hiện có
    if (studentConversation) {
      // Kiểm tra xem tin nhắn này đã tồn tại chưa (tránh duplicate) - GIỐNG StudentChat
      const existingMessage = studentConversation.messages.find((msg) => {
        // Kiểm tra theo ID
        if (msg.id === id) return true;

        // Kiểm tra theo nội dung và thời gian (tránh duplicate từ server)
        if (
          msg.text === content &&
          Math.abs(msg.time - new Date(timestamp).getTime()) < 2000
        )
          return true;

        return false;
      });

      if (existingMessage) {
        return;
      }

      // Tạo tin nhắn mới
      const newMessage = {
        id: id || `msg_${Date.now()}_${Math.random()}`,
        sender: `Sinh viên ${studentConversation.studentName || senderId}`,
        time: timestamp ? new Date(timestamp).getTime() : Date.now(),
        text: content,
        mine: false,
        read: false,
        studentId: senderId,
      };

      // Thêm tin nhắn vào conversation hiện có - GIỐNG StudentChat
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.studentId === senderId) {
            // Kiểm tra duplicate message trước khi thêm
            const isDuplicate = conv.messages.some(
              (msg) =>
                msg.id === newMessage.id ||
                (msg.text === newMessage.text &&
                  Math.abs(msg.time - newMessage.time) < 5000)
            );

            if (isDuplicate) {
              return conv; // Không thay đổi nếu là duplicate
            }

            const newMessages = [...conv.messages, newMessage];

            return {
              ...conv,
              messages: newMessages, // GIỮ LẠI TIN NHẮN CŨ + THÊM MỚI
              lastMessageAt: newMessage.time,
              unread: conv.unread + 1,
            };
          }
          return conv;
        });

        // Cập nhật conversationsRef để đồng bộ
        conversationsRef.current = updated;
        return updated;
      });

      return;
    }

    // Nếu chưa có conversation cho sinh viên này, lấy profile từ API
    try {
      const profile = await userService.getStudentProfileById(senderId);

      // Kiểm tra lại xem conversation đã được tạo chưa trong thời gian async
      const existingConv = conversationsRef.current.find(
        (conv) => conv.studentId === senderId
      );

      if (existingConv) {
        // Nếu đã có conversation (có thể được tạo trong thời gian async), thêm tin nhắn
        const newMessage = {
          id: id || `msg_${Date.now()}_${Math.random()}`,
          sender: `Sinh viên ${profile.fullName || profile.name || senderId}`,
          time: timestamp ? new Date(timestamp).getTime() : Date.now(),
          text: content,
          mine: false,
          read: false,
          studentId: senderId,
        };

        setConversations((prev) => {
          const updated = prev.map((conv) => {
            if (conv.studentId === senderId) {
              // Kiểm tra duplicate message trước khi thêm
              const isDuplicate = conv.messages.some(
                (msg) =>
                  msg.id === newMessage.id ||
                  (msg.text === newMessage.text &&
                    Math.abs(msg.time - newMessage.time) < 5000)
              );

              if (isDuplicate) {
                return conv; // Không thay đổi nếu là duplicate
              }

              return {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessageAt: newMessage.time,
                unread: conv.unread + 1,
              };
            }
            return conv;
          });
          return updated;
        });
        return;
      }

      const newConversation = {
        id: `student_${senderId}`,
        studentId: senderId,
        topic: `Chat với ${profile.fullName || profile.name || "Sinh viên"}`,
        studentName: profile.fullName || profile.name || "Sinh viên",
        studentAvatar:
          profile.avt ||
          profile.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            profile.fullName || profile.name || "SV"
          )}&background=random`,
        unread: 1,
        archived: false,
        members: 2,
        lastMessageAt: Date.now(),
        messages: [],
      };

      // Tạo tin nhắn đầu tiên
      const newMessage = {
        id: id || `msg_${Date.now()}_${Math.random()}`,
        sender: `Sinh viên ${profile.fullName || profile.name || senderId}`,
        time: timestamp ? new Date(timestamp).getTime() : Date.now(),
        text: content,
        mine: false,
        read: false,
        studentId: senderId,
      };

      // Thêm conversation mới VÀ tin nhắn đầu tiên trong 1 lần setConversations
      setConversations((prev) => {
        // Kiểm tra lần cuối để chắc chắn không có duplicate
        const alreadyExists = prev.find((conv) => conv.studentId === senderId);
        if (alreadyExists) {
          return prev; // Không thêm nếu đã tồn tại
        }

        // Tạo conversation mới với tin nhắn đầu tiên
        const conversationWithMessage = {
          ...newConversation,
          messages: [newMessage],
          lastMessageAt: newMessage.time,
        };

        // Cập nhật conversationsRef để đồng bộ
        conversationsRef.current = [conversationWithMessage, ...prev];
        return [conversationWithMessage, ...prev];
      });

      setActiveConvId(newConversation.id);

      // Cập nhật students state để cache thông tin
      setStudents((prev) => [
        ...prev,
        {
          id: senderId,
          name: profile.fullName || profile.name || "Sinh viên",
          studentId:
            profile.userId || profile.studentId || profile.id || senderId,
          major: profile.major || "",
          avatar:
            profile.avt ||
            profile.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              profile.fullName || profile.name || "SV"
            )}&background=random`,
        },
      ]);

      return;
    } catch (error) {
      console.error("Không thể lấy profile sinh viên:", error);

      // Tạo conversation với thông tin cơ bản nếu API thất bại
      const fallbackConversation = {
        id: `student_${senderId}`,
        studentId: senderId,
        topic: `Chat với sinh viên (ID: ${senderId})`,
        studentName: `Sinh viên (ID: ${senderId})`,
        studentAvatar: `https://ui-avatars.com/api/?name=SV&background=random`,
        unread: 1,
        archived: false,
        members: 2,
        lastMessageAt: Date.now(),
        messages: [],
      };

      setConversations((prev) => {
        const updated = [fallbackConversation, ...prev];
        // Cập nhật conversationsRef để đồng bộ
        conversationsRef.current = updated;
        return updated;
      });
      setActiveConvId(fallbackConversation.id);

      const fallbackMessage = {
        id: id || `msg_${Date.now()}_${Math.random()}`,
        sender: `Sinh viên (ID: ${senderId})`,
        time: timestamp ? new Date(timestamp).getTime() : Date.now(),
        text: content,
        mine: false,
        read: false,
        studentId: senderId,
      };

      // Cập nhật conversation với tin nhắn đầu tiên
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === fallbackConversation.id) {
            return {
              ...conv,
              messages: [fallbackMessage],
              lastMessageAt: fallbackMessage.time,
            };
          }
          return conv;
        });

        // Cập nhật conversationsRef để đồng bộ
        conversationsRef.current = updated;
        return updated;
      });
      return;
    }
  };

  // Hàm reconnect WebSocket
  const reconnectWebSocket = () => {
    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("Không thể lấy userId từ token");
      return;
    }

    setConnectionStatus("connecting");

    if (wsConnection) {
      wsConnection.close();
    }

    const wsUrl = `${WS_ENDPOINTS.CHAT}?userId=${encodeURIComponent(userId)}`;

    const ws = new WebSocket(wsUrl);
    setWsConnection(ws);

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Lỗi khi parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setConnectionStatus("disconnected");
    };

    ws.onerror = (error) => {
      setConnectionStatus("error");
    };
  };

  // Đồng bộ thông báo từ LecturerLayout
  useEffect(() => {
    try {
      const initial = Array.isArray(window.__lecturerNotifications)
        ? window.__lecturerNotifications
        : [];
      setNotifications(initial);
    } catch (_) {}
    const handler = (evt) => {
      const list = evt?.detail;
      if (Array.isArray(list)) setNotifications(list);
    };
    window.addEventListener("app:lecturer-notifications", handler);
    return () =>
      window.removeEventListener("app:lecturer-notifications", handler);
  }, []);

  // Hàm xóa duplicate conversations
  const removeDuplicateConversations = (conversationsList) => {
    const seen = new Map();
    return conversationsList.filter((conv) => {
      if (seen.has(conv.studentId)) {
        return false; // Bỏ conversation duplicate này
      } else {
        seen.set(conv.studentId, conv);
        return true; // Giữ conversation này
      }
    });
  };

  // Tự động xóa duplicate conversations
  useEffect(() => {
    if (conversations.length > 0) {
      const uniqueConversations = removeDuplicateConversations(conversations);
      if (uniqueConversations.length !== conversations.length) {
        setConversations(uniqueConversations);
        // Cập nhật activeConvId nếu conversation hiện tại bị xóa
        if (
          activeConvId &&
          !uniqueConversations.find((c) => c.id === activeConvId)
        ) {
          setActiveConvId(uniqueConversations[0]?.id || null);
        }
      }
    }
  }, [conversations, activeConvId]);

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
      list = list.filter(
        (c) =>
          c.studentName?.toLowerCase().includes(q) ||
          c.studentId?.toString().includes(q)
      );
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
    if (!text || !activeConv || !isConnected) return;

    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("Không thể lấy userId từ token");
      return;
    }

    // Xóa input ngay lập tức
    setMessageInput("");

    // Tạo tin nhắn local
    const localMsgId = `local-${Date.now()}-${Math.random()}`;
    const localMsg = {
      id: localMsgId,
      sender: "Bạn",
      time: Date.now(),
      text,
      mine: true,
      read: false,
      isLocal: true,
    };

    // Cập nhật UI ngay lập tức
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              messages: [...c.messages, localMsg],
              lastMessageAt: localMsg.time,
            }
          : c
      )
    );

    // Gửi tin nhắn qua WebSocket
    try {
      const chatMessage = {
        senderId: userId,
        receiverId: activeConv.studentId, // Gửi cho sinh viên cụ thể
        content: text,
        timestamp: new Date().toISOString(),
      };

      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify(chatMessage));
        console.log("Giảng viên đã gửi tin nhắn:", chatMessage);
      } else {
        console.error("WebSocket không kết nối");
        // Khôi phục input nếu gửi thất bại
        setMessageInput(text);
        // Xóa tin nhắn local nếu gửi thất bại
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? {
                  ...c,
                  messages: c.messages.filter((msg) => msg.id !== localMsgId),
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      setMessageInput(text);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? {
                ...c,
                messages: c.messages.filter((msg) => msg.id !== localMsgId),
              }
            : c
        )
      );
    }
  };

  return (
    <div
      className="flex w-full bg-gray-50 overflow-hidden"
      style={{
        height: "calc(100vh - 138px)",
        maxHeight: "calc(100vh - 138px)",
      }}
    >
      {/* Sidebar hội thoại */}
      <aside className="hidden md:flex md:w-72 lg:w-80 xl:w-96 flex-col border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">
                Hội thoại với sinh viên
              </h2>
              {/* Debug button - xóa duplicate */}
              {conversations.length > 0 &&
                removeDuplicateConversations(conversations).length !==
                  conversations.length && (
                  <button
                    onClick={() => {
                      const uniqueConversations =
                        removeDuplicateConversations(conversations);
                      setConversations(uniqueConversations);
                      console.log(
                        "🧹 Đã xóa",
                        conversations.length - uniqueConversations.length,
                        "duplicate conversations"
                      );
                    }}
                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    title="Xóa conversation trùng lặp"
                  >
                    🗑️ Fix duplicates
                  </button>
                )}
              {/* WebSocket connection status */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === "connected"
                        ? "bg-green-500"
                        : connectionStatus === "connecting"
                        ? "bg-yellow-500"
                        : connectionStatus === "error"
                        ? "bg-red-500"
                        : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-gray-500">
                    {connectionStatus === "connected"
                      ? "Online"
                      : connectionStatus === "connecting"
                      ? "Connecting..."
                      : connectionStatus === "error"
                      ? "Error"
                      : "Offline"}
                  </span>
                </div>
                {connectionStatus !== "connected" && (
                  <button
                    onClick={reconnectWebSocket}
                    disabled={connectionStatus === "connecting"}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connectionStatus === "connecting"
                      ? "Connecting..."
                      : "Reconnect"}
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                className={`text-xs px-2 py-1 rounded ${
                  filter === "all"
                    ? "bg-secondary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setFilter("all")}
              >
                Tất cả
              </button>
              <button
                className={`text-xs px-2 py-1 rounded ${
                  filter === "unread"
                    ? "bg-secondary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setFilter("unread")}
              >
                Chưa đọc
              </button>
            </div>
          </div>
          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm hội thoại..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Danh sách hội thoại */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-3">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mx-auto text-gray-300"
                >
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1">Chưa có hội thoại nào</p>
              <p className="text-xs text-gray-400">
                Sinh viên sẽ xuất hiện ở đây khi gửi tin nhắn
              </p>
            </div>
          ) : (
            filteredConversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full text-left p-3 rounded-lg border mb-2 transition hover:bg-gray-50 ${
                  activeConvId === c.id
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar sinh viên */}
                  <img
                    src={
                      c.studentAvatar ||
                      "https://ui-avatars.com/api/?name=SV&background=random"
                    }
                    alt={c.studentName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />

                  {/* Thông tin hội thoại */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {c.studentName}
                      </div>
                      <div className="text-[11px] text-gray-500 whitespace-nowrap">
                        {formatRelative(c.lastMessageAt)}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {c.members} thành viên
                      </div>
                      {c.unread > 0 && (
                        <span className="text-[10px] bg-blue-600 text-white rounded-full px-2 py-0.5">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Khung chat trung tâm */}
      <section className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            {/* Avatar sinh viên */}
            {activeConv?.studentAvatar && (
              <img
                src={activeConv.studentAvatar}
                alt={activeConv.studentName}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {activeConv?.studentName || "Chọn hội thoại"}
              </div>
              <div className="text-xs text-gray-500">
                {activeConv ? `Chat với sinh viên` : "Chọn hội thoại"}
              </div>
            </div>
          </div>
        </div>

        {/* Khu vực tin nhắn */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 bg-gray-50 min-h-0">
          {!activeConv ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Chọn một hội thoại để bắt đầu trò chuyện
            </div>
          ) : (
            <div className="space-y-4">
              {activeConv.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                  <div className="mb-4">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-gray-300"
                    >
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                    </svg>
                  </div>
                  <p className="mb-2">Chưa có tin nhắn nào</p>
                  <p className="text-xs text-gray-400">
                    {activeConv?.studentName
                      ? `Sinh viên ${activeConv.studentName} sẽ gửi tin nhắn ở đây`
                      : "Sinh viên sẽ gửi tin nhắn ở đây"}
                  </p>
                </div>
              ) : (
                <>
                  {activeConv.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${
                        m.mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm shadow ${
                          m.mine
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-200 text-gray-900"
                        }`}
                      >
                        {/* Hiển thị tên người gửi cho tin nhắn từ sinh viên */}
                        {!m.mine && (
                          <div className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-2">
                            <img
                              src={
                                activeConv.studentAvatar ||
                                "https://ui-avatars.com/api/?name=SV&background=random"
                              }
                              alt={activeConv.studentName}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            {m.sender}
                          </div>
                        )}
                        <div className="text-sm leading-relaxed">{m.text}</div>
                        <div
                          className={`mt-2 text-[10px] ${
                            m.mine ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {formatRelative(m.time)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Input */}
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
              placeholder={isConnected ? "Nhập tin nhắn..." : "Đang kết nối..."}
              disabled={!isConnected}
              className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                isConnected
                  ? "border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary"
                  : "border-gray-200 bg-gray-100 cursor-not-allowed"
              }`}
            />
            <button
              onClick={handleSend}
              disabled={!isConnected || !messageInput.trim()}
              className={`px-3 py-2 rounded-lg text-sm ${
                isConnected && messageInput.trim()
                  ? "bg-secondary text-white hover:bg-secondary-hover"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isConnected ? "Gửi" : "Đang kết nối..."}
            </button>
          </div>
        </div>
      </section>

      {/* Panel thông báo bên phải */}
      <aside className="hidden xl:flex w-80 flex-col border-l border-gray-200 bg-white">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
          <div className="flex gap-1">
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
              Tất cả
            </span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
              Chưa đọc
            </span>
          </div>
        </div>

        {/* Danh sách thông báo */}
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
                  <button className="text-[11px] px-2 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    Đánh dấu đã đọc
                  </button>
                  <button className="text-[11px] px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    Lưu trữ
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

export default LecturerChat;
