import React, { useState, useEffect } from "react";
import {
  debugSession,
  checkActiveSessions,
  clearAllSessionData,
} from "../../utils/sessionDebug";
import { getSessionId, getSessionKey } from "../../auth/authUtils";

/**
 * Component debug session (chỉ hiển thị trong development)
 */
const SessionDebugPanel = () => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Chỉ hiển thị trong development
    if (process.env.NODE_ENV === "development") {
      updateSessionInfo();
    }
  }, []);

  const updateSessionInfo = () => {
    const sessionId = getSessionId();
    const sessionKey = getSessionKey("userInfo");
    const tokenKey = getSessionKey("accessToken");

    const userInfo = sessionStorage.getItem(sessionKey);
    const token = sessionStorage.getItem(tokenKey);

    setSessionInfo({
      sessionId,
      sessionKey,
      tokenKey,
      userInfo: userInfo ? JSON.parse(userInfo) : null,
      hasToken: !!token,
      activeSessions: checkActiveSessions(),
    });
  };

  const handleDebug = () => {
    debugSession();
    updateSessionInfo();
  };

  const handleClear = () => {
    clearAllSessionData();
    updateSessionInfo();
  };

  // Chỉ hiển thị trong development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
      >
        {isVisible ? "Ẩn" : "Hiện"} Debug Session
      </button>

      {isVisible && (
        <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Session Debug</h3>

          {sessionInfo && (
            <div className="text-sm space-y-2">
              <div>
                <strong>Session ID:</strong> {sessionInfo.sessionId}
              </div>
              <div>
                <strong>User:</strong>{" "}
                {sessionInfo.userInfo?.username || "Không có"}
              </div>
              <div>
                <strong>Role:</strong>{" "}
                {sessionInfo.userInfo?.role || "Không có"}
              </div>
              <div>
                <strong>Token:</strong>{" "}
                {sessionInfo.hasToken ? "Có" : "Không có"}
              </div>
              <div>
                <strong>Active Sessions:</strong>{" "}
                {sessionInfo.activeSessions.length}
              </div>
            </div>
          )}

          <div className="mt-3 space-x-2">
            <button
              onClick={handleDebug}
              className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
            >
              Debug Console
            </button>
            <button
              onClick={handleClear}
              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
            >
              Clear All
            </button>
            <button
              onClick={updateSessionInfo}
              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDebugPanel;
