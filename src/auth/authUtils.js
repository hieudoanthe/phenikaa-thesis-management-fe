import authService from "../services/authService";

// Utility functions cho authentication

/**
 * Kiểm tra xem user đã đăng nhập hay chưa
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("accessToken");
  return token && token.trim() !== "";
};

/**
 * Lấy token từ localStorage
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem("accessToken");
};

/**
 * Lưu token vào localStorage
 * @param {string} token - JWT token
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem("accessToken", token);
  }
};

/**
 * Xóa token và đăng xuất user
 */
export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userInfo");
  // Không redirect ngay, để component tự xử lý
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
      // Lưu thông tin user vào localStorage để cache
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
 * Lấy thông tin user từ cache (localStorage)
 * @returns {Object|null}
 */
export const getCachedUserInfo = () => {
  try {
    const userInfo = localStorage.getItem("userInfo");
    console.log(
      "getCachedUserInfo - Raw userInfo from localStorage:",
      userInfo
    );

    if (userInfo) {
      const parsedUser = JSON.parse(userInfo);
      console.log("getCachedUserInfo - Parsed user info:", parsedUser);
      return parsedUser;
    } else {
      console.log("getCachedUserInfo - No userInfo found in localStorage");
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
    const refreshTokenValue = localStorage.getItem("refreshToken");
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
