import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import { getUserIdFromToken } from "../../auth/authUtils";
import { WS_ENDPOINTS } from "../../config/api";
import userService from "../../services/user.service";
import chatService from "../../services/chat.service";

// Trang Chat của Sinh viên - giao diện giống Slack/Teams, học thuật
const StudentChat = () => {
  const location = useLocation();

  // CSS reset để đảm bảo không có margin/padding không mong muốn
  useEffect(() => {
    // Không cần reset body nữa vì sẽ hiển thị trong layout
    // Chỉ cần đảm bảo container có chiều cao đúng
  }, []);

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | unread
  const [search, setSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const messageEndRef = useRef(null);

  // WebSocket chat
  const [wsConnection, setWsConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Ref để tránh duplicate WebSocket messages
  const processedMessagesRef = useRef(new Set());

  // Chọn giảng viên để chat
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [errorTeachers, setErrorTeachers] = useState("");

  // Load lịch sử chat
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);

  // Load lịch sử chat khi chọn giảng viên
  const loadChatHistory = useCallback(async (currentUserId, teacherId) => {
    if (!currentUserId || !teacherId) return;

    setLoadingChatHistory(true);
    try {
      console.log("Đang load lịch sử chat với giảng viên:", teacherId);
      const historyMessages = await chatService.loadChatHistory(
        currentUserId,
        teacherId
      );

      console.log("Lịch sử chat đã load:", historyMessages);

      // Cập nhật conversations với lịch sử chat
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          messages: historyMessages,
          lastMessageAt:
            historyMessages.length > 0
              ? historyMessages[historyMessages.length - 1].time
              : Date.now(),
        }))
      );

      setChatHistoryLoaded(true);
    } catch (error) {
      console.error("Lỗi khi load lịch sử chat:", error);
    } finally {
      setLoadingChatHistory(false);
    }
  }, []);

  // Load danh sách giảng viên
  useEffect(() => {
    const loadTeachers = async () => {
      setLoadingTeachers(true);
      setErrorTeachers("");
      try {
        const response = await userService.getAllTeachers();

        // API trả về trực tiếp array, không có cấu trúc { success, data }
        if (Array.isArray(response)) {
          // Chuyển đổi dữ liệu từ API sang format phù hợp với UI
          const formattedTeachers = response.map((teacher) => ({
            id: teacher.userId, // API trả về userId
            name: teacher.fullName || "Chưa có tên",
            email: teacher.phoneNumber || "Chưa có thông tin liên lạc", // Sử dụng phoneNumber thay vì email
            avatar:
              teacher.avt ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                teacher.fullName || "GV"
              )}&background=random`, // API trả về avt
            specialization: teacher.specialization || "Chưa có chuyên ngành",
            department: teacher.department || "Chưa có khoa",
          }));

          setTeachers(formattedTeachers);
          console.log("Danh sách giảng viên:", formattedTeachers);

          // Tự động chọn giảng viên từ URL parameters nếu có
          const urlParams = new URLSearchParams(location.search);
          const teacherId = urlParams.get("teacherId");
          if (teacherId) {
            const teacher = formattedTeachers.find((t) => t.id == teacherId);
            if (teacher) {
              console.log("Tự động chọn giảng viên từ URL:", teacher);
              setSelectedTeacher(teacher);
            }
          }
        } else {
          console.error("API không trả về array:", response);
          setErrorTeachers("API không trả về dữ liệu hợp lệ");
        }
      } catch (error) {
        console.error("Lỗi khi load danh sách giảng viên:", error);
        setErrorTeachers(
          "Không thể tải danh sách giảng viên. Vui lòng thử lại sau."
        );
      } finally {
        setLoadingTeachers(false);
      }
    };

    loadTeachers();
  }, [location.search]); // Thêm location.search vào dependencies

  // Khởi tạo WebSocket chat và conversations
  useEffect(() => {
    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("Không thể lấy userId từ token");
      return;
    }

    // Khởi tạo conversations mẫu (sẽ được cập nhật từ WebSocket)
    const initialConversations = [
      {
        id: "cv1",
        topic: "Chọn giảng viên để chat", // Hướng dẫn chọn giảng viên
        unread: 0,
        members: 0, // Chưa có ai
        lastMessageAt: Date.now() - 1000 * 60 * 10,
        messages: [],
      },
    ];
    setConversations(initialConversations);
    setActiveConvId(initialConversations[0]?.id || null);

    // Chỉ kết nối WebSocket khi đã chọn giảng viên
    // WebSocket sẽ được kết nối sau khi chọn giảng viên
  }, []);

  // Kết nối WebSocket khi chọn giảng viên
  useEffect(() => {
    if (!selectedTeacher) {
      // Nếu chưa chọn giảng viên, đóng kết nối WebSocket
      if (wsConnection) {
        wsConnection.close();
        setWsConnection(null);
        setIsConnected(false);
        setConnectionStatus("disconnected");
      }

      // Cập nhật conversation topic về trạng thái chọn giảng viên
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          topic: "Chọn giảng viên để chat",
          members: 0,
          messages: [],
        }))
      );
      setChatHistoryLoaded(false);
      return;
    }

    // Cập nhật conversation topic với tên giảng viên đã chọn
    setConversations((prev) =>
      prev.map((conv) => ({
        ...conv,
        topic: selectedTeacher.name || "Giảng viên",
        members: 2,
      }))
    );

    // Load lịch sử chat khi chọn giảng viên
    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("Không thể lấy userId từ token");
      return;
    }

    if (selectedTeacher.id) {
      loadChatHistory(userId, selectedTeacher.id);
    }

    // Kết nối WebSocket chat với giảng viên đã chọn
    const wsUrl = `${WS_ENDPOINTS.CHAT}?userId=${encodeURIComponent(userId)}`;
    console.log(
      "Kết nối WebSocket chat với giảng viên:",
      selectedTeacher.name,
      wsUrl
    );

    const ws = new WebSocket(wsUrl);
    setWsConnection(ws);

    ws.onopen = () => {
      console.log(
        "WebSocket chat đã kết nối với giảng viên:",
        selectedTeacher.name
      );
      setIsConnected(true);
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Nhận message từ WebSocket:", data);

        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Lỗi khi parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket chat đã đóng");
      setIsConnected(false);
      setConnectionStatus("disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket chat error:", error);
      setConnectionStatus("error");
    };

    // Cleanup khi component unmount hoặc thay đổi giảng viên
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      // Xóa tất cả processed messages
      processedMessagesRef.current.clear();
    };
  }, [selectedTeacher, loadChatHistory]); // Dependency vào selectedTeacher và loadChatHistory

  // Xử lý message từ WebSocket
  const handleWebSocketMessage = useCallback((data) => {
    // API response format: { id, senderId, receiverId, content, timestamp }
    // Không cần switch case nữa, tất cả message đều là chat message
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
    } else {
      console.log("Message không hợp lệ:", data);
    }
  }, []);

  // Xử lý tin nhắn chat
  const handleChatMessage = useCallback(
    (data) => {
      // API response format: { id, senderId, receiverId, content, timestamp }
      const { id, senderId, receiverId, content, timestamp } = data;
      const userId = getUserIdFromToken();

      // Kiểm tra xem tin nhắn này đã tồn tại chưa (tránh duplicate)
      const existingMessage = conversations[0]?.messages?.find((msg) => {
        // Kiểm tra theo ID
        if (msg.id === id) return true;

        // Kiểm tra theo nội dung và thời gian (tránh duplicate từ server)
        if (
          msg.text === content &&
          Math.abs(msg.time - new Date(timestamp).getTime()) < 2000
        )
          return true;

        // Kiểm tra tin nhắn local có cùng nội dung
        if (msg.isLocal && msg.text === content) return true;

        return false;
      });

      if (existingMessage) {
        console.log("Tin nhắn đã tồn tại, bỏ qua:", content);
        return;
      }

      // Chỉ hiển thị content, ẩn các thông tin kỹ thuật
      const newMessage = {
        id: id || `msg_${Date.now()}_${Math.random()}_${content.slice(0, 10)}`, // Unique ID với content
        sender: senderId === userId ? "You" : `User ${senderId}`, // Ẩn senderId thực tế
        time: timestamp ? new Date(timestamp).getTime() : Date.now(),
        text: content, // Sử dụng content thay vì message
        mine: senderId === userId,
        read: false,
      };

      // Thêm tin nhắn vào conversation đầu tiên hoặc thay thế tin nhắn local
      setConversations((prev) =>
        prev.map((conv, index) => {
          if (index === 0) {
            // Tìm tin nhắn local có cùng nội dung để thay thế
            const localMessageIndex = conv.messages.findIndex(
              (msg) => msg.isLocal && msg.text === content
            );

            let newMessages;
            if (localMessageIndex !== -1) {
              // Thay thế tin nhắn local bằng tin nhắn từ server
              newMessages = [...conv.messages];
              newMessages[localMessageIndex] = {
                ...newMessage,
                isLocal: false, // Đánh dấu không còn là local
              };
            } else {
              // Kiểm tra duplicate trước khi thêm tin nhắn mới
              const isDuplicate = conv.messages.some(
                (msg) =>
                  msg.id === newMessage.id ||
                  (msg.text === newMessage.text &&
                    Math.abs(msg.time - newMessage.time) < 5000)
              );

              if (!isDuplicate) {
                // Thêm tin nhắn mới nếu không duplicate
                newMessages = [...conv.messages, newMessage];
              } else {
                // Giữ nguyên messages nếu là duplicate
                newMessages = conv.messages;
              }
            }

            return {
              ...conv,
              messages: newMessages,
              lastMessageAt: newMessage.time,
              unread: conv.unread + (newMessage.mine ? 0 : 1),
            };
          }
          return conv;
        })
      );
    },
    [conversations]
  );

  // Xử lý user join topic
  const handleUserJoined = (data) => {
    console.log("User joined topic:", data);
  };

  // Xử lý user leave topic
  const handleUserLeft = (data) => {
    console.log("User left topic:", data);
  };

  // Xử lý cập nhật topic
  const handleTopicUpdate = (data) => {
    console.log("Topic updated:", data);
  };

  // Hàm reconnect WebSocket
  const reconnectWebSocket = () => {
    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("Không thể lấy userId từ token");
      return;
    }

    setConnectionStatus("connecting");

    // Đóng kết nối cũ nếu có
    if (wsConnection) {
      wsConnection.close();
    }

    // Tạo kết nối mới
    const wsUrl = `${WS_ENDPOINTS.CHAT}?userId=${encodeURIComponent(userId)}`;
    console.log("Reconnecting WebSocket chat:", wsUrl);

    const ws = new WebSocket(wsUrl);
    setWsConnection(ws);

    ws.onopen = () => {
      console.log("WebSocket chat đã kết nối lại");
      setIsConnected(true);
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Nhận message từ WebSocket:", data);

        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Lỗi khi parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket chat đã đóng");
      setIsConnected(false);
      setConnectionStatus("disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket chat error:", error);
      setConnectionStatus("error");
    };
  };

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

  const handleSend = useCallback(() => {
    const text = messageInput.trim();
    if (!text || !activeConv || !isConnected || !selectedTeacher) return;

    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("Không thể lấy userId từ token");
      return;
    }

    // Xóa input ngay lập tức để UX tốt hơn
    setMessageInput("");

    // Tạo tin nhắn local với ID đặc biệt để tránh duplicate
    const localMsgId = `local-${Date.now()}-${Math.random()}`;
    const localMsg = {
      id: localMsgId,
      sender: "You",
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
        receiverId: selectedTeacher.id, // Sử dụng ID thực tế của giảng viên đã chọn
        content: text, // Sử dụng content thay vì message
        timestamp: new Date().toISOString(), // Format ISO string như API
      };

      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify(chatMessage));
        console.log("Đã gửi tin nhắn qua WebSocket:", chatMessage);
      } else {
        console.error("WebSocket không kết nối");
        // Có thể hiển thị toast thông báo lỗi kết nối
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
      console.error("Lỗi khi gửi tin nhắn qua WebSocket:", error);
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
  }, [messageInput, activeConv, isConnected, selectedTeacher, wsConnection]);

  return (
    <>
      {/* Modal chọn giảng viên */}
      {showTeacherSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Chọn giảng viên để chat
              </h3>
              <button
                onClick={() => setShowTeacherSelector(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loadingTeachers ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
                  <p className="text-gray-600 text-lg">
                    Đang tải danh sách giảng viên...
                  </p>
                </div>
              ) : errorTeachers ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-4">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <p className="text-red-600 mb-4">{errorTeachers}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200"
                  >
                    Thử lại
                  </button>
                </div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Không có giảng viên nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teachers.map((teacher) => (
                    <button
                      key={teacher.id || teacher.userId}
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        setShowTeacherSelector(false);
                      }}
                      className={`w-full p-4 text-left rounded-lg border transition-all duration-200 hover:shadow-md ${
                        selectedTeacher?.id === teacher.id
                          ? "bg-blue-50 border-blue-300"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-semibold">
                          {(teacher.name || "GV").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {teacher.name || "Giảng viên"}
                          </div>
                          {teacher.email && (
                            <div className="text-sm text-gray-500">
                              {teacher.email}
                            </div>
                          )}
                          {teacher.specialization && (
                            <div className="text-xs text-gray-400">
                              {teacher.specialization}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center gap-2">
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
                  <div className="text-xs text-gray-500">
                    {c.members} members
                  </div>
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
          {/* Header */}
          <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              {/* Avatar giảng viên */}
              {selectedTeacher?.avatar && (
                <img
                  src={selectedTeacher.avatar}
                  alt={selectedTeacher.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {selectedTeacher?.name || "Chọn giảng viên"}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedTeacher
                    ? selectedTeacher.name
                    : "Chọn giảng viên để chat"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!selectedTeacher ? (
                <button
                  onClick={() => setShowTeacherSelector(true)}
                  className="text-xs px-3 py-1.5 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200"
                >
                  Chọn giảng viên
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowTeacherSelector(true)}
                    className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Đổi giảng viên
                  </button>
                  <button
                    onClick={() => {
                      const userId = getUserIdFromToken();
                      if (userId && selectedTeacher.id) {
                        loadChatHistory(userId, selectedTeacher.id);
                      }
                    }}
                    disabled={loadingChatHistory}
                    className="text-xs px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingChatHistory ? "Đang tải..." : "Tải lại lịch sử"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Messages area - Scrollable, takes remaining height */}
          <div className="flex-1 overflow-y-auto thin-scrollbar p-4 bg-gray-50 min-h-0">
            {!activeConv ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                Chọn một hội thoại để bắt đầu trò chuyện
              </div>
            ) : !selectedTeacher ? (
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
                <p className="mb-2">Bạn chưa chọn giảng viên để chat</p>
                <button
                  onClick={() => setShowTeacherSelector(true)}
                  className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors duration-200"
                >
                  Chọn giảng viên
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Loading indicator cho lịch sử chat */}
                {loadingChatHistory && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3"></div>
                    <p className="text-sm text-gray-600">
                      Đang tải lịch sử chat...
                    </p>
                  </div>
                )}

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
                      {/* Chỉ hiển thị nội dung tin nhắn, ẩn các thông tin kỹ thuật */}
                      <div className="text-sm leading-relaxed">{m.text}</div>

                      {/* Chỉ hiển thị thời gian tương đối, ẩn các thông tin khác */}
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
                placeholder={
                  !selectedTeacher
                    ? "Chọn giảng viên để chat..."
                    : isConnected
                    ? "Nhập tin nhắn..."
                    : "Đang kết nối..."
                }
                disabled={!isConnected || !selectedTeacher}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                  isConnected
                    ? "border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary"
                    : "border-gray-200 bg-gray-100 cursor-not-allowed"
                }`}
              />
              <button
                onClick={handleSend}
                disabled={
                  !isConnected || !messageInput.trim() || !selectedTeacher
                }
                className={`px-3 py-2 rounded-lg text-sm ${
                  isConnected && messageInput.trim()
                    ? "bg-secondary text-white hover:bg-secondary-hover"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {!selectedTeacher
                  ? "Chọn giảng viên"
                  : isConnected
                  ? "Gửi"
                  : "Đang kết nối..."}
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default StudentChat;
