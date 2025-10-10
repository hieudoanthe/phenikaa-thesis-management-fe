import React, { createContext, useContext } from "react";
import PropTypes from "prop-types";
import { useSettingsStorage } from "../../hooks/useSettingsStorage";

// Tạo SettingsContext
const SettingsContext = createContext();

// SettingsProvider component
export const SettingsProvider = ({ children }) => {
  const settingsStorage = useSettingsStorage();

  const contextValue = {
    ...settingsStorage,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

SettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook để sử dụng SettingsContext
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
