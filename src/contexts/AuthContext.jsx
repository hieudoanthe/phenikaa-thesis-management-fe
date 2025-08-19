import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  getToken,
  logout,
  getCachedUserInfo,
  setToken,
  setRefreshToken,
  getSessionKey,
  getSessionId,
  setUserInfo,
} from "../auth/authUtils";
import PropTypes from "prop-types";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được sử dụng trong AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Khởi tạo session ID cho tab hiện tại
  useEffect(() => {
    getSessionId();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const token = getToken();

    if (token) {
      setIsAuthenticated(true);
      const cachedUser = getCachedUserInfo();
      setUser(cachedUser);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  // Lắng nghe sự thay đổi của session storage giữa các tab
  useEffect(() => {
    const handleStorageChange = (e) => {
      const sessionId = getSessionId();
      const sessionKey = getSessionKey("userInfo");

      // Chỉ xử lý nếu thay đổi liên quan đến session hiện tại
      if (e.key === sessionKey) {
        try {
          const newUser = e.newValue ? JSON.parse(e.newValue) : null;
          setUser(newUser);
          setIsAuthenticated(!!newUser);
        } catch (error) {
          console.error("Lỗi khi parse user info từ storage change:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = async (token, userData, refreshToken, persistent = false) => {
    // Sử dụng các hàm mới từ authUtils
    setToken(token, persistent);
    if (refreshToken) {
      setRefreshToken(refreshToken, persistent);
    }
    if (userData) {
      // Lưu user info vào session storage và cookie nếu persistent
      setUserInfo(userData, persistent);
      setUser(userData);
    } else {
      setUser(null);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout: handleLogout,
    }),
    [user, isAuthenticated, isLoading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
