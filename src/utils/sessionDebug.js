import { getSessionId, getSessionKey } from "../auth/authUtils";

/**
 * Utility để debug session
 */
export const debugSession = () => {
  const sessionId = getSessionId();
  const sessionKey = getSessionKey("userInfo");
  const tokenKey = getSessionKey("accessToken");

  console.log("=== Session Debug ===");
  console.log("Session ID:", sessionId);
  console.log("User Info Key:", sessionKey);
  console.log("Token Key:", tokenKey);

  // Kiểm tra session storage
  const userInfo = sessionStorage.getItem(sessionKey);
  const token = sessionStorage.getItem(tokenKey);

  console.log(
    "User Info from Session:",
    userInfo ? JSON.parse(userInfo) : null
  );
  console.log("Token from Session:", token ? "exists" : "not found");

  // Kiểm tra localStorage (backup)
  const localUserInfo = localStorage.getItem("userInfo");
  const localToken = localStorage.getItem("accessToken");

  console.log(
    "User Info from LocalStorage:",
    localUserInfo ? JSON.parse(localUserInfo) : null
  );
  console.log("Token from LocalStorage:", localToken ? "exists" : "not found");

  // Liệt kê tất cả session storage keys
  console.log("All SessionStorage keys:");
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    console.log(`  ${key}: ${sessionStorage.getItem(key)}`);
  }

  console.log("=== End Session Debug ===");
};

/**
 * Kiểm tra xem có session nào đang active không
 */
export const checkActiveSessions = () => {
  const activeSessions = [];

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes("session_")) {
      const sessionId = key.split("_")[0] + "_" + key.split("_")[1];
      if (!activeSessions.includes(sessionId)) {
        activeSessions.push(sessionId);
      }
    }
  }

  console.log("Active sessions:", activeSessions);
  return activeSessions;
};

/**
 * Xóa tất cả session data
 */
export const clearAllSessionData = () => {
  const keysToRemove = [];

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes("session_") || key.includes("currentSessionId"))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    sessionStorage.removeItem(key);
  });

  console.log("Cleared all session data");
};

export default {
  debugSession,
  checkActiveSessions,
  clearAllSessionData,
};
