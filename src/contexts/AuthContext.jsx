import React, { createContext, useContext, useState, useEffect } from "react";
import { getToken, logout, getCachedUserInfo } from "../auth/authUtils";

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

  const login = async (token, userData) => {
    localStorage.setItem("accessToken", token);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
