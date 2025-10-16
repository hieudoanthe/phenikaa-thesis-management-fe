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

// Department mapping
const departmentMapping = {
  CNTT: "Công nghệ thông tin",
  KHMT: "Khoa học máy tính",
  KTMT: "Kỹ thuật máy tính",
  HTTT: "Hệ thống thông tin",
  KTPM: "Kỹ thuật phần mềm",
  ATTT: "An toàn thông tin",
  MMT: "Mạng máy tính",
  PM: "Phần mềm",
};

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
  // idle | connecting | connected | disconnected | error
  const [connectionStatus, setConnectionStatus] = useState("idle");

  // Ref để tránh duplicate WebSocket messages
  const processedMessagesRef = useRef(new Set());

  // Chọn giảng viên để chat
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [errorTeachers, setErrorTeachers] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  // Tabs: direct | group
  const [activeTab, setActiveTab] = useState("direct");
  // Group chat states
  const [groups, setGroups] = useState([]); // {id,name,memberIds,messages,unread,lastMessageAt}
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [students, setStudents] = useState([]);

  // Load lịch sử chat
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
  const partnersLoadedRef = useRef(false);
  const [partnerIds, setPartnerIds] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  useEffect(() => {
    const userId = getUserIdFromToken();
    if (!userId) return;
    (async () => {
      try {
        const partnerIds = await chatService.getChatPartners(userId);
        if (Array.isArray(partnerIds) && partnerIds.length > 0) {
          partnersLoadedRef.current = true;
          setPartnerIds(partnerIds.map((x) => String(x)));
        } else {
          setLoadingPartners(false);
        }
      } catch (e) {
        // ignore
        setLoadingPartners(false);
      }
    })();
  }, []);

  // Fetch groups for student (participated groups)
  useEffect(() => {
    const userId = getUserIdFromToken();
    if (!userId) return;
    (async () => {
      try {
        const data = await chatService.getMyGroups(userId);
        const mapped = (data || []).map((g) => ({
          id: g.id,
          name: g.name,
          memberIds: g.memberIds || [],
          messages: [],
          unread: 0,
          lastMessageAt: 0,
        }));
        setGroups(mapped);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Tải danh sách sinh viên tương tự như trang Giảng viên (để map tên senderId)
  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.getUsers({ page: 0, size: 1000 });
        if (resp && resp.content && Array.isArray(resp.content)) {
          const onlyStudents = resp.content.filter(
            (u) => u.roles && u.roles.some((r) => r.roleName === "STUDENT")
          );
          const formatted = (
            onlyStudents.length ? onlyStudents : resp.content
          ).map((s) => ({
            id: s.userId,
            name: s.fullName || s.name || "Sinh viên",
            avatar:
              s.avt ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                s.fullName || s.name || "SV"
              )}&background=random`,
          }));
          setStudents(formatted);
        }
      } catch (_) {}
    })();
  }, []);

  // Khi đã có cả danh sách partnerIds và danh sách giảng viên, tạo hội thoại với tên thật
  useEffect(() => {
    if (partnerIds.length === 0 || teachers.length === 0) return;
    const mapped = partnerIds
      .map((pid) => {
        const t = teachers.find((x) => String(x.id) === String(pid));
        if (!t) return null;
        return {
          id: `cv_${pid}`,
          topic: t.name || `Giảng viên ${pid}`,
          unread: 0,
          members: 2,
          // Mặc định chưa có thời điểm cuối để tránh hiển thị "Vừa xong"
          lastMessageAt: 0,
          messages: [],
          partnerId: String(pid),
        };
      })
      .filter(Boolean);
    if (mapped.length > 0) {
      setConversations(mapped);
      setActiveConvId(null);
      setLoadingPartners(false);
    }
  }, [partnerIds, teachers]);

  // Danh sách giảng viên sau khi lọc theo từ khoá tìm kiếm trong modal
  const filteredTeachersInModal = useMemo(() => {
    if (!teacherSearch) return teachers;
    const q = teacherSearch.toLowerCase().trim();
    return teachers.filter((t) =>
      [t.name, t.email, t.specialization, t.department]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [teacherSearch, teachers]);

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

      // Cập nhật ĐÚNG conversation của teacherId được chọn
      setConversations((prev) =>
        prev.map((conv) => {
          const isThisPartner = String(conv.partnerId) === String(teacherId);
          if (!isThisPartner) return conv;
          return {
            ...conv,
            messages: historyMessages,
            lastMessageAt:
              historyMessages.length > 0
                ? historyMessages[historyMessages.length - 1].time
                : Date.now(),
          };
        })
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
            department:
              departmentMapping[teacher.department] ||
              teacher.department ||
              "Chưa có khoa",
          }));

          setTeachers(formattedTeachers);
          console.log("Danh sách giảng viên:", formattedTeachers);

          // Tải danh sách đối tác chat đã từng nhắn để hiển thị trong sidebar
          try {
            const currentUserId = getUserIdFromToken();
            if (currentUserId) {
              const partnerIds = await chatService.getChatPartners(
                currentUserId
              );
              if (Array.isArray(partnerIds) && partnerIds.length > 0) {
                const partnerConversations = partnerIds
                  .map((pid) => {
                    const t = formattedTeachers.find(
                      (x) => String(x.id) === String(pid)
                    );
                    return {
                      id: `cv_${pid}`,
                      topic: t?.name || `Giảng viên ${pid}`,
                      unread: 0,
                      members: 2,
                      // Tránh hiển thị "Vừa xong" trước khi có lịch sử thật sự
                      lastMessageAt: 0,
                      messages: [],
                      partnerId: String(pid),
                    };
                  })
                  .filter(Boolean);

                if (partnerConversations.length > 0) {
                  setConversations(partnerConversations);
                  // Không auto chọn; chờ người dùng click
                  setActiveConvId(null);
                }
              }
            }
          } catch (e) {
            console.log("Không thể tải danh sách đối tác chat:", e);
          }

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

          // Không tự động chọn giảng viên nếu không có teacherId trên URL
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

  // Khởi tạo WebSocket chat và (chỉ tạo placeholder nếu chưa có partners)
  useEffect(() => {
    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("Không thể lấy userId từ token");
      return;
    }

    if (!partnersLoadedRef.current) {
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
    }

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

    // Đánh dấu đang kết nối ngay khi đã có giảng viên
    setConnectionStatus("connecting");

    setConversations((prev) =>
      prev.map((conv) => {
        const isThisPartner =
          String(conv.partnerId) === String(selectedTeacher.id);
        if (!isThisPartner) return conv;
        return {
          ...conv,
          topic: selectedTeacher.name || "Giảng viên",
          members: 2,
        };
      })
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

  useEffect(() => {
    if (!activeConvId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, unread: 0 } : c))
    );
  }, [activeConvId]);

  // Reset unread for group when opened
  useEffect(() => {
    if (!activeGroupId) return;
    setGroups((prev) =>
      prev.map((g) => (g.id === activeGroupId ? { ...g, unread: 0 } : g))
    );
  }, [activeGroupId]);

  // Xử lý message từ WebSocket
  const handleWebSocketMessage = useCallback((data) => {
    // API response format: { id, senderId, receiverId, content, timestamp }
    // Không cần switch case nữa, tất cả message đều là chat message
    if (data.groupId && data.content && data.senderId) {
      // Group message
      const messageKey = `${data.id || data.senderId}_${data.groupId}_${
        data.content
      }_${data.timestamp}`;
      if (processedMessagesRef.current.has(messageKey)) return;
      processedMessagesRef.current.add(messageKey);
      handleGroupMessage(data);
      setTimeout(() => {
        processedMessagesRef.current.delete(messageKey);
      }, 10000);
    } else if (data.content && data.senderId) {
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
        time: timestamp
          ? Number(new Date(timestamp).getTime()) || Date.now()
          : Date.now(),
        text: content, // Sử dụng content thay vì message
        mine: senderId === userId,
        read: false,
      };

      // Thêm tin nhắn vào đúng conversation theo partnerId (giảng viên)
      setConversations((prev) =>
        prev.map((conv) => {
          // Xác định hội thoại cần cập nhật: partnerId chính là teacherId (senderId nếu là tin đến, selectedTeacher.id nếu là tin mình gửi)
          const targetPartnerId = conv.partnerId;
          const messagePartnerId = newMessage.mine
            ? String(selectedTeacher?.id)
            : String(senderId);
          if (String(targetPartnerId) === String(messagePartnerId)) {
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
              // Chỉ tăng unread nếu KHÔNG phải hội thoại đang mở và tin nhắn không phải của mình
              unread:
                newMessage.mine || (activeConvId && activeConvId === conv.id)
                  ? conv.unread
                  : conv.unread + 1,
            };
          }
          return conv;
        })
      );
    },
    [conversations, activeConvId]
  );

  // Xử lý tin nhắn nhóm
  const handleGroupMessage = useCallback(
    (data) => {
      const { id, groupId, senderId, content, timestamp } = data;
      const userId = getUserIdFromToken();
      // Map senderId -> tên thật (ưu tiên giảng viên, sau đó sinh viên)
      const sid = String(senderId);
      const t = teachers.find((x) => String(x.id) === sid);
      const st = students.find((x) => String(x.id) === sid);
      const senderName =
        sid === String(userId) ? "You" : t?.name || st?.name || `User ${sid}`;

      const newMessage = {
        id: id || `gmsg_${Date.now()}_${Math.random()}`,
        sender: senderName,
        time: timestamp
          ? Number(new Date(timestamp).getTime()) || Date.now()
          : Date.now(),
        text: content,
        mine: sid === String(userId),
        read: false,
        senderId: sid,
      };

      setGroups((prev) =>
        prev.map((g) => {
          if (String(g.id) !== String(groupId)) return g;
          // Replace local if exists
          const localIdx = g.messages.findIndex(
            (m) => m.isLocal && m.text === newMessage.text
          );
          let updatedMessages;
          if (localIdx !== -1) {
            updatedMessages = [...g.messages];
            updatedMessages[localIdx] = { ...newMessage, isLocal: false };
          } else {
            const dup = g.messages.some(
              (m) =>
                m.id === newMessage.id ||
                (m.text === newMessage.text &&
                  Math.abs(m.time - newMessage.time) < 5000)
            );
            updatedMessages = dup ? g.messages : [...g.messages, newMessage];
          }
          return {
            ...g,
            messages: updatedMessages,
            lastMessageAt: newMessage.time,
            unread:
              newMessage.mine || (activeGroupId && activeGroupId === g.id)
                ? g.unread
                : g.unread + 1,
          };
        })
      );

      // Nếu vẫn là placeholder, fetch tên sinh viên và cập nhật lại toàn bộ message cùng senderId trong nhóm
      if (!t && !st && sid !== String(userId)) {
        userService
          .getStudentProfileById(sid)
          .then((profile) => {
            const realName = profile?.fullName || profile?.name || `ID ${sid}`;
            setStudents((prev) => {
              const idx = prev.findIndex((s) => String(s.id) === sid);
              const entry = {
                id: sid,
                name: realName,
                avatar:
                  profile?.avt ||
                  profile?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    realName || "SV"
                  )}&background=random`,
              };
              if (idx === -1) return [...prev, entry];
              const next = [...prev];
              next[idx] = entry;
              return next;
            });

            setGroups((prev) =>
              prev.map((g) => {
                if (String(g.id) !== String(groupId)) return g;
                const updated = g.messages.map((m) =>
                  String(m.senderId) === sid && !m.mine
                    ? { ...m, sender: realName }
                    : m
                );
                return { ...g, messages: updated };
              })
            );
          })
          .catch(() => {});
      }
    },
    [activeGroupId, teachers, students]
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
    const ts = Number(ms);
    if (!ts || Number.isNaN(ts)) return "Vừa xong";
    if (ts < 946684800000) return "Vừa xong";
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

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (filter === "unread") list = list.filter((c) => c.unread > 0);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.topic.toLowerCase().includes(q));
    }
    return list;
  }, [conversations, filter, search]);

  const filteredGroups = useMemo(() => {
    let list = groups;
    if (filter === "unread") list = list.filter((g) => g.unread > 0);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((g) => (g.name || "").toLowerCase().includes(q));
    }
    return list;
  }, [groups, filter, search]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeGroup = groups.find((g) => g.id === activeGroupId);

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
    if (!text) return;

    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("Không thể lấy userId từ token");
      return;
    }

    // Nhánh nhóm
    if (activeTab === "group") {
      if (!activeGroupId) return;
      setMessageInput("");
      const localMsgId = `g-local-${Date.now()}-${Math.random()}`;
      const localMsg = {
        id: localMsgId,
        sender: "You",
        time: Date.now(),
        text,
        mine: true,
        read: false,
        isLocal: true,
      };

      // Cập nhật UI ngay
      setGroups((prev) =>
        prev.map((g) =>
          g.id === activeGroupId
            ? {
                ...g,
                messages: [...g.messages, localMsg],
                lastMessageAt: localMsg.time,
              }
            : g
        )
      );

      // Gọi API gửi tin nhắn nhóm
      (async () => {
        try {
          await chatService.sendGroupMessage({
            groupId: activeGroupId,
            senderId: userId,
            content: text,
          });
        } catch (e) {
          // Nếu lỗi, hoàn tác local message
          setGroups((prev) =>
            prev.map((g) =>
              g.id === activeGroupId
                ? {
                    ...g,
                    messages: g.messages.filter((m) => m.id !== localMsgId),
                  }
                : g
            )
          );
          setMessageInput(text);
        }
      })();
      return;
    }

    // Nhánh cá nhân (direct)
    if (!activeConv || !isConnected || !selectedTeacher) return;

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
        receiverId: selectedTeacher.id,
        content: text,
        timestamp: new Date().toISOString(),
      };

      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify(chatMessage));
        console.log("Đã gửi tin nhắn qua WebSocket:", chatMessage);
      } else {
        console.error("WebSocket không kết nối");
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
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn qua WebSocket:", error);
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
  }, [
    messageInput,
    activeTab,
    activeGroupId,
    activeConv,
    isConnected,
    selectedTeacher,
    wsConnection,
  ]);

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
                <div>
                  {/* Ô tìm kiếm trong modal */}
                  <div className="mb-4">
                    <input
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Tìm tên, email hoặc chuyên ngành..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/60 focus:border-primary-500/60"
                    />
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto thin-scrollbar pr-1">
                    {filteredTeachersInModal.length === 0 ? (
                      <div className="text-center text-sm text-gray-500 py-8">
                        Không tìm thấy giảng viên phù hợp
                      </div>
                    ) : (
                      filteredTeachersInModal.map((teacher) => (
                        <button
                          key={teacher.id || teacher.userId}
                          onClick={() => {
                            // Chọn giảng viên và đồng bộ hội thoại đang active
                            const convId = `cv_${teacher.id}`;
                            setConversations((prev) => {
                              const exists = prev.some((c) => c.id === convId);
                              if (exists) return prev;
                              // Nếu chưa có, thêm hội thoại rỗng để hiển thị ngay
                              return [
                                {
                                  id: convId,
                                  topic: teacher.name || "Giảng viên",
                                  unread: 0,
                                  members: 2,
                                  lastMessageAt: 0,
                                  messages: [],
                                  partnerId: String(teacher.id),
                                },
                                ...prev,
                              ];
                            });
                            setActiveConvId(convId);
                            setSelectedTeacher(teacher);
                            setShowTeacherSelector(false);
                            setTeacherSearch("");
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
                      ))
                    )}
                  </div>
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
                        : selectedTeacher
                        ? "Offline"
                        : ""}
                    </span>
                  </div>
                  {(connectionStatus === "disconnected" ||
                    connectionStatus === "error") && (
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
            {/* Tabs */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setActiveTab("direct")}
                className={`px-3 py-1.5 text-xs rounded ${
                  activeTab === "direct"
                    ? "bg-secondary text-white"
                    : "text-gray-600 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                Cá nhân
              </button>
              <button
                onClick={() => setActiveTab("group")}
                className={`px-3 py-1.5 text-xs rounded ${
                  activeTab === "group"
                    ? "bg-secondary text-white"
                    : "text-gray-600 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                Nhóm
              </button>
            </div>
            <div className="mt-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm cuộc trò chuyện..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/60 focus:border-primary-500/60"
              />
            </div>
          </div>

          {/* Scrollable conversations list */}
          <div className="flex-1 overflow-y-auto thin-scrollbar p-2">
            {activeTab === "direct" ? (
              loadingPartners ? (
                <div className="px-4 py-6 text-gray-500 text-sm">
                  Đang tải danh sách hội thoại...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="px-4 py-6 text-gray-400 text-sm">
                  Chưa có hội thoại nào
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveConvId(c.id);
                      // Nếu conversation đến từ danh sách đối tác, đồng bộ selectedTeacher
                      if (c.partnerId) {
                        const t = teachers.find(
                          (x) => String(x.id) === String(c.partnerId)
                        );
                        if (t) setSelectedTeacher(t);
                      }
                    }}
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
                ))
              )
            ) : // groups tab
            filteredGroups.length === 0 ? (
              <div className="px-4 py-6 text-gray-400 text-sm">
                Chưa có nhóm
              </div>
            ) : (
              filteredGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setActiveGroupId(g.id);
                    // load history lazily
                    (async () => {
                      try {
                        const history = await chatService.getGroupHistory(g.id);
                        const userId = getUserIdFromToken();
                        setGroups((prev) =>
                          prev.map((gg) =>
                            gg.id === g.id
                              ? {
                                  ...gg,
                                  messages: (history || []).map((m) => {
                                    const sid = String(m.senderId);
                                    const t = teachers.find(
                                      (x) => String(x.id) === sid
                                    );
                                    const st = students.find(
                                      (x) => String(x.id) === sid
                                    );
                                    const senderName =
                                      sid === String(userId)
                                        ? "You"
                                        : t?.name || st?.name || `User ${sid}`;
                                    return {
                                      id: m.id,
                                      sender: senderName,
                                      time:
                                        Number(
                                          new Date(m.timestamp).getTime()
                                        ) || Date.now(),
                                      text: m.content,
                                      mine: sid === String(userId),
                                      read: true,
                                      senderId: sid,
                                    };
                                  }),
                                  lastMessageAt:
                                    history && history.length
                                      ? Number(
                                          new Date(
                                            history[
                                              history.length - 1
                                            ].timestamp
                                          ).getTime()
                                        )
                                      : gg.lastMessageAt,
                                }
                              : gg
                          )
                        );
                      } catch (_) {}
                    })();
                  }}
                  className={`w-full text-left p-3 rounded-lg border mb-2 transition hover:bg-gray-50 ${
                    activeGroupId === g.id
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {g.name}
                    </div>
                    <div className="text-[11px] text-gray-500 whitespace-nowrap">
                      {formatRelative(g.lastMessageAt)}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {g.memberIds?.length || 0} thành viên
                    </div>
                    {g.unread > 0 && (
                      <span className="text-[10px] bg-blue-600 text-white rounded-full px-2 py-0.5">
                        {g.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Khung chat trung tâm - Fixed height, scrollable messages */}
        <section className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              {/* Avatar giảng viên */}
              {activeTab === "direct" && selectedTeacher?.avatar && (
                <img
                  src={selectedTeacher.avatar}
                  alt={selectedTeacher.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {activeTab === "group"
                    ? activeGroup?.name || "Chọn nhóm"
                    : selectedTeacher?.name || "Chọn giảng viên"}
                </div>
                <div className="text-xs text-gray-500">
                  {activeTab === "group"
                    ? activeGroup
                      ? `${activeGroup.memberIds?.length || 0} thành viên`
                      : "Chọn nhóm để chat"
                    : selectedTeacher
                    ? selectedTeacher.name
                    : "Chọn giảng viên để chat"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {activeTab === "group" ? null : !selectedTeacher ? (
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
            {activeTab === "group" ? (
              !activeGroup ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Chọn một nhóm để bắt đầu trò chuyện
                </div>
              ) : (
                <div className="space-y-4">
                  {activeGroup.messages.map((m) => (
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
                        <div className="text-xs mb-1 opacity-70">
                          {m.mine ? "Bạn" : m.sender}
                        </div>
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
                </div>
              )
            ) : !activeConv ? (
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
                  activeTab === "group"
                    ? activeGroup
                      ? "Nhập tin nhắn..."
                      : "Chọn nhóm để chat..."
                    : !selectedTeacher
                    ? "Chọn giảng viên để chat..."
                    : isConnected
                    ? "Nhập tin nhắn..."
                    : "Đang kết nối..."
                }
                disabled={
                  activeTab === "group"
                    ? !activeGroup
                    : !isConnected || !selectedTeacher
                }
                className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/60 focus:border-primary-500/60 ${
                  isConnected
                    ? "border-gray-300"
                    : "border-gray-200 bg-gray-100 cursor-not-allowed"
                }`}
              />
              <button
                onClick={handleSend}
                disabled={
                  !messageInput.trim() ||
                  (activeTab === "group"
                    ? !activeGroup
                    : !isConnected || !selectedTeacher)
                }
                className={`px-3 py-2 rounded-lg text-sm ${
                  messageInput.trim() &&
                  (activeTab === "group" ? !!activeGroup : isConnected)
                    ? "bg-secondary text-white hover:bg-secondary-hover"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {activeTab === "group"
                  ? activeGroup
                    ? "Gửi"
                    : "Chọn nhóm"
                  : !selectedTeacher
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
