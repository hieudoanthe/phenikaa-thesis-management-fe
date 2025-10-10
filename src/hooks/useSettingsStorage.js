import { useState, useEffect, useCallback } from "react";
import i18n from "../i18n";

/**
 * Apply theme to DOM
 */
const applyTheme = (theme) => {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }

  // Force a reflow to ensure CSS updates
  root.offsetHeight;

  // Dispatch custom event to notify other components
  window.dispatchEvent(
    new CustomEvent("themeChanged", {
      detail: { theme },
    })
  );
};

/**
 * Custom hook để quản lý storage cho settings
 * Settings là global, không phụ thuộc user/role
 */
export const useSettingsStorage = () => {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Default settings - global, không phụ thuộc role
  const defaultSettings = {
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    appearance: {
      theme: "light",
      language: "vi",
    },
    academic: {
      showGrades: true,
      showSchedule: true,
    },
    grading: {
      autoSave: true,
      showRubrics: true,
    },
    thesis: {
      showDeadlines: true,
      notifications: true,
    },
    system: {
      showAnalytics: true,
      autoBackup: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
    },
  };

  // Global settings - not user-specific, works for all users on this browser
  const getStorageKey = () => {
    return "app_settings_global";
  };

  // Load settings từ localStorage
  const loadSettings = useCallback(() => {
    try {
      setIsLoading(true);
      const storageKey = getStorageKey();
      const savedSettings = localStorage.getItem(storageKey);

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);

        // Apply language immediately
        if (parsed.appearance?.language) {
          i18n.changeLanguage(parsed.appearance.language);
        }

        // Apply theme immediately
        if (parsed.appearance?.theme) {
          applyTheme(parsed.appearance.theme);
        }
      } else {
        // Use default settings
        setSettings(defaultSettings);

        // Apply default theme
        if (defaultSettings.appearance?.theme) {
          applyTheme(defaultSettings.appearance.theme);
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setSettings(defaultSettings);

      // Apply fallback theme
      if (defaultSettings.appearance?.theme) {
        applyTheme(defaultSettings.appearance.theme);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings vào localStorage
  const saveSettings = useCallback((newSettings) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(newSettings));
      setSettings(newSettings);

      // Apply language change
      if (newSettings.appearance?.language) {
        i18n.changeLanguage(newSettings.appearance.language);
      }

      // Apply theme change
      if (newSettings.appearance?.theme) {
        applyTheme(newSettings.appearance.theme);
      }

      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  }, []);

  // Update một phần settings
  const updateSettings = useCallback(
    (path, value) => {
      const newSettings = { ...settings };
      const keys = path.split(".");
      let current = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      setSettings(newSettings);

      // Apply theme immediately for better UX
      if (path === "appearance.theme" && value) {
        applyTheme(value);

        // Force component re-render by updating state
        setTimeout(() => {
          setSettings((prev) => ({ ...prev }));
        }, 0);
      }
    },
    [settings]
  );

  // Reset settings về default
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  }, [saveSettings]);

  // Get một setting cụ thể
  const getSetting = useCallback(
    (path, defaultValue = null) => {
      const keys = path.split(".");
      let current = settings;

      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = current[key];
        } else {
          return defaultValue;
        }
      }
      return current;
    },
    [settings]
  );

  // Load settings khi component mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    loadSettings,
    saveSettings,
    updateSettings,
    resetSettings,
    getSetting,
  };
};
