import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { getToken, logout, getCachedUserInfo } from "../auth/authUtils";
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

  useEffect(() => {
    setIsLoading(true);
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      setUser(getCachedUserInfo());
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (token, userData, refreshToken) => {
    localStorage.setItem("accessToken", token);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    if (userData) {
      localStorage.setItem("userInfo", JSON.stringify(userData));
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
