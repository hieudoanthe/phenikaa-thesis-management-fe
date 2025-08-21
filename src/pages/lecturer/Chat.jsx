import React from "react";
import StudentChat from "../student/Chat.jsx";

// Tái sử dụng giao diện chat cho Lecturer (cùng layout/chat window),
// sau này có thể tách phần dữ liệu theo role nếu cần.
const LecturerChat = () => {
  return <StudentChat />;
};

export default LecturerChat;
