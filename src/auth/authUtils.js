import authService from "../services/auth.service";

// Utility functions cho authentication

/**
 * Tạo session ID duy nhất cho tab hiện tại
 * @returns {string}
 */
export const getSessionId = () => {
  let sessionId = sessionStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    sessionStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
};

/**
 * Lấy key với prefix session cho tab hiện tại
 * @param {string} key - Key gốc
 * @returns {string}
 */
export const getSessionKey = (key) => {
  const sessionId = getSessionId();
  return `${sessionId}_${key}`;
};

/**
 * Kiểm tra xem user đã đăng nhập hay chưa
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  return token && token.trim() !== "";
};

/**
 * Lấy token từ session storage
 * @returns {string|null}
 */
export const getToken = () => {
  const sessionKey = getSessionKey("accessToken");
  return (
    sessionStorage.getItem(sessionKey) || localStorage.getItem("accessToken")
  );
};

/**
 * Lưu token vào session storage
 * @param {string} token - JWT token
 */
export const setToken = (token) => {
  if (token) {
    const sessionKey = getSessionKey("accessToken");
    sessionStorage.setItem(sessionKey, token);
    // Vẫn lưu vào localStorage để backup
    localStorage.setItem("accessToken", token);
  }
};

/**
 * Xóa token và đăng xuất user
 */
export const logout = () => {
  const sessionId = getSessionId();

  // Xóa tất cả data liên quan đến session hiện tại
  const keysToRemove = [
    getSessionKey("accessToken"),
    getSessionKey("refreshToken"),
    getSessionKey("userInfo"),
  ];

  keysToRemove.forEach((key) => {
    sessionStorage.removeItem(key);
  });

  // Xóa session ID
  sessionStorage.removeItem("sessionId");

  // Xóa data từ localStorage nếu cần
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userInfo");
};

/**
 * Tạo header Authorization cho API calls
 * @returns {Object}
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/**
 * Kiểm tra token có hợp lệ không bằng cách gọi API
 * @returns {Promise<boolean>}
 */
export const validateToken = async () => {
  try {
    const result = await authService.validateToken();
    return result;
  } catch (error) {
    console.error("Lỗi khi kiểm tra token:", error);
    return false;
  }
};

/**
 * Lấy thông tin user từ token
 * @returns {Promise<Object|null>}
 */
export const getUserInfo = async () => {
  try {
    const result = await authService.getCurrentUser();
    if (result.success) {
      // Lưu thông tin user vào session storage để cache
      const sessionKey = getSessionKey("userInfo");
      sessionStorage.setItem(sessionKey, JSON.stringify(result.data));
      // Backup vào localStorage
      localStorage.setItem("userInfo", JSON.stringify(result.data));
      return result.data;
    }
    return null;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin user:", error);
    return null;
  }
};

/**
 * Lấy thông tin user từ cache (session storage)
 * @returns {Object|null}
 */
export const getCachedUserInfo = () => {
  try {
    const sessionKey = getSessionKey("userInfo");
    let userInfo = sessionStorage.getItem(sessionKey);

    // Fallback về localStorage nếu không có trong session
    if (!userInfo) {
      userInfo = localStorage.getItem("userInfo");
    }

    console.log("getCachedUserInfo - Raw userInfo from storage:", userInfo);

    if (userInfo) {
      const parsedUser = JSON.parse(userInfo);
      console.log("getCachedUserInfo - Parsed user info:", parsedUser);
      return parsedUser;
    } else {
      console.log("getCachedUserInfo - No userInfo found in storage");
      return null;
    }
  } catch (error) {
    console.error("Lỗi khi đọc cache user info:", error);
    return null;
  }
};

/**
 * Xóa cache user info
 */
export const clearUserCache = () => {
  const sessionKey = getSessionKey("userInfo");
  sessionStorage.removeItem(sessionKey);
  localStorage.removeItem("userInfo");
};

/**
 * Kiểm tra token có hết hạn không (JWT decode)
 * @returns {boolean}
 */
export const isTokenExpired = () => {
  try {
    const token = getToken();
    if (!token) return true;

    // Decode JWT token (chỉ phần payload)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    return payload.exp < currentTime;
  } catch (error) {
    console.error("Lỗi khi kiểm tra token expiration:", error);
    return true;
  }
};

/**
 * Refresh token (nếu có)
 * @returns {Promise<string|null>}
 */
export const refreshToken = async () => {
  try {
    const sessionKey = getSessionKey("refreshToken");
    const refreshTokenValue =
      sessionStorage.getItem(sessionKey) ||
      localStorage.getItem("refreshToken");
    if (!refreshTokenValue) return null;

    const result = await authService.refreshToken(refreshTokenValue);
    if (result.success) {
      setToken(result.data.accessToken);
      return result.data.accessToken;
    }
    return null;
  } catch (error) {
    console.error("Lỗi khi refresh token:", error);
    return null;
  }
};

/**
 * Lưu refresh token
 * @param {string} refreshToken - Refresh token
 */
export const setRefreshToken = (refreshToken) => {
  if (refreshToken) {
    const sessionKey = getSessionKey("refreshToken");
    sessionStorage.setItem(sessionKey, refreshToken);
    // Backup vào localStorage
    localStorage.setItem("refreshToken", refreshToken);
  }
};

/**
 * Lấy refresh token
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  const sessionKey = getSessionKey("refreshToken");
  return (
    sessionStorage.getItem(sessionKey) || localStorage.getItem("refreshToken")
  );
};
