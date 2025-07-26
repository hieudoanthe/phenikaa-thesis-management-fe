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
    console.log(
      "AuthContext - Initializing with token:",
      token ? "exists" : "not found"
    );

    if (token) {
      setIsAuthenticated(true);
      const cachedUser = getCachedUserInfo();
      console.log("AuthContext - Cached user info:", cachedUser);
      setUser(cachedUser);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (token, userData, refreshToken) => {
    console.log("AuthContext - Login called with:", {
      token,
      userData,
      refreshToken,
    });

    localStorage.setItem("accessToken", token);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    if (userData) {
      console.log("AuthContext - Saving user data to localStorage:", userData);
      localStorage.setItem("userInfo", JSON.stringify(userData));
      setUser(userData);
    } else {
      console.log("AuthContext - No user data provided, setting user to null");
      setUser(null);
    }
    setIsAuthenticated(true);
    console.log("AuthContext - Login completed, user:", userData);
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
