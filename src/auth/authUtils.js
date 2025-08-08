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
 * Lấy cookie value theo name
 * @param {string} name - Tên cookie
 * @returns {string|null}
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

/**
 * Set cookie với options
 * @param {string} name - Tên cookie
 * @param {string} value - Giá trị cookie
 * @param {Object} options - Options (expires, path, secure, etc.)
 */
export const setCookie = (name, value, options = {}) => {
  const {
    expires = 7, // Mặc định 7 ngày
    path = "/",
    secure = window.location.protocol === "https:",
    sameSite = "Lax",
  } = options;

  let cookieString = `${name}=${value}`;

  if (expires) {
    const date = new Date();
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  cookieString += `; path=${path}`;
  if (secure) cookieString += "; secure";
  cookieString += `; samesite=${sameSite}`;

  document.cookie = cookieString;
};

/**
 * Xóa cookie
 * @param {string} name - Tên cookie
 * @param {string} path - Path của cookie
 */
export const removeCookie = (name, path = "/") => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
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
 * Lấy token từ session storage hoặc cookie
 * @returns {string|null}
 */
export const getToken = () => {
  // Ưu tiên session storage trước
  const sessionKey = getSessionKey("accessToken");
  const sessionToken = sessionStorage.getItem(sessionKey);

  if (sessionToken) {
    return sessionToken;
  }

  // Fallback về localStorage
  const localToken = localStorage.getItem("accessToken");
  if (localToken) {
    return localToken;
  }

  // Cuối cùng là cookie
  const cookieToken = getCookie("accessToken");
  return cookieToken;
};

/**
 * Lưu token vào session storage và cookie
 * @param {string} token - JWT token
 * @param {boolean} persistent - Có lưu vào cookie không
 */
export const setToken = (token, persistent = false) => {
  if (token) {
    const sessionKey = getSessionKey("accessToken");
    sessionStorage.setItem(sessionKey, token);
    localStorage.setItem("accessToken", token);

    // Nếu persistent thì lưu vào cookie
    if (persistent) {
      setCookie("accessToken", token, { expires: 7 }); // 7 ngày
    }
  }
};

/**
 * Xóa token và đăng xuất user
 * @param {string} refreshToken - Refresh token cần xóa khỏi database
 */
export const logout = async (refreshToken) => {
  console.log("logout() được gọi với refreshToken:", refreshToken);

  try {
    // Gọi API để xóa refreshToken khỏi database
    if (refreshToken) {
      console.log("Gọi API logout với refreshToken:", refreshToken);
      const result = await authService.logout(refreshToken);
      console.log("Kết quả API logout:", result);
    } else {
      console.log("Không có refreshToken để gửi");
    }
  } catch (error) {
    console.error("Lỗi khi gọi API logout:", error);
  } finally {
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

    // Xóa data từ localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");

    // Xóa cookies
    removeCookie("accessToken");
    removeCookie("refreshToken");
    removeCookie("userInfo");
  }
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
 * Lấy thông tin user từ cache (session storage, localStorage, hoặc cookie)
 * @returns {Object|null}
 */
export const getCachedUserInfo = () => {
  try {
    // Ưu tiên session storage
    const sessionKey = getSessionKey("userInfo");
    let userInfo = sessionStorage.getItem(sessionKey);

    // Fallback về localStorage
    if (!userInfo) {
      userInfo = localStorage.getItem("userInfo");
    }

    // Fallback về cookie
    if (!userInfo) {
      userInfo = getCookie("userInfo");
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
  removeCookie("userInfo");
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
      localStorage.getItem("refreshToken") ||
      getCookie("refreshToken");

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
 * @param {boolean} persistent - Có lưu vào cookie không
 */
export const setRefreshToken = (refreshToken, persistent = false) => {
  console.log("setRefreshToken() được gọi với:", {
    refreshToken,
    persistent,
  });

  if (refreshToken) {
    const sessionKey = getSessionKey("refreshToken");
    console.log("setRefreshToken() - sessionKey:", sessionKey);

    sessionStorage.setItem(sessionKey, refreshToken);
    localStorage.setItem("refreshToken", refreshToken);

    console.log(
      "setRefreshToken() - Đã lưu vào sessionStorage và localStorage"
    );

    // Nếu persistent thì lưu vào cookie
    if (persistent) {
      setCookie("refreshToken", refreshToken, { expires: 30 });
      console.log("setRefreshToken() - Đã lưu vào cookie");
    }
  } else {
    console.log("setRefreshToken() - refreshToken là null hoặc empty");
  }
};

/**
 * Lấy refresh token
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  const sessionKey = getSessionKey("refreshToken");
  const sessionToken = sessionStorage.getItem(sessionKey);
  const localToken = localStorage.getItem("refreshToken");
  const cookieToken = getCookie("refreshToken");

  console.log("getRefreshToken() - sessionKey:", sessionKey);
  console.log("getRefreshToken() - sessionStorage:", sessionToken);
  console.log("getRefreshToken() - localStorage:", localToken);
  console.log("getRefreshToken() - cookie:", cookieToken);

  const result = sessionToken || localToken || cookieToken;
  console.log("getRefreshToken() - kết quả cuối:", result);

  // Debug: Kiểm tra tất cả keys trong storage
  console.log("Tất cả sessionStorage keys:", Object.keys(sessionStorage));
  console.log("Tất cả localStorage keys:", Object.keys(localStorage));

  return result;
};

/**
 * Lưu user info vào cookie (cho persistent login)
 * @param {Object} userData - Thông tin user
 * @param {boolean} persistent - Có lưu vào cookie không
 */
export const setUserInfo = (userData, persistent = false) => {
  if (userData) {
    const sessionKey = getSessionKey("userInfo");
    sessionStorage.setItem(sessionKey, JSON.stringify(userData));
    localStorage.setItem("userInfo", JSON.stringify(userData));

    // Nếu persistent thì lưu vào cookie
    if (persistent) {
      setCookie("userInfo", JSON.stringify(userData), { expires: 7 }); 
    }
  }
};
